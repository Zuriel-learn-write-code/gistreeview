import "dotenv/config";
import express from "express";
import prisma from "../src/prismaClient.js";
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
import { formatPrismaError } from "../src/prismaClient.js";
import path from "path";
import serverless from "serverless-http";

const app = express();



// Configure CORS origins via env var for easier deployment configuration on Vercel.
// Set ALLOWED_ORIGINS as a comma-separated list (e.g. "https://my-frontend.vercel.app,https://other.com").
let allowedOrigins = [];
if (process.env.ALLOWED_ORIGINS) {
  // Split on comma, trim whitespace, and filter empties
  allowedOrigins = process.env.ALLOWED_ORIGINS.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
} else {
  // Fallback to localhost if no origins are specified
  allowedOrigins = ["http://localhost:5173"];
}

// Normalize to lowercase for case-insensitive comparison
allowedOrigins = allowedOrigins.map((o) => o.toLowerCase());

// Use a function for CORS origin so we can:
// - allow requests without an Origin header (e.g., curl, Postman)
// - do case-insensitive matching
// - return a clear error for disallowed origins
const corsConfig = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    const incoming = origin.toLowerCase();
    if (allowedOrigins.includes(incoming)) {
      return callback(null, true);
    }

    // Not allowed
    return callback(
      new Error(`CORS policy: origin '${origin}' not allowed`),
      false
    );
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  maxAge: 86400, // 24 hours
};

app.use(cors(corsConfig));
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
// (db-check diagnostic removed - restored to original state)

app.get("/trees", async (req, res) => {
  const trees = await prisma.tree.findMany();
  res.json(trees);
});

// Simple health check: verifies app is reachable and can query the DB.
// Use this from health checks or Vercel logs to get a quick status.
app.get("/api/health", async (req, res) => {
  try {
    // Quick and cheap check: run a simple raw query or connect.
    await prisma.$connect();
    // Optionally run a tiny query depending on the DB/provider
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: "connected" });
  } catch (err) {
    console.error("Health check failed:", err && err.stack ? err.stack : err);
    res
      .status(503)
      .json({ ok: false, error: err?.message || "DB connection failed" });
  }
});

app.use("/api/trees", treesRoute);
app.use("/api/treepictures", treePicturesRoute);
app.use("/api/roads", roadsRoute);
app.use("/api/roadpictures", roadPicturesRoute);
app.use("/api/register", registerRoute);
app.use("/api/login", loginRoute);
app.use("/api/reports", reportsRoute);
app.use("/api/reportpictures", reportPicturesRoute);
app.use("/api/profile", profileRoute);

// Generic error handler so Express returns JSON and we log the stack to Vercel.
app.use((err, req, res, next) => {
  try {
    // If this is a Prisma error, log helpful fields so Vercel logs show the cause.
    const prismaDetails =
      err && err.name && err.name.startsWith("Prisma")
        ? formatPrismaError(err)
        : null;
    if (prismaDetails) {
      console.error("Prisma error:", prismaDetails);
    }
    console.error(
      "Unhandled error in request:",
      err && err.stack ? err.stack : err
    );
  } catch (e) {
    console.error("Error logging failed:", e);
  }
  res.status(500).json({ error: err?.message || "Internal Server Error" });
});

// Export a serverless handler for platforms like Vercel that expect a function entry.
// Export the handler as the default export so Vercel's Node builder picks it up
// reliably, and also expose it as a named export for tests or local wrappers.
const handler = serverless(app);
// Also export the raw Express app for local debugging / wrappers so we can
// run it directly without going through serverless-http (which expects
// full lambda event objects).
export { app };
export default handler;
export { handler };
