# Gistreeview

Gistreeview is a mapping + tree/road reporting web application with a React+Vite frontend and an Express/Prisma backend. The backend uses PostgreSQL (Supabase in production) and Cloudinary for image uploads.

This README explains how to run the project locally and how to deploy the frontend and backend to Vercel.

## Repository layout

- backend/ — Express API, Prisma schema, serverless handler. Intended to be deployed as a serverless function on Vercel.
- frontend/ — React + Vite single-page application.

## Quick start (local)

Prerequisites

- Node.js (>=18 recommended)
- npm
- A Postgres database (local or Supabase)

1. Backend

```bash
cd backend
# copy example .env
cp .env.example .env
# edit .env: set DATABASE_URL, CLOUDINARY_*, ALLOWED_ORIGINS
npm install
# run locally (dev)
npm run dev
```

2. Frontend

```bash
cd frontend
# copy example env if needed
cp .env.example .env
# edit .env: set VITE_API_BASE to your backend URL (for dev this defaults to http://localhost:4000)
npm install
npm run dev
```

## Environment variables

See `backend/.env.example` and `frontend/.env.example` for examples. Important variables include:

Backend

- DATABASE_URL — Postgres connection string (Supabase recommended in production)
- ALLOWED_ORIGINS — comma-separated list of allowed origins (e.g. `http://localhost:5173,https://gistreeview.vercel.app`)
- CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
- JWT_SECRET (if used)

Frontend

- VITE_API_BASE — base URL for API requests (e.g. `https://gistreeview-e8cn.vercel.app/`)

## Deployment to Vercel

Recommended: deploy frontend and backend as two separate projects in Vercel.

1. Backend project

- Set root directory to `backend` in the Vercel project settings.
- In the project settings, add environment variables (DATABASE*URL, CLOUDINARY*\*, ALLOWED_ORIGINS, JWT_SECRET).
- Vercel will use `backend/vercel.json` to build and route the serverless function.

2. Frontend project

- Set root directory to `frontend`.
- Add environment variable `VITE_API_BASE` in Vercel (Production) pointing to the backend's public URL.
- Vercel will build the SPA automatically.

## Notes and gotchas

- Do NOT commit `.env` with secrets. Use `backend/.env.example` and `frontend/.env.example` as templates.
- Serverless DB connections: monitor and consider Prisma Data Proxy or pooling if you see connection errors in production.
- File uploads: the backend is configured to use Cloudinary. Do not rely on local filesystem persistence in serverless deployments.

:)

## CI deployment (frontend-only via GitHub Actions)

This repository uses a GitHub Actions workflow to deploy only the `frontend/` project to Vercel on pushes to `main`.

Required repository secrets (add under Settings → Secrets):

- `VERCEL_TOKEN` — personal access token from Vercel.
- `VERCEL_ORG_ID` — organization ID for your Vercel account.
- `VERCEL_PROJECT_ID_FRONTEND` — the Vercel Project ID for the frontend project.

- `VERCEL_PROJECT_ID_BACKEND` — the Vercel Project ID for the backend project (if you want CI to deploy the backend on push as well).

The workflow file is located at `.github/workflows/deploy-frontend-only.yml` and runs `vercel` with the working directory set to `frontend`.

This repository's default workflow deploys both the frontend and backend sequentially on pushes to `main` when the required secrets are present:

- `VERCEL_PROJECT_ID_FRONTEND` — frontend project id
- `VERCEL_PROJECT_ID_BACKEND` — backend project id

If you prefer to keep backend deployments manual, omit `VERCEL_PROJECT_ID_BACKEND` from repository secrets and the workflow will fail the backend deploy step (you can also remove that step).
