Gistreeview
===========

Gistreeview is a mapping + tree/road reporting web application with a React+Vite frontend and an Express/Prisma backend. The backend uses PostgreSQL (Supabase in production) and Cloudinary for image uploads.

This README explains how to run the project locally and how to deploy the frontend and backend to Vercel.

Repository layout
-----------------
- backend/ — Express API, Prisma schema, serverless handler. Intended to be deployed as a serverless function on Vercel.
- frontend/ — React + Vite single-page application.

Quick start (local)
-------------------
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

Environment variables
---------------------
See `backend/.env.example` and `frontend/.env.example` for examples. Important variables include:

Backend
- DATABASE_URL — Postgres connection string (Supabase recommended in production)
- ALLOWED_ORIGINS — comma-separated list of allowed origins (e.g. `http://localhost:5173,https://gistreeview.vercel.app`)
- CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
- JWT_SECRET (if used)

Frontend
- VITE_API_BASE — base URL for API requests (e.g. `https://gistreeview-backend-three.vercel.app`)

Deployment to Vercel
--------------------
Recommended: deploy frontend and backend as two separate projects in Vercel.

1. Backend project
- Set root directory to `backend` in the Vercel project settings.
- In the project settings, add environment variables (DATABASE_URL, CLOUDINARY_*, ALLOWED_ORIGINS, JWT_SECRET).
- Vercel will use `backend/vercel.json` to build and route the serverless function.

2. Frontend project
- Set root directory to `frontend`.
- Add environment variable `VITE_API_BASE` in Vercel (Production) pointing to the backend's public URL.
- Vercel will build the SPA automatically.

Notes and gotchas
-----------------
- Do NOT commit `.env` with secrets. Use `backend/.env.example` and `frontend/.env.example` as templates.
- Serverless DB connections: monitor and consider Prisma Data Proxy or pooling if you see connection errors in production.
- File uploads: the backend is configured to use Cloudinary. Do not rely on local filesystem persistence in serverless deployments.

Need help?
----------
If you want, I can:
- Add deployment docs with exact Vercel steps for a monorepo or separate projects.
- Create scripts to copy `.env.example` to `.env` safely.
- Add CI configuration for testing.

