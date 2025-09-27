import express from "express";
import prisma from "../prismaClient.js";
import { uploadRoadPicture } from "../middleware/upload.js";

import path from "path";
import fs from "fs";
const router = express.Router();
// POST /api/roads/:id/pictures - upload gambar jalan
router.post(
  "/:id/pictures",
  uploadRoadPicture.array("picture", 10),
  async (req, res) => {
    try {
      const roadId = req.params.id;
      if (!req.files || req.files.length === 0)
        return res.status(400).json({ error: "No files uploaded" });
      const roadDir = path.join(process.cwd(), "public", "uploads", "road");
      if (!fs.existsSync(roadDir)) fs.mkdirSync(roadDir, { recursive: true });
      const files = req.files;
      const createdPictures = [];
      for (const file of files) {
        // Simpan URL Cloudinary
        const url = file.path || file.url || file.filename;
        const pict = await prisma.roadPicture.create({
          data: {
            url,
            roadId,
          },
        });
        createdPictures.push(pict);
      }
      res.json(createdPictures);
    } catch (err) {
      res.status(500).json({ error: "Gagal upload gambar jalan" });
    }
  }
);

// GET /api/roadpictures
router.get("/", async (req, res) => {
  try {
    const roadPictures = await prisma.roadPicture.findMany();
    res.json(roadPictures);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch road pictures" });
  }
});

// DELETE /api/roadpictures/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.roadPicture.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(404).json({ error: "Road picture not found" });
  }
});

export default router;
