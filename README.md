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

## File storage (Depot)

Files live in Depot (`STORAGE_URL`, `STORAGE_API_KEY`, `STORAGE_BUCKET` in `backend/.env`; the key is server-side only). One private bucket, `knotfiles`, holds photos (original and blurred copy), verification selfies and voice notes. Files open only through short-lived signed links that the backend hands to people allowed to see them. The database stores bucket + key.

- Browsers upload straight to storage: `POST /api/me/uploads/sign` → `PUT` to the signed URL with the returned headers → the feature's endpoint with `{ key }` (e.g. `POST /api/me/photos`). Files over 100 MB use `/api/me/uploads/multipart` (10 MB parts; admins only until a feature needs it). Client helper: `shared/uploads.js`.
- The storage CORS policy must allow `PUT` and `GET` from the web and app origins and expose the `ETag` header (multipart).
- `npm run storage:smoke` runs sign → upload → complete → view → delete (and a 210 MB multipart video) against a running dev backend and the real Depot.
- `npm run storage:migrate-local` moves files saved by the old local driver (`backend/uploads*`) into Depot, once.

## Tests

```bash
cd backend && npm test       # unit + API tests against a throwaway real PostgreSQL
```
