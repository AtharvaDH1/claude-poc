# DH Digital — Life Claims POC

A modern, full-stack life insurance claims management system built with React + Node.js/Express.

## Environment

Configured in **`life-claim-frontend/.env`** and **`life-claim-backend/.env`** (not in git for secrets). See **[ENV.md](./ENV.md)** for the full pairing table.

- v2 backend: **port 3010** (v1 legacy: 3008)
- Frontend dev: **http://localhost:5174** → proxies `/api` to `VITE_PROXY_TARGET`
- `VITE_*` and `REACT_APP_*` are both supported on the frontend

After editing `.env`, restart both `npm start` and `npm run dev`.

## Tech Stack

**Frontend:** React 18, Vite, React Router v6, Recharts, Lucide Icons, Axios  
**Backend:** Node.js, Express, Sequelize ORM, MySQL, Keycloak, JWT Auth, Multer  

## Project Structure

```
claude-poc/
├── life-claim-frontend/   # React + Vite
│   ├── src/
│   ├── public/
│   ├── index.html
│   └── package.json
├── life-claim-backend/    # Node.js + Express
│   └── src/
└── README.md
```

## Pages

| Route | Page | Roles |
|-------|------|-------|
| `/dashboard` | Dashboard | All |
| `/policy-search` | Policy Search | Pre Assessor |
| `/claim-search` | Claim Search | Assessor, Verifier, Admin |
| `/registration` | Register Claim | Pre Assessor |
| `/claim-view/:id` | View/Assess Claim | Assessor, Verifier, Admin |
| `/pool-selection` | Pool Selection | Assessor, Verifier |
| `/my-task` | My Tasks | Assessor, Verifier |
| `/add-screen` | Add Screen | Assessor, Verifier |
| `/inward` | Inward Mail (legacy inbox) | All |
| `/hospital-contacts` | Hospital email/fax/phone | All |
| `/case/:id` | ADD case detail (frontend) | Assessor, Verifier |
| `/user-management` | User Management | Admin |
| `/audit-log` | Audit Logs | Admin |
| `/admin-reports` | Reports | Admin |
| `/profile` | My Profile | All |

## Setup

### Frontend
```bash
cd life-claim-frontend
npm install
cp .env.example .env   # set VITE_API_URL
npm run dev            # runs on http://localhost:5174 (proxies /api to v2 backend)
```

### Backend (v2 — parallel to v1 on port 3008)
```bash
cd life-claim-backend
npm install
cp .env.example .env   # set PORT=3010, DB_PASSWORD, Keycloak, etc.
npm start              # runs on https://192.168.60.62:3010 (or PORT from .env)
```

### Database
Connects to existing `claims_poc` MySQL database.  
**No schema changes** — read/write only, models match existing tables.

## Demo Accounts
Password for all: `password123`

| Username | Role |
|----------|------|
| `preassessor` | Pre Assessor |
| `assessor` | Assessor |
| `verifier` | Verifier |
| `admin` | Admin |

## Key Features
- Full claim lifecycle: Registration → Assessment → Decision → Approval
- Role-based access control
- Real-time dashboard with charts
- Document upload (Alfresco DMS with fallback)
- Per-claim fraud prevention (claim workspace modal)
- Inward mail inbox & hospital contact management (legacy APIs)
- Ask Me floating assistant (UI preview)
- Admin audit logs & reports
- Idle session timeout + cross-tab logout
- Fully responsive with breadcrumbs & global loading bar
