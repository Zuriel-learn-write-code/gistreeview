import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Path to the JSON file
  const filePath = path.join(
    __dirname,
    "../../frontend/public/datamap/jalankotaambon.json"
  );
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  if (!Array.isArray(data.features)) {
    throw new Error("Invalid JSON structure: features array not found");
  }

  console.log("Menghapus semua data jalan yang ada di database...");
  // Delete all existing roads (and cascading pictures if DB is configured with cascade)
  await prisma.road.deleteMany({});

  const createOps = data.features.map((feature) => {
    const nameroad = feature.properties?.nameroad || null;
    const description = feature.properties?.description || null;
    const geometry = feature.geometry || null;
    return prisma.road.create({ data: { nameroad, description, geometry } });
  });

  console.log(`Membuat ${createOps.length} record jalan dari GeoJSON...`);
  // Run creates in a transaction for speed and atomicity
  await prisma.$transaction(createOps, { timeout: 120000 });

  console.log("Import selesai! Semua data jalan telah digantikan dengan GeoJSON dari file.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
