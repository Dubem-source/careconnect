# CareConnect

Clinic appointment system — Next.js 16 (App Router, Turbopack), TypeScript, Tailwind, Prisma, Supabase.

## Stack

- **Frontend/Backend:** Next.js 16 (API routes are the backend — no separate server)
- **Database:** PostgreSQL via Supabase
- **ORM:** Prisma
- **Auth:** Supabase Auth (roles stored in `app_metadata.role`)
- **Email:** Resend (booking confirmations)
- **RBAC:** `proxy.ts` (Next.js 16's replacement for `middleware.ts`)

## 1. Install

```bash
npm install
```

## 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com) (free tier).
2. Go to **Project Settings → Database** and copy the connection string.
3. Go to **Project Settings → API** and copy the Project URL + anon key.
4. Copy `.env.example` to `.env` and fill in the three Supabase values plus your Resend API key.

```bash
cp .env.example .env
```

## 3. Push the database schema

```bash
npm run db:migrate
```

This creates the `patients`, `doctors`, `appointments`, and `medical_records` tables from `prisma/schema.prisma`.

## 4. Create test users

Doctors and patients both need a Supabase Auth user before they can log in.

- **Patients:** just register through the app at `/register` — it creates the auth user and the `Patient` row automatically.
- **Doctors:** create a user manually in **Supabase Dashboard → Authentication → Users → Add User**, then in that user's row set `app_metadata` to `{ "role": "DOCTOR" }`. Copy the user's UUID into `prisma/seed.ts`, then run:

```bash
npm run db:seed
```

## 5. Run it

```bash
npm run dev
```

Visit `http://localhost:3000`.

- `/register` → patient sign-up (FR-1)
- `/book` → booking flow (FR-2, FR-3)
- `/dashboard` → patient's own appointments
- `/staff/dashboard` → doctor/staff queue view (FR-3, FR-4) — requires a DOCTOR or ADMIN role
- `/admin/reports` → utilization reporting — requires ADMIN role

## Useful commands

```bash
npm run db:studio   # visual DB browser, no UI needed to inspect data
npm run build        # production build check
```

## Notes

- Route protection and role checks live in `proxy.ts` (Next.js 16 renamed `middleware.ts`).
- Double-booking is prevented at the database level via a `@@unique([doctorId, dateTime])` constraint in `schema.prisma`, not just app logic.
- SMS was cut from scope — notifications are email-only via Resend (free tier: 100/day).
