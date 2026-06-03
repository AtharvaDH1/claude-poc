# DH Digital — Life Claims POC

A modern, full-stack life insurance claims management system built with React + Node.js/Express.

## Tech Stack

**Frontend:** React 18, Vite, React Router v6, Recharts, Lucide Icons, Axios  
**Backend:** Node.js, Express, Sequelize ORM, MySQL, JWT Auth, Multer  

## Project Structure

```
claude-poc/
├── src/                    # React frontend
│   ├── pages/              # All pages
│   ├── components/         # Shared components
│   ├── layouts/            # AppLayout (sidebar + topbar)
│   ├── services/           # API service layer
│   ├── context/            # Auth context
│   └── data/               # Mock data fallback
├── backend/                # Node.js backend
│   └── src/
│       ├── controllers/    # Route handlers
│       ├── models/         # Sequelize models
│       ├── middleware/      # Auth, rate limit, error
│       ├── routes/         # All API routes
│       └── services/       # Business logic
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
| `/fraud-prevention` | Fraud Prevention | Assessor, Verifier, Admin |
| `/user-management` | User Management | Admin |
| `/audit-log` | Audit Logs | Admin |
| `/admin-reports` | Reports | Admin |
| `/profile` | My Profile | All |

## Setup

### Frontend
```bash
npm install
cp .env.example .env   # set VITE_API_URL
npm run dev            # runs on http://localhost:5174
```

### Backend
```bash
cd backend
npm install
cp .env.example .env   # set DB_PASSWORD and other vars
npm start              # runs on http://localhost:3009
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
- Fraud prevention rules engine
- Admin audit logs & reports
- Idle session timeout + cross-tab logout
- Fully responsive with breadcrumbs & global loading bar
