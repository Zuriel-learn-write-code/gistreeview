import express from "express";
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

const app = express();
const prisma = new PrismaClient();

app.use(cors({
  origin: [
    "http://localhost:4000",
    "http://localhost:5173",
    "https://gistreeview.vercel.app"
  ]
}));
app.use(express.json());
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "public", "uploads"))
);

app.get("/", (req, res) => {
  res.json({ message: "Backend API is running" });
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
