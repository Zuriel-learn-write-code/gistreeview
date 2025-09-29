import express from "express";
import prisma from "../prismaClient.js";
import { uploadTreePicture } from "../middleware/upload.js";
const router = express.Router();

// GET /api/treepictures
router.get("/", async (req, res) => {
  try {
    const treePictures = await prisma.treePicture.findMany();
    res.json(treePictures);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tree pictures" });
  }
});

export default router;

// DELETE /api/treepictures/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.treePicture.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(404).json({ error: "Tree picture not found" });
  }
});

// POST /api/treepictures/:id - upload gambar pohon
router.post("/:id", uploadTreePicture.single("picture"), async (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const url = req.file.path || req.file.url || req.file.filename;
  try {
    const pict = await prisma.treePicture.create({
      data: {
        url,
        treeId: id,
      },
    });
    res.json(pict);
  } catch (err) {
    res.status(500).json({ error: "Gagal upload gambar pohon" });
  }
});
