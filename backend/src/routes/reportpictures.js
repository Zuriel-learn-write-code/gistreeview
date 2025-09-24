import express from "express";
import prisma from "../prismaClient.js";
import { uploadReportPicture } from "../middleware/upload.js";

const router = express.Router();

// GET all report pictures
router.get("/", async (req, res) => {
  try {
    const reportPictures = await prisma.reportPicture.findMany();
    res.json(reportPictures);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch report pictures" });
  }
});

export default router;
