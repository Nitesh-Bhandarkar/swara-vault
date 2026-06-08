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
                             │ Session cookie (SameSite=None; Secure)
┌───────────────────────────▼─────────────────────────────────┐
│  Spring Boot 3.5  (Java 21, Maven)                          │
│  REST API · Spring Security · Spring Session JDBC           │
│  Hosted on Railway                                           │
└───────────┬───────────────────────────┬─────────────────────┘
            │ JDBC                       │ AWS SDK v2 (S3-compat)
┌───────────▼──────────┐   ┌────────────▼────────────────────┐
│  PostgreSQL           │   │  Cloudflare R2                  │
│  Hosted on Railway    │   │  MP3 audio file storage         │
│  Flyway migrations    │   │  Presigned PUT (upload)         │
│  Session tables here  │   │  Public URL (playback)          │
└──────────────────────┘   └─────────────────────────────────┘
```

**Auth flow:** Session-based. Spring Session JDBC stores session data in PostgreSQL (`spring_session` / `spring_session_attributes` tables). Frontend sends `credentials: include` on every request. Login sets `HttpOnly; SameSite=None; Secure` cookie.

**Audio flow:** Frontend requests presigned PUT URL from `/api/storage/upload-url` → uploads file directly to R2 → stores returned public URL in the DB field. Playback uses the public URL directly in `<audio>`.

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
| DB migrations | Flyway | via Boot |
| Auth / sessions | Spring Security + Spring Session JDBC | via Boot |
| File storage SDK | AWS SDK v2 S3 | 2.26.0 (BOM) |
| CSV parsing | OpenCSV | 5.9 |
| Database | PostgreSQL | latest on Railway |
| File storage | Cloudflare R2 | S3-compatible |
| Frontend host | Vercel | free tier |
| Backend host | Railway | ~$5/mo credit |

---

## Directory Structure

```
swara_vault/
├── CLAUDE.md                          ← this file
├── project-scope.md                   ← original requirements
│
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/swara/vault/
│       │   ├── SwaraVaultApplication.java   @SpringBootApplication @EnableJdbcHttpSession
│       │   ├── config/
│       │   │   ├── SecurityConfig.java      Spring Security, BCrypt, session entrypoint
│       │   │   ├── StorageConfig.java       S3Client + S3Presigner beans for R2
│       │   │   └── WebConfig.java           CORS mapping (/api/**)
│       │   ├── entity/
│       │   │   ├── Raga.java                Self-referencing (janakaRaga FK → raga)
│       │   │   ├── Composition.java         Belongs to Raga, has CompositionType enum
│       │   │   ├── CompositionType.java     GEETHE | KRUTHI | KEERTANE | VARNA
│       │   │   └── User.java                username, email, passwordHash
│       │   ├── repository/
│       │   │   ├── RagaRepository.java      search() JPQL, findByJanyaFalse...
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
│       │   │   ├── StorageService.java      Presigned URL generation for R2
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
│               ├── V1__create_schema.sql    app_user, raga, composition, spring_session tables
│               └── V2__seed_melakarta.sql   72 Melakarta Ragas (Kanakangi → Rasikapriya)
│
└── frontend/
    ├── vite.config.ts                 Tailwind v4 plugin + /api proxy → :8080
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx                    BrowserRouter + QueryClientProvider + all routes
    │   ├── index.css                  @import "tailwindcss" only
    │   ├── types/index.ts             Raga, Composition, Page<T>, CompositionType
    │   ├── api/
    │   │   ├── client.ts              Axios instance — baseURL=/api, withCredentials=true
    │   │   │                          401 interceptor → redirect to /login
    │   │   ├── auth.ts                login, logout, register, getMe
    │   │   └── ragas.ts               searchRagas, getRaga, CRUD, compositions, upload, import
    │   ├── components/
    │   │   ├── Layout.tsx             Top nav (Swara Vault | Ragas | + Add Raga | Import | Logout)
    │   │   ├── AudioPlayer.tsx        Play/Pause button wrapping <audio>
    │   │   ├── AudioUpload.tsx        File picker → presigned PUT → calls onUploaded(url)
    │   │   └── CompositionSection.tsx Per-type accordion with inline add/edit/delete forms
    │   └── pages/
    │       ├── LoginPage.tsx
    │       ├── RegisterPage.tsx
    │       ├── RagaListPage.tsx       Search bar + Janya/Melakarta filter + paginated list
    │       ├── RagaDetailPage.tsx     Full Raga view, clickable Janaka link, compositions
    │       ├── RagaFormPage.tsx       Add + Edit (same component, isEdit = id !== 'new')
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
                type (GEETHE|KRUTHI|KEERTANE|VARNA),
                name, tala, description, audio_url

spring_session + spring_session_attributes   (managed by Spring Session JDBC)
```

**Seeded data:** 72 Melakarta Ragas are inserted by `V2__seed_melakarta.sql` at startup. `is_seeded=true` rows cannot be deleted via the API.

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
  DELETE /api/ragas/:id         403 if is_seeded=true

Compositions  (nested under a Raga)
  POST   /api/ragas/:id/compositions              { type, name, tala, description, audioUrl }
  PUT    /api/ragas/:id/compositions/:cid
  DELETE /api/ragas/:id/compositions/:cid

Storage
  POST /api/storage/upload-url  { ragaId, filename, contentType, compositionId? }
                                → { uploadUrl (presigned PUT), publicUrl, fileKey }

Import
  POST /api/import/ragas        multipart file (.csv or .json)
                                → { imported: N, ragas: [...] }
```

---

## Key Design Decisions

- **Melakarta range is 1–72** (not 1–76 as written in the original scope — standard Carnatic system).
- **Seeded Melakarta Ragas cannot be deleted** (`is_seeded=true` guard in `RagaService.delete`).
- **DTOs are Java records** with static factory methods (`RagaDto.from(entity)`, `RagaDto.summary(entity)`). Entities are never serialised directly to avoid circular JSON with the self-referencing `janakaRaga` FK.
- **Audio upload is two-step:** frontend gets a presigned PUT URL from backend, uploads directly to R2 (bypassing backend), then saves the returned public URL back to the Raga/Composition via a normal PUT.
- **Tailwind v4** uses `@import "tailwindcss"` in CSS — there is no `tailwind.config.ts`.
- **`RagaFormPage`** doubles as both Add and Edit: `id === 'new'` → create, otherwise → update.
- **Session cookie** must be `SameSite=None; Secure` because Vercel (frontend) and Railway (backend) are on different domains. Axios must always send `withCredentials: true`.

---

## Environment Variables

### Backend (Railway)
| Variable | Description |
|---|---|
| `DATABASE_URL` | Railway PostgreSQL JDBC URL — `jdbc:postgresql://...` |
| `R2_ENDPOINT` | Cloudflare R2 endpoint — `https://<accountid>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY` | R2 API token access key |
| `R2_SECRET_KEY` | R2 API token secret key |
| `R2_BUCKET` | R2 bucket name (e.g. `swara-vault-audio`) |
| `R2_PUBLIC_URL` | Public URL for the R2 bucket (e.g. `https://pub-xxx.r2.dev`) |
| `CORS_ALLOWED_ORIGINS` | Vercel frontend URL (e.g. `https://swara-vault.vercel.app`) |
| `PORT` | Set automatically by Railway |

### Frontend (Vercel)
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend Railway URL — only needed for production build |

> In dev, Vite proxies `/api` → `http://localhost:8080` so no env var is needed locally.

---

## Development

```bash
# Backend (needs local Postgres)
cd backend
DATABASE_URL=jdbc:postgresql://localhost:5432/swara_dev \
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com \
R2_ACCESS_KEY=key R2_SECRET_KEY=secret \
R2_BUCKET=swara-vault-audio R2_PUBLIC_URL=https://pub.r2.dev \
CORS_ALLOWED_ORIGINS=http://localhost:5173 \
./mvnw spring-boot:run

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

1. **Railway** — create project → provision PostgreSQL → copy `DATABASE_URL`
2. **Cloudflare R2** — create bucket → enable public access → create API token with Object Read & Write → copy endpoint + keys
3. Set all backend env vars in Railway service settings
4. Connect Railway service to GitHub repo (root: `backend/`) → deploy
5. Flyway runs `V1` + `V2` on first startup — 72 Melakarta Ragas seeded automatically
6. **Vercel** — import GitHub repo (root: `frontend/`) → set `VITE_API_URL` → deploy
7. Set `CORS_ALLOWED_ORIGINS` in Railway to the deployed Vercel URL

---

## Known Constraints

- Audio uploads require the Raga to be saved first (the `ragaId` is needed for the R2 file key). The form shows a note about this on the "Add" page.
- Seeded Melakarta Ragas have `arohana`/`avarohana` left blank — the user fills these in via Edit.
- The `application.properties` file left by Spring Initializr is an empty placeholder — `application.yml` is the active config.
