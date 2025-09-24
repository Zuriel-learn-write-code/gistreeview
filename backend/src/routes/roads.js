import express from "express";
import { PrismaClient, Prisma } from "@prisma/client";
const router = express.Router();
const prisma = new PrismaClient();

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
    const withHex = roads.map((r) => ({ ...r, color_hex: enumToHex(r.color) }));
    res.json(withHex);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch roads" });
  }
});

// GET /api/roads/geojson
// Returns roads as a GeoJSON FeatureCollection. Prefer PostGIS `geom` (ST_AsGeoJSON) but
// fall back to the JSON `geometry` column if `geom` is not present. This allows recent
// seed inserts (which write to `geometry` JSON) to be visible without requiring a separate
// geom-population migration step.
router.get("/geojson", async (req, res) => {
  try {
    // Try to retrieve ST_AsGeoJSON(geom) (PostGIS) and the JSON geometry column.
    // If the raw query fails (e.g. PostGIS not installed), fall back to reading the
    // JSON `geometry` column via Prisma so we return a safe FeatureCollection.
    let rows;
    try {
      rows = await prisma.$queryRaw`
        SELECT id, nameroad, description, color, status, ST_AsGeoJSON(geom) AS geom_json, geometry::text AS geometry_json
        FROM "road"
        WHERE geom IS NOT NULL OR geometry IS NOT NULL
      `;
    } catch (rawErr) {
      console.warn('roads.geojson: raw query failed, falling back to prisma.findMany:', rawErr && rawErr.message ? rawErr.message : rawErr);
      // Fallback: use Prisma to read the JSON geometry column (if present).
  const fallback = await prisma.road.findMany({ where: { geometry: { not: null } }, select: { id: true, nameroad: true, description: true, color: true, status: true, geometry: true } });
  rows = fallback.map((r) => ({ id: r.id, nameroad: r.nameroad, description: r.description, color: r.color, status: r.status, geom_json: null, geometry_json: JSON.stringify(r.geometry) }));
    }

    // Fetch roadPictures and trees for all ids in a single query to avoid N+1
    const ids = rows.map((r) => r.id);
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.json({ type: 'FeatureCollection', features: [] });
    }
    // Fetch roadPictures and trees for all ids in a single query to avoid N+1
    const extras = await prisma.road.findMany({ where: { id: { in: ids } }, include: { roadPictures: true, trees: true } });
    const extrasMap = new Map(extras.map((e) => [e.id, e]));

    const features = rows.map((r) => {
      let geometry = null;
      try {
        if (r.geom_json) {
          geometry = typeof r.geom_json === 'string' ? JSON.parse(r.geom_json) : r.geom_json;
        } else if (r.geometry_json) {
          // geometry_json may be a JSON string; parse if needed
          geometry = typeof r.geometry_json === 'string' ? JSON.parse(r.geometry_json) : r.geometry_json;
        }
      } catch (_e) {
        geometry = null;
      }

  // attach extras if present
  const extra = extrasMap.get(r.id) || { roadPictures: [], trees: [] };
  return {
        type: 'Feature',
        properties: {
          id: r.id,
          uuid: String(r.id).toLowerCase(),
          nameroad: r.nameroad,
          description: r.description,
          color: r.color || null,
          color_hex: enumToHex(r.color) || null,
          status: r.status || null,
          treesCount: Array.isArray(extra.trees) ? extra.trees.length : 0,
          roadPictures: Array.isArray(extra.roadPictures) ? extra.roadPictures.map((p) => ({ id: p.id, url: p.url })) : [],
        },
        geometry,
      };
    });

    res.json({ type: 'FeatureCollection', features });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch roads as GeoJSON' });
  }
});

// GET /api/roads/with-treecount
// Returns roads as GeoJSON with an aggregated treesCount (number of trees attached to each road)
router.get('/with-treecount', async (req, res) => {
  try {
    // Get road geometries. Try raw PostGIS ST_AsGeoJSON first; fall back to reading
    // `geometry` JSON column if the raw query fails (PostGIS missing or other SQL error).
    let rows;
    try {
      rows = await prisma.$queryRaw`
        SELECT id, nameroad, description, color, status, ST_AsGeoJSON(geom) AS geom_json, geometry::text AS geometry_json
        FROM "road"
        WHERE geom IS NOT NULL OR geometry IS NOT NULL
      `;
    } catch (rawErr) {
      console.warn('roads.with-treecount: raw query failed, falling back to prisma.findMany:', rawErr && rawErr.message ? rawErr.message : rawErr);
  const fallback = await prisma.road.findMany({ where: { geometry: { not: null } }, select: { id: true, nameroad: true, description: true, color: true, status: true, geometry: true } });
  rows = fallback.map((r) => ({ id: r.id, nameroad: r.nameroad, description: r.description, color: r.color, status: r.status, geom_json: null, geometry_json: JSON.stringify(r.geometry) }));
    }

    const ids = rows.map((r) => r.id);
    // If there are no road rows, return an empty FeatureCollection to avoid running
    // subsequent queries that may produce invalid SQL (e.g. IN () ).
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.json({ type: 'FeatureCollection', features: [] });
    }

    // fetch pictures in batch
    const extras = await prisma.road.findMany({ where: { id: { in: ids } }, include: { roadPictures: true } });
    const extrasMap = new Map(extras.map((e) => [e.id, e]));

    // Aggregate tree counts per road in a single query
    let countsRaw = [];
    if (ids.length > 0) {
      // Use a safe join of ids for the raw query
      countsRaw = await prisma.$queryRaw`
        SELECT "roadId" as road_id, COUNT(*) as cnt
        FROM "tree"
        WHERE "roadId" IN (${Prisma.join(ids)})
        GROUP BY "roadId"
      `;
    }
    const countsMap = new Map();
    if (Array.isArray(countsRaw)) {
      for (const r of countsRaw) {
        countsMap.set(String(r.road_id), Number(r.cnt) || 0);
      }
    }

    const features = rows.map((r) => {
      let geometry = null;
      try {
        if (r.geom_json) {
          geometry = typeof r.geom_json === 'string' ? JSON.parse(r.geom_json) : r.geom_json;
        } else if (r.geometry_json) {
          geometry = typeof r.geometry_json === 'string' ? JSON.parse(r.geometry_json) : r.geometry_json;
        }
      } catch (_e) { geometry = null; }

  const extra = extrasMap.get(r.id) || { roadPictures: [] };
  const cnt = countsMap.has(String(r.id)) ? countsMap.get(String(r.id)) : 0;

      return {
        type: 'Feature',
        properties: {
          id: r.id,
          uuid: String(r.id).toLowerCase(),
          nameroad: r.nameroad,
          description: r.description,
          color: r.color || null,
          color_hex: enumToHex(r.color) || null,
          status: r.status || null,
          treesCount: cnt,
          roadPictures: Array.isArray(extra.roadPictures) ? extra.roadPictures.map((p) => ({ id: p.id, url: p.url })) : [],
        },
        geometry,
      };
    });

    res.json({ type: 'FeatureCollection', features });
  } catch (error) {
    console.error(error);
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
