# MortgageFlow — Mini CRM

A **portfolio demonstration** of a mortgage enquiry workflow built with React, FastAPI and SQLAlchemy. It supports adding fictional customer enquiries, listing and searching them, filtering by status, and updating the pipeline status.

> **Not production-ready.** This is a student portfolio prototype, not affiliated with any mortgage company. Do not use real customer data. It has no authentication, role-based permissions, audit trail, rate limiting or production security hardening.

## Tech stack
- Frontend: React 18, Vite, CSS, lucide-react
- Backend: Python, FastAPI, Pydantic, SQLAlchemy
- Database: **SQLite by default**, optional PostgreSQL 16 using Docker Compose
- Tests: pytest + FastAPI TestClient

## Quick start

Requires **Python 3.10+** and **Node.js 18+**.

### Terminal 1: API
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate      # Windows PowerShell: .venv\\Scripts\\Activate.ps1
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```
API docs: http://127.0.0.1:8000/docs

### Terminal 2: React app
```bash
cd frontend
npm install
npm run dev
```
Open http://127.0.0.1:5173

The app starts with an empty database. Click **New enquiry** to create a fictional record. The data persists in `backend/mortgageflow.db`.

### Optional: use PostgreSQL instead of SQLite
```bash
docker compose up -d postgres
```
In the API terminal, before starting uvicorn:
```bash
export DATABASE_URL='postgresql+psycopg://mortgageflow:local_demo_only@localhost:5432/mortgageflow'
```
On Windows PowerShell:
```powershell
$env:DATABASE_URL='postgresql+psycopg://mortgageflow:local_demo_only@localhost:5432/mortgageflow'
```
This database password is **only for local development**. Do not reuse it for any deployed environment.

## API endpoints
| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/enquiries?search=alex&status=New` | List, optionally filter by name/status |
| POST | `/api/enquiries` | Create an enquiry |
| PATCH | `/api/enquiries/{id}/status` | Update an enquiry's status |

Example request:
```bash
curl -X POST http://127.0.0.1:8000/api/enquiries \
  -H 'Content-Type: application/json' \
  -d '{"customer_name":"Alex Example","email":"alex@example.test","loan_type":"Home Loan","amount":450000,"notes":"Fictional record"}'
```

## Tests
```bash
cd backend
python -m pytest -q
```
Tests cover creation, listing, search, status changes, invalid amounts/emails, invalid statuses and missing records.

## Architecture
```
Browser (React/Vite)
  └── fetch /api/* (Vite dev proxy)
       └── FastAPI + Pydantic validation
            └── SQLAlchemy ORM
                 └── SQLite (default) or PostgreSQL (optional)
```

## Current limitations / next steps
- Add user authentication, permissions and an audit log before any real use.
- Add database migrations (Alembic) and secure configuration management.
- Add frontend component tests and CI.
- Add record editing and deletion, pagination, and secure server-side search.
- Add an AWS deployment using infrastructure-as-code **only after** adding production safeguards.

## Portfolio discussion prompts
1. Trace the request from the React form through FastAPI into the database.
2. Explain why the backend validates values even though the browser also validates them.
3. Explain the difference between SQLite and PostgreSQL and how `DATABASE_URL` switches them.
4. Describe how you would introduce an audit log and safely deploy changes to a live CRM.

## Attribution
This project was generated with AI assistance as a learning scaffold. Review, run, test, modify and understand the code before presenting it as your own engineering work. Be transparent about the use of AI tools if asked.
