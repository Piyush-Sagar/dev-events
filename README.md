# DevEvents

A Next.js app for discovering real upcoming developer events near a city or browser location. Search conferences by topic, date, distance, or online format, view details, add dates to your calendar, and register on the organizer's website. Community event publishing and email bookings are separate features backed by MongoDB.

## Requirements

- Node.js 20.19 or newer and npm
- MongoDB (local or hosted) for persistent events and bookings
- A Cloudinary account for event image uploads

## Run locally

```powershell
npm ci
npm run dev
```

Open http://localhost:3000. Discovery fetches live event data without an API key, MongoDB, or Cloudinary. It never substitutes placeholder events if the provider fails. Use the city suggestions or press "Use my location" to request browser location access. The worldwide view works without permission.

Event data comes from [developers.events](https://developers.events/all-events.json) and the maintainers' [city coordinate dataset](https://raw.githubusercontent.com/scraly/developers-conferences-agenda/main/page/src/misc/geolocations.json), refreshed hourly. Content is [CC BY-NC 4.0](https://github.com/scraly/developers-conferences-agenda/blob/main/LICENSE-CONTENT): attribute Aurélie Vache and contributors and use this source for noncommercial discovery. Obtain permission or a licensed provider before commercial use. Coverage is community-curated and focuses on developer conferences, not every local meetup.

Distances are approximate distances to host cities, not exact venues. Nearby searches exclude online events and listings with unknown coordinates; choose "Online only" to discover remote events. Browser coordinates are rounded to two decimal places before requests, retained only in component memory, and excluded from shareable URLs. The external provider receives generic feed requests, not visitor coordinates. The app does not store coordinates in MongoDB; hosting request logs may contain discovery API query parameters.

Development uses Webpack to avoid runaway Turbopack CSS workers observed on Windows. Production builds use the default Next.js bundler.

To enable persistence, copy the example configuration:

```powershell
Copy-Item .env.example .env.local
```

Set `MONGODB_URI` to your database connection string and `CLOUDINARY_URL` to your Cloudinary URL (`cloudinary://API_KEY:API_SECRET@CLOUD_NAME`). Start MongoDB or allow your machine to access your hosted database, then restart the development server. Community events are listed at `/community`; an empty connected database displays an empty community list. Unavailable MongoDB does not affect live discovery. No base URL is required.

## Optional test fixtures

After configuring MongoDB:

```powershell
npm run seed
```

This explicitly inserts sample community events by slug for testing. Run it against a test database, not your live event catalog. Existing events and bookings are preserved. The script loads `.env.local` and `.env`; shell environment variables take precedence. Fixtures are not an automatic runtime fallback.

## Checks and production

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run start
```

The production server defaults to port 3000. Set environment variables on your deployment platform before building and starting. Builds validate TypeScript errors.

## Project structure

- `app/`: App Router pages, layout, styles, and API routes
- `components/`: Event cards, event details, create/edit and booking forms, navigation, WebGL background
- `components/EventDiscovery.tsx`: Location/search/filter controls and paginated live event results
- `lib/discovery/`: Live provider, normalization, geographic search, date formatting, calendar downloads
- `database/`: Mongoose Event and Booking models
- `lib/events.ts`: Cached, serialized event queries and booking counts
- `lib/actions/`: Booking and related-event server actions
- `lib/mongodb.ts`: Shared MongoDB connection helper
- `lib/event-input.ts`: Allowed form fields and upload validation
- `lib/cloudinary.ts`: Event image uploads
- `lib/constants.ts`: Explicit test/seed fixtures
- `scripts/seed.ts`: Non-destructive sample-data seeding
- `public/`: Local images and icons
- `tests/`: Regression tests
- `docs/nearby-events-plan.md`: API comparison, implementation plan, acceptance criteria, and later work

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Live developer event discovery |
| `/discover/[id]` | Real event details and organizer registration link |
| `/community` | User-published events from MongoDB |
| `/events/[slug]` | Details, bookings, related events, management |
| `/create-event` | Create event |
| `/events/[slug]/edit` | Edit saved event |
| `/api/events` | GET events; POST multipart event data |
| `/api/events/[slug]` | GET, PUT/PATCH multipart updates, DELETE |
| `/api/discover` | GET live events filtered by city/coordinates, radius, query, days, format, sort, and page |
| `/api/locations?q=...` | GET matching host cities for manual selection |
| `/api/discover/[id]/calendar` | Download an all-day `.ics` event with an exclusive end date |

Example nearby search: `/api/discover?city=Bengaluru%20(India)&radius=100&days=180&mode=in-person`. GPS search uses paired `lat`/`lng` values; city and coordinates are mutually exclusive. Page sizes are capped at 50, radii at 1,000 km, and date windows at 730 days. Upcoming/ongoing events use UTC date boundaries. Filtered responses are private/no-store; the normalized upcoming catalog and city data are shared and cached for one hour. The raw historical response exceeds Next's 2 MB fetch-cache limit and is not separately cached. Queries and manual city choices are shareable through the browser URL.

Tags and agenda are JSON arrays of non-empty strings in multipart requests. Images must have an image MIME type and be no larger than 5 MB. Renaming an event regenerates its slug. Booking email addresses are normalized, and duplicate bookings are rejected.

## Current limitations

The live discovery feed does not guarantee complete meetup/hackathon coverage or current ticket availability. Events with missing coordinates appear worldwide but are excluded from radius searches. Imported events have no local booking or management controls; registration stays with the real organizer. Calendar dates are all-day because the provider does not supply verified start times.

Community event management has no authentication or ownership checks. Add access control before exposing creation, editing, and deletion to an untrusted public audience. Community bookings are stored in the database; confirmation emails and payments are not implemented. Deleted or replaced community event images are not automatically removed from Cloudinary. The production MongoDB hostname found during deployment was invalid and must be replaced before community persistence will work.
