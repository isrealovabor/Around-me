# Production architecture

## Required for the MVP

```text
React/Vite client → HTTPS API → PostgreSQL + PostGIS
                         ├─ Object storage (public images / private verification evidence)
                         ├─ Transactional email service
                         ├─ Redis or managed durable queue + worker
                         └─ Monitoring, structured logs and managed database backups
```

- **Frontend:** retain the existing Vite client, deploy it as static assets behind HTTPS, and set only `VITE_API_URL` as a browser-visible variable.
- **API:** the new `server/` boundary owns validation, authentication, authorization, pagination, uploads, notifications and moderation. It must use secure HTTP-only cookies or bearer tokens validated server-side.
- **Database:** PostgreSQL is the selected provider. Enable PostGIS through a reviewed SQL migration before adding radius/bounds queries. Prisma remains the relational data-access layer.
- **Storage:** use separate public buckets for approved public media and a private verification bucket with short-lived signed URLs. Store object keys/metadata in PostgreSQL, never binary images.
- **Jobs:** use a durable queue/scheduler for email, notifications, external ingestion, AI processing and expiry. The in-memory queue is development-only.

## Optional / future integrations

- Realtime: Supabase Realtime, SSE, or WebSockets after topic authorization is implemented; never subscribe a client to all database changes.
- Intelligence: approved news, government, weather, traffic, electricity and emergency providers through the existing adapters. No adapter is enabled today.
- AI, maps, weather and push providers are isolated behind server-side contracts and need accounts/keys before use.

## Security controls before launch

- Put `DATABASE_URL`, service-role credentials, AI keys, provider keys and token secrets in the deployment secret manager only.
- Configure CORS to the production client origin, HTTPS-only cookies, CSRF protection, rate limits and request-size limits.
- Apply role checks in API services, not UI components; write `AuditLog` records for sensitive moderation/admin actions.
- Use managed point-in-time recovery plus scheduled restore tests. Do not rely on manual exports as the only backup.

## Migration workflow

There is no existing production database or migration history. After a PostgreSQL project exists, create the baseline migration from the checked-in schema, review its SQL, then apply it once to an empty database:

```powershell
npm run db:validate
npm run db:migrate:dev -- --name initial_platform_schema
npm run db:migrate:deploy
npm run db:seed
```

For an existing database, do **not** use this baseline. Take a backup, generate a diff against the live schema, write a phased data migration (including backfills for profiles/category IDs), and rehearse restoration first.
