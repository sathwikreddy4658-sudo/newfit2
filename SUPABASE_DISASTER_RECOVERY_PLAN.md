# Supabase Disaster Recovery Plan (Workspace-Specific)

Last updated: 2026-02-23

## Current Situation
- Support ticket already submitted (correct first action).
- This workspace contains enough artifacts to rebuild backend state if restore is not possible.
- Detected assets:
  - `68` SQL migration files in `supabase/migrations`
  - `13` Edge Functions in `supabase/functions`
  - Consolidated schema file: `consolidated-database-schema.sql`

---

## Track A (Preferred): Supabase Support Restores Project

### While waiting for support
1. Keep app in maintenance mode if production is impacted.
2. Prepare these details for support follow-up:
   - account email
   - org name
   - previous project ref(s)
   - first observed deletion time (UTC)
   - business impact statement
3. Ask specifically for:
   - project-level recovery from backup/PITR
   - storage bucket/object recovery
   - auth users recovery (if available)
   - function secrets recovery

### If support restores successfully
1. Verify tables and row counts.
2. Verify Storage buckets and file objects.
3. Verify Auth users and providers.
4. Verify Edge Functions and webhooks.
5. Rotate all API keys/secrets immediately.

---

## Track B: Rebuild Backend from This Repo (If Restore Fails)

## 1) Create new Supabase project
- Create a fresh project in same region.
- Save:
  - Project URL
  - anon key
  - service_role key
  - DB password

## 2) Restore database schema (fastest safe route)
Use **one** method:

### Method 1 (fastest): Consolidated schema
- In SQL Editor, run `consolidated-database-schema.sql`
- Validate key tables exist (`products`, `orders`, `order_items`, `profiles`, `user_roles`, `blogs`, `promo_codes`)

### Method 2 (clean migration history): ordered migrations
- Apply all files in `supabase/migrations` in filename order.
- Prefer this if you need exact historical migration lineage.

## 3) Recreate Edge Functions
Functions to deploy:
- `check-shipping`
- `cors-test`
- `delete-lab-report`
- `download-lab-report`
- `order-confirmation-email`
- `phonepe-check-status`
- `phonepe-initiate`
- `phonepe-refresh-token`
- `phonepe-webhook`
- `send-order-confirmation`
- `telegram-order-notification`
- `upload-lab-report`
- `verify-admin`

## 4) Recreate secrets and function config
- Re-add all required function secrets in Supabase dashboard.
- Recheck function JWT/auth settings per function requirement.
- Reconfigure webhooks (PhonePe/Telegram/other external systems).

## 5) Recreate Storage setup
- Recreate required buckets and policies.
- Re-upload any off-platform backups/assets if available.

## 6) Recreate admin access
- Create at least one admin user.
- Ensure `user_roles` contains admin role assignment.

## 7) Update app environment
- Update frontend/backend env vars to new project URL and keys.
- Redeploy app with new env configuration.

## 8) Validate critical flows
- Auth sign-up / login
- Product listing and details
- Checkout and order creation
- Payment callback/webhook flow
- Admin dashboard operations
- Lab reports upload/download (if used)

---

## Data Reality Check
- Schema/functions can be rebuilt from this repo.
- **Business data** (orders/users/files) can only be recovered from:
  1. Supabase restore/backups, or
  2. external exports/replicas/log sinks/third-party systems.

---

## Security Actions (Do This Regardless)
- Treat previous keys as compromised if they appeared in scripts/docs.
- Rotate all keys/secrets after restore/rebuild:
  - Supabase anon/service keys
  - payment provider keys
  - SMTP/API/webhook secrets
- Remove hardcoded credentials from scripts and move to env vars.

---

## Suggested Execution Order (Practical)
1. Wait for support response window (primary recovery chance).
2. In parallel, prepare Track B project skeleton.
3. If support cannot restore in acceptable time, execute Track B fully.
4. Run smoke tests and switch traffic.
5. Perform key rotation + post-incident cleanup.

---

## Workspace Pointers
- Migrations: `supabase/migrations`
- Edge Functions: `supabase/functions`
- Full schema shortcut: `consolidated-database-schema.sql`
- Quick bootstrap reference: `QUICK_START_NEW_DATABASE.md`
