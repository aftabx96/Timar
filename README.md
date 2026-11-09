# Timar

A record for every mangrove planted on the Karachi coast.

Timar is a web platform built with **Saltwater Marina**, a community led mangrove conservation group from Rehri Goth, Karachi. Today a plantation drive happens, photos end up in phone galleries, and months later nobody can say what survived. Timar gives each drive and each plot a record: where it was planted, by whom, and a photo from the same marked stake at every survey visit, so the people who funded it can see what happened to it.

Timar is the local name for the grey mangrove, *Avicennia marina*, the tree that makes up most of the Indus Delta.

This repository is the Final Year Project of **Aftab Ahmed Samoo** and **Haseeb Mudasir**, BS Computer Science, SZABIST University Karachi (2026).

## What is in this phase (FYP-I)

| Area | What works now |
| --- | --- |
| Accounts | Sign up with a 6 digit email code, sign in with an email code or a password, profile setup, role based dashboards |
| Public website | Home page with real field photos, a satellite map of Saltwater Marina's sites (Kaderu Island, Buddo Island, Rehri Goth), species and awareness content |
| Journal | Past plantation drives with their record and photos, plus awareness articles |
| Admin content | Saltwater Marina staff create, edit, publish and delete drives and articles, with photo uploads |
| Adopting mangroves | Public users become adopters once they pay for a mangrove; adopters follow their plot and its photo timeline |
| Volunteers | Volunteer applications from profile setup, field task list, stake photo checklist |
| Dashboards | Visitor, adopter, volunteer, company and admin views, scoped to this phase |

Some dashboard sections still show sample data and are wired to the database one by one. Online payment, trip booking and plot management are next.

**Planned for FYP-II:** plant health classification and seedling counting from photos, site suitability prediction, satellite change detection with Sentinel-2, cutting and encroachment reports with a public threat map, company portfolios and impact reports, community feed, media requests and audit reporting.

## Tech stack

| Part | Built with |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS 4, Motion, React Router, Leaflet |
| Backend | Node.js, Express, Zod validation, JSON Web Tokens in httpOnly cookies, bcrypt, Nodemailer |
| Database | PostgreSQL (Neon in the cloud), or PGlite locally when no database is configured |
| Planned | Python FastAPI service for the models, PostGIS for plot boundaries, rasterio for satellite imagery |

## Project structure

```
Timar/
├── frontend/          React app (public site, auth screens, dashboards, journal)
│   ├── public/field/  Field photos from the 3 October 2026 drive (metadata removed)
│   ├── src/pages/     Home, Journal, Login, Signup, ProfileSetup, dashboards
│   ├── src/components/
│   └── src/lib/       API client, auth, sites, photo list
├── backend/           Express API
│   ├── src/routes/    auth, profile, content (drives and articles), uploads
│   ├── src/db/        connection, schema.sql, seed data
│   ├── scripts/       db:check and mail:test helpers
│   └── test/          API tests (node --test)
└── documentation/     SRS, proposal, ERD, business model canvas, presentation
```

## Getting started

You need **Node.js 22.9 or newer** and npm.

```bash
git clone https://github.com/aftabx96/Timar.git
cd Timar
```

**1. Backend**

```bash
cd backend
npm install
cp .env.example .env      # then set JWT_SECRET to a long random string
npm run dev               # http://localhost:4000
```

With `DATABASE_URL` left empty the API runs on a local PGlite database in `backend/.data`, so nothing else needs installing. On first start it creates the tables and adds demo accounts and the starting journal content.

**2. Frontend** (in a second terminal)

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

Vite forwards `/api` and `/uploads` to the backend, so open http://localhost:5173 and everything works from there.

## Configuration

All settings live in `backend/.env`. See `backend/.env.example` for the full list.

| Setting | What it does |
| --- | --- |
| `JWT_SECRET` | Signs session tokens. Use a long random string. |
| `DATABASE_URL` | PostgreSQL connection string, for example from Neon. Leave empty for the local PGlite database. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Mail server for the sign in codes. For Gmail: `smtp.gmail.com`, port `465`, your address and an app password. Leave `SMTP_HOST` empty and codes are printed in the backend console and shown in a small inbox box on the site instead. |

Check each part on its own:

```bash
npm run db:check                      # connects, migrates, seeds and counts rows
npm run mail:test -- you@example.com  # sends one sample code email
```

## Demo accounts

Created automatically outside production. Sign in with the password `Timar2026`, or ask for an email code (for these four the code only appears in the backend console).

| Email | Sees |
| --- | --- |
| `sponsor@timar.com` | Adopter dashboard with 25 adopted mangroves |
| `volunteer@timar.com` | Volunteer dashboard |
| `company@timar.com` | Company dashboard |
| `admin@timar.com` | Saltwater Marina admin, including the Content screen |

Change or remove these before any public launch.

## Tests

```bash
cd backend
npm test
```

The tests run the real API against an in-memory database: sign up and code checks, lockouts after wrong codes and passwords, expired and forged tokens, password reset, and the drive and article admin routes including uploads.

## Security notes

- Passwords are hashed with bcrypt; email codes are stored as HMACs, expire after 5 minutes and lock after 5 wrong tries.
- Sign ins are signed tokens (JWT) in httpOnly cookies that last 7 days.
- Sign in failures do not reveal whether an email exists, and repeated failures from one address are slowed down.
- Admin routes check the role on the server, and uploads are checked by their file contents, not just their name.
## Credits

- Field photos: Timar field team, Rehri Goth, 3 October 2026.
- Site and programme information: [Saltwater Marina](https://saltwater-marina.com).
- Satellite imagery: Sentinel-2 cloudless by EOX IT Services GmbH (contains modified Copernicus Sentinel data 2021), CC BY-NC-SA 4.0.
- Coastline and mangrove shapes: © OpenStreetMap contributors, ODbL.

More detail on each half is in [frontend/README.md](frontend/README.md) and [backend/README.md](backend/README.md).
