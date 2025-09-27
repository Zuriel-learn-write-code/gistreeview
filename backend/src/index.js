import 'dotenv/config';
import express from "express";
import { PrismaClient } from "@prisma/client";
import registerRoute from "./routes/register.js";
import loginRoute from "./routes/login.js";
import profileRoute from "./routes/profile.js";
import treesRoute from "./routes/trees.js";
import treePicturesRoute from "./routes/treepictures.js";
import roadsRoute from "./routes/roads.js";
import roadPicturesRoute from "./routes/roadpictures.js";

import reportsRoute from "./routes/reports.js";
import reportPicturesRoute from "./routes/reportpictures.js";
import cors from "cors";
import dns from 'dns';
import net from 'net';

const app = express();
const prisma = new PrismaClient();

import path from "path";

// Configure CORS origins via env var for easier deployment configuration on Vercel.
const defaultOrigins = [
  "http://localhost:4000",
  "http://localhost:5173",
  "https://gistreeview.vercel.app"
];

let allowedOrigins = defaultOrigins;
if (process.env.ALLOWED_ORIGINS) {
  allowedOrigins = process.env.ALLOWED_ORIGINS.split(",").map(s => s.trim()).filter(Boolean);
}

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
// Serve uploads statically
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "public", "uploads"))
);

app.get("/", (req, res) => {
  res.json({ message: "Backend API is running" });
});

// Diagnostic endpoint for local debugging (same as the serverless /api/db-check)
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

    let ipAddr;
    try {
      const lookup = await dns.promises.lookup(host);
      ipAddr = lookup && lookup.address;
    } catch (e) {
      return res.status(500).json({ step: 'dns', host, error: String(e && e.message ? e.message : e) });
    }

    try {
      await new Promise((resolve, reject) => {
        const sock = new net.Socket();
        const timer = setTimeout(() => { sock.destroy(); reject(new Error('tcp timeout')); }, 5000);
        sock.once('error', (err) => { clearTimeout(timer); reject(err); });
        sock.connect(port, ipAddr, () => { clearTimeout(timer); sock.end(); resolve(); });
      });
    } catch (e) {
      return res.status(500).json({ step: 'tcp', host, ip: ipAddr, port, error: String(e && e.message ? e.message : e) });
    }

    try {
      await prisma.$connect();
      await prisma.$disconnect();
    } catch (e) {
      return res.status(500).json({ step: 'prisma', host, ip: ipAddr, port, error: String(e && e.message ? e.message : e) });
    }

    res.json({ ok: true, host, ip: ipAddr, port });
  } catch (error) {
    res.status(500).json({ error: String(error && error.message ? error.message : error) });
  }
});

// Example: get all trees (assuming model Tree exists)
app.get("/trees", async (req, res) => {
  const trees = await prisma.tree.findMany();
  res.json(trees);
});

// Trees route
app.use("/api/trees", treesRoute);
// TreePictures route
app.use("/api/treepictures", treePicturesRoute);
// Roads route
app.use("/api/roads", roadsRoute);
// RoadPictures route
app.use("/api/roadpictures", roadPicturesRoute);
// Agar upload gambar jalan bisa pakai /api/roads/:id/pictures
app.use("/api/roads", roadPicturesRoute);
// Register route
app.use("/api/register", registerRoute);
// Login route
app.use("/api/login", loginRoute);
// Profile route

// Reports route
app.use("/api/reports", reportsRoute);
app.use("/api/reportpictures", reportPicturesRoute);
app.use("/api/profile", profileRoute);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
