#!/usr/bin/env bash
#
# One-time export of the live RDS PostgreSQL data into an H2 SCRIPT-format
# seed file, per docs/adr/0001-postgres-to-h2-migration.md.
#
# Run this from a machine that can reach RDS (e.g. the EC2 instance, or your
# laptop via an SSH tunnel/bastion). Requires: pg_dump/psql, java, curl.
# If S3_BUCKET is set, also requires the aws CLI and uploads the seed to S3.
#
# Pipeline:
#   1. pg_dump data-only INSERTs for app_user, raga, composition,
#      composition_audio_url (spring_session* is intentionally excluded —
#      the ADR drops session persistence entirely).
#   2. Load those INSERTs into a scratch, file-based H2 database created
#      from H2-compatible DDL mirroring V1/V4/V5 (gen_random_uuid() ->
#      RANDOM_UUID(), no BYTEA in scope).
#   3. Dump that scratch H2 database with H2's SCRIPT TO — this is the
#      portable SQL snapshot format the app will RUNSCRIPT FROM on boot.
#   4. If S3_BUCKET is set, upload the snapshot to S3_SEED_KEY (default
#      db-seed/snapshot.sql). This is the single object key the app's S3
#      boot-loader will fetch and RUNSCRIPT FROM (ADR 0001, resolved
#      decision 4 — native S3 bucket versioning on one key, no timestamped
#      key naming). Env vars mirror StorageConfig.java's storage.s3.*
#      properties so this script and the app stay pointed at the same
#      bucket/endpoint/credentials.
#
# Required env vars: RDS_HOST, RDS_DB, RDS_USER, PGPASSWORD
# Optional: RDS_PORT (default 5432), OUT_DIR (default ./h2-seed-output)
# Optional (enables S3 upload): S3_BUCKET
# Optional (only used if S3_BUCKET is set):
#   S3_SEED_KEY   (default db-seed/snapshot.sql)
#   AWS_REGION    (default us-east-1)
#   S3_ENDPOINT   (blank = native AWS S3; set for R2/MinIO/custom endpoint)
#   S3_ACCESS_KEY / S3_SECRET_KEY (blank = use default AWS credential chain,
#                                  e.g. the EC2 instance's IAM role)

set -euo pipefail

: "${RDS_HOST:?set RDS_HOST}"
: "${RDS_DB:?set RDS_DB}"
: "${RDS_USER:?set RDS_USER}"
: "${PGPASSWORD:?set PGPASSWORD (pg_dump/psql read this directly)}"
RDS_PORT="${RDS_PORT:-5432}"
OUT_DIR="${OUT_DIR:-$(pwd)/h2-seed-output}"

S3_BUCKET="${S3_BUCKET:-}"
S3_SEED_KEY="${S3_SEED_KEY:-db-seed/snapshot.sql}"
AWS_REGION="${AWS_REGION:-us-east-1}"
S3_ENDPOINT="${S3_ENDPOINT:-}"

H2_VERSION="2.3.232"

for bin in pg_dump java curl; do
  command -v "$bin" >/dev/null || { echo "missing required tool: $bin" >&2; exit 1; }
done
if [ -n "$S3_BUCKET" ]; then
  command -v aws >/dev/null || { echo "missing required tool: aws (needed because S3_BUCKET is set)" >&2; exit 1; }
fi

WORKDIR=$(mktemp -d)
trap 'rm -rf "$WORKDIR"' EXIT
mkdir -p "$OUT_DIR"

echo "== Fetching H2 $H2_VERSION jar =="
H2_JAR="$WORKDIR/h2.jar"
curl -fsSL -o "$H2_JAR" \
  "https://repo1.maven.org/maven2/com/h2database/h2/${H2_VERSION}/h2-${H2_VERSION}.jar"

pg_dump_table() {
  local table="$1" out="$2"
  PGPASSWORD="$PGPASSWORD" pg_dump \
    --host="$RDS_HOST" --port="$RDS_PORT" --dbname="$RDS_DB" --username="$RDS_USER" \
    --data-only --inserts --column-inserts --no-owner --no-privileges \
    --table="public.${table}" \
    | grep -vE '^(SET |SELECT pg_catalog\.|--|\\|$)' \
    | sed -E "s/^INSERT INTO public\.${table} /INSERT INTO ${table} /" \
    >> "$out"
}

echo "== Dumping data from RDS (app_user, raga, composition, composition_audio_url) =="
DATA_SQL="$WORKDIR/data.sql"
: > "$DATA_SQL"
# Order matters: raga is self-referencing (janaka before janya rows, which
# matches insertion order in Postgres already); composition depends on raga;
# composition_audio_url depends on composition.
pg_dump_table app_user "$DATA_SQL"
pg_dump_table raga "$DATA_SQL"
pg_dump_table composition "$DATA_SQL"
pg_dump_table composition_audio_url "$DATA_SQL"

echo "== Writing H2-compatible schema DDL =="
SCHEMA_SQL="$WORKDIR/schema.sql"
cat > "$SCHEMA_SQL" <<'SQL'
CREATE TABLE app_user (
    id UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE raga (
    id UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    janya BOOLEAN NOT NULL DEFAULT FALSE,
    janaka_raga_id UUID REFERENCES raga(id),
    melakarta_number INTEGER CHECK (melakarta_number BETWEEN 1 AND 72),
    arohana TEXT,
    arohana_audio_url TEXT,
    avarohana TEXT,
    avarohana_audio_url TEXT,
    is_seeded BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT raga_type_check CHECK (
        (janya = TRUE AND janaka_raga_id IS NOT NULL AND melakarta_number IS NULL) OR
        (janya = FALSE AND janaka_raga_id IS NULL AND melakarta_number IS NOT NULL)
    )
);

CREATE INDEX idx_raga_melakarta ON raga (melakarta_number);

CREATE TABLE composition (
    id UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
    raga_id UUID NOT NULL REFERENCES raga(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('GEETHE', 'JATHI_SWARA', 'KRUTHI', 'KEERTANE', 'VARNA')),
    name VARCHAR(255) NOT NULL,
    tala VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE INDEX idx_composition_raga ON composition (raga_id);

CREATE TABLE composition_audio_url (
    composition_id UUID NOT NULL REFERENCES composition(id) ON DELETE CASCADE,
    audio_url      TEXT NOT NULL,
    position       INT  NOT NULL DEFAULT 0
);
SQL

echo "== Loading schema + data into a scratch H2 database =="
SCRATCH_DB="$WORKDIR/scratch"
SCRATCH_URL="jdbc:h2:$SCRATCH_DB;DATABASE_TO_LOWER=TRUE"
COMBINED_SQL="$WORKDIR/combined.sql"
{
  cat "$SCHEMA_SQL"
  echo "SET REFERENTIAL_INTEGRITY FALSE;"
  cat "$DATA_SQL"
  echo "SET REFERENTIAL_INTEGRITY TRUE;"
} > "$COMBINED_SQL"

java -cp "$H2_JAR" org.h2.tools.RunScript \
  -url "$SCRATCH_URL" -user sa -password "" \
  -script "$COMBINED_SQL"

echo "== Row counts in scratch H2 =="
java -cp "$H2_JAR" org.h2.tools.Shell \
  -url "$SCRATCH_URL" -user sa -password "" \
  -sql "SELECT (SELECT COUNT(*) FROM app_user) app_user, (SELECT COUNT(*) FROM raga) raga, (SELECT COUNT(*) FROM composition) composition, (SELECT COUNT(*) FROM composition_audio_url) composition_audio_url;"

SEED_FILE="$OUT_DIR/h2-seed-$(date +%Y%m%d%H%M%S).sql"
echo "== Exporting portable H2 SCRIPT to $SEED_FILE =="
java -cp "$H2_JAR" org.h2.tools.Script \
  -url "$SCRATCH_URL" -user sa -password "" \
  -script "$SEED_FILE"

echo "Done: $SEED_FILE"

if [ -z "$S3_BUCKET" ]; then
  echo "S3_BUCKET not set — skipping upload."
  echo "Next: set S3_BUCKET (and re-run, or upload $SEED_FILE manually) to s3://<bucket>/$S3_SEED_KEY"
  exit 0
fi

echo "== Uploading seed to s3://$S3_BUCKET/$S3_SEED_KEY =="
AWS_ARGS=(--region "$AWS_REGION")
if [[ "$S3_ENDPOINT" == http://* || "$S3_ENDPOINT" == https://* ]]; then
  AWS_ARGS+=(--endpoint-url "$S3_ENDPOINT")
fi
if [ -n "${S3_ACCESS_KEY:-}" ]; then
  export AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY"
  export AWS_SECRET_ACCESS_KEY="${S3_SECRET_KEY:?set S3_SECRET_KEY alongside S3_ACCESS_KEY}"
fi

aws s3api put-object \
  "${AWS_ARGS[@]}" \
  --bucket "$S3_BUCKET" \
  --key "$S3_SEED_KEY" \
  --body "$SEED_FILE" \
  --content-type "application/sql" \
  > "$WORKDIR/put-object-response.json"

VERSION_ID=$(grep -o '"VersionId": *"[^"]*"' "$WORKDIR/put-object-response.json" | sed -E 's/.*"([^"]+)"$/\1/' || true)
echo "Uploaded. s3://$S3_BUCKET/$S3_SEED_KEY${VERSION_ID:+ (VersionId: $VERSION_ID)}"
echo "This is the key the app's boot-time S3 loader should fetch and RUNSCRIPT FROM (ADR 0001)."
