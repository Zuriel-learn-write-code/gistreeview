// Load .env.development on dev, .env on prod
import dotenv from 'dotenv';
if (process.env.NODE_ENV === 'development' || process.argv.some(arg => arg.includes('nodemon'))) {
  dotenv.config({ path: '.env.development' });
} else {
  dotenv.config();
}
import express from "express";
import prisma from "./prismaClient.js";
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

const app = express();

import path from "path";
import serverless from 'serverless-http';

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
// Only call listen when this file is run directly (node src/index.js) or in dev.
if (process.env.NODE_ENV === 'development' || process.argv.some(arg => arg.includes('nodemon')) || process.env.FORCE_LISTEN === 'true') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export serverless handler (works with Vercel / AWS Lambda / etc.)
export const handler = serverless(app);
export default handler;
