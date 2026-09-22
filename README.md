# AI Capsule

Assignment 3 for CSE3CWA — a private prompt library. Sign in with GitHub, save prompts you use for coding/writing/research, track whether the AI response was useful, and keep notes for next time.

## Live demo

- **App:** _(fill in after deploying — e.g. https://ai-capsule.onrender.com)_
- **Cloud platform:** Render (Web Service)

> Free tier on Render spins the service down after inactivity, so the first load can take 30-60 seconds. Local SQLite storage on Render's free tier is **ephemeral** — the `capsules.db` file resets on redeploy or after the disk is recycled, since Render's free web services don't have a persistent disk. This is fine for demo purposes but is a known limitation (see "Limitation" below).

## Tech stack

- **Frontend:** React 18 + Vite
- **Backend:** Node.js + Express, served from the **same origin** as the frontend (no CORS/cross-site cookie issues in production)
- **Auth:** GitHub OAuth → Express issues its own application JWT → stored in a **Secure, HttpOnly cookie named `token`** (never localStorage, never a Bearer header)
- **Database:** SQLite via Node's built-in `node:sqlite` module (no native compile step needed)

## Project structure

```
ai-capsule/
├── backend/
│   ├── routes/
│   │   ├── auth.js       # GET /login, GET /auth/github/callback, GET /logout
│   │   └── capsules.js   # GET/POST/PUT/DELETE /api/capsules (JWT-protected)
│   ├── middleware/auth.js  # verifies the "token" cookie
│   ├── db.js               # SQLite schema (capsules table)
│   ├── server.js           # serves the API + the built frontend from one origin
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/Landing.jsx     # public "/" — explains the app, GitHub login link
    │   ├── pages/Dashboard.jsx   # protected "/dashboard" — CRUD UI
    │   ├── components/
    │   └── api.js                # fetch wrapper (credentials: "include")
    └── vite.config.js
```

## Running it locally

You need a GitHub OAuth App even for local testing. Create one at
https://github.com/settings/developers → New OAuth App:
- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/auth/github/callback`

### Backend
```bash
cd backend
npm install
cp .env.example .env
# fill in JWT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_CALLBACK_URL
npm run dev
```
Runs on `http://localhost:3000`.

### Frontend (dev only — proxies API calls to :3000)
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`.

In production, the frontend is built and served directly by the backend on one origin, so there is no separate frontend URL.

## API routes

| Route | Access | Purpose |
|---|---|---|
| `GET /` | Public | Landing page |
| `GET /login` | Public | Starts GitHub OAuth |
| `GET /auth/github/callback` | Public | OAuth callback — issues the app JWT cookie |
| `GET /logout` | Public | Clears the session cookie |
| `GET /dashboard` | Protected (client-side) | Shows the user's capsules |
| `GET /api/health` | Public | `{ "status": "ok" }` |
| `GET /api/capsules` | Protected | List own records |
| `POST /api/capsules` | Protected | Create a record |
| `PUT /api/capsules/:id` | Protected | Update own record |
| `DELETE /api/capsules/:id` | Protected | Delete own record |

All `/api/capsules` routes are protected by JWT middleware that reads the `token` cookie, verifies it, and uses the verified `userId` for every query — the frontend never sends `user_id`.

## OAuth + JWT flow

1. User clicks "Sign in with GitHub" → `GET /login` redirects to GitHub's OAuth authorize page.
2. GitHub redirects back to `GET /auth/github/callback?code=...`.
3. Backend exchanges the code for a GitHub access token, then fetches the GitHub profile.
4. Backend signs its **own** application JWT (`{ userId, username }`, using `JWT_SECRET`) — this is separate from the GitHub token.
5. That JWT is set as a `Secure, HttpOnly` cookie named `token` and the user is redirected to `/dashboard`.
6. Every `/api/capsules` request includes that cookie automatically (`credentials: "include"` on the frontend); the middleware verifies it and rejects anything missing or invalid with `401`.

## Environment variables (names only — no secret values here or in the repo)

- `JWT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL`
- `NODE_ENV`
- `PORT` (set automatically by Render)

## Database

SQLite (`capsules` table) is created automatically on first run by `backend/db.js`. Every row stores `user_id` (the GitHub user ID from the verified JWT) so records are always scoped to their owner. On Render's free tier, the SQLite file lives on ephemeral disk — it resets on redeploy. For guaranteed persistence, Render PostgreSQL would be the next step.

## Required cURL tests

```bash
# Test 1 - no authentication
curl -i https://YOUR-APP/api/capsules
# Result: 401 Unauthorized

# Test 2 - fake / invalid JWT
curl -i -H "Cookie: token=fake-token-123" https://YOUR-APP/api/capsules
# Result: 401 Unauthorized
```

Both were verified locally and against the deployed URL before submission (see the demo video).

## AI-assisted development

**Tool used:** Claude (Anthropic) — built the Express backend (GitHub OAuth flow, JWT issuing/verification, SQLite schema, capsule CRUD routes) and the React frontend (landing page, dashboard, capsule form/card components).

**Problem found and corrected:** the assignment brief was revised partway through development to require GitHub OAuth + an HttpOnly cookie JWT and the exact `/api/capsules` routes/fields. An earlier version of this project used plain email/password login with the JWT stored in `localStorage` and a different route/field naming scheme — this did not meet the revised spec at all. I caught the mismatch by re-reading the assignment brief carefully, and the whole backend/frontend auth layer was rebuilt around GitHub OAuth and a Secure HttpOnly cookie instead.

**How OAuth login, JWT verification and protected API behaviour were verified:** ran both required cURL tests (no cookie, and a fake `token` cookie) against the running server and confirmed both return `401`. Also tested with a validly-signed JWT (same secret, different `userId`) to confirm one user cannot read, update or delete another user's capsules — both attempts correctly returned `404` rather than leaking or modifying the record.

**How CRUD behaviour and ownership were verified:** created, listed, updated and deleted a capsule end-to-end using a valid session, and confirmed `user_id` in every stored row always comes from `req.userId` (set by the auth middleware from the verified JWT), never from the request body.

**Implementation decision I made and can explain:** the frontend and backend are served from the **same Express app/origin** in production (Express serves the built React files and the API together), rather than as two separate deployed services. This avoids CORS configuration and cross-site cookie (`SameSite`) complications entirely, since the browser treats the whole app as one origin.

## Limitation

SQLite storage on Render's free tier is not guaranteed to persist — the underlying disk is ephemeral, so a redeploy or a long period of inactivity can reset the database. This is acceptable for demonstrating the required CRUD/auth behaviour but means capsules aren't guaranteed to survive indefinitely on the free tier.
