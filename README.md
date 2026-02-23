# TDT4242 - AI Compliance Platform

Full-stack demo platform for assignment-level AI usage guidance, declaration, feedback, and privacy-controlled aggregate dashboards in education.

- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL 16
- Orchestration: Docker Compose

## What the app currently does

- Authentication and role-based access (`student`, `instructor`, `head_of_faculty`, `admin`)
- Privacy notice acknowledgement gate before normal app usage
- Assignment-level AI guidance:
  - permitted/prohibited text
  - permitted/prohibited categories
  - examples
- Student AI usage declarations per assignment
- Compliance feedback with policy reference and mismatch prompts
- Student dashboard:
  - usage by category/frequency
  - monthly trend
  - assignment-level breakdown
- Instructor dashboard: aggregate rows for the instructor course(s)
- Faculty dashboard: aggregate rows for faculty scope
- Per-course sharing controls for students (private by default)
- Student data export

## Quick start (Docker)

### Prerequisites

- Docker Desktop (or Docker Engine + Compose)
- Git (optional)

### 1) Configure environment

Root `.env`:

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

### 2) Start services

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Postgres: `localhost:5432`

### 3) Startup DB behavior

On backend startup (`backend/scripts/ensureSchema.ts`):

1. Checks required tables/columns/views.
2. Runs migrations if schema is outdated.
3. Runs seed script.

Seed is safe to rerun because inserts use `ON CONFLICT DO NOTHING`, but it does not overwrite existing rows.

## Demo accounts

Password for all seeded users:

- `Password123!`

Users:

- `instructor.demo@ntnu.no` (instructor)
- `faculty.demo@ntnu.no` (head_of_faculty)
- `student1.demo@ntnu.no` (student)
- `student2.demo@ntnu.no` (student)
- `student3.demo@ntnu.no` (student)
- `student4.demo@ntnu.no` (student)
- `student5.demo@ntnu.no` (student)

## Current navigation

- `/dashboard`
  - student -> student dashboard
  - instructor -> instructor course home
  - head_of_faculty -> redirects to faculty dashboard with demo `facultyId`
- `/dashboard/instructor/:courseId`
- `/dashboard/instructor/:courseId/assignments`
- `/dashboard/faculty?facultyId=<uuid>`
- `/assignments/:assignmentId/guidance`
- `/assignments/:assignmentId/guidance/manage?courseId=<uuid>`
- `/declarations/submit?assignmentId=<uuid>`
- `/declarations/:declarationId/feedback`
- `/privacy`
- `/export`
- `/profile`

## API overview

### Health

- `GET /health`

### Auth and user

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/privacy-ack`
- `GET /api/user/export`

### Assignments

- `GET /api/assignments` (student assignments + declaration status)
- `GET /api/instructor/:courseId/assignments`
- `POST /api/instructor/:courseId/assignments`

### Guidance

- `GET /api/assignments/:assignmentId/guidance`
- `POST /api/assignments/:assignmentId/guidance`
- `PUT /api/assignments/:assignmentId/guidance`

### Declarations

- `POST /api/declarations`
- `GET /api/declarations`
- `GET /api/declarations/:declarationId`

### Feedback and policy

- `GET /api/declarations/:declarationId/feedback`
- `GET /api/policy/current`
- `POST /api/policy/upload`

### Dashboards

- `GET /api/dashboard/student`
- `GET /api/dashboard/instructor-courses`
- `GET /api/dashboard/instructor/:courseId`
- `GET /api/dashboard/faculty`

### Sharing

- `GET /api/sharing/status`
- `POST /api/sharing/revoke/:courseId`
- `POST /api/sharing/reinstate/:courseId`

Note:

- Sharing is private by default.
- Instructor/faculty aggregate views currently include only data from students with `is_shared = TRUE`.

## Local development without Docker for app processes

### Prerequisites

- Node.js 20+
- npm 10+

### Install dependencies

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

### Start Postgres only

```bash
docker compose up -d postgres
```

### Run backend

```bash
npm run dev:backend
```

### Run frontend

```bash
npm run dev:frontend
```

## Scripts

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
- `npm run migrate`
- `npm run seed`

### Frontend

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`

## Database and migrations

Migrations:

- `backend/sql/migrations`

Aggregate views:

- `backend/sql/views/v_instructor_aggregate.sql`
- `backend/sql/views/v_faculty_aggregate.sql`

### Check tables

```bash
docker compose exec postgres sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dt"'
```

### Recreate DB from scratch

```bash
docker compose down -v
docker compose up --build
```

### Follow backend logs

```bash
docker compose logs -f backend
```

## Frontend environment

`frontend/.env` (optional):

```env
VITE_API_URL=http://localhost:3000
VITE_PRIVACY_NOTICE_VERSION=1
```

## Project structure

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
  types/
```

## Troubleshooting

### Frontend route issues after changes

- Rebuild frontend image or restart frontend dev process.

### Compose startup issues

```bash
docker compose logs --tail=200 backend
docker compose logs --tail=200 postgres
docker compose logs --tail=200 frontend
```

### Seed does not update existing values

- Seed does not overwrite existing rows (`ON CONFLICT DO NOTHING`).
- If you need full replacement, reset volumes:

```bash
docker compose down -v
docker compose up --build
```

## Security notes

- Current `.env` values are for local development only.
- Change `JWT_SECRET` and DB credentials for any shared/production environment.
- Demo credentials are intentionally public for local testing and must not be used in production.
