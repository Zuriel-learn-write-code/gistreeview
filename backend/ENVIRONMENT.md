Environment variables for gistreeview backend

This document explains the important environment variables used by the backend and how to set them for local development and for deployment to Vercel.

Required / important variables

- DATABASE_URL
  - Postgres connection string used by Prisma.
  - Example: postgresql://user:password@host:5432/dbname

- ALLOWED_ORIGINS
  - Comma-separated list of origins the backend will accept cross-origin requests from.
  - Matching is case-insensitive and trimmed of whitespace.
  - Examples:
    - Local + deployed frontend: http://localhost:5173,https://gistreeview.vercel.app
    - Only production: https://gistreeview.vercel.app
  - If omitted, the backend uses a default set which includes:
    - http://localhost:4000
    - http://localhost:5173
    - https://gistreeview.vercel.app
  - Notes for Vercel:
    - Set `ALLOWED_ORIGINS` in the Vercel Project Environment settings to the deployed frontend URL(s).
    - Example Vercel value: https://gistreeview.vercel.app

Optional / integration variables

- CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
  - Required if you use Cloudinary for uploads. Set in both local `.env` and Vercel env.

- PORT
  - Local port (default 4000). Vercel ignores this for serverless functions.

- JWT_SECRET
  - Secret used for signing JWTs (if used by your auth routes).

- DRY_RUN
  - Some scripts accept a dry-run flag (DRY_RUN=1). Default in `.env.example` is 0.

How to set variables on Vercel

1. Go to your Vercel dashboard and open the Project for the backend (set Root Directory to `backend` if required).
2. Open Settings → Environment Variables.
3. Add variables (DATABASE_URL, ALLOWED_ORIGINS, CLOUDINARY_*, JWT_SECRET, etc.) for the correct environment (Preview/Production).

Tips and gotchas

- For CORS, the browser sends the `Origin` header of the page making the request. If your frontend is deployed at `https://gistreeview.vercel.app`, set that origin in `ALLOWED_ORIGINS`.
- Serverless note: When running under Vercel serverless functions, avoid writing uploads to disk; use Cloudinary or another external store.
- Database connections: serverless environments need connection pooling or Prisma Data Proxy to avoid exhausting DB connections.

Local usage

1. Copy `.env.example` to `.env` in the `backend/` folder.
2. Fill values for `DATABASE_URL`, `ALLOWED_ORIGINS`, and any Cloudinary/JWT vars you need.
3. Run locally:

```bash
cd backend
npm install
npm run dev
```

If you want me to add a small script or documentation snippet to your repo that automates copying `.env.example` to `.env` (without secrets), I can add that as well.
