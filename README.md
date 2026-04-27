# 🌍 Smart Resource Allocation System

> A full-stack web application that enables NGOs to efficiently register problems, manage volunteers, and automatically assign the nearest skill-matched volunteer to any crisis — complete with real-time email notifications.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Live Features](#live-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Core Algorithm](#core-algorithm)
- [Email Notifications](#email-notifications)
- [Security](#security)
- [Screenshots](#screenshots)

---

## Overview

The **Smart Resource Allocation System** is built for NGOs and disaster-response organizations to streamline the process of identifying problems, registering volunteers, and intelligently matching the right help to the right place — automatically.

When a problem is registered (e.g., a flood, food shortage, or medical emergency), the system uses **real geo-coordinates** resolved from plain city/landmark text to calculate the Haversine distance between every available volunteer and the problem location. It then prioritizes volunteers whose **skills match the problem category** and assigns the nearest qualified volunteer — sending them an email notification instantly.

---

## Live Features

### 🔐 Authentication
- User signup with **email OTP verification** via Resend
- Secure login with **JWT access tokens** (15 min) + **refresh tokens** (7 days) stored in httpOnly cookies
- Auto session restore on page reload using a lightweight `localStorage` flag
- Protected and guest route guards in React Router

### 🏠 Home
- Dashboard showing all NGO workspaces created by the logged-in user
- Each workspace card displays problem count, volunteer count, and creation date
- Empty state with call-to-action for first-time users

### 🏢 Workspace Management
- Create NGO workspaces with full details: name, type, contact info, city, password-protected access
- Each workspace is isolated — problems and volunteers are scoped to their workspace

### 📊 Dashboard
- Live stats: Total Problems, Total Volunteers, Assigned, Unassigned
- Full problems table with priority badges, status badges, assigned volunteer info, and distance
- Full volunteers table with skills, availability, and status badges
- Tab switcher between Problems and Volunteers views
- Inline **Edit** and **Delete** actions for both problems and volunteers
- **Notify Nearest Volunteer** button per problem row

### 📋 Problem Registration
- Rich form with category, priority, location, contact details, and description
- **Auto-coordinate detection** — resolves latitude/longitude from city + landmark text via Nominatim (OpenStreetMap)
- After registration, a prominent **"Notify Nearest Volunteer"** button appears

### 🙋 Volunteer Registration
- Full volunteer profile: skills, availability, vehicle ownership, emergency contact
- **Auto-coordinate detection** from city + landmark — same geocoding flow as problems
- Skill multi-select with checkboxes

### 🔔 Smart Volunteer Notification
- Filters available volunteers in the same workspace
- Auto-geocodes any volunteer or problem missing coordinates
- Calculates real Haversine distance between problem and each volunteer
- **Prioritizes skill-matched volunteers** for the problem's category
- Falls back to nearest available volunteer if no skill match exists
- Sends a **fully styled HTML email** to the assigned volunteer via Resend
- Returns `selectionInfo` to the frontend — shows whether assignment was skill-matched or a fallback

### 👤 Profile
- View and edit full name and city
- Displays member since date, email (read-only)
- Avatar with initials auto-generated from name

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React.js + Vite | UI framework and build tool |
| Tailwind CSS | Utility-first styling |
| Redux Toolkit | Global state management |
| RTK Query | API data fetching and caching |
| React Router v6 | Client-side routing |
| React Hook Form + Yup | Form handling and validation |
| Lucide React | Icon library |
| React Hot Toast | Toast notifications |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express.js | REST API server |
| Supabase (PostgreSQL) | Database with Row Level Security |
| JWT | Stateless authentication |
| bcryptjs | Password and OTP hashing |
| Resend | Transactional email delivery |
| express-validator | Request input validation |
| axios | Nominatim geocoding API calls |

### Services
| Service | Purpose |
|---|---|
| Nominatim (OpenStreetMap) | Free geocoding — city + landmark → lat/lng |
| Resend | OTP emails + volunteer assignment emails |
| Supabase | Hosted PostgreSQL with RLS |

---

## Project Structure

```
smart-resource-allocation/
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── store.js               # Redux store
│   │   │   └── api.js                 # Axios instance with base URL
│   │   ├── features/
│   │   │   └── auth/
│   │   │       └── authSlice.js       # Auth state, fetchMe, logout thunks
│   │   ├── pages/
│   │   │   ├── WelcomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   ├── VerifyOtpPage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── WorkspaceFormPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   └── WorkspaceView.jsx
│   │   ├── components/
│   │   │   ├── workspace/
│   │   │   │   ├── DashboardTab.jsx   # Problems + Volunteers tables with edit/delete
│   │   │   │   ├── ProblemTab.jsx     # Problem registration form
│   │   │   │   ├── VolunteerTab.jsx   # Volunteer registration form
│   │   │   │   └── CoordinateField.jsx # Auto-geocoding input component
│   │   │   └── Sidebar.jsx
│   │   ├── layouts/
│   │   │   ├── MainLayout.jsx
│   │   │   └── WorkspaceLayout.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   └── useGeocode.js
│   │   ├── App.jsx                    # Routes + protected/guest wrappers
│   │   └── main.jsx
│   ├── .env
│   ├── index.html
│   └── package.json
│
└── backend/
    ├── src/
    │   ├── config/
    │   │   ├── db.js                  # Supabase client (service_role key)
    │   │   └── email.js               # Resend client setup
    │   ├── controllers/
    │   │   ├── authController.js      # signup, verifyOtp, login, logout, profile
    │   │   ├── workspaceController.js # CRUD for workspaces
    │   │   ├── problemController.js   # CRUD for problems
    │   │   ├── volunteerController.js # CRUD for volunteers
    │   │   ├── dashboardController.js # Enriched stats + problems + volunteers
    │   │   ├── notifyController.js    # Smart nearest-volunteer assignment
    │   │   ├── geocodeController.js   # /api/geocode endpoint
    │   │   └── sendAssignmentEmailController.js # HTML email builder
    │   ├── middlewares/
    │   │   ├── authMiddleware.js      # JWT verification
    │   │   ├── errorHandler.js        # Global error handler
    │   │   └── validate.js            # express-validator error formatter
    │   ├── routes/
    │   │   ├── auth.js
    │   │   ├── workspace.js
    │   │   ├── problem.js
    │   │   ├── volunteer.js
    │   │   └── geocode.js
    │   ├── utils/
    │   │   ├── haversine.js           # Haversine distance formula
    │   │   ├── geocoder.js            # Nominatim API + in-memory cache
    │   │   ├── otpGenerator.js        # 6-digit OTP generator
    │   │   └── tokenUtils.js          # JWT sign/verify helpers
    │   └── app.js                     # Express app setup, middleware, routes
    ├── server.js                      # Entry point
    ├── .env
    └── package.json
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- A [Supabase](https://supabase.com) account and project
- A [Resend](https://resend.com) account with a verified sender domain

### 1. Clone the repository

```bash
git clone https://github.com/your-username/smart-resource-allocation.git
cd smart-resource-allocation
```

### 2. Setup the Backend

```bash
cd backend
npm install
```

Create a `.env` file (see [Environment Variables](#environment-variables) below), then start the server:

```bash
npm run dev
```

The backend runs on `http://localhost:5000`

### 3. Setup the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`

### 4. Run the Database Migration

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Open **SQL Editor → New Query**
3. Paste and run the full migration SQL from `backend/migration.sql`

This creates all four tables (`users`, `workspaces`, `problems`, `volunteers`) with proper foreign keys, indexes, Row Level Security policies, and `updated_at` triggers.

---

## Environment Variables

### Backend — `backend/.env`

```env
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...          # Settings → API → service_role (secret)
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

> ⚠️ **Important:** Always use the `service_role` key in the backend — never the `anon` key. The service role bypasses Row Level Security, which is required for your backend to perform assignments and updates on behalf of users.

### Frontend — `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Database Schema

### Tables

#### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | auto-generated |
| full_name | TEXT | required |
| email | TEXT UNIQUE | required |
| password_hash | TEXT | bcrypt hashed |
| city | TEXT | used for proximity |
| otp_hash | TEXT | hashed 6-digit OTP |
| otp_expiry | TIMESTAMPTZ | 10 min validity |
| is_verified | BOOLEAN | default false |
| refresh_token | TEXT | JWT refresh token |
| created_at / updated_at | TIMESTAMPTZ | auto-managed |

#### `workspaces`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | auto-generated |
| created_by | UUID FK → users | workspace owner |
| ngo_name | TEXT | required |
| ngo_type | TEXT | e.g. Health, Education |
| city | TEXT | required |
| contact_email / phone | TEXT | required |
| password_hash | TEXT | workspace access password |
| founded_year | INTEGER | CHECK 1800–2100 |
| created_at / updated_at | TIMESTAMPTZ | auto-managed |

#### `problems`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | auto-generated |
| workspace_id | UUID FK → workspaces | NOT NULL |
| title, description | TEXT | required |
| category | TEXT | maps to skill requirements |
| priority | TEXT | Low / Medium / High / Critical |
| status | TEXT | Open / Assigned / In Progress / Resolved |
| city, landmark | TEXT | used for geocoding |
| latitude, longitude | NUMERIC | auto-resolved via Nominatim |
| resolved_address | TEXT | human-readable geocoded address |
| coordinates_source | TEXT | 'auto' or 'manual' |
| assigned_volunteer_id | UUID FK → volunteers | nullable |
| distance_km | NUMERIC | set on assignment |
| estimated_people_affected | INTEGER | optional |
| created_at / updated_at | TIMESTAMPTZ | auto-managed |

#### `volunteers`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | auto-generated |
| workspace_id | UUID FK → workspaces | NOT NULL |
| full_name, email, phone | TEXT | required |
| age | INTEGER | CHECK 18–65 |
| city, landmark | TEXT | used for geocoding |
| latitude, longitude | NUMERIC | auto-resolved via Nominatim |
| skills | TEXT[] | array of skill strings |
| availability | TEXT | Full-Time / Part-Time / etc. |
| status | TEXT | Available / Busy / Inactive |
| current_assignment_id | UUID FK → problems | nullable |
| has_vehicle | BOOLEAN | default false |
| created_at / updated_at | TIMESTAMPTZ | auto-managed |

---

## API Reference

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register user, send OTP email |
| POST | `/api/auth/verify-otp` | Verify OTP, issue JWT tokens |
| POST | `/api/auth/resend-otp` | Resend OTP (30s cooldown) |
| POST | `/api/auth/login` | Login, issue JWT tokens |
| POST | `/api/auth/logout` | Clear auth cookies |
| POST | `/api/auth/refresh-token` | Rotate access token |
| GET  | `/api/auth/me` | Get current user from token |
| PUT  | `/api/auth/profile` | Update full name and city |

### Workspaces

| Method | Endpoint | Description |
|---|---|---|
| GET    | `/api/workspaces` | Get all workspaces for logged-in user |
| POST   | `/api/workspaces` | Create new workspace |
| GET    | `/api/workspaces/:id` | Get single workspace |
| PUT    | `/api/workspaces/:id` | Update workspace |
| DELETE | `/api/workspaces/:id` | Delete workspace |

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/workspaces/:id/dashboard` | Stats + enriched problems + volunteers |

### Problems

| Method | Endpoint | Description |
|---|---|---|
| GET    | `/api/workspaces/:id/problems` | List all problems |
| POST   | `/api/workspaces/:id/problems` | Register new problem (auto-geocodes) |
| GET    | `/api/workspaces/:id/problems/:pid` | Get single problem |
| PUT    | `/api/workspaces/:id/problems/:pid` | Update problem |
| DELETE | `/api/workspaces/:id/problems/:pid` | Delete problem |
| POST   | `/api/workspaces/:id/problems/:pid/notify` | Assign nearest volunteer + send email |

### Volunteers

| Method | Endpoint | Description |
|---|---|---|
| GET    | `/api/workspaces/:id/volunteers` | List all volunteers |
| POST   | `/api/workspaces/:id/volunteers` | Register volunteer (auto-geocodes) |
| GET    | `/api/workspaces/:id/volunteers/:vid` | Get single volunteer |
| PUT    | `/api/workspaces/:id/volunteers/:vid` | Update volunteer |
| DELETE | `/api/workspaces/:id/volunteers/:vid` | Delete volunteer |

### Geocoding

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/geocode?city=Delhi&landmark=Gandhi Chowk` | Resolve coordinates from text |

---

## Core Algorithm

The **Smart Volunteer Assignment Algorithm** runs when the "Notify Nearest Volunteer" button is triggered.

```
1. FETCH the problem (auto-geocode if lat/lng missing)
2. FETCH all volunteers with status = "Available" in same workspace
3. GEOCODE any volunteer missing coordinates (1s delay between calls)
4. CALCULATE Haversine distance from problem to every volunteer
5. SORT all volunteers by distance ascending (nearest first)
6. SPLIT into two buckets:
   │
   ├─ skill-matched[]  → volunteer has ≥1 skill required for problem's category
   │                     (e.g. "Medical Emergency" needs Medical Aid or Counseling)
   │
   └─ unmatched[]      → no relevant skills for this category
7. SELECT:
   ├─ skill-matched volunteers exist? → pick skillMatched[0] (nearest + skilled)
   └─ none? → fallback to sortedByDistance[0] (nearest available, any skills)
8. UPDATE problem: status = "Assigned", assigned_volunteer_id, distance_km
9. UPDATE volunteer: status = "Busy", current_assignment_id
10. SEND HTML email to assigned volunteer via Resend
11. RETURN response with selectionInfo (method, skillMatchedCount, requiredSkills)
```

### Category → Skills Mapping

| Problem Category | Required Skills (any one qualifies) |
|---|---|
| Medical Emergency | Medical Aid, Counseling |
| Natural Disaster | Rescue Operations, Food Distribution, Construction, Driving, Medical Aid |
| Food Shortage | Food Distribution, Driving |
| Infrastructure | Construction, Driving, IT Support |
| Education | Teaching, Counseling, IT Support |
| Environmental Hazard | Rescue Operations, Construction, Medical Aid |
| Social Issue | Counseling, Teaching, Food Distribution |
| Other | Any volunteer qualifies (no filter) |

### Haversine Distance Formula

```javascript
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

### Geocoding — Nominatim

- **Free** — no API key required
- Queries `https://nominatim.openstreetmap.org/search` with city + landmark
- Falls back to city-only if landmark+city returns no results
- Results cached in-memory for 24 hours (keyed by `"city|landmark"`)
- 1-second delay enforced between requests (Nominatim fair-use policy)
- Coordinates are persisted to the database after first resolution

---

## Email Notifications

Two types of emails are sent via **Resend**:

### 1. OTP Verification Email
Sent on signup. Contains a 6-digit OTP valid for 10 minutes with a resend option after 30 seconds.

### 2. Volunteer Assignment Email
Sent when a volunteer is assigned to a problem. The email includes:
- Problem title, category, priority badge (color-coded)
- Problem location (city + landmark)
- Distance from volunteer to problem
- Estimated people affected
- Contact person name and phone
- Problem description
- NGO name and contact email
- Volunteer's own skills listed

The email is fully responsive HTML with a dark navy + emerald green design matching the application theme.

---

## Security

| Layer | Implementation |
|---|---|
| Password storage | bcrypt hashed, never stored in plain text |
| OTP storage | bcrypt hashed in DB, plain text only in the email |
| JWT | Short-lived access tokens (15 min), long-lived refresh tokens (7 days) in httpOnly cookies — inaccessible to JavaScript |
| Session hint | `localStorage.isLoggedIn` flag — only signals whether to attempt token restore, carries no sensitive data |
| Row Level Security | Enabled on all Supabase tables — users can only access their own workspaces; problems/volunteers are gated by workspace ownership |
| Backend client | Uses `service_role` key — never exposed to frontend |
| Input validation | `express-validator` on all POST/PUT endpoints |
| CORS | Restricted to `CLIENT_URL` only |
| Helmet | HTTP security headers on all responses |
| Sensitive columns | `password_hash`, `otp_hash`, `refresh_token` are never returned in API responses |

---

## Acknowledgements

- [Nominatim / OpenStreetMap](https://nominatim.openstreetmap.org) — free geocoding service
- [Resend](https://resend.com) — transactional email API
- [Supabase](https://supabase.com) — open-source Firebase alternative with PostgreSQL
- [Lucide React](https://lucide.dev) — beautiful open-source icons
- [Tailwind CSS](https://tailwindcss.com) — utility-first CSS framework

---

<p align="center">Built with ❤️ for NGOs and disaster-response teams</p>