# Around Me Intelligence — Future Integration Architecture

This MVP does not collect external data, call AI models, or send push notifications. The contracts in `src/lib/intelligence-contracts.ts` establish the domain boundary required to add those capabilities safely later.

## Processing flow

`DataSource → ExternalEvent → IntelligenceProvider → CommunityAlert → AlertSource / AlertConfirmation → NotificationPayload`

1. A connector polls or receives a webhook from an approved source and saves the unmodified payload as an `ExternalEvent`.
2. The intelligence provider enriches the event: location extraction, category, de-duplication, summary, confidence and affected communities.
3. The alert service creates or updates a `CommunityAlert`. A user-created alert always begins as `reported`; no model or community confirmation should silently mark it verified.
4. Source citations are kept in `AlertSource`. Resident signals live in `AlertConfirmation` and are separate from source verification.
5. The notification service produces an `in_app` notification now and can add `push` delivery later from the same payload and user preferences.

## Safety and moderation gates

- Community reports display their source type and timestamp, and are never facts merely because they have been submitted or confirmed by neighbours.
- High-risk categories such as crime/security, fire and missing-person reports should be held from broad notifications by `ModerationHook.requiresHumanReview` until a moderator decision or authoritative source is present.
- `AlertAuditEvent` is append-only and records alert creation, confirmations, misinformation flags, moderation decisions and every notification hold/send action.
- Reporting misinformation must create a moderation case; it should not erase the original report or rewrite its history.
- The admin dashboard is an MVP moderation UI. Its buttons demonstrate workflow states; a production backend must enforce role-based access, immutable audit storage and moderator permissions server-side.

## Modularity rules

- Each source connector implements only data ingestion; it cannot directly publish an alert.
- `ExternalEvent` is immutable so enrichment can be audited and rerun.
- The `IntelligenceProvider` is an interface, allowing rules-based, human-reviewed, or AI implementations to coexist.
- A connector should only use public or authorized APIs and should retain source URLs, timestamps and provenance.
- Exact user addresses are never input to public alerts or notification payloads. Only an approved approximate community/location label is used.
- `verified` is reserved for trusted authoritative evidence or a reviewed moderation decision; AI confidence alone is not verification.

## Suggested services when a backend is introduced

- `community-api`: users, communities, posts, listings, services and recommendations.
- `alert-api`: reports, alert lifecycle, confirmations and moderation.
- `ingestion-worker`: source adapters, rate limits, retries and raw event storage.
- `intelligence-worker`: enrichment, clustering, duplicate detection and impact mapping.
- `notification-worker`: preference evaluation, in-app persistence and future push provider adapters.

The contracts keep the application independent of a particular database, message queue, AI provider or push vendor.
