# Denny's Sanitation — Website

Locally owned garbage and recycling service in Rock Rapids, Iowa. Serving Lyon County communities since 1984.

## Tech Stack

- Plain HTML / CSS / JS (no build step)
- Firebase Hosting (deployment)
- Firebase Firestore (route notices, site config)
- Firebase Auth (admin login)
- Google Fonts: Barlow Condensed + Barlow

## Project Structure

```
index.html          Public website (single-page)
admin.html          Password-protected admin panel
firebase.json       Firebase Hosting config
firestore.rules     Firestore security rules
favicon.svg         Browser tab icon
sitemap.xml         SEO sitemap
robots.txt          Search engine directives
404.html            Custom 404 page
assets/images/      Image assets
```

## Running Locally

No build step required. Open `index.html` in a browser, or use any static server:

```bash
npx serve .
# or
python -m http.server 8000
```

The site works in static mode without Firebase — route notices and admin features require a configured Firebase project.

## Firebase Setup

1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → Email/Password sign-in method
3. Create an admin user in Authentication → Users
4. Enable **Cloud Firestore** (start in production mode)
5. Deploy Firestore rules: `firebase deploy --only firestore:rules`
6. Copy your Firebase config object and replace the placeholder in both `index.html` and `admin.html`
7. Deploy: `firebase deploy`

### Firestore Collections

| Collection | Purpose |
|---|---|
| `notices` | Route notices (title, body, expires, order) |
| `config/site` | Announcement banner text, hours override |

## Admin Page

Navigate to `/admin` (or open `admin.html`). Sign in with the Firebase Auth credentials created in step 3 above.

**Route Notices tab:**
- Add, edit, delete, and reorder pickup schedule changes
- Set optional expiration dates so holiday notices auto-hide

**Settings tab:**
- Announcement banner (red bar at top of website)
- Hours override (special hours message below the hours table)
- Backup/export all data as JSON

## Deployment

```bash
firebase deploy
```

The site deploys to Firebase Hosting at `dennys-sanitation.web.app` (or your configured custom domain).
