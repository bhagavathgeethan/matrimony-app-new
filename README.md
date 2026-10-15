# Sangam

Values-led matchmaking: matched on money, roots, kids and ambition, with a family co-pilot and DPDP-grade privacy.

## Repository layout

| Folder | What it is |
|---|---|
| `backend/` | Node.js + Express REST API and WebSocket server over PostgreSQL. Also serves the built web app. |
| `web/` | React web app (Vite + React Router) — the browser experience, including parent-portal links. |
| `frontend/` | Mobile app (React + react-native-web, packaged for Android with Capacitor). |
| `shared/` | Logic used by **both** apps: API client (`api.js`), app state and actions (`store.js`), product constants (`constants.js`). |

All business logic lives in the backend and in `shared/`; the two apps are UI layers on top of the same store.

## Running locally

```bash
# 1. Backend (needs backend/.env — see backend/.env.example)
cd backend && npm install && npm start          # http://localhost:5000

# 2a. Web app in development (proxies /api, /uploads, /ws to the backend)
cd web && npm install && npm run dev            # http://localhost:5173

# 2b. Mobile app in the browser
cd frontend && npm install && npm run dev       # http://localhost:3000
```

For production, build the web app once and the backend serves it at `/`:

```bash
cd web && npm run build      # creates web/dist, served by the backend
```

## Services still to connect

- **SMS** — `backend/src/services/sms.js` uses a dummy provider (logs codes; returns them to the app outside production). The real provider implements `sendOtp` and `sendFamilyInvite`.
- **File storage** — `backend/src/services/storage.js` saves to `backend/uploads/`. A Cloudflare R2 driver implements `put`, `remove` and `url`.

## Tests

```bash
cd backend && npm test       # unit + API tests against a throwaway real PostgreSQL
```
