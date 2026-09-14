# Around Me controlled beta

Around Me uses Vite/React, a Hono API, Supabase PostgreSQL/Storage, Upstash Redis (optional cache/rate-limit resilience), Resend, Mapbox, OpenAI, and Open-Meteo. PostgreSQL is authoritative; Redis and AI are optional.

Copy `.env.example` to a private `.env`. Only `VITE_*` values are browser-visible. Keep database, Supabase secret, Resend, OpenAI, Redis, and session credentials server-only.

Run migrations with `npm run migrate:deploy`; never use `db push` in production. Build with `npm run build`, start with `npm run start`, and validate readiness with `npm run readiness:check`. Liveness is `/health`; dependency readiness endpoints report sanitized booleans only.

Set `APP_URL` and `CORS_ORIGIN` to the eventual HTTPS frontend origin. Until a domain is purchased, Resend production delivery remains `PENDING_DOMAIN`; development sender limits apply. Set beta flags through environment variables; `BETA_MODE` is safe to disable when opening publicly.

For a test deployment, Vercel receives only `VITE_API_BASE_URL` and `VITE_MAPBOX_ACCESS_TOKEN`; it must never receive server credentials. Render receives server-only variables, runs `npm run migrate:deploy`, and starts with `npm start`. Configure Render `APP_URL` and `CORS_ORIGIN` to the assigned Vercel URL after it exists. Cookie authentication uses HTTPS-aware secure cookies and credentialed requests; cross-origin browser cookie policies should be tested with the assigned preview URLs before inviting beta users.

Supabase backups, database recovery, storage retention, and provider key rotation are provider/manual responsibilities and must be confirmed before production. Migrations are additive where possible; rollback should use a new corrective migration, never a database reset. No backup configuration is claimed by this repository.
