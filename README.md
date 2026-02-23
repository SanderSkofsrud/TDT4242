# TDT4242 – AI Compliance Platform

A full-stack demo platform for AI usage compliance in education.

- **Frontend:** React + Vite + TypeScript
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL 16
- **Orchestration:** Docker Compose

The app supports user authentication, privacy notice acknowledgement, declarations, guidance, dashboards, sharing controls, policy management, and data export.

## Quick Start (Recommended)

### Prerequisites

- Docker Desktop (or Docker Engine + Compose)
- Git (optional)

### 1) Configure environment

Create a root `.env` file (already present in this workspace) with:

```env
PORT=3000
NODE_ENV=development
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=ai_compliance
POSTGRES_USER=postgres
POSTGRES_PASSWORD=localdevpassword
JWT_SECRET=local-dev-jwt-secret-change-in-production
PRIVACY_NOTICE_VERSION=1
POLICY_PDF_STORAGE_PATH=./uploads/policies
```

### 2) Start everything

From the project root:

```bash
docker compose up --build
```

Services:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Postgres: localhost:5432

### 3) First-run DB behavior

On backend startup:

1. It checks whether required tables exist.
2. If tables are missing, it runs migrations automatically.
3. It then runs demo seeding (idempotent) so the app is usable immediately.

## Demo Login Users (Seed Data)

All seeded users share this password:

- **Password:** `Password123!`

Seeded accounts:

- `instructor.demo@ntnu.no` (role: instructor)
- `faculty.demo@ntnu.no` (role: head_of_faculty)
- `student1.demo@ntnu.no` (role: student)
- `student2.demo@ntnu.no` (role: student)
- `student3.demo@ntnu.no` (role: student)
- `student4.demo@ntnu.no` (role: student)
- `student5.demo@ntnu.no` (role: student)

## Role-specific Navigation Notes

- Students are routed to `/dashboard`.
- Instructors can use instructor dashboard route:
  - `/dashboard/instructor/55555555-5555-5555-5555-555555555555`
- Faculty dashboard requires query parameter:
  - `/dashboard/faculty?facultyId=11111111-1111-1111-1111-111111111111`

## Development (Without Docker for App Processes)

You can run PostgreSQL in Docker and run backend/frontend locally.

### Prerequisites

- Node.js 20+
- npm 10+

### Install dependencies

From root:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

### Start Postgres only

```bash
docker compose up -d postgres
```

### Run backend (dev)

```bash
npm run dev:backend
```

### Run frontend (dev)

```bash
npm run dev:frontend
```

## Available Scripts

### Root

- `npm run dev:frontend`
- `npm run dev:backend`
- `npm run build:frontend`
- `npm run build:backend`
- `npm run build`
- `npm run start:backend`
- `npm run lint`

### Backend

- `npm run build`
- `npm run dev`
- `npm run start`
- `npm run type-check`
- `npm run lint`
- `npm run migrate` (manual migration run)
- `npm run seed` (manual seed run)

### Frontend

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`

## API Overview

### Health

- `GET /health`

### Auth & User

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/privacy-ack`
- `GET /api/user/export`

### Declarations

- `POST /api/declarations`
- `GET /api/declarations`
- `GET /api/declarations/:declarationId`

### Guidance

- `GET /api/assignments/:assignmentId/guidance`
- `POST /api/assignments/:assignmentId/guidance`
- `PUT /api/assignments/:assignmentId/guidance`

### Assignments

- `GET /api/assignments`

### Dashboard

- `GET /api/dashboard/student`
- `GET /api/dashboard/instructor/:courseId`
- `GET /api/dashboard/faculty`

### Sharing

- `GET /api/sharing/status`
- `POST /api/sharing/revoke/:courseId`
- `POST /api/sharing/reinstate/:courseId`

### Feedback & Policy

- `GET /api/declarations/:declarationId/feedback`
- `GET /api/policy/current`
- `POST /api/policy/upload`

## Database Notes

Migrations are SQL files in `backend/sql/migrations` and aggregate views in `backend/sql/views`.

### Check if tables exist

```bash
docker compose exec postgres sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dt"'
```

### Recreate DB from scratch (fresh migrations + fresh seed)

```bash
docker compose down -v
docker compose up --build
```

### Follow backend logs

```bash
docker compose logs -f backend
```

Look for messages like:

- `[schema] Running migrations...`
- `[seed] Demo data inserted successfully`

## Frontend Environment

Frontend API base URL defaults to `http://localhost:3000`.

Optional `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_PRIVACY_NOTICE_VERSION=1
```

## Project Structure

```text
backend/
  config/
  controllers/
  jobs/
  middleware/
  models/
  routes/
  scripts/
  sql/
frontend/
  components/
  context/
  hooks/
  pages/
  services/
  styles/
```

## Troubleshooting

### Blank page after login/register

If routed to `/privacy-notice`, ensure backend is running and frontend is rebuilt after latest router updates.

### Compose startup fails

- Check container logs:

```bash
docker compose logs --tail=200 backend
docker compose logs --tail=200 postgres
docker compose logs --tail=200 frontend
```

### Local `npm run build` errors for missing packages

Run:

```bash
npm install --prefix backend
npm install --prefix frontend
```

## Security Notes

- The included `.env` values are for local development only.
- Change `JWT_SECRET` and database credentials in any shared/production environment.
- Demo credentials are intentionally public for local testing and should not be used in production.
