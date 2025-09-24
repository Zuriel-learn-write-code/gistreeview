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

const app = express();
const prisma = new PrismaClient();

import path from "path";
app.use(cors());
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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
