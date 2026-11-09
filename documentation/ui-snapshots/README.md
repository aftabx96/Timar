# Timar UI snapshots

Screens of the Timar web app as of 4 November 2026, taken from the running app at desktop size (1440 wide) and phone size (390 wide).

| Folder | What it shows |
| --- | --- |
| `01-public-site` | Home, About, Journal, a drive record and an article. Long pages have a full page image and one image per section. |
| `02-sign-in-and-sign-up` | Sign in with an email code or a password, entering the code, the sign up form and email verification. |
| `03-profile-setup` | Choosing an account type, the details for each type, photo and updates, and the final review. |
| `04-visitor-dashboard` | A public user who has not adopted yet. |
| `05-adopter-dashboard` | A public user who has paid for mangroves. |
| `06-volunteer-dashboard` | An approved volunteer and a person whose request is still pending. |
| `07-company-dashboard` | A company account. |
| `08-admin-dashboard` | Overview, adoptions, volunteer requests, users and roles, content, the new drive and new article forms, and a tab that is next on the build list. |
| `09-phone-size` | The first screen of the main pages and dashboards on a phone. |

Notes:

- People, adoptions and accounts shown are demo data.
- Panels for features not built yet (plots, surveys, trips, tasks, hours, plant health, satellite alerts, cutting reports, community feed, impact report and activity log) show sample data from `frontend/src/lib/previewData.js`.
- The enter code, verify email, profile setup and visitor dashboard images were taken with the API replies stubbed in the browser, so no test accounts were created in the database.
- Real accounts are left out of the users and roles image.
