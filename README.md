# HomeBook Israel

A Hebrew RTL-first smart home management platform for Israeli families — track homes, rooms, items, warranties, documents, professionals, and maintenance in one place, with Gemini-powered receipt/document scanning.

> **Status:** Under active phased development. See [`PHASE_0_ARCHITECTURE.md`](../PHASE_0_ARCHITECTURE.md) for the original architecture doc. **Note:** the DB/Auth stack described there (Supabase) was replaced with Neon + Drizzle + Auth.js — see [Architecture change](#architecture-change-supabase--neon--drizzle--authjs) below.

## Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript (strict)
- **Styling:** Tailwind CSS, Hebrew RTL-first (`dir="rtl"`, `lang="he"`)
- **Database:** [Neon](https://neon.tech) (serverless Postgres) + [Drizzle ORM](https://orm.drizzle.team)
- **Auth:** [Auth.js v5](https://authjs.dev) (Credentials provider, JWT sessions, bcrypt password hashing)
- **Storage:** Cloudflare R2 (S3-compatible) — planned for Phase 5, not yet implemented
- **AI:** Google Gemini API (`gemini-2.5-flash`, via `@google/genai`) — structured document extraction, zod-validated
- **Deployment:** Render.com

## Architecture change: Supabase → Neon + Drizzle + Auth.js

Phases 1–3 were originally built on Supabase (DB + Auth + Storage + RLS). Per project direction, this was replaced with:

| Concern | Was (Supabase) | Now |
|---|---|---|
| Database | Supabase Postgres | Neon Postgres |
| ORM / migrations | Hand-written SQL + Supabase CLI | Drizzle ORM (`src/db/schema.ts` is the source of truth) + Drizzle Kit |
| Auth | Supabase Auth | Auth.js v5, Credentials provider, JWT sessions |
| Password hashing | Supabase-managed | `bcryptjs`, in `src/lib/auth/password.ts` |
| Authorization | Row Level Security (`auth.uid()`) | **Application-layer scoping** — every query must filter by the authenticated user's id explicitly. Neon is plain Postgres with no built-in RLS-friendly session/auth integration, so this is enforced in code (Server Actions, route handlers), not the database. |
| Storage | Supabase Storage | Cloudflare R2 (S3-compatible) — not yet built (Phase 5) |

**Why this matters for future phases:** because authorization is no longer enforced by the database, every new query written in Phase 4 onward (homes/rooms/items CRUD) **must** explicitly filter by `ownerId`/`homeId` derived from the session — there is no RLS safety net catching a missing `WHERE` clause. Data-integrity triggers that don't depend on Supabase-specific features (like the `items.home_id` auto-sync from `rooms.home_id`) were ported over as plain Postgres triggers in `drizzle/migrations/0001_triggers.sql`, since Neon supports arbitrary Postgres functions/triggers.

## Getting Started

### Prerequisites
- Node.js 20+
- npm
- A [Neon](https://neon.tech) project (free tier is fine)

### Setup

```bash
npm install
cp .env.example .env.local
# fill in .env.local — see below
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Neon + Auth Setup

1. Create a project at [neon.tech](https://neon.tech).
2. Copy the connection string from the Neon dashboard into `.env.local` as `DATABASE_URL`. Neon's connection strings include `?sslmode=require` by default — keep that.
3. Generate an Auth.js secret and put it in `.env.local` as `AUTH_SECRET`:
   ```bash
   npx auth secret
   ```
4. Apply the schema:
   ```bash
   npm run db:migrate
   ```
   This runs everything in `drizzle/migrations/` in order: the 8 tables (`users`, `homes`, `rooms`, `items`, `documents`, `professionals`, `maintenance`, `reminders`) plus the `items.home_id` sync trigger and `updated_at` triggers.
5. If you change `src/db/schema.ts`, regenerate a migration before applying it:
   ```bash
   npm run db:generate   # writes a new file to drizzle/migrations/
   npm run db:migrate    # applies it
   ```
6. Optional: browse your data with Drizzle Studio:
   ```bash
   npm run db:studio
   ```

### Authentication

- `/register` and `/login` — email/password auth via Auth.js Credentials provider (Server Actions in `src/lib/actions/auth.ts`). Passwords are hashed with bcrypt before being stored in `users.password_hash` — plaintext passwords are never persisted.
- `/dashboard` and `/profile` are protected: `src/middleware.ts` (backed by the Edge-safe `src/auth.config.ts`) redirects unauthenticated visitors to `/login` (preserving `?redirectTo=`), and the `(dashboard)` layout re-checks the session server-side as defense in depth.
- Logged-in users are redirected away from `/login`/`/register` back to `/dashboard`.
- **Why two Auth.js config files:** `src/auth.config.ts` has no providers and is safe to run in the Edge runtime (used by `src/middleware.ts`). `src/auth.ts` extends it with the Credentials provider, which needs Node-only APIs (`bcryptjs`, the `pg` driver) — safe to import from Server Actions and the API route (`src/app/api/auth/[...nextauth]/route.ts`), but would break if imported into middleware.
- **`trustHost: true`** is set in `src/auth.config.ts` — required for any deployment behind a reverse proxy (Render, etc.), since Auth.js otherwise rejects the incoming `Host` header by default (`UntrustedHost` error → 500 on `/api/auth/*`).

### Core app: homes, rooms, items (Phase 4)

- `/dashboard` — lists the signed-in user's homes; empty state prompts creating the first one.
- `/homes/new`, `/homes/[homeId]`, `/homes/[homeId]/edit` — home CRUD.
- `/homes/[homeId]/rooms/new`, `/homes/[homeId]/rooms/[roomId]`, `/homes/[homeId]/rooms/[roomId]/edit` — room CRUD (with an icon picker), nested under a home.
- `/homes/[homeId]/rooms/[roomId]/items/new`, `.../items/[itemId]`, `.../items/[itemId]/edit` — item CRUD (category, brand, model, purchase date/price, warranty date, notes), nested under a room.
- Deleting a home cascades to its rooms/items (DB-level `ON DELETE CASCADE`); deleting a room cascades to its items. Both ask for confirmation client-side (`src/components/delete-button.tsx`) before submitting.
- **`src/lib/db/ownership.ts` is the authorization chokepoint.** Since Neon has no RLS, every page and Server Action that touches a home/room/item goes through `getOwnedHome` / `getOwnedRoom` / `getOwnedItem` / `getOwnedRoomInHome` instead of querying those tables directly by id — this is what stands in for the database-level RLS Supabase would have provided. **Any new query added in later phases must follow the same pattern**, or it risks leaking data across users.

### Documents (Phase 5)

- `/homes/[homeId]/documents` — upload and browse receipts, warranty cards, manuals, and other files, optionally attached to a specific item.
- **Storage: Cloudflare R2** (S3-compatible), private bucket, accessed via `src/lib/storage/r2.ts` using the AWS SDK. Objects are never public — every read/write goes through a short-lived presigned URL.
- **Upload flow (client uploads directly to R2, bypassing the Next.js server for file bytes):**
  1. Browser calls the `requestDocumentUpload` Server Action with the target home (and optional item) — it verifies ownership, then returns a presigned `PUT` URL good for 5 minutes and an object key shaped like `documents/{userId}/{homeId}/{uuid}-{filename}`.
  2. Browser `fetch`es that URL directly with the file as the body.
  3. Browser calls `confirmDocumentUpload` to persist the document row — this **independently re-verifies** that the object key's `userId`/`homeId` prefix matches the caller's session and the home they claim, so a forged key can't be used to attach a document to someone else's home.
  4. Viewing a document generates a fresh presigned `GET` URL (15 min expiry) server-side at page-render time — nothing is stored as a permanent public link.
- Set up an R2 bucket at [dash.cloudflare.com](https://dash.cloudflare.com) → R2, create an API token (Object Read & Write) scoped to that bucket, and fill in `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` in `.env.local`. Until these are set, the documents page still renders but shows a notice instead of allowing uploads (`isStorageConfigured()` gate, same graceful-degradation pattern used for `DATABASE_URL`/`AUTH_SECRET`).

### Professionals & Maintenance (Phase 6)

- `/professionals` — a user-level (not home-scoped) address book of electricians, plumbers, technicians, etc., with a 0–5 star rating. Reusable across all of a user's homes.
- `/homes/[homeId]/maintenance` — maintenance history for a home: description, date, cost, optionally linked to a specific item and/or professional. Shows a running total of tracked costs.
- Deleting a professional does **not** delete their maintenance history — `maintenance.professional_id` has `ON DELETE SET NULL`, so past records stay intact and just lose the professional link. Deleting a home/item still cascades as before.

### AI document analysis (Phase 7)

- On the documents page, an uploaded receipt/warranty card/manual shows a **✨ ניתוח AI** button (until it's been analyzed once — the button is replaced by the extracted summary after that).
- `src/services/gemini.ts` — sends the file (image or PDF, straight from R2, no OCR pre-processing needed since Gemini handles both natively) to `gemini-2.5-flash` with a JSON `responseSchema`, then **independently re-validates** the response with zod before trusting it. A well-formed `responseSchema` from Gemini is not treated as sufficient on its own — the API route only ever persists data that also passes the zod schema.
- `POST /api/ai/analyze-document` — Route Handler (not a Server Action, since this is genuinely an API endpoint per the original brief) that: authenticates, checks `isGeminiConfigured()`/`isStorageConfigured()`, verifies document ownership via `getOwnedDocument`, downloads the file from R2, calls Gemini, and writes the validated result to `documents.extracted_data` (a column that already existed in the schema from Phase 2 but was unused until now).
- Extracted fields: document type, vendor name, purchase date, total amount + currency, brand, model, warranty expiry date (computed from a stated warranty period + purchase date when possible), and a one-line Hebrew summary. The model is instructed to leave a field `null` rather than guess.
- Get an API key at [aistudio.google.com](https://aistudio.google.com/apikey) and set `GEMINI_API_KEY` in `.env.local`. Until it's set, the documents page shows a setup notice instead of the analyze button — same graceful-degradation pattern as `DATABASE_URL`/`AUTH_SECRET`/R2.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate a Drizzle migration from `src/db/schema.ts` |
| `npm run db:migrate` | Apply pending migrations to `DATABASE_URL` |
| `npm run db:studio` | Open Drizzle Studio to browse the database |

## Project Structure

```
src/app/(auth)/         # Login & register routes (public)
src/app/(dashboard)/    # Dashboard, homes/rooms/items, profile routes (protected)
src/app/api/auth/       # Auth.js route handler
src/components/ui/      # Reusable UI primitives (Button, Input, Textarea, FormAlert)
src/components/delete-button.tsx  # Confirm-before-delete form wrapper
src/db/schema.ts        # Drizzle schema — source of truth for the database
src/db/index.ts         # Lazily-initialized Drizzle client (pg driver, works with Neon)
src/db/migrate.ts       # Migration runner (npm run db:migrate)
src/lib/actions/        # Server Actions (auth, homes, rooms, items, documents, professionals, maintenance)
src/lib/auth/           # Password hashing (bcryptjs)
src/lib/db/ownership.ts # Authorization chokepoint — every home/room/item/document/professional/maintenance query goes through here
src/lib/storage/r2.ts   # Cloudflare R2 client (presigned upload/download URLs, raw byte download for AI analysis)
src/lib/constants/      # Shared constants (e.g. room icon list)
src/services/gemini.ts  # Gemini AI document analysis (structured extraction, zod-validated)
src/app/api/ai/         # AI analysis Route Handler
src/auth.config.ts      # Edge-safe Auth.js base config (used by middleware)
src/auth.ts             # Full Auth.js config with Credentials provider (server-only)
src/middleware.ts        # Route protection + session refresh
drizzle/migrations/      # Generated + hand-written SQL migrations
```

## Development Conventions

- **RTL first:** use Tailwind logical properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`) instead of directional ones (`ml-`, `mr-`, `text-left`, `text-right`).
- **No `any`:** strict TypeScript throughout; `@typescript-eslint/no-explicit-any` is enforced as an error.
- **No hardcoded secrets:** all credentials go through environment variables (`.env.local`, never committed).
- **No placeholders in "done" phases:** each phase delivers working, non-stubbed code.
- **Always scope queries by owner:** since there's no database-level RLS, every Drizzle query touching `homes`/`rooms`/`items`/etc. must filter by the authenticated user's id (directly via `ownerId`, or via a join up to `homes.ownerId`). This is the single most important convention going forward.

## License

Private project — not licensed for public redistribution.
