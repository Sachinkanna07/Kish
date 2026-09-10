# Kish — by dot

An installable agricultural procurement app for the hackathon: Tamil and English, complete booking-to-payment demonstration, and offline support. No paid API, account, or environment file is required.

## Run locally

Use Node.js 24 LTS. Run inside **DOT_NEW**, the app and Git repository root:

```sh
npm ci
npm run dev
```

For the installable/offline build:

```sh
npm run build
npm run preview
```

Open the printed URL. Offline support is enabled only for production builds. Visit once online and let assets finish loading before disconnecting. Hosting requires HTTPS; localhost is also supported.

## GitHub publishing

1. Upload/commit the **contents of DOT_NEW** at the repository root, including `.github`, `src`, `public`, `scripts`, tests, and package files. Exclude `node_modules`, `.env`, and `dist`.
2. Use a public repository for the free GitHub Pages path. Push to `main` or `master`.
3. Open **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Open **Actions → Build and publish Kish → Run workflow** if the first push happened before Pages was enabled.
5. Wait for build, tests, and deployment. Open the Pages URL from the deployment.

The workflow installs dependencies, checks lint, builds, runs browser tests, and publishes `dist`. Relative assets and service-worker scope support repository paths such as `https://USERNAME.github.io/REPOSITORY/`.

Uploading source files alone does not publish the app. Pages must be enabled once. No GitHub remote was configured locally, and no repository was pushed by this implementation.

Reference: [GitHub custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Phone installation

- Android Chrome: browser menu → Add to Home screen / Install app.
- iPhone Safari: Share → Add to Home Screen.
- Desktop Chrome/Edge: install icon or browser menu when available.

Kish opens in a standalone app window. This is an installable PWA, not an APK. Judges can open the link immediately. [PWA installation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).

## Five-minute demonstration

1. Select English or Tamil → Get started → sample number `9876543210`.
2. Use **demo code `123456`**. No SMS is sent; this is not real phone verification.
3. Select Farmer, enter a sample name and village.
4. Book a token → Paddy → 250 kg → Kayathar recommended centre → tomorrow → available slot → review → confirm.
5. Show the token, simulate the queue, and record arrival. Print/save the token if needed.
6. Profile → Demo role → Procurement centre. Select the booked centre in the centre selector.
7. Open the booking → check in if needed → Start procurement → measured weight and grade → Complete procurement.
8. Process demo payment → Record demo payment.
9. Switch to Farmer. Open Payments to show amount, status, date and reference; open Alerts to show the updates.
10. Switch to Administration to review all demo records, profiles and centre capacity. Switch languages throughout.

## Implemented

- Bilingual onboarding, persisted language, mobile demo code validation, roles and profiles.
- Farmer home, current booking, rule-based recommendation with explanation, centre search/details.
- Crop selection, kg/quintal/tonne conversion, date/slot availability, review and digital token.
- Invalid quantity, past/full slots, closed centres, insufficient capacity and duplicate booking checks.
- Persistent tokens, queue simulation, arrival, cancellation, and print/save.
- Centre bookings, weight/grade valuation and procurement completion.
- Pending → processing → paid demo records, receipts, references and history.
- Alerts with read/unread state, editable profile, larger text and logout.
- Admin records, demo profiles, centre opening/closing, slot limits and daily capacity.
- Standalone manifest, icons, local fonts, offline cache and GitHub deployment workflow.

## Demo boundaries

Operational data is stored in this browser on this device. Same-origin tabs receive storage updates; different phones do not share records. Role switching is explicitly a demo feature, not production authorization. Queue, distances, facilities and prices are samples. Payments are records only; no money is sent. Alerts are in-app, not SMS/push. Queue simulation is independent of real time so tomorrow's booking can be demonstrated today. Use sample personal details.

The existing Supabase client remains in `src/lib/supabase.ts` and tolerates missing configuration, but is not connected to these demo flows. Production needs authenticated server-assigned roles, database row-level security, atomic booking/capacity allocation, authorized financial updates and realtime subscriptions. Mobile SMS also needs a provider; no paid SMS dependency was added. Do not collect real farmer/payment data with the local demo.

## Validation

```sh
npm run lint
npm run build
npx playwright install chromium
npm test
```

To use installed Chrome locally in PowerShell, set `$env:PLAYWRIGHT_CHANNEL = 'chrome'` before `npm test`. The tests cover the full workflow, bilingual UI, persistence, cancellation, invalid quantity/weight, centre closure, booking rules and offline reload.

## Project files

- `src/App.tsx`: app shell, role screens and local demo orchestration.
- `src/services/procurement.ts`: booking, capacity, slots and recommendation rules.
- `src/data`, `src/components/Icon.tsx`: preserved data and icons.
- `src/lib/storage.ts`: resilient local storage adapter.
- `scripts/build-offline.mjs`: offline cache generation.
- `.github/workflows/pages.yml`: CI and deployment.

Earlier component files are retained; `src/main.tsx` loads the new app flow.
