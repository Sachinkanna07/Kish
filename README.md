<img src="DOT_NEW/public/icon-192.png" alt="KISH app icon" width="68" height="68">

# KISH

Book a crop delivery in Tamil or English, follow its token through the procurement queue, and see how the centre turns measured weight and grade into a receipt. KISH is an installable, mobile-first demo for farmers, procurement centres, and administrators.

[Open the live demo](https://kish-app.vercel.app/) · [Full demonstration guide](DOT_NEW/README.md#five-minute-demonstration) · [Booking rules](DOT_NEW/src/services/procurement.ts)

## Follow 250 kg of paddy

| Step | What to try |
| --- | --- |
| **1 · Book as a farmer** | Choose a language and use the sample sign-in from the [demo guide](DOT_NEW/README.md#five-minute-demonstration). Select **Book a token → Paddy**, enter **250 kg**, choose a recommended centre and an available slot, then confirm. |
| **2 · Join the queue** | Open the digital token, advance the simulated queue and record arrival. Reload to see the booking persist. |
| **3 · Record the delivery** | Under **Profile → Demo role**, switch to **Procurement centre** and select the same centre. Open the booking, start procurement, and enter **245 kg**, grade **B**. Complete procurement and record the demo payment. |
| **4 · Read the receipt** | Switch back to **Farmer** and open **Payments**. Look for the paid record, then switch to **தமிழ்** to read the token in Tamil. |

The administration view lets you review demo records, close a centre, or change slot and daily capacity. These records live in the current browser. Use sample details. The demo simulates role switching, queues, alerts, market prices, and payment records.

## Run locally

Use Node.js 24 LTS. The React, TypeScript and Vite application lives in [DOT_NEW](DOT_NEW/).

```sh
cd DOT_NEW
npm ci
npm run dev
```

For offline use, build and serve the production version. Open the printed localhost address once while connected so the service worker can cache the app.

```sh
npm run build
npm run preview
```

Install from **Add to Home Screen** in iPhone Safari, or the install option in Chrome or Edge. The hosted app uses HTTPS. Records stay on the device where the demo was opened.

<details>
<summary>Tests and implementation</summary>

From `DOT_NEW`, run:

```sh
npm run lint
npm run build
npx playwright install chromium
npm test
```

The [Playwright scenarios](DOT_NEW/tests/app.spec.ts) cover the booking-to-receipt flow, bilingual UI, invalid quantities, capacity, persistence, and offline reload. [App.tsx](DOT_NEW/src/App.tsx) coordinates the role screens. [Procurement rules](DOT_NEW/src/services/procurement.ts) handle recommendations, slots and capacity. The [FastAPI backend prototype](DOT_NEW/backend/) and [Supabase client](DOT_NEW/src/lib/supabase.ts) are separate from the browser-local demonstration.

</details>
