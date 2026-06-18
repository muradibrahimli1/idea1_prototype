# Devex — Prototype

A small two-sided task marketplace for software engineers, from the Devex one-pager.

- **Creators** publish task packages into the marketplace and review submissions.
- **Solvers** buy a task (mock checkout), upload their solution (PDF / ZIP / any file),
  and receive a score + feedback.
- Both account types can do everything — the role you pick at signup just decides
  **where you land first** (Creator → _Create task_, Solver → _Marketplace_).

Stack: **Next.js 14 (App Router) · Supabase (Postgres + Auth + Storage) · Tailwind**.

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Open **Project Settings → API** and copy:
   - `Project URL`
   - `anon` `public` key

## 2. Run the database schema

In the Supabase dashboard: **SQL Editor → New query**, paste the contents of
[`supabase/schema.sql`](supabase/schema.sql), and **Run**. This creates the
tables, row-level-security policies, the `submissions` storage bucket, and a
trigger that creates a profile on signup.

## 3. Turn off email confirmation (prototype only)

**Authentication → Providers → Email →** disable **Confirm email**, and save.
This lets signup log you straight in so the role-based redirect works.

## 4. Configure env vars

```bash
cp .env.local.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## 5. Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

---

## Try the full flow

1. **Sign up as a Creator** → you land on _Create task_ → publish a task.
2. Sign out. **Sign up as a Solver** (different email) → you land on the
   _Marketplace_ → open the task → **Buy** (mock) → the brief unlocks.
3. As the solver, **upload a file** + notes → **Submit for review**.
4. Sign back in as the **Creator** → **Dashboard** → download the file, give a
   **score + feedback**, approve or reject.
5. Back as the **Solver**, the dashboard/task page shows the score and feedback.

## Project map

```
src/
  app/
    login, signup            # auth + role selection
    (app)/                   # authenticated area (shared navbar)
      marketplace            # browse all tasks
      tasks/create           # creator publishes a task
      tasks/[id]             # detail · buy · submit
      dashboard              # creator review queue + solver progress
    actions.ts               # server actions: createTask, buyTask, submit, review
    auth/signout             # POST sign-out
  lib/supabase/              # browser / server / middleware clients
  components/                # navbar, badges, review form
supabase/schema.sql          # tables + RLS + storage bucket
```

## Notes / prototype shortcuts

- **Payments are mocked** — "Buy" just records a purchase row; no Stripe.
- Uploaded files live in a **private** `submissions` bucket; download links are
  short-lived signed URLs generated server-side.
- RLS enforces that only a task's creator can review its submissions and only
  the solver/creator can see a submission.
