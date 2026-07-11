# HomeBook Israel — Phase 0: Architecture & Planning

**Status:** Planning only — no code in this phase.

> **⚠️ Superseded update:** the Database/Auth/Storage stack below (Supabase) was replaced with **Neon (Postgres) + Drizzle ORM + Auth.js v5** partway through Phase 3. See `README.md` → "Architecture change: Supabase → Neon + Drizzle + Auth.js" for the current, accurate stack and the reasoning (mainly: authorization moved from database RLS to the application layer, since Neon has no `auth.uid()`-style RLS integration). The database design (8 tables, field-level schema) below is still accurate — only the platform/tooling changed.

---

## 1. Product Overview

HomeBook Israel is a Hebrew-RTL-first smart home management platform for Israeli families. It centralizes:

- Home & room inventory (items, appliances, warranties)
- Document storage (receipts, manuals, warranty cards)
- Professionals (electricians, plumbers, technicians) with ratings
- Maintenance history & cost tracking
- Reminders (warranty expiry, maintenance due dates)
- AI-assisted document/receipt scanning (Gemini)

**Primary users:** Israeli homeowners/renters managing one or more properties, tracking what they own, who fixed it, and when things need attention.

**Core design principle:** Hebrew RTL is the default layout direction, not a toggle bolted on afterward. All spacing, icons, and navigation are mirrored for RTL from day one.

---

## 2. Technology Decisions

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router) | Server components, built-in API routes, good Render.com support |
| Language | TypeScript (strict mode) | Type safety across DB models, forms, and AI responses |
| Styling | Tailwind CSS + `dir="rtl"` config | Utility-first, easy RTL logical properties (`ms-`, `me-`, `ps-`, `pe-`) |
| Backend/DB | Supabase (PostgreSQL) | Auth, Row Level Security, Storage, and Postgres in one managed service |
| Auth | Supabase Auth (email/password, session middleware) | Native integration with RLS policies |
| File Storage | Supabase Storage | Receipts, PDFs, item photos — bucketed with RLS |
| AI | Google Gemini API (multimodal) | Receipt/label/warranty extraction from images — **no OpenAI** |
| Hosting | Render.com | Static + Node web service, `render.yaml` for IaC |
| Fonts | Hebrew-support font (e.g. Assistant / Heebo via next/font) | Proper Hebrew glyph rendering |

**Explicitly excluded for this project:** OpenAI APIs, client-only auth (no server verification), `any` TypeScript types, hardcoded secrets, placeholder/stub code in "final" phases.

---

## 3. Folder Structure (target end-state, built incrementally)

```
homebook-israel/
├── .github/
│   └── workflows/            # CI (lint/build checks) — added Phase 1/9
├── public/
│   └── fonts/, icons/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── homes/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [homeId]/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── rooms/
│   │   │   │       │   └── [roomId]/page.tsx
│   │   │   │       ├── items/
│   │   │   │       │   ├── page.tsx
│   │   │   │       │   ├── new/page.tsx
│   │   │   │       │   └── [itemId]/page.tsx
│   │   │   │       ├── documents/page.tsx
│   │   │   │       ├── professionals/page.tsx
│   │   │   │       ├── maintenance/page.tsx
│   │   │   │       └── reminders/page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   └── ai/
│   │   │       └── analyze-document/route.ts
│   │   ├── layout.tsx          # root layout, dir="rtl", lang="he"
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                 # buttons, inputs, modals (reusable primitives)
│   │   ├── layout/              # nav, sidebar, header (RTL-aware)
│   │   ├── homes/, rooms/, items/, documents/, professionals/, maintenance/, reminders/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        # browser client
│   │   │   ├── server.ts        # server client (cookies)
│   │   │   └── middleware.ts
│   │   ├── gemini/
│   │   │   └── client.ts
│   │   └── utils/
│   ├── services/
│   │   └── gemini.ts             # Phase 7
│   ├── types/
│   │   └── database.types.ts     # generated from Supabase schema
│   ├── hooks/
│   └── middleware.ts              # route protection
├── supabase/
│   ├── migrations/                # SQL migrations, Phase 2
│   └── config.toml
├── .env.example
├── render.yaml                    # Phase 9
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .eslintrc.json
├── package.json
└── README.md
```

---

## 4. Database Design (Postgres / Supabase)

All tables use `uuid` primary keys (`gen_random_uuid()`), `created_at`/`updated_at` timestamps, and RLS scoped to the owning user (directly or via `home_id` ownership chain).

### `profiles`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | = `auth.users.id` |
| full_name | text | |
| phone | text | nullable |
| created_at | timestamptz | |

### `homes`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| owner_id | uuid FK → profiles.id | |
| name | text | e.g. "הבית ברחוב הרצל" |
| address | text | |
| city | text | |
| created_at / updated_at | timestamptz | |

### `rooms`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| home_id | uuid FK → homes.id | |
| name | text | e.g. "מטבח", "סלון" |
| icon | text | nullable, icon key |
| created_at | timestamptz | |

### `items`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| room_id | uuid FK → rooms.id | |
| home_id | uuid FK → homes.id | denormalized for RLS simplicity |
| name | text | |
| category | text | appliance, furniture, electronics, etc. |
| brand | text | nullable |
| model | text | nullable |
| purchase_date | date | nullable |
| purchase_price | numeric | nullable |
| warranty_expires_at | date | nullable |
| photo_url | text | nullable, Supabase Storage path |
| notes | text | nullable |
| created_at / updated_at | timestamptz | |

### `documents`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| home_id | uuid FK → homes.id | |
| item_id | uuid FK → items.id | nullable — doc may be home-level |
| type | text | receipt, warranty, manual, other |
| file_url | text | Storage path |
| file_name | text | |
| extracted_data | jsonb | nullable — Gemini output |
| uploaded_at | timestamptz | |

### `professionals`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| owner_id | uuid FK → profiles.id | |
| name | text | |
| profession | text | electrician, plumber, etc. |
| phone | text | nullable |
| rating | numeric(2,1) | 0–5, nullable |
| notes | text | nullable |
| created_at | timestamptz | |

### `maintenance`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| item_id | uuid FK → items.id | nullable |
| home_id | uuid FK → homes.id | |
| professional_id | uuid FK → professionals.id | nullable |
| description | text | |
| cost | numeric | nullable |
| performed_at | date | |
| created_at | timestamptz | |

### `reminders`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| home_id | uuid FK → homes.id | |
| item_id | uuid FK → items.id | nullable |
| title | text | |
| due_date | date | |
| status | text | pending, done, dismissed |
| created_at | timestamptz | |

**RLS strategy:** every table's policy checks `owner_id = auth.uid()` directly (profiles, homes, professionals) or joins up to `homes.owner_id = auth.uid()` (rooms, items, documents, maintenance, reminders). Written explicitly per table in Phase 2, not via a generic helper, to keep policies auditable.

**Storage buckets:** `item-photos` (public read via signed URL), `documents` (private, signed URL only).

---

## 5. Development Roadmap

| Phase | Deliverable | Depends on |
|---|---|---|
| 0 | Architecture & planning (this doc) | — |
| 1 | Next.js/TS/Tailwind/RTL/ESLint project scaffold, `npm install` verified | 0 |
| 2 | Supabase migrations for all 8 tables, RLS, storage buckets, Supabase client | 1 |
| 3 | Auth (login/register/logout), middleware, protected routes, profile | 2 |
| 4 | Dashboard, homes, rooms, items CRUD | 3 |
| 5 | Document upload (image/PDF), Storage integration, listing/preview | 4 |
| 6 | Professionals CRUD + ratings, maintenance history + cost tracking | 4 |
| 7 | Gemini integration: `services/gemini.ts`, `/api/ai/analyze-document` | 5 |
| 8 | RTL/mobile/loading/empty/error state polish, navigation | 4–7 |
| 9 | `render.yaml`, `.env.example`, prod README, lint/build clean | 8 |
| 10 | Code/security/performance/TS/dependency review | 9 |
| 11 | Final release package + `PRODUCTION_READY_REPORT.md` | 10 |

Each phase will only start after you approve the previous one's summary.

---

## 6. Open Decisions to Confirm Before Phase 1

1. **Package manager** — npm (as implied by your instructions) vs pnpm/yarn? I'll default to **npm** unless you say otherwise.
2. **Multi-home support** — should a single user manage multiple homes from day one (schema already supports this), or start with one home per user for MVP simplicity?
3. **Hebrew font** — any preference (Heebo, Assistant, Rubik) or should I pick one?
4. **Gemini model** — any preference, or should I select the current recommended multimodal Gemini model when we reach Phase 7?

If you don't have preferences, I'll proceed with sensible defaults (npm, multi-home schema from the start but simple UI initially, Heebo font) when Phase 1 begins.

---

**Next step:** once you approve this architecture, I'll start **Phase 1 — Project Foundation** (Next.js/TS/Tailwind/RTL scaffold), and stop there for your review before touching Supabase.
