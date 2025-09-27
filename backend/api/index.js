import 'dotenv/config';
import express from "express";
import dns from 'dns';
import net from 'net';
import { PrismaClient } from "@prisma/client";
import registerRoute from "../src/routes/register.js";
import loginRoute from "../src/routes/login.js";
import profileRoute from "../src/routes/profile.js";
import treesRoute from "../src/routes/trees.js";
import treePicturesRoute from "../src/routes/treepictures.js";
import roadsRoute from "../src/routes/roads.js";
import roadPicturesRoute from "../src/routes/roadpictures.js";
import reportsRoute from "../src/routes/reports.js";
import reportPicturesRoute from "../src/routes/reportpictures.js";
import cors from "cors";
import path from "path";
import serverless from "serverless-http";

const app = express();
const prisma = new PrismaClient();

// Configure CORS origins via env var for easier deployment configuration on Vercel.
// Set ALLOWED_ORIGINS as a comma-separated list (e.g. "https://my-frontend.vercel.app,https://other.com").
const defaultOrigins = [
  "http://localhost:4000",
  "http://localhost:5173",
  "https://gistreeview.vercel.app"
];

let allowedOrigins = defaultOrigins;
if (process.env.ALLOWED_ORIGINS) {
  // Split on comma, trim whitespace, and filter empties
  allowedOrigins = process.env.ALLOWED_ORIGINS.split(",").map(s => s.trim()).filter(Boolean);
}

// Normalize to lowercase for case-insensitive comparison
allowedOrigins = allowedOrigins.map(o => o.toLowerCase());

// Use a function for CORS origin so we can:
// - allow requests without an Origin header (e.g., curl, Postman)
// - do case-insensitive matching
// - return a clear error for disallowed origins
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    const incoming = origin.toLowerCase();
    if (allowedOrigins.includes(incoming)) {
      return callback(null, true);
    }

    // Not allowed
    return callback(new Error(`CORS policy: origin '${origin}' not allowed`), false);
  }
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "public", "uploads"))
);

app.get("/", (req, res) => {
  res.json({ message: "Backend API is running" });
});

// Diagnostic endpoint to help debug DB connectivity / DNS issues when deployed.
// - Performs DNS lookup for the DB hostname
// - Attempts a TCP connection to the resolved IP on the DB port
// - Attempts a short Prisma connect to validate credentials/network
app.get('/api/db-check', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) return res.status(500).json({ error: 'DATABASE_URL not set in environment' });
    let host, port;
    try {
      const u = new URL(process.env.DATABASE_URL);
      host = u.hostname;
      port = u.port ? Number(u.port) : 5432;
    } catch (e) {
      return res.status(500).json({ error: 'Invalid DATABASE_URL format', detail: String(e && e.message ? e.message : e) });
    }

    // DNS lookup
    let ipAddr;
    try {
      const lookup = await dns.promises.lookup(host);
      ipAddr = lookup && lookup.address;
    } catch (e) {
      return res.status(500).json({ step: 'dns', host, error: String(e && e.message ? e.message : e) });
    }

    // TCP connect test to the resolved IP and port
    try {
      await new Promise((resolve, reject) => {
        const sock = new net.Socket();
        const timer = setTimeout(() => {
          sock.destroy();
          reject(new Error('tcp timeout'));
        }, 5000);
        sock.once('error', (err) => {
          clearTimeout(timer);
          reject(err);
        });
        sock.connect(port, ipAddr, () => {
          clearTimeout(timer);
          sock.end();
          resolve();
        });
      });
    } catch (e) {
      return res.status(500).json({ step: 'tcp', host, ip: ipAddr, port, error: String(e && e.message ? e.message : e) });
    }

    // Prisma connect attempt (short-lived)
    try {
+      await prisma.$connect();
      await prisma.$disconnect();
    } catch (e) {
      return res.status(500).json({ step: 'prisma', host, ip: ipAddr, port, error: String(e && e.message ? e.message : e) });
    }

    res.json({ ok: true, host, ip: ipAddr, port });
  } catch (error) {
    res.status(500).json({ error: String(error && error.message ? error.message : error) });
  }
});

app.get("/trees", async (req, res) => {
  const trees = await prisma.tree.findMany();
  res.json(trees);
});

app.use("/api/trees", treesRoute);
app.use("/api/treepictures", treePicturesRoute);
app.use("/api/roads", roadsRoute);
app.use("/api/roadpictures", roadPicturesRoute);
app.use("/api/roads", roadPicturesRoute);
app.use("/api/register", registerRoute);
app.use("/api/login", loginRoute);
app.use("/api/reports", reportsRoute);
app.use("/api/reportpictures", reportPicturesRoute);
app.use("/api/profile", profileRoute);

export default app;

// Export a serverless handler for platforms like Vercel that expect a function entry.
// This keeps local usage (importing the app) intact while also providing a handler
// that wraps the Express app for per-invocation execution.
export const handler = serverless(app);
