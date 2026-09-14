# Frontend audit — pre-production hardening

## Current architecture

`src/App.tsx` contains the complete product UI, sample data, navigation, local interaction state, admin preview, onboarding preview and modal flows. `src/styles.css` is similarly monolithic. The app builds cleanly, but it is intentionally a client-only prototype.

## Missing or non-live screens

- No live map or map renderer; no provider data may be shown until a public/fuzzed event API exists.
- No verified emergency facility directory; the product must not present an emergency dispatch experience.
- No live traffic, weather, flood, power, external-intelligence, profile, admin, search, file-upload, messaging or notification data.
- No loading, retry, offline, pagination, API-error or optimistic-update states because there are no APIs.

## State and component concerns

- `App.tsx` is too large and contains unrelated page components. Split by route/domain before API integration.
- Demo records are local constants and are not persisted. Keep the existing preview disclaimer until a live data store is connected.
- Several user-facing actions only show a toast; replace with real route/service behavior or label them unavailable.
- The desktop/sidebar, mobile bottom-nav and header navigation duplicate navigation intent. Consolidate into a route-aware navigation model.
- UI views should move to a router with deep-linkable map, alert detail, business, listing, community and admin routes.

## Accessibility and mobile concerns

- Navigation uses clickable `<a>` elements without links; use buttons or real routes and keyboard focus styles.
- Icon-only controls need consistent accessible names.
- Modals need focus trapping, Escape handling and focus return.
- Verify touch target size, screen-reader labels, contrast and landscape behaviour on physical devices.
- The mobile bottom navigation has been added and tested at 390px, but tablet and device-specific visual testing is still required.

## Performance concerns

- Do not import map SDKs or intelligence-heavy bundles into the initial feed route.
- Add route-level code splitting, image optimization, virtualization/pagination and bounded map queries before live data.
- Cache community feed/map requests by community, filter and cursor; never send all Nigerian events to the browser.
- Keep external fetching, AI, geocoding and push dispatch completely outside React render paths.
