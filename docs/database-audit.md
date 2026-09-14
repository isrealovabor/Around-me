# Database audit — pre-production hardening

Audited against `prisma/schema.prisma` on 2026-09-01. The schema is a useful domain prototype; it has not been migrated to a live PostgreSQL database.

## Existing models

- Geography and community: `Location`, `Community`, `CommunityMembership`.
- Identity and access: `User`, `AuthToken`, `NotificationPreference`, `PushSubscription`.
- Community content: `Post`, `Comment`, `Reaction`, `ContentReport`, `CommunityAnnouncement`.
- Alerts and moderation: `CommunityAlert`, `AlertConfirmation`, `AlertSource`, `AlertAuditEvent`, `IntelligenceReviewCase`.
- Intelligence: `DataSource`, `ExternalEvent`.
- Commerce: `Business`, `BusinessReview`, `MarketplaceListing`.
- Delivery: `Notification`, `NotificationDelivery`.

## Strengths already present

- Community-scoped recency indexes on posts, alerts, listings and notifications.
- Provenance (`DataSource`, raw external payload, `AlertSource`) and append-only-shaped alert audit records.
- Separate confirmation, content-report and review concepts.
- A hierarchy-capable location table rather than a hard-coded neighbourhood list.
- Configurable source trust and external event processing/lifecycle enums.

## Required redesign/hardening work for the next stage

1. **Primary community.** `CommunityMembership` allows many memberships but has no `isPrimary` field or a user-level `primaryCommunityId`. Add one with a database constraint/transactional service rule.
2. **User profile privacy.** Move private address/precise coordinate storage to a separate protected model, with purpose, consent, retention and access audit fields. `User.locationId` is adequate only for public/community precision.
3. **Geospatial queries.** Decimal latitude/longitude columns are not sufficient for map bounds/radius scale. Adopt PostGIS `geography(Point, 4326)` columns and GiST indexes for public event locations, communities, businesses and approved facilities. Keep a separate fuzzed public coordinate.
4. **External events ↔ alerts.** `AlertSource` permits source linkage but `CommunityAlert` has no canonical event-cluster relation. Introduce an `EventCluster` model or a required cluster foreign key when external publishing is enabled.
5. **Review ownership.** `IntelligenceReviewCase.assignedToId` lacks a `User` foreign key. Add it plus reviewer decision/audit relation.
6. **Report integrity.** `ContentReport` has nullable polymorphic foreign keys and no check that exactly one target is populated. Prefer distinct report target tables, or enforce a database check constraint in SQL migrations.
7. **Listing messaging and images.** `MarketplaceListing` needs image metadata/storage object references, listing conversations, seller visibility controls, expiry rules and immutable status transitions.
8. **Businesses.** Add structured provider services, opening hours, verified evidence, address privacy level, public coordinates and business moderation history. `BusinessReview.rating` should use a database check (1–5 when present).
9. **Notification preferences.** The current flat booleans do not cover traffic/weather/flood/power/service preferences, radius, quiet hours, critical overrides or briefing opt-ins. Replace with a versioned preferences model or normalized preference rows.
10. **Power and infrastructure.** Add `PowerIncident`, `InfrastructureIssue`, `EmergencyFacility`, provider/service-area metadata and anonymous aggregate observations only after product rules are finalized.
11. **Retention.** Add retention/expiry policies for raw source payloads, auth tokens, push tokens, precise location data and stale intelligence events.

## Index gaps

- Full-text/trigram indexes for business, listing, post and community search.
- PostGIS spatial indexes and partial indexes for active/non-expired alerts.
- Partial unique index for active push subscriptions and provider delivery deduplication keys.
- `ExternalEvent` hash currently unique per source; cross-source canonical URL/content clustering needs a separate deterministic index.
- Review queue composite index should include `assignedToId` and severity after those fields exist.

## No destructive migration performed

No table was dropped, renamed, or migrated. A production migration must begin with a tested PostgreSQL backup/restore plan and a data migration strategy.
