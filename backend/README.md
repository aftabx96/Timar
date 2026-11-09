# Timar backend

Node + Express REST API. This first part covers accounts and sign in (SRS 4.1 Sign Up, 4.2 Sign In).

```bash
cp .env.example .env    # then set JWT_SECRET
npm install
npm run dev             # http://localhost:4000, migrates and seeds demo users on start
npm test
```

Run the frontend alongside it (`npm run dev --prefix frontend`). Vite proxies `/api` to this server,
so the browser sees one origin and the session cookie stays first party.

## Database

All tables are in one file, [`src/db/schema.sql`](src/db/schema.sql). It runs on every start and only creates tables that do not exist yet.

- `DATABASE_URL` empty: runs on [PGlite](https://pglite.dev), the Postgres engine compiled to WASM, stored in `backend/.data`. Nothing to install. Delete that folder to start fresh.
- `DATABASE_URL=postgres://...`: uses a real PostgreSQL server through `pg`. Use this for deployment and once PostGIS is needed for plots.

Tables: `users` (with the profile answers), `otp_codes`, `volunteer_applications`, `drives`, `articles`, `adoptions`. The 3 October 2026 drive and four starter articles are added by `src/db/seedContent.js` when those tables are empty.

## Email

With `SMTP_HOST` empty, codes are printed in this console and returned to the client as `devCode`
(the client shows them in its dev inbox). Set the `SMTP_*` values (Gmail app password, Brevo, Mailtrap...)
to send real email; `devCode` then disappears from responses. It is never sent when `NODE_ENV=production`.

## Endpoints

All under `/api`. Errors look like `{ "error": { "message", "code", "field" } }`.

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| POST | `/auth/signup` | name, email, phone, password | Creates an unverified visitor and emails a code |
| POST | `/auth/verify` | email, code | Verifies the email and signs in |
| POST | `/auth/login/code` | email | Emails a sign in code. Same reply for unknown emails |
| POST | `/auth/login/code/verify` | email, code | Signs in |
| POST | `/auth/login/password` | email, password | Signs in. 403 `unverified` sends a fresh verify code |
| POST | `/auth/resend` | email, purpose (`verify`, `login`, `reset`) | 30 second cooldown |
| POST | `/auth/password/forgot` | email | Emails a reset code |
| POST | `/auth/password/reset` | email, code, password | Sets the password and signs in |
| GET | `/auth/me` | | Current user |
| POST | `/auth/logout` | | Clears the session cookie |
| PUT | `/me/profile` | role, bio, photo, notify, details | Profile setup. See `src/routes/profile.js` for details per role |
| GET | `/drives`, `/drives/:id` | | Published past drives (public) |
| GET | `/articles?kind=`, `/articles/:slug` | | Published articles; kind is `article` or `awareness` (public) |
| GET, POST | `/admin/drives` | title, date, site, people, saplings, summary, photos, published | Admin and coordinator only; GET includes drafts |
| PUT, DELETE | `/admin/drives/:id` | same as POST | Edit or delete a drive |
| GET, POST | `/admin/articles` | title, slug, kind, summary, body, cover, published | Slug is made from the title when empty and kept unique |
| PUT, DELETE | `/admin/articles/:id` | same as POST | Edit or delete an article |
| GET | `/me/adoptions` | | The signed in user's adoptions, newest first |
| GET | `/admin/overview` | | Counts and per month figures for the admin overview |
| GET | `/admin/volunteer-applications` | | Pending volunteer requests |
| POST | `/admin/volunteer-applications/:id/approve`, `/decline` | | Approving makes a visitor a volunteer |
| GET | `/admin/adoptions` | | Every adoption with who made it |
| POST | `/admin/adoptions/:id/paid` | | Marks a pending adoption as paid |
| PUT | `/admin/adoptions/:id/plot` | plot (like `KD-014`) | Paid adoptions only |
| GET | `/admin/users` | | Every account |
| PUT | `/admin/users/:id/role` | role | Admin only, not your own account |
| POST | `/uploads` | data (image data URL) | Admin and coordinator; JPG, PNG or WebP under 2 MB, checked by its bytes; served at `/uploads/...` |

## How the rules from the SRS are met

- Passwords: bcrypt, 12 rounds. At least 8 characters with letters and numbers.
- New accounts are `visitor`. Choosing volunteer files a `volunteer_applications` row; the role changes on approval.
- Session: signed JWT in an httpOnly cookie, valid for 7 days. Logout clears the cookie.
- Codes: 6 digits, stored as an HMAC, 5 minutes, 5 tries, one active code per purpose.
- Failed sign in: one message for unknown email and wrong password; 5 failures from one address lock it for 30 seconds.

## Demo accounts

Seeded outside production: `sponsor@`, `volunteer@`, `company@`, `admin@timar.com`, password `Timar2026`.

## Not done yet

- Admin endpoints to approve volunteer applications.
- Profile photos are stored as data URLs in the database; move them to file storage with the survey photo uploads.
- The failed sign in counter is in memory, fine for one server.

## If the local database will not start

PGlite can be left damaged if the server is killed mid-write (for example by force-stopping the
dev server on Windows). The symptom is `RuntimeError: Aborted()` from `_pg_initdb` on start. Move
`.data/pglite` aside and restart: a fresh database is created and the demo accounts are seeded again.
Accounts created by hand are lost, which is fine for development. Use a real PostgreSQL server
(`DATABASE_URL`) for anything that has to keep data.

Only one server may use the PGlite folder at a time. The backend writes `.data/pglite.lock` with its
process id and a second server refuses to start while that process is alive. If you see
"already in use by process N", stop the other backend first.
