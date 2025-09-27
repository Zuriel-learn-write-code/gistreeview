Prisma + Serverless: Handling Postgres Connection Limits

Problem
-------
Serverless environments (Vercel, AWS Lambda, Cloud Run with scaled instances) create many short-lived function instances. Each instance that initializes a PrismaClient may open one or more Postgres connections. Managed Postgres databases often have low connection limits (e.g. 100). Without pooling, you can quickly exhaust available connections and see errors like `FATAL: remaining connection slots are reserved for non-replication superuser connections` or timeouts.

Options / Tradeoffs
------------------
1) Prisma Data Proxy
   - Pros: Managed by Prisma, centralizes connections, designed for serverless, minimal infra work on your side.
   - Cons: Paid for production usage (free tier exists), requires enabling Data Proxy and pointing `DATABASE_URL` to the proxy URL; may add slight latency.

2) PgBouncer (connection pooler)
   - Pros: Open-source, robust, low-latency, you can run it close to your DB (same VPC) and configure pooling mode.
   - Cons: Requires infrastructure (container/VM) and networking setup. If your DB is managed (e.g., ElephantSQL, Heroku Postgres), you'll need to run PgBouncer externally (e.g., another small VM, or use provider add-on if available).

3) Use a DB host that supports many concurrent connections
   - Pros: Simple (no extra infra).
   - Cons: May be expensive and still fragile at large scales.

Recommendation
--------------
- For quick and reliable serverless support, Prisma Data Proxy is the easiest and safest.
- If you prefer self-hosting and lower cost, run PgBouncer close to the database and point your app at PgBouncer.

Local testing with PgBouncer (example)
--------------------------------------
This repo includes an example `docker-compose`-style setup you can use locally to test Prisma + PgBouncer.

Files (example)
- `pgbouncer/docker-compose.yml` — runs Postgres + PgBouncer
- `pgbouncer/userlist.txt` — PgBouncer user list
- `pgbouncer/pgbouncer.ini` — PgBouncer config

Usage (local)
--------------
1. Install Docker and Docker Compose.
2. From `backend/pgbouncer` run:

```bash
docker compose up -d
```

3. Update your `DATABASE_URL` in `.env.development` to point to PgBouncer (example shown in `docker-compose.yml`).
4. Run your backend locally (`npm run dev`) and observe connections in PgBouncer logs.

PgBouncer modes of interest
- session (default): each client gets a dedicated server connection. Better compatibility, higher server connection usage.
- transaction: a server connection is handed out only during a transaction. Good for pooled short-lived transactions.
- statement: like transaction but only for single statements (less common).

Prisma considerations
- Ensure Prisma client is a singleton (this repo already uses `prismaClient.js` singleton).
- Avoid creating PrismaClient in ephemeral top-level code in serverless functions.
- Use Prisma Data Proxy if you don't want to operate pooling infra.

Next steps
----------
- If you want, I can add the `pgbouncer` example files and a small `README` to `backend/pgbouncer` and show how to switch `DATABASE_URL` for local testing.
- Or, I can show how to enable Prisma Data Proxy and change your `DATABASE_URL` to the proxy URL.
