# KISH 🌾

### Bilingual smart procurement platform for farmers

KISH is an installable agricultural procurement PWA designed to demonstrate a complete farmer-to-procurement workflow in **English and Tamil**.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-kish--app.vercel.app-000000?style=for-the-badge&logo=vercel)](https://kish-app.vercel.app/)
[![Repository](https://img.shields.io/badge/GitHub-Sachinkanna07%2FKish-181717?style=for-the-badge&logo=github)](https://github.com/Sachinkanna07/Kish)

---

## ✨ What KISH demonstrates

- English–Tamil onboarding and UI
- Farmer, procurement-centre, and admin workflows
- Crop selection and quantity conversion
- Centre recommendation and booking flow
- Digital token and queue simulation
- Procurement completion with weight and grade
- Demo payment records and receipts
- Alerts, profile management, and role switching
- Installable PWA with offline support
- Automated browser testing with Playwright

---

## 🧭 Product Flow

```text
Farmer
  ↓
Choose crop & quantity
  ↓
Recommended procurement centre
  ↓
Book slot & receive token
  ↓
Centre check-in & procurement
  ↓
Weight / grade / valuation
  ↓
Demo payment record
  ↓
Receipt + alerts + history
```

---

## 🛠 Tech Stack

**Frontend:** React · TypeScript · Vite · Tailwind CSS  
**PWA / Offline:** Web App Manifest · Service Worker  
**Testing:** Playwright  
**Data / Integration:** Local persistence · Supabase client support  
**Backend prototype:** FastAPI · SQLite/PostgreSQL-ready structure  
**Deployment:** Vercel

---

## 🚀 Live Demo

👉 **https://kish-app.vercel.app/**

For the demo workflow, use sample data only.

---

## 💻 Run Locally

The current application source is inside the `DOT_NEW` directory.

```bash
cd DOT_NEW
npm ci
npm run dev
```

Production-style build:

```bash
npm run build
npm run preview
```

> The `DOT_NEW` folder name is an internal legacy project path. The product name is **KISH**.

---

## 🧪 Validation

```bash
cd DOT_NEW
npm run lint
npm run build
npx playwright install chromium
npm test
```

---

## 📱 Install as a PWA

- **Android Chrome:** Menu → Add to Home screen / Install app
- **iPhone Safari:** Share → Add to Home Screen
- **Desktop Chrome/Edge:** Use the install icon when available

KISH is a PWA, not an APK.

---

## ⚠️ Demo Boundaries

KISH is currently a prototype/demo environment.

- Payments are simulated; no real money is transferred.
- Queue, centre capacity, prices, and facilities use sample data.
- Role switching is included for demonstration.
- Demo data can be stored locally in the browser.
- Do not enter real farmer or payment information.

---

## 📂 Repository Structure

```text
Kish/
├── DOT_NEW/          # Current application source
│   ├── src/
│   ├── public/
│   ├── backend/
│   ├── docs/
│   ├── tests/
│   └── package.json
├── README.md
└── implementation / blueprint documents
```

---

## 📌 Status

KISH is an active prototype focused on demonstrating the end-to-end procurement experience, bilingual accessibility, offline capability, and operational workflows.

---

<div align="center">

**KISH — simpler digital procurement for farmers.**

[Live Demo](https://kish-app.vercel.app/) · [GitHub](https://github.com/Sachinkanna07/Kish)

</div>
