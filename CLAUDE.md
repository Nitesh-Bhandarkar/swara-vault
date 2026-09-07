# Swara Vault — Project Intelligence

Carnatic music reference application. A personal vault to catalog Ragas, their Arohana/Avarohana, and compositions (Geethe, Kruthi, Keertane, Varna) with optional audio playback.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                     │
│  React SPA (Vite + TypeScript + Tailwind v4)                │
│  Hosted on Vercel                                            │
└───────────────────────────┬─────────────────────────────────┘
                             │ HTTPS  /api/**  (withCredentials)
                             │ Session cookie — first-party on vercel.app
┌───────────────────────────▼─────────────────────────────────┐
│  Vercel Edge (API proxy)                                     │
│  vercel.json rewrites /api/:path* → EC2 backend               │
│  Makes all API calls same-origin — fixes mobile Chrome       │
│  third-party cookie blocking                                 │
└───────────────────────────┬─────────────────────────────────┘
                             │ HTTPS forwarded
┌───────────────────────────▼─────────────────────────────────┐
│  Spring Boot 3.5  (Java 21, Maven)                          │
│  REST API · Spring Security · in-memory HttpSession          │
│  Hosted on EC2                                                │
└───────────┬───────────────────────────┬─────────────────────┘
            │ in-process (JDBC)          │ AWS SDK v2 S3
┌───────────▼──────────┐   ┌────────────▼────────────────────┐
│  H2 (in-memory)       │   │  AWS S3                          │
│  Lives in the app JVM │   │  Audio files + one DB snapshot   │
│  Loaded from S3       │   │  object (H2 SCRIPT format)       │
│  snapshot on boot     │   │  Presigned PUT (audio upload)    │
│  Flyway on first boot │   │  Public URL (audio playback)     │
└──────────────────────┘   └─────────────────────────────────┘
```

**Auth flow:** Session-based, container default in-memory `HttpSession` (Spring Session JDBC was removed — see `docs/adr/0001-postgres-to-h2-migration.md`). Frontend sends `credentials: include` on every request. Login sets `HttpOnly; SameSite=None; Secure` cookie. After login, `LoginPage` pre-populates the `['me']` TanStack Query cache via `qc.setQueryData` so `ProtectedRoute` renders immediately without a second round-trip. **Sessions do not survive an app restart/redeploy** — accepted trade-off for a single-user personal app.

**Audio flow:** Frontend requests presigned PUT URL from `/api/storage/upload-url` → uploads file directly to S3 (bypassing backend) → stores returned public URL in the DB field. Playback uses the public URL directly in `<audio>`.

**Database persistence flow:** The database is an in-memory H2 instance living inside the app JVM — no separate DB server. On boot, `S3SnapshotService.restoreFromSnapshotIfPresent()` fetches the latest snapshot object from S3 (`storage.s3.snapshot-key`, an H2 `SCRIPT`-format SQL file) and `RUNSCRIPT`-loads it; if none exists yet (first-ever boot), Flyway runs `V1`–`V5` from scratch instead (seeding the 72 Melakarta ragas). Every raga/composition create/update/delete schedules an async, debounced-per-transaction snapshot re-upload (`SnapshotTrigger` → `S3SnapshotService.backupAsync()`), retried up to twice with exponential backoff (2s, 4s) before giving up and logging an error — the triggering HTTP request is never blocked or failed by a backup failure. See the ADR for the full design and the restore-from-an-older-S3-version runbook.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | React | 19 |
| Build tool | Vite | 8 |
| Language | TypeScript | 6 |
| Styling | Tailwind CSS | v4 (CSS import, no config file) |
| Routing | React Router | v7 |
| Server state | TanStack Query | v5 |
| Forms | React Hook Form + Zod | v7 / v4 |
| HTTP client | Axios | v1 |
| Backend framework | Spring Boot | 3.5.3 |
| Language | Java | 21 |
| Build | Maven | wrapper included |
| ORM | Spring Data JPA / Hibernate | via Boot |
| DB migrations | Flyway | via Boot (first-boot only — see below) |
| Auth / sessions | Spring Security, container default `HttpSession` | via Boot |
| File storage SDK | AWS SDK v2 S3 | 2.26.0 (BOM) |
| CSV parsing | OpenCSV | 5.9 |
| Database | H2 (in-memory), S3-snapshot backed | 2.x |
| File storage | AWS S3 | — |
| Frontend host | Vercel | free tier |
| Backend host | EC2 | — |

---

## Directory Structure

```
swara_vault/
├── CLAUDE.md                          ← this file
├── vercel.json                        ← Vercel build + /api proxy rewrite (repo root)
├── project-scope.md                   ← original requirements
├── docs/adr/                          ← Architecture Decision Records (numbered, immutable once accepted)
│   └── 0001-postgres-to-h2-migration.md
│
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/swara/vault/
│       │   ├── SwaraVaultApplication.java   @SpringBootApplication
│       │   ├── config/
│       │   │   ├── SecurityConfig.java      Spring Security, BCrypt, session entrypoint
│       │   │   ├── StorageConfig.java       S3Client + S3Presigner beans (audio storage)
│       │   │   ├── WebConfig.java           CORS mapping (/api/**)
│       │   │   ├── AsyncConfig.java         @EnableAsync + snapshotExecutor/retry-scheduler beans
│       │   │   └── DatabaseBootConfig.java  FlywayMigrationStrategy: S3 restore, else migrate()
│       │   ├── entity/
│       │   │   ├── Raga.java                Self-referencing (janakaRaga FK → raga)
│       │   │   ├── Composition.java         Belongs to Raga, has CompositionType enum
│       │   │   ├── CompositionType.java     GEETHE | JATHI_SWARA | KRUTHI | KEERTANE | VARNA
│       │   │   └── User.java                username, email, passwordHash
│       │   ├── repository/
│       │   │   ├── RagaRepository.java      derived-query methods, no native/JPQL SQL
│       │   │   ├── CompositionRepository.java
│       │   │   └── UserRepository.java
│       │   ├── dto/                         Java records used as request/response bodies
│       │   │   ├── RagaDto.java             static from() and summary() factory methods
│       │   │   ├── RagaRequest.java
│       │   │   ├── CompositionDto.java
│       │   │   ├── CompositionRequest.java
│       │   │   ├── LoginRequest.java
│       │   │   ├── RegisterRequest.java
│       │   │   ├── UploadUrlRequest.java
│       │   │   └── UploadUrlResponse.java
│       │   ├── service/
│       │   │   ├── RagaService.java         CRUD + validation (janya/melakarta rules)
│       │   │   ├── CompositionService.java
│       │   │   ├── StorageService.java      Presigned URL generation (audio upload)
│       │   │   ├── S3SnapshotService.java   H2 SCRIPT ⇄ S3 snapshot load/backup + retry/backoff
│       │   │   ├── SnapshotTrigger.java     Per-transaction-deduped backup scheduling on mutation
│       │   │   ├── ImportService.java       CSV + JSON bulk import
│       │   │   └── UserService.java         implements UserDetailsService
│       │   └── controller/
│       │       ├── RagaController.java      GET/POST/PUT/DELETE /api/ragas
│       │       ├── CompositionController.java  nested under /api/ragas/{id}/compositions
│       │       ├── StorageController.java   POST /api/storage/upload-url
│       │       ├── ImportController.java    POST /api/import/ragas (multipart)
│       │       └── AuthController.java      /api/auth/login|logout|register|me
│       └── resources/
│           ├── application.yml
│           └── db/migration/
│               ├── V1__create_schema.sql    app_user, raga, composition (H2 syntax)
│               └── V2__seed_melakarta.sql   72 Melakarta Ragas (Kanakangi → Rasikapriya)
│
└── frontend/
    ├── vite.config.ts                 Tailwind v4 plugin + /api proxy → :8080 (dev only)
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx                    BrowserRouter + QueryClientProvider + all routes
    │   ├── index.css                  @import "tailwindcss" + custom CSS (sv-card, btn-gold,
    │   │                              sv-seek, note-bounce, shimmer-bar, float-note keyframes)
    │   ├── types/index.ts             Raga, Composition, Page<T>, CompositionType
    │   ├── api/
    │   │   ├── client.ts              Axios instance — baseURL=/api, withCredentials=true
    │   │   │                          401 interceptor → redirect to /login
    │   │   ├── auth.ts                login, logout, register, getMe
    │   │   └── ragas.ts               searchRagas, getRaga, CRUD, compositions, upload, import
    │   ├── components/
    │   │   ├── Layout.tsx             Top nav + fixed instrument emoji decorations (opacity 0.4)
    │   │   ├── NoteSpinner.tsx        Musical note loading indicator (♩♪♫ bounce animation)
    │   │   ├── AudioPlayer.tsx        Play/Pause + seek bar + time display + speed controls
    │   │   ├── AudioUpload.tsx        File picker (no accept filter) → presigned PUT → onUploaded(url)
    │   │   └── CompositionSection.tsx Per-type accordion with inline add/edit/delete + shimmer refresh
    │   └── pages/
    │       ├── LoginPage.tsx          Pre-populates ['me'] cache after login (no ProtectedRoute race)
    │       ├── RegisterPage.tsx
    │       ├── RagaListPage.tsx       Search bar + Janya/Janaka filter + paginated list
    │       ├── RagaDetailPage.tsx     Full Raga view, clickable Janaka link, inline delete confirm
    │       ├── RagaFormPage.tsx       Add + Edit (isEdit = id !== 'new'); audio upload auto-saves
    │       └── ImportPage.tsx         Drag-and-drop CSV/JSON with format reference
```

---

## Database Schema

```sql
app_user        id, username (unique), email (unique), password_hash, created_at

raga            id, name (unique), janya (bool),
                janaka_raga_id (FK → raga, null if melakarta),
                melakarta_number (1–72, null if janya),
                arohana, arohana_audio_url,
                avarohana, avarohana_audio_url,
                is_seeded (true for the 72 pre-seeded Melakarta ragas),
                created_at
                CONSTRAINT: janya=true ↔ janaka_raga_id set, melakarta_number null
                             janya=false ↔ melakarta_number set, janaka_raga_id null

composition     id, raga_id (FK → raga CASCADE DELETE),
                type (GEETHE|JATHI_SWARA|KRUTHI|KEERTANE|VARNA),
                name, tala, description

composition_audio_url   composition_id (FK → composition CASCADE DELETE),
                audio_url, position   (ordered multi-audio-per-composition)
```

Runs as an **in-memory H2 database** inside the app JVM (no separate DB server/process) — see the Architecture diagram above and `docs/adr/0001-postgres-to-h2-migration.md`.

**Seeded data:** on first-ever boot (no S3 snapshot yet), 72 Melakarta Ragas are inserted by `V2__seed_melakarta.sql`. `is_seeded=true` is informational only — all ragas including seeded ones can be deleted via the API. On every later boot, the full dataset (not just the seed) is restored from the S3 snapshot instead of re-running Flyway.

---

## API Endpoints

```
Auth
  POST /api/auth/register       { username, email, password }
  POST /api/auth/login          { username, password }  → sets session cookie
  POST /api/auth/logout
  GET  /api/auth/me             → { username } or 401

Ragas
  GET  /api/ragas               ?q=&janya=&page=&size=   → Page<RagaDto>
  GET  /api/ragas/melakarta     → List<RagaDto> (all 72, ordered by number)
  GET  /api/ragas/:id           → RagaDto (includes full compositions list)
  POST /api/ragas               { name, janya, janakaRagaId|melakarataNumber,
                                  arohana, arohanaAudioUrl, avarohana, avarohanaAudioUrl }
  PUT  /api/ragas/:id           same body as POST
  DELETE /api/ragas/:id         deletes any raga including seeded ones

Compositions  (nested under a Raga)
  POST   /api/ragas/:id/compositions              { type, name, tala, description, audioUrls: [...] }
  PUT    /api/ragas/:id/compositions/:cid
  DELETE /api/ragas/:id/compositions/:cid

Storage
  POST /api/storage/upload-url  { ragaId, filename, contentType, compositionId? }
                                → { uploadUrl (presigned PUT), publicUrl, fileKey }
                                contentType must start with "audio/" or be a video/mpeg variant

Import
  POST /api/import/ragas        multipart file (.csv or .json)
                                → { imported: N, ragas: [...] }
```

---

## Key Design Decisions

- **Melakarta range is 1–72** (not 1–76 as written in the original scope — standard Carnatic system).
- **Seeded Melakarta Ragas can be deleted** — the `is_seeded` guard was removed from `RagaService.delete()`. The `is_seeded` flag remains in the DB and is shown as a badge in the UI, but it no longer blocks deletion.
- **DTOs are Java records** with static factory methods (`RagaDto.from(entity)`, `RagaDto.summary(entity)`). Entities are never serialised directly to avoid circular JSON with the self-referencing `janakaRaga` FK.
- **Audio upload is two-step:** frontend gets a presigned PUT URL from backend, uploads directly to R2 (bypassing backend), then saves the returned public URL back to the Raga/Composition via a normal PUT. In Edit mode, audio upload auto-saves immediately without requiring a separate "Save changes" click.
- **Audio type validation:** backend accepts any `audio/*` content type plus `video/mpeg`, `video/mpg`, `video/x-mpeg` (MPEG containers reported as video by some OSes). Frontend has no `accept` attribute on the file input (mobile Chrome compatibility) and only rejects files where `file.type` is positively identified as non-audio.
- **Vercel API proxy:** `vercel.json` at repo root rewrites `/api/:path*` → Railway. All API calls are same-origin from the browser, making the session cookie first-party on `vercel.app`. This fixes Chrome for Android's third-party cookie blocking. `VITE_API_URL` is no longer used — `client.ts` always sets `baseURL: '/api'`.
- **Tailwind v4** uses `@import "tailwindcss"` in CSS — there is no `tailwind.config.ts`.
- **`RagaFormPage`** doubles as both Add and Edit: `id === 'new'` → create, otherwise → update.
- **Session cookie** must be `SameSite=None; Secure` because the Railway backend origin differs from Vercel. Combined with the Vercel proxy, this ensures cookies work on all browsers including mobile Chrome.
- **NoteSpinner** — reusable `<NoteSpinner>` component (♩♪♫ bounce) used on every button that triggers an API call.
- **AudioPlayer** — enhanced with a draggable seek bar (`sv-seek` CSS class, gold fill), current/total time display, and speed selector (1× 1.25× 1.5× 2×).
- **Database is in-memory H2, backed by an S3 snapshot** (`docs/adr/0001-postgres-to-h2-migration.md`) — no managed DB service. `DatabaseBootConfig`'s `FlywayMigrationStrategy` tries `S3SnapshotService.restoreFromSnapshotIfPresent()` first; only runs Flyway's `V1`–`V5` from scratch when no snapshot exists (first-ever boot). Every mutation schedules an async full-snapshot re-upload via `SnapshotTrigger` (deduped per transaction, so a bulk CSV/JSON import triggers one upload, not N), retried up to twice with exponential backoff (2s, 4s) before giving up — never blocks or fails the triggering request.
- **Sessions are no longer persisted** — Spring Session JDBC was removed along with Postgres; the app uses the servlet container's default in-memory `HttpSession`. Every restart/redeploy logs all users out (accepted trade-off, single-user app).
- **`GlobalExceptionHandler`'s FK-violation detection uses `SQLState`** (`23503`/`23506`), not message string-matching — H2's exception message text differs from Postgres's, so string-matching would have silently broken the friendly "cannot delete: referenced" 409 response.

---

## Environment Variables

### Backend (EC2)
| Variable | Description |
|---|---|
| `S3_BUCKET` | S3 bucket name — holds both audio files and the DB snapshot object |
| `AWS_REGION` | AWS region (default `us-east-1`) |
| `S3_ENDPOINT` | Blank for native AWS S3; set for a custom/S3-compatible endpoint |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | Blank to use the EC2 instance's IAM role; set to override |
| `S3_PUBLIC_URL` | Public URL for the bucket (audio playback links) |
| `S3_SNAPSHOT_KEY` | DB snapshot object key (default `db-seed/snapshot.sql`) — must match `backend/scripts/export-rds-to-h2-seed.sh`'s `S3_SEED_KEY` if that script is re-run |
| `CORS_ALLOWED_ORIGINS` | Vercel frontend URL (e.g. `https://swara-vault.vercel.app`) |
| `PORT` | Server port (defaults to `8080`) |

### Frontend (Vercel)
No frontend environment variables are required. `VITE_API_URL` is no longer read by the code — all API calls go through the Vercel proxy rewrite in `vercel.json`.

> In dev, Vite proxies `/api` → `http://localhost:8080` (configured in `vite.config.ts`).

---

## Development

```bash
# Backend (no external DB needed — H2 is in-memory)
cd backend
S3_BUCKET=swara-vault-audio S3_PUBLIC_URL=https://pub.example.com \
S3_ACCESS_KEY=key S3_SECRET_KEY=secret \
CORS_ALLOWED_ORIGINS=http://localhost:5173 \
./mvnw spring-boot:run
# With no S3_BUCKET set (or no snapshot object present yet), the app falls back
# to Flyway on boot and starts with just the 72 seeded Melakarta ragas.

# Frontend
cd frontend
npm run dev        # http://localhost:5173

# TypeScript check + production build
npm run build
```

### Backend compile check
```bash
cd backend && ./mvnw compile -q
```

---

## Deployment Checklist

1. **S3 bucket** — create bucket → enable **versioning** + a lifecycle rule expiring noncurrent versions after 30 days (the DB snapshot's only recovery mechanism, per the ADR) → grant the EC2 instance's IAM role (or an access key pair) Object Read & Write
2. **EC2** — deploy the Spring Boot jar; set all backend env vars (see above)
3. First-ever boot with no snapshot object present: Flyway runs `V1`–`V5` — 72 Melakarta Ragas seeded automatically. Every mutation thereafter re-uploads a full DB snapshot to S3 in the background.
4. **Vercel** — import GitHub repo (repo root, not `frontend/`) → deploy (no env vars needed)
5. Set `CORS_ALLOWED_ORIGINS` on EC2 to the deployed Vercel URL
6. Rehearse the S3-version restore runbook at least once before relying on this in production (ADR resolved decision 5) — list object versions of the snapshot key, restore an older `VersionId`, restart, confirm the app boots with that older dataset.

---

## Known Constraints

- Audio uploads require the Raga to be saved first (the `ragaId` is needed for the S3 file key). The form shows a note about this on the "Add" page.
- The H2 database is entirely in-memory: all data lives only in the running JVM's heap between snapshot backups. A crash between a successful write and its (up to ~10s-delayed, with retries) S3 backup completing loses that write — see the ADR's "Costs / risks accepted" section.
- Seeded Melakarta Ragas have `arohana`/`avarohana` left blank — the user fills these in via Edit.
- The `application.properties` file left by Spring Initializr is an empty placeholder — `application.yml` is the active config.
- The Vercel `vercel.json` must be at the **repo root** (not inside `frontend/`) for the API proxy rewrite to work correctly.
