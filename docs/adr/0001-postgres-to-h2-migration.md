# ADR 0001: Replace RDS PostgreSQL with In-Memory H2 + S3 Snapshots

- **Status:** Accepted — design finalized, implementation pending on `postgres-to-h2-migration`
- **Date:** 2026-09-05
- **Branch:** `postgres-to-h2-migration`
- **Supersedes:** N/A (first ADR)

## Context

Swara Vault runs on a single EC2 instance with an RDS PostgreSQL instance as the
system of record (`APP_DB_URL`, Postgres dialect, Flyway migrations under
`backend/src/main/resources/db/migration/`). RDS is the largest recurring cost
in the deployment — a `db.t4g.micro` runs roughly $12–15/mo plus storage —
while the application itself is a personal, single-user catalog with a small,
slow-growing dataset (ragas + compositions) and effectively single-writer
traffic. Given that profile, paying for a dedicated, always-on managed
database is disproportionate to what the workload needs.

An initial evaluation of embedded H2 as a replacement (file-based, on the EC2
instance's own disk) surfaced a durability gap: without RDS's automated
snapshots and point-in-time recovery, data safety depends entirely on a
backup mechanism we'd have to build and trust ourselves, and on the EC2
instance's disk being persistent across restarts/redeploys.

## Decision

Replace RDS PostgreSQL with an **in-memory H2 database**, using S3 as the
durable backing store instead of a managed DB service:

1. **Move the data model from PostgreSQL to H2 (in-memory mode).** The JDBC
   datasource points at an in-memory H2 instance instead of RDS — no separate
   managed database process to pay for or operate.
2. **Load from S3 on startup.** On application init, before serving traffic,
   fetch the current data snapshot from S3 and load it into the in-memory H2
   instance. This is the recovery path in place of RDS restore.
3. **Write-through with async S3 backup on every mutation.** Every add/update
   is applied to H2 synchronously (H2 remains the runtime source of truth for
   reads within a running instance). Each mutation also enqueues an
   asynchronous job that re-uploads the snapshot to S3, retrying on failure up
   to **2 times** with **exponential backoff**.

This trades RDS's built-in durability guarantees for a smaller, self-managed
backup loop, in exchange for eliminating the RDS bill entirely — EC2 and S3
are both already paid for.

## Consequences

**Gains**
- Eliminates the RDS line item; DB now costs only the marginal S3 storage/PUT
  costs of periodic snapshots (effectively cents/month).
- No network hop for queries — H2 lives in the same JVM as the app.
- One fewer managed service/network boundary to secure and operate.

**Costs / risks accepted**
- **RPO is bounded by the async backup, not zero.** A crash between a
  successful write and its corresponding S3 upload completing loses that
  write. The retry/backoff (2 retries, exponential) reduces but does not
  eliminate this window.
- **No point-in-time recovery.** Only the latest successfully uploaded
  snapshot is recoverable; there is no continuous WAL-style history like RDS
  provides unless we separately version snapshots in S3.
- **Startup dependency on S3.** App boot now requires a successful S3 fetch
  before serving traffic; S3 unavailability becomes a startup blocker.
- **Single-writer/in-memory ceiling.** Fine for one user; forecloses adding
  concurrent multi-instance deployments later without revisiting this
  decision.
- **Postgres-specific SQL must be ported.** `V1__create_schema.sql` uses
  `gen_random_uuid()` and `BYTEA` (Postgres-specific); these need H2-compatible
  equivalents (`RANDOM_UUID()`, `BLOB`/`VARBINARY`) across all existing Flyway
  migrations.
- **Sessions no longer persisted across restarts (decided below).** Every
  restart/redeploy logs users out. Acceptable trade-off for a single-user
  personal app in exchange for dropping Spring Session JDBC entirely.

## Resolved Design Decisions

All items originally listed as open questions have been decided:

1. **Retry/backoff timing.** Async S3 backup retries use base delay **2s**,
   multiplier **2×**: attempt immediately, retry 1 at +2s, retry 2 at +4s,
   then give up. Rationale: transient S3 failures (throttling, brief network
   blips) typically clear within a few seconds; short backoff avoids tying up
   the async worker for long. Because every backup uploads a **full**
   snapshot (not a diff), a failed backup self-heals on the *next* successful
   mutation — there's no accumulating drift to reconcile. A final failure
   after both retries is logged as an error but does not fail the triggering
   request; H2 remains correct in memory regardless.

2. **Snapshot file format: H2 `SCRIPT` (plain SQL), not the native
   `.mv.db` file.** Rationale: `SCRIPT TO`/`RUNSCRIPT FROM` work directly
   against a pure in-memory (`jdbc:h2:mem:`) instance with no on-disk file
   ever required; the output is portable SQL, is human-readable/diffable in
   S3 if inspected, and avoids coupling the backup format to a specific H2
   storage-engine version. The dataset is small enough that SQL-export
   overhead is a non-issue.

3. **Sessions: dropped from persistence entirely.** Spring Session JDBC is
   removed; the app reverts to the servlet container's default in-memory
   `HttpSession`. `spring_session` / `spring_session_attributes` are not
   ported to H2 and are not part of the S3 snapshot. Consequence: every
   restart or redeploy logs all users out. Decided acceptable for a
   single-user personal app, in exchange for not having to reconcile session
   state with the same load/backup cycle as domain data.

4. **Snapshot versioning: native S3 bucket versioning on a single object
   key, with a lifecycle rule expiring noncurrent versions after 30 days.**
   Every backup upload becomes a new S3 version automatically — no
   custom timestamped-key naming or manual pruning logic needed. A bad
   write can be recovered by restoring an earlier version of the same key
   (via its S3 version ID) within the 30-day window.

5. **Restore procedure (runbook, manual for now):**
   - **Normal boot:** fetch the latest version of the snapshot object from
     S3 → `RUNSCRIPT FROM` into the fresh in-memory H2 instance → app starts
     serving traffic. (This is goal 2, and doubles as the restore path.)
   - **Recovering from a bad snapshot:** list versions of the S3 object,
     pick an earlier version ID, download it in place of "latest", then
     restart the app so the normal boot path loads it.
   - This procedure must be **rehearsed at least once** before the migration
     is considered done — e.g., deliberately point boot at an older version
     locally and confirm the app comes up with the expected data. An
     untested restore path is not a real backup.

## References

- Prior evaluation of RDS → H2 trade-offs: see conversation history on the
  `postgres-to-h2-migration` branch (pros/cons of embedded/in-memory H2 vs.
  managed Postgres for a single-user deployment).
