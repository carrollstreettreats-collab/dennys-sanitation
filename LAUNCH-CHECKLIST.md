# Launch Checklist — Denny's Sanitation Website

Everything the owner must verify or provide before this site goes live.

## Content to Verify

- [ ] **Service area towns** — The current list (Rock Rapids, Larchwood, George, Little Rock, Doon, Lester, Alvord, Inwood, Rural Routes) is marked as PLACEHOLDER. Confirm the complete list of towns served.
- [ ] **Pickup schedules** — Verify the garbage and recycling pickup days listed for each town are current and accurate.
- [ ] **FAQ answers** — Review all FAQ entries for accuracy. Add or remove questions as needed.
- [ ] **Payment policies** — Confirm the payment policy text matches current business policies. Update if anything has changed since September 2023.
- [ ] **Can redemption accepted brands** — Verify the brand list is current.
- [ ] **Can redemption hours** — Confirm Mon–Thu 12–5 PM is still accurate.
- [ ] **Office hours** — Confirm Mon–Thu 7 AM–5 PM, Fri 7 AM–2 PM.
- [ ] **Contact email** — Confirm dennysanitation@gmail.com is the correct public-facing email.
- [ ] **Phone number** — Confirm (712) 472-2293 is correct.
- [ ] **Address** — Confirm 213 N. Union Street, Rock Rapids, IA 51246.
- [ ] **Facebook URL** — Confirm facebook.com/DennysSanitation is the correct page.

## Images

- [ ] **Logo** — Provide a high-resolution version of the Denny's Sanitation logo (PNG or SVG preferred).
- [ ] **Hero/banner photo** — Provide a photo of a truck, building, or crew for the homepage hero background.
- [ ] **Service photos** (optional) — Photos of trucks, dumpsters, portable toilets, recycling bins, etc.
- [ ] **Permission** — Confirm you have rights to use any photos provided.

## Technical Setup

- [ ] **Firebase project** — Create a Firebase project and configure Auth + Firestore (see README.md).
- [ ] **Firebase config** — Replace placeholder config in both `index.html` and `admin.html`.
- [ ] **Admin account** — Create an admin user in Firebase Authentication.
- [ ] **Firestore rules** — Deploy security rules (`firebase deploy --only firestore:rules`).
- [ ] **EmailJS** (optional) — Set up EmailJS for the contact form, or use the fallback (directs to email/phone).
- [ ] **Custom domain** (optional) — Point dennyssanitation.com to Firebase Hosting.

## Before Going Live

- [ ] Test the site on mobile (phone) and desktop
- [ ] Test the admin login and create/edit/delete a test route notice
- [ ] Test the click-to-call button on a phone
- [ ] Verify the Google Maps embed shows the correct location
- [ ] Check that the Facebook link opens the correct page
- [ ] Run a Lighthouse audit (aim for 90+ on Performance, Accessibility, SEO)
