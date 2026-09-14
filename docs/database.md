# Database and authentication implementation

## Current status

The project now has a validated PostgreSQL Prisma schema in `prisma/schema.prisma` and a generated Prisma client. No database has been migrated or connected by this repository because no `DATABASE_URL` has been provided.

The existing React sign-up, verification, sign-in, and reset screens remain UI flows. They are not connected to a server yet and must not be described as live authentication. The real authentication boundary is specified in `src/lib/auth-contracts.ts`; the persistence tables it needs are `User`, `AuthToken`, `CommunityMembership`, `NotificationPreference`, and `PushSubscription`.

## Domain coverage

The schema uses normalized relations for:

- locations → communities → memberships;
- users, one-time authentication tokens, roles and verification state;
- posts, comments, reactions and content reports;
- community alerts, confirmations, sources, external events and immutable audit events;
- businesses, reviews and verification state;
- marketplace listings;
- notifications, delivery attempts and preferences;
- data sources and raw external events for future intelligence ingestion.

It includes composite indexes for active community feeds, recent posts, alerts, business/service discovery, marketplace listings, reports, and a user’s unread notifications. PostgreSQL full-text/trigram indexes can be added in a later migration once search ranking requirements are defined.

## Local setup

1. Create a PostgreSQL database and copy `.env.example` to `.env`.
2. Set a non-public `DATABASE_URL` and `AUTH_SESSION_SECRET`.
3. Run `npm run db:validate` and `npm run db:generate`.
4. Create the first migration with `npx prisma migrate dev --name init` after the database URL is configured.
5. Add a server/API runtime that implements `AuthService`, hashing passwords and tokens server-side. Do not expose `DATABASE_URL`, session secrets, or auth tokens to Vite client code.

## Safety invariants

- Community alerts default to `REPORTED`, with `LOW` confidence.
- High-risk alerts carry `requiresHumanReview`; a backend must not mark `broadNotificationSentAt` before a moderation check and audit event.
- `AlertAuditEvent` is append-only in application logic and preserves important moderation actions.
- A resident confirmation is an input signal, not verification of fact.
