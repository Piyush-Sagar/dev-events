# DevEvents

A Next.js app for discovering developer conferences, hackathons, and meetups. Browse event details, book a spot by email, and create, edit, or delete events.

## Requirements

- Node.js 20.19 or newer and npm
- MongoDB (local or hosted) for persistent events and bookings
- A Cloudinary account for event image uploads

## Run locally

```powershell
npm ci
npm run dev
```

Open http://localhost:3000. Without `MONGODB_URI`, the app displays ten sample events. Sample details and related events work, but samples cannot be booked, edited, or deleted.

Development uses Webpack to avoid runaway Turbopack CSS workers observed on Windows. Production builds use the default Next.js bundler.

To enable persistence, copy the example configuration:

```powershell
Copy-Item .env.example .env.local
```

Set `MONGODB_URI` to your database connection string and `CLOUDINARY_URL` to your Cloudinary URL (`cloudinary://API_KEY:API_SECRET@CLOUD_NAME`). Start MongoDB or allow your machine to access your hosted database, then restart the development server. An empty connected database displays an empty event list. No base URL is required.

## Sample data

After configuring MongoDB:

```powershell
npm run seed
```

This inserts missing sample events by slug. Existing events and bookings are preserved, so it is safe to rerun. The script loads `.env.local` and `.env`; shell environment variables take precedence.

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
- `database/`: Mongoose Event and Booking models
- `lib/events.ts`: Cached, serialized event queries and booking counts
- `lib/actions/`: Booking and related-event server actions
- `lib/mongodb.ts`: Shared MongoDB connection helper
- `lib/event-input.ts`: Allowed form fields and upload validation
- `lib/cloudinary.ts`: Event image uploads
- `lib/constants.ts`: Sample events
- `scripts/seed.ts`: Non-destructive sample-data seeding
- `public/`: Local images and icons
- `tests/`: Regression tests

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Event listing |
| `/events/[slug]` | Details, bookings, related events, management |
| `/create-event` | Create event |
| `/events/[slug]/edit` | Edit saved event |
| `/api/events` | GET events; POST multipart event data |
| `/api/events/[slug]` | GET, PUT/PATCH multipart updates, DELETE |

Tags and agenda are JSON arrays of non-empty strings in multipart requests. Images must have an image MIME type and be no larger than 5 MB. Renaming an event regenerates its slug. Booking email addresses are normalized, and duplicate bookings are rejected.

## Current limitations

Event management has no authentication or ownership checks. Add access control before deploying event creation, editing, and deletion to an untrusted public audience. Bookings are stored in the database; confirmation emails and payments are not implemented. Deleted or replaced event images are not automatically removed from Cloudinary.
