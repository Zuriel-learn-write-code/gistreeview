import 'dotenv/config';
import express from "express";
import cors from "cors";
import path from "path";
import serverless from "serverless-http";

const app = express();

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
// File uploads are handled via Cloudinary
// Lightweight health endpoint to help measure cold-starts and verify CORS quickly.
// This intentionally avoids Prisma/database access so it should return fast.
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

// Dynamically import and mount route modules after registering the quick ping route.
// This allows /api/ping to respond quickly even if route modules (which may
// initialize Prisma or other network resources) are slow or failing.
(async () => {
  try {
    const [
      { default: registerRoute },
      { default: loginRoute },
      { default: profileRoute },
      { default: treesRoute },
      { default: treePicturesRoute },
      { default: roadsRoute },
      { default: roadPicturesRoute },
      { default: reportsRoute },
      { default: reportPicturesRoute }
    ] = await Promise.all([
      import('../src/routes/register.js'),
      import('../src/routes/login.js'),
      import('../src/routes/profile.js'),
      import('../src/routes/trees.js'),
      import('../src/routes/treepictures.js'),
      import('../src/routes/roads.js'),
      import('../src/routes/roadpictures.js'),
      import('../src/routes/reports.js'),
      import('../src/routes/reportpictures.js')
    ]);

    app.use('/api/trees', treesRoute);
    app.use('/api/treepictures', treePicturesRoute);
    app.use('/api/roads', roadsRoute);
    app.use('/api/roadpictures', roadPicturesRoute);
    app.use('/api/register', registerRoute);
    app.use('/api/login', loginRoute);
    app.use('/api/reports', reportsRoute);
    app.use('/api/reportpictures', reportPicturesRoute);
    app.use('/api/profile', profileRoute);
  } catch (e) {
    console.error('Failed to dynamically load routes:', e);
  }
})();

app.get("/", (req, res) => {
  res.json({ message: "Backend API is running" });
});

app.get("/api/trees/all", async (req, res) => {
  const trees = await prisma.tree.findMany();
  res.json(trees);
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

// Export a serverless handler for platforms like Vercel that expect a function entry.
// This keeps local usage (importing the app) intact while also providing a handler
// that wraps the Express app for per-invocation execution.
export const handler = serverless(app);
// Export default for compatibility with some Vercel entrypoint expectations
export default handler;
