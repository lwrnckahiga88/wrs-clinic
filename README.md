# WRS Clinic — "Your clinic in your pocket."

A mobile-first, offline-first clinic operating system built as an installable PWA.
The Android phone is the clinic server, receptionist, consultation room, and
reporting device. Every module (Patients, Appointments, Consultation, Pharmacy,
Reports, WhatsApp Reception) is a **WRS runtime package** that follows the same
contract: `connect() / initialize() / read() / write() / sync() / health() / shutdown()`.

## Structure

```
wrs-clinic-pwa/
├── frontend/          React + Vite PWA (installs to phone home screen)
│   └── src/
│       ├── db.js       Dexie (IndexedDB) — offline-first local store
│       ├── sync.js      Drains queued writes to the Gateway when online
│       └── pages/       One page per runtime package
├── backend/            WRS Gateway (Node/Express)
│   ├── packages/        Runtime package manifests (runtime.yaml)
│   ├── runtime/loader.js  Discovers installed packages
│   ├── routes/           REST API, one file per package + /sync + /whatsapp
│   └── db/schema.sql     SQLite source of truth
└── docker-compose.yml
```

## Run it locally

**Backend**
```bash
cd backend
npm install
npm run dev        # http://localhost:4000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev         # http://localhost:5173
```

Open `http://localhost:5173` on your Android phone's Chrome browser (same
Wi-Fi network, use your machine's LAN IP instead of localhost), then
**Menu → Install app**. From then on it behaves like a native app icon,
works offline, and syncs automatically when connectivity returns.

## Run it with Docker

```bash
docker compose up --build
```

## How offline works

1. Every write (register patient, book appointment, save consultation,
   dispense medicine) goes to Dexie on the phone first — instantly, no
   network required.
2. Each write is also pushed into a `syncQueue` table.
3. When `navigator.onLine` fires (or every 15s while the app is open),
   `sync.js` drains the queue against `POST /api/sync/:entity` on the Gateway.
4. The Gateway is the durable source of truth (SQLite here; swap for
   Postgres when you federate multiple clinics).

## WhatsApp / Telegram Reception

`POST /api/whatsapp/webhook` accepts either a Telegram update or a generic
`{ phone, text }` payload (map your WhatsApp Business API provider — Twilio,
Meta Cloud API — to this shape). It auto-replies with the clinic menu and
logs the conversation; the phone app polls `GET /api/whatsapp/inbox` to show
new messages for the clinician to act on.

## Marketplace

`GET /api/marketplace` returns installed vs. available runtime packages —
this is what powers the "Install more modules" screen (Laboratory, Billing,
Telemedicine, Inventory, Insurance, Radiology are stubbed as `available`).
Adding a real one means: create `backend/packages/wrs.<name>/runtime.yaml`,
add a `routes/<name>.js`, mount it in `server.js`, add a frontend page + nav
tile. No other module needs to change — that's the point of the contract.

## What's intentionally an MVP simplification

- Sync is last-writer-wins, not full CRDT/vector-clock federation (that's the
  multi-clinic version described in the WRS-OS architecture).
- WhatsApp send is stubbed — wire in Twilio/Meta Cloud API credentials in
  `routes/whatsapp.js` where noted.
- Billing/Revenue in Reports is a flat KES 500/consultation placeholder until
  the Billing runtime package is installed.
