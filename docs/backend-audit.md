# Backend audit — pre-production hardening

## Current state

There is no backend application, API route directory, worker, queue, authentication provider, deployment configuration, or object storage integration in this repository. The project is a Vite/React client plus Prisma schema and TypeScript contracts. Therefore there are no existing API routes to audit for authorization; all content mutation shown in the UI is local component state.

## Business logic currently in the frontend

- Account preview/onboarding state and primary-community selection.
- Post, comment, reaction, save and report interactions.
- Alert confirmation, status presentation and misinformation flags.
- Marketplace listing creation and saves.
- Service recommendations and notification read state.
- Admin “review” actions and export feedback.

These must move behind server-side services before real users can use the product.

## Required service boundaries

- `auth-service`: registration, password hashing, session issuance, verification/reset tokens, rate limits.
- `community-service`: primary membership and community-scoped authorization.
- `content-service`: posts/comments/reactions, ownership checks, sanitization and pagination.
- `alert-service`: reports, confirmations, lifecycle, moderation gate, audit events and geographic targeting.
- `intelligence-worker`: disabled source adapters, AI processing, geocoding, deduplication, confidence, stale-event processing.
- `notification-worker`: preference filtering, quiet hours, idempotency/deduplication and push delivery.
- `marketplace-service` / `business-service`: ownership, listing status transitions, recommendations/reviews, verification.
- `admin-service`: role-based moderation and immutable operator action records.

## Security and validation gaps

- No server authentication or authorization exists; every mutation needs user ownership checks and admin-only enforcement.
- Input validation is missing. Use server-side schemas (for example Zod) with length, enum, URL, phone and location-precision rules.
- Add CSRF protection/session-cookie controls, rate limits, CAPTCHA/spam safeguards for sensitive reports, and request idempotency keys.
- Sanitize rendered rich text and never trust client-supplied role, community, verification, confidence, or status values.
- Validate uploads by mime type, byte size, dimensions and malware scanning before storage.
- Never serve raw external payloads or precise residential location coordinates to the client.

## Infrastructure required

- PostgreSQL + PostGIS; Prisma migration workflow.
- Durable queue/scheduler (for example a managed queue or Redis-backed worker) for ingestion and notifications.
- Approved source credentials/terms and per-source fetch intervals; no arbitrary scraping.
- Object storage/CDN for images.
- Email provider, web-push credentials, Android/iOS push provider adapters.
- Realtime adapter (WebSocket, SSE or managed service) with topic authorization.
- Structured logging, error monitoring, metrics, secrets management, backups and deployment configuration.

## Environment variables needed in production

`DATABASE_URL`, `AUTH_SESSION_SECRET`, `APP_URL`, email credentials, object-storage credentials/bucket, push-provider credentials, queue/Redis URL, realtime-provider credentials, AI-provider key/model, geocoding-provider key, approved traffic/weather/provider keys, and source-specific API credentials where required. None are present today.
