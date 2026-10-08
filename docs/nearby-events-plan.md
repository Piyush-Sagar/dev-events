# Nearby real developer events

Branch: `codex/nearby-real-events`

## Outcome

Replace the sample-event homepage with real upcoming developer events. A visitor can automatically use browser location with permission or choose a city, search by topic, set a radius and date window, view event details, and continue to the organizer's registration page. Discovery must work independently of the currently broken MongoDB connection.

## API decision

Use the community-maintained [developers.events JSON API](https://developers.events/all-events.json), documented in its [source repository](https://github.com/scraly/developers-conferences-agenda). Combine it with the maintainers' [city coordinate data](https://raw.githubusercontent.com/scraly/developers-conferences-agenda/main/page/src/misc/geolocations.json). These endpoints need no API key. During research on 8 October 2026, the live feed contained 6,271 records, including 681 ongoing/future records and 20 in India; counts will change.

The source content is [CC BY-NC 4.0](https://github.com/scraly/developers-conferences-agenda/blob/main/LICENSE-CONTENT). Show creator/source attribution and license links, and identify that dates/tags/distances are normalized by DevEvents. This implementation is for noncommercial discovery. A commercial version requires the maintainers' permission or a replacement provider.

| Provider | Assessment |
| --- | --- |
| developers.events | Developer-specific, real organizer URLs, worldwide city data, no credentials; selected for the first release |
| [Ticketmaster Discovery](https://developer.ticketmaster.com/products-and-docs/apis/discovery/v2/) | Supports geographic search, but needs an API key and focuses on broader ticketed events; useful future adapter for general events |
| [AllEvents](https://developer.allevents.in/apis) | Has city and coordinate searches; a candidate for wider local meetup coverage once API access is obtained |
| [Eventbrite](https://www.eventbrite.com/platform/new/api) | Public event search is deprecated; not a viable open discovery backend |
| [Meetup](https://www.meetup.com/api/) | API access requires an approved OAuth consumer and Pro subscription; not suitable for a credential-free first release |

## First-release implementation

1. **Normalize real data:** Validate upstream payloads, ignore malformed/cancelled/past events, deduplicate repeated records, retain organizer URLs, tags, country, and date range. Do not invent a time, venue, ticket price, or description when the feed omits it.
2. **Fetch efficiently:** Cache the normalized upcoming catalog and city data for one hour, impose fetch timeouts, and return a clear service error if the source is unavailable. The full historical feed exceeds Next's 2 MB fetch-cache limit, so do not put that raw response in the fetch cache. Never substitute fake events on provider failure.
3. **Find nearby events:** Add an internal read-only discovery API supporting validated coordinates/city, radius, query, days, mode, sort, and bounded pagination. Calculate great-circle distance to host-city coordinates. Unknown coordinates are excluded from radius searches. Label distances as approximate distances to the host city, not the venue.
4. **Location UX:** Automatically request browser location on arrival unless the URL selects a manual city, worldwide discovery, or online-only events. Offer city search, "Choose another location", and a "Use my location" retry button. Permission denial, timeouts, unsupported browsers, and empty coverage all retain the manual-city path. GPS coordinates remain in component memory, are rounded before requests, are not persisted, and are not sent to the upstream event provider. Preserve selected city and filters in the URL; do not put GPS coordinates in shareable URLs.
5. **Useful browsing:** Show query, radius, time-window, online/in-person, and date/distance filters; display loading, retry, empty, and pagination states. Separate online events from proximity results. Preserve active filters while paging. Show coverage limitations rather than implying every local meetup is included.
6. **Real detail/registration:** Add dedicated imported-event pages with authentic title, location, date range, topic labels, source attribution, organizer link, and an add-to-calendar download. Imported events have no local edit/delete/booking controls; registration remains with the actual organizer.
7. **Remove automatic placeholders:** Stop returning seeded fixtures when MongoDB is absent or unavailable. Keep fixtures only for explicit seeding/testing. Existing user-created event routes remain available as a separate community-events area when the database works.
8. **Verify and commit:** Test date boundaries, malformed upstream data, safe URLs, deduplication, coordinate bounds, radius filtering, online separation, pagination, calendar escaping, and upstream failures. Run lint, typecheck, tests, build, live upstream API checks, and local browser checks. Commit feature work on this branch for review.

## Acceptance criteria

- Homepage and detail pages contain real provider data and no placeholder fallback.
- A Bengaluru city search returns only ongoing/upcoming events within the selected radius; a sparse city truthfully returns no matches.
- Radius is enforced using unrounded distances; missing coordinates never appear as nearby.
- Online-only discovery works without location and is never described as nearby.
- Manual city selection works without browser permission; browser permission gates automatic location; manual/worldwide/online links bypass detection.
- Provider failures are distinguishable from an empty search and can be retried.
- Organizer links open the real event website; calendar entries reflect supplied dates without inventing a start time.
- External event discovery requires neither MongoDB nor Cloudinary credentials.

## Later work

Add a licensed AllEvents/Meetup adapter for small local meetups and hackathons, bookmark alerts after opt-in, verified organizer submissions, and authentication/ownership checks before promoting community event management. Repair the production MongoDB connection separately. Provider listings are community-curated: coverage, city coordinates, registration availability, and organizer schedules must be confirmed on the organizer's site.

This branch does not automatically replace the deployed production site. Review it before merging and deploying.

## Implementation and verification

The first release is implemented on this branch. Live production-build checks returned **9 distinct events within 100 km of Bengaluru** for the next 180 days, and **46 online events**; provider records can change. The city suggestion/search flow and organizer detail page were verified in the browser. Tests cover approximate coordinate rounding, permission-error messages, and removal of GPS coordinates from shared URLs; automated browser checks did not grant real location access.

Lint, TypeScript, all **21 regression tests**, and the production build passed. HTTP checks covered genuine upstream data, matching SSR/card/detail IDs, each nearby detail route, deduplication of city/domain aliases, online separation, empty coverage, pagination, invalid coordinates, calendar downloads, and the absence of automatic MongoDB sample fallbacks.

Local review URL: `http://localhost:3001/`. The currently deployed Vercel production site remains on its earlier version.

## Automatic location and popularity update

On arrival the browser requests location permission and, on success, fetches in-person events using rounded coordinates. Manual cities and worldwide/online links override detection. Denial and timeout retain city search. Default sorting compares exact host-city distance, provider-reported attendance for distance ties, then date. A separate popularity sort orders known attendance counts descending, missing counts last, with distance/date tie-breakers. Counts come from the live feed and are not independently verified: the provider uses AI-assisted metadata generation. They are a popularity proxy, not live bookings or verified ticket sales. No attendance figures are invented. Sparse coverage is explained on the page.

Update verification: all 24 tests, lint, TypeScript, and the production build passed. The browser automatically attempted location, returned unavailable on this computer, and retained working manual London search and popularity sorting. Live API checks confirmed nine Bengaluru nearby results, descending reported attendance, and online separation. Actual successful GPS access could not be verified on this computer.
