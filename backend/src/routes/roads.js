import express from "express";
import prisma from "../prismaClient.js";
const router = express.Router();

// Palette mapping - must match frontend `PALETTE` order
const PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'
];

function hexToRoadColorEnum(hex) {
  if (!hex) return undefined;
  if (typeof hex === 'string' && hex.startsWith('palette_')) return hex; // already enum
  const idx = PALETTE.findIndex((h) => h.toLowerCase() === String(hex).toLowerCase());
  if (idx === -1) return undefined;
  return `palette_${String(idx + 1).padStart(2, '0')}`; // palette_01 ... palette_10
}

function enumToHex(colorEnum) {
  if (!colorEnum) return null;
  if (typeof colorEnum === 'string' && colorEnum.startsWith('palette_')) {
    const idx = parseInt(colorEnum.split('_')[1], 10) - 1;
    if (idx >= 0 && idx < PALETTE.length) return PALETTE[idx];
  }
  return null;
}

// GET /api/roads
router.get("/", async (req, res) => {
  try {
    const roads = await prisma.road.findMany({ include: { roadPictures: true, trees: true } });
    // include color_hex for frontend convenience
    const withHex = roads.map((r) => ({
      ...r,
      color_hex: enumToHex(r.color),
      status: r.status || 'unknown',
    }));
    res.json(withHex);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch roads" });
  }
});

// GET /api/roads/geojson
router.get("/geojson", async (req, res) => {
  try {
    // Get filter parameters from query string
    // Accept status as comma-separated (status=primary,unknown) or single string
    let statusArr = [];
    if (req.query.status) {
      if (Array.isArray(req.query.status)) {
        statusArr = req.query.status;
      } else if (typeof req.query.status === 'string') {
        statusArr = req.query.status.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    const where = {
      geometry: { not: null },
      ...(statusArr.length > 0 ? { status: { in: statusArr } } : {})
    };

    const roads = await prisma.road.findMany({
      where,
      select: {
        id: true,
        nameroad: true,
        description: true,
        color: true,
        status: true,
        geometry: true,
        roadPictures: {
          select: {
            id: true,
            url: true
          }
        },
        _count: {
          select: { trees: true }
        }
      }
    });

    if (!roads?.length) {
      return res.json({ type: 'FeatureCollection', features: [] });
    }


    const features = roads.map((r) => {
      let geometry = null;
      try {
        geometry = typeof r.geometry === 'string' ? JSON.parse(r.geometry) : r.geometry;
      } catch (_e) {
        console.warn('Failed to parse geometry for road:', r.id, _e);
        geometry = null;
      }

      return {
        type: 'Feature',
        properties: {
          id: r.id,
          uuid: String(r.id).toLowerCase(),
          nameroad: r.nameroad,
          description: r.description,
          color: r.color || null,
          color_hex: enumToHex(r.color) || null,
          status: r.status || 'unknown',
          treesCount: r._count?.trees || 0,
          roadPictures: r.roadPictures || [],
        },
        geometry,
      };
    });

    res.json({ 
      type: 'FeatureCollection', 
      features: features.filter(f => f.geometry) // Only include features with valid geometry
    });
  } catch (error) {
    console.error('Error in /geojson:', error);
    res.status(500).json({ error: 'Failed to fetch roads' });
  }
});

// GET /api/roads/with-treecount
router.get('/with-treecount', async (req, res) => {
  try {
    // Get filter parameters from query string
    // Accept status as comma-separated (status=primary,unknown) or single string
    let statusArr = [];
    if (req.query.status) {
      if (Array.isArray(req.query.status)) {
        statusArr = req.query.status;
      } else if (typeof req.query.status === 'string') {
        statusArr = req.query.status.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    const where = {
      geometry: { not: null },
      ...(statusArr.length > 0 ? { status: { in: statusArr } } : {})
    };

    const roads = await prisma.road.findMany({
      where,
      select: {
        id: true,
        nameroad: true,
        description: true,
        color: true,
        status: true,
        geometry: true,
        roadPictures: {
          select: {
            id: true,
            url: true
          }
        },
        _count: {
          select: { trees: true }
        }
      }
    });

    if (!roads?.length) {
      return res.json({ type: 'FeatureCollection', features: [] });
    }


    const features = roads.map((r) => {
      let geometry = null;
      try {
        geometry = typeof r.geometry === 'string' ? JSON.parse(r.geometry) : r.geometry;
      } catch (_e) {
        console.warn('Failed to parse geometry for road:', r.id, _e);
        geometry = null;
      }

      return {
        type: 'Feature',
        properties: {
          id: r.id,
          uuid: String(r.id).toLowerCase(),
          nameroad: r.nameroad,
          description: r.description,
          color: r.color || null,
          color_hex: enumToHex(r.color) || null,
          status: r.status || 'unknown',
          treesCount: r._count?.trees || 0,
          roadPictures: r.roadPictures || [],
        },
        geometry,
      };
    });

    res.json({ 
      type: 'FeatureCollection', 
      features: features.filter(f => f.geometry)
    });
  } catch (error) {
    console.error('Error in /with-treecount:', error);
    res.status(500).json({ error: 'Failed to fetch roads with tree counts' });
  }
});

// POST /api/roads
router.post("/", async (req, res) => {
  try {
    const road = await prisma.road.create({ data: req.body });
    res.json(road);
  } catch (error) {
    res.status(500).json({ error: "Failed to create road" });
  }
});

// PUT /api/roads/:id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Whitelist fields we allow to be updated from frontend
    const payload = {};
    if (typeof req.body.nameroad === 'string') payload.nameroad = req.body.nameroad;
    if (typeof req.body.description === 'string') payload.description = req.body.description;
    // Validate status against allowed enum values
    if (typeof req.body.status === 'string') {
      const allowed = ['primary', 'secondary', 'tertiary', 'unknown'];
      if (!allowed.includes(req.body.status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      payload.status = req.body.status;
    }
    // map color hex to enum if provided
    if (req.body.color) {
      const mapped = hexToRoadColorEnum(req.body.color);
      if (mapped) payload.color = mapped;
    }

    const road = await prisma.road.update({ where: { id }, data: payload });
    res.json(road);
  } catch (error) {
    res.status(500).json({ error: "Failed to update road" });
  }
});

// DELETE /api/roads/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.road.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(404).json({ error: "Road not found" });
  }
});

export default router;