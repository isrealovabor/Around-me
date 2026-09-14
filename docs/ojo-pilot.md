# Ojo pilot

## Scope

Around Me launches first in **Ojo LGA, Lagos State**. The Ojo pilot is a location configuration, not a permanent application restriction: `src/config/pilot.ts` is the single presentation-level switch and database locations remain hierarchical. Nationwide onboarding remains available; the richer area selector activates only when Lagos State and Ojo LGA are selected.

## Seeded hierarchy

`Nigeria → Lagos State → Ojo LGA → named local area → Community`

Development seed areas: Ojo, Iba, Okokomaiko, Alaba, Ajangbadi, Shibiri, Ijanikin, Satellite Town, Trade Fair, and Agaja. They are stored as named areas with `source=development_seed`, `boundaryAvailable=false`, and no coordinates. This deliberately avoids claiming verified boundaries or precise central locations.

## Enabled pilot experience

- Ojo-first onboarding: Lagos State → Ojo LGA → selected area, with no home-address collection.
- Ojo-wide/community area context in home, profile, alerts, services and marketplace views.
- Empty states for alerts, marketplace and services rather than invented activity.
- Community reports can be drafted in the client preview. Real posts, power, traffic, recommendations, alerts and marketplace records require the database-backed API.
- Pilot flags exist in `src/config/pilot.ts`; power reporting and marketplace are enabled for the UI path, while the live map remains disabled until protected server queries and a map provider exist.

## Moderation plan

Ojo moderators must use `CommunityMembership` with a community-scoped moderator role. They may review reports within assigned communities only. Platform-wide actions remain restricted to `ADMIN`/`SUPER_ADMIN`, with `AuditLog` entries required for sensitive actions. Missing-person and high-risk reports require human review before broad notification.

## Launch requirements

1. Provision PostgreSQL, generate/review the baseline migration, and run the Ojo seed.
2. Verify each pilot area with a local source before marking boundaries or coordinates verified.
3. Implement and deploy the database-backed APIs for membership, posts, reports, traffic/power reports, marketplace, recommendations and moderation.
4. Assign and train Ojo-scoped moderators; publish reporting and escalation guidance.
5. Enable storage, transactional email, rate limiting, logging/backups and privacy reviews before inviting residents.

## Missing local datasets

- Verified Ojo area boundaries/centroids and road aliases.
- Verified emergency facilities, organisations and contact numbers. No emergency directory entry is seeded.
- Approved traffic, weather, power and public-authority data sources.
- Confirmed community/estate moderation assignments.

## Metrics to monitor

- Activated users and area-selection completion.
- New posts, marketplace listings and recommendations per active user.
- Report review time, duplicate/misinformation rate, and unresolved high-risk reports.
- Traffic/power report expiry and reconfirmation rates.
- Moderator queue age, notification delivery failures, API errors and privacy complaints.

## Known limitations

The pilot currently runs as a local UI plus schema/server foundation. There is no connected database, external intelligence feed, live map, realtime channel, push delivery, verified emergency dataset, or authenticated production account. Those absences are intentionally shown as unavailable rather than simulated.
