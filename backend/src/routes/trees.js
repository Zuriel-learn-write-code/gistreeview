import express from "express";
import { PrismaClient } from "@prisma/client";
import { uploadTreePicture } from "../middleware/upload.js";
import path from "path";
import fs from "fs";
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/treepictures - ambil semua gambar pohon
router.get("/treepictures", async (req, res) => {
  try {
    const pictures = await prisma.treePicture.findMany();
    res.json(pictures);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil data gambar pohon" });
  }
});
// POST /api/trees/:id/pictures - upload gambar pohon
// Multi-upload gambar pohon
router.post(
  "/:id/pictures",
  uploadTreePicture.array("picture", 10),
  async (req, res) => {
    try {
      const treeId = req.params.id;
      console.log(`POST /api/trees/${treeId}/pictures called. req.files present?`, Array.isArray(req.files));
      if (!req.files || req.files.length === 0) {
        console.warn(`No files uploaded for tree ${treeId}`);
        return res.status(400).json({ error: "No files uploaded" });
      }
      const treeDir = path.join(process.cwd(), "public", "uploads", "tree");
      if (!fs.existsSync(treeDir)) fs.mkdirSync(treeDir, { recursive: true });
      const files = req.files;
      const createdPictures = [];
      for (const file of files) {
        // If multer saved a local temp file, move it to public/uploads/tree
        const oldPath = file.path;
        const newPath = path.join(treeDir, file.filename || (file.originalname || `upload-${Date.now()}`));
        try {
          if (oldPath && typeof oldPath === 'string' && fs.existsSync(oldPath)) {
            try { fs.renameSync(oldPath, newPath); }
            catch (e) { console.warn('Failed to move uploaded file to public folder, continuing with available URL', e); }
          }
        } catch (e) { /* ignore */ }
        // Determine URL to save (Cloudinary storage often provides file.url or file.secure_url)
        console.log('Processing uploaded file:', { originalname: file.originalname, filename: file.filename, path: file.path, url: file.url, secure_url: file.secure_url });
        const url = file.url || file.secure_url || file.path || file.filename;
        const pict = await prisma.treePicture.create({
          data: {
            url,
            treeId,
          },
        });
        createdPictures.push(pict);
      }
      res.json(createdPictures);
    } catch (err) {
      res.status(500).json({ error: "Gagal upload gambar pohon" });
    }
  }
);

// GET /api/trees - ambil semua data pohon
router.get("/", async (req, res) => {
  try {
    const trees = await prisma.tree.findMany({
      include: { road: true, treePictures: true },
    });
    res.json(trees);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil data pohon" });
  }
});

// GET /api/trees/:id - ambil satu pohon beserta relasinya
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const tree = await prisma.tree.findUnique({ where: { id }, include: { road: true, treePictures: true } });
    if (!tree) return res.status(404).json({ error: 'Tree not found' });
    res.json(tree);
  } catch (err) {
    console.error('Failed to fetch tree', err);
    res.status(500).json({ error: 'Gagal mengambil pohon' });
  }
});

// POST /api/trees - tambah pohon baru
router.post("/", async (req, res) => {
  try {
    const tree = await prisma.tree.create({ data: req.body, include: { road: true, treePictures: true } });
    res.json(tree);
  } catch (err) {
    res.status(500).json({ error: "Gagal menambah pohon" });
  }
});

// PUT /api/trees/:id - edit pohon
router.put("/:id", async (req, res) => {
  try {
    console.log(`PUT /api/trees/${req.params.id} - received body:`, req.body);
    const tree = await prisma.tree.update({
      where: { id: req.params.id },
      data: req.body,
      include: { road: true, treePictures: true },
    });
    res.json(tree);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengedit pohon" });
  }
});

// DELETE /api/trees/:id - hapus pohon
router.delete("/:id", async (req, res) => {
  try {
    await prisma.tree.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error("Error saat hapus pohon:", err);
    res.status(500).json({ error: "Gagal menghapus pohon" });
  }
});

// DELETE /api/trees/:treeId/pictures/:pictureId - hapus sebuah gambar pohon
router.delete('/:treeId/pictures/:pictureId', async (req, res) => {
  try {
    const { treeId, pictureId } = req.params;
    // find picture
    const pic = await prisma.treePicture.findUnique({ where: { id: pictureId } });
    if (!pic) return res.status(404).json({ error: 'Picture not found' });
    if (pic.treeId !== treeId) return res.status(400).json({ error: 'Picture does not belong to this tree' });
    // delete DB record
    await prisma.treePicture.delete({ where: { id: pictureId } });
    // attempt to remove local file if path looks local (public/uploads/tree)
    try {
      const url = pic.url || '';
      if (typeof url === 'string' && url.startsWith('public/uploads/tree')) {
        const fs = await import('fs');
        try { fs.unlinkSync(url); } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore */ }
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to delete tree picture', err);
    res.status(500).json({ error: 'Failed to delete picture' });
  }
});

export default router;
