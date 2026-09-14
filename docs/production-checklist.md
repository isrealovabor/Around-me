# Production checklist

## Required before public launch

- [ ] PostgreSQL instance provisioned; PostGIS migration reviewed and enabled if radius search is released.
- [ ] Baseline migration generated/reviewed/applied; production backup and restore rehearsal complete.
- [ ] `DATABASE_URL`, `DIRECT_URL`, `AUTH_SESSION_SECRET`, `APP_URL`, `CORS_ORIGIN` configured in a secret manager.
- [ ] API deployed separately from the static client; HTTPS, CSP, cookie, CORS, request-size and rate-limit policies configured.
- [ ] Auth registration, verification, password reset, session revocation and server-side authorization endpoints implemented and tested against the deployed database.
- [ ] Storage buckets created: `avatars`, `post-images`, `marketplace`, `businesses`, and private `verification`; upload scanning/type/size/ownership policies enabled.
- [ ] Email provider/domain configured for verification, reset and security notices.
- [ ] Queue/worker and monitoring configured for notifications, email and intelligence jobs.
- [ ] Admin account created through a controlled bootstrap path; audit log retention policy approved.
- [ ] RLS/policies reviewed if Supabase is chosen; users cannot query private profiles, reports, verification evidence, notifications or admin records.
- [ ] Dependency vulnerabilities reviewed and an upgrade plan approved.

## Only when enabling the corresponding capability

- [ ] AI provider key, usage limits, redaction policy and human-review thresholds.
- [ ] Map/geocoding provider, public-coordinate privacy policy and server-side radius query limits.
- [ ] Weather/traffic/power/emergency sources approved with terms, credentials, polling limits and retention rules.
- [ ] Push provider credentials, device subscription consent, preference filtering and delivery de-duplication.
- [ ] Realtime provider with per-community topic authorization.

## Verification commands

```powershell
npm run db:validate
npm run db:generate
npm run test:intelligence
npm run build
```
