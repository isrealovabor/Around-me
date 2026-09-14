# Around Me Intelligence operations

## Status

The intelligence foundation is implemented, but no external source is enabled and no AI provider, queue, or scheduler is deployed. The app must continue to state that only community-platform data is currently displayed.

`guardian-nigeria-rss` is a disabled adapter configuration for the public `https://guardian.ng/feed/` feed. It is an established-news source, not an official authority. It must be enabled only after an operational review of source terms, fetch limits, retention policy, and deployment controls. The Guardian Nigeria publishes an RSS feed; public RSS discovery supports the adapter design but is not a claim of an active integration. [Guardian Nigeria RSS](https://guardian.ng/feed/)

## Pipeline

`SourceAdapter → SourceItem → ExternalEventInput → AiEventExtractor → NigeriaLocationResolver → Deduplicator → confidence policy → CommunityTarget → review / alert publishing`

- Source adapters are server-only and return metadata, raw source items and normalized items.
- The current `ReviewRequiredExtractor` does **not** infer events. It marks content for review when no approved structured-output AI provider exists.
- Unknown locations return `{ country: 'NG', confidence: 0 }`; no state/city is inferred from ambiguous text.
- The confidence calculator can return `verified` only when an `officialConfirmation` signal is supplied. AI cannot set that result.
- Duplicate candidates share a group before an alert is created, limiting duplicate public alerts.
- `InMemoryIntelligenceQueue` is development-only. A production deployment must attach a durable queue and scheduler for ingestion, processing, deduplication, confidence recalculation and stale-event expiration.

## Review and notification rules

External events in `NEEDS_REVIEW`, uncertain locations, conflicting evidence, high severity, AI errors, and duplicate candidates should create `IntelligenceReviewCase` records. A moderator decision must create an alert audit event.

Traffic alerts should receive a short expiry window; weather/flood events can remain active while updated; missing-person items must require human review and must not auto-expire under traffic rules. High-priority notifications must require both confidence/relevance thresholds and geographically targeted communities. No push notification adapter is included yet.

## Tests

`npm run test:intelligence` uses mocked input only. It never calls a feed, AI provider, or paid service.
