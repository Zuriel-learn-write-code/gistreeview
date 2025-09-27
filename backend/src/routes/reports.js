import express from "express";
import prisma from "../prismaClient.js";
import { uploadReportPicture } from "../middleware/upload.js";
import path from "path";
import fs from "fs";

const router = express.Router();

// GET /api/reports/status/:status - get reports by status
router.get("/status/:status", async (req, res) => {
  try {
    const { status } = req.params;
    const reports = await prisma.report.findMany({
      where: { status },
      include: {
        user: true,
        tree: { include: { road: true } },
        reportPictures: true,
        verifiedBy: true,
        resolvedBy: true,
      },
      orderBy: { timestamp: "desc" },
    });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reports by status" });
  }
});
// POST /api/reports/:id/pictures - upload gambar report (reportpictures)
router.post(
  "/:id/pictures",
  uploadReportPicture.array("picture", 10),
  async (req, res) => {
    try {
      const reportId = req.params.id;
      if (!req.files || req.files.length === 0)
        return res.status(400).json({ error: "No files uploaded" });
      const reportDir = path.join(process.cwd(), "public", "uploads", "report");
      if (!fs.existsSync(reportDir))
        fs.mkdirSync(reportDir, { recursive: true });
      const files = req.files;
      const createdPictures = [];
      for (const file of files) {
        // Simpan URL Cloudinary
        const url = file.path || file.url || file.filename;
        const pict = await prisma.reportPicture.create({
          data: {
            url,
            reportId,
          },
        });
        createdPictures.push(pict);
      }
      res.json(createdPictures);
    } catch (err) {
      res.status(500).json({ error: "Gagal upload gambar laporan" });
    }
  }
);

// GET /api/reports - get all reports
router.get("/", async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        user: true,
        tree: { include: { road: true } },
        reportPictures: true,
        verifiedBy: true,
        resolvedBy: true,
      },
    });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// POST /api/reports - create a new report
router.post("/", async (req, res) => {
  try {
    const report = await prisma.report.create({
      data: req.body,
    });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: "Failed to create report" });
  }
});

// PUT /api/reports/:id - update a report
router.put("/:id", async (req, res) => {
  try {
    // Validasi status
    if (
      req.body.status &&
      !["pending", "approved", "rejected", "resolved"].includes(req.body.status)
    ) {
      return res.status(400).json({
        error:
          "Invalid status. Must be one of: pending, approved, rejected, resolved",
      });
    }

    // Validate references before update
    if (req.body.verifiedById) {
      const verifier = await prisma.user.findUnique({
        where: { id: req.body.verifiedById },
      });
      if (!verifier) {
        return res.status(400).json({ error: "Verifier not found" });
      }
    }

    if (req.body.resolvedById) {
      const resolver = await prisma.user.findUnique({
        where: { id: req.body.resolvedById },
      });
      if (!resolver) {
        return res.status(400).json({ error: "Resolver not found" });
      }
    }

    const report = await prisma.report.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        user: true,
        tree: true,
        verifiedBy: true,
        resolvedBy: true,
      },
    });
    res.json(report);
  } catch (err) {
    console.error("Error updating report:", err);
    res.status(500).json({
      error: "Failed to update report",
      details: err.message,
    });
  }
});

// DELETE /api/reports/:id - delete a report
router.delete("/:id", async (req, res) => {
  try {
    await prisma.report.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete report" });
  }
});

export default router;
