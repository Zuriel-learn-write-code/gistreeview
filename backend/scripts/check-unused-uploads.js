import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// Folder upload lokal
const uploadDirs = [
  path.join(process.cwd(), "public", "uploads"),
  path.join(process.cwd(), "public", "uploads", "report"),
  path.join(process.cwd(), "public", "uploads", "road"),
  path.join(process.cwd(), "public", "uploads", "tree"),
];

async function main() {
  // Ambil semua url gambar dari database
  const treePics = await prisma.treePicture.findMany({ select: { url: true } });
  const roadPics = await prisma.roadPicture.findMany({ select: { url: true } });
  const reportPics = await prisma.reportPicture.findMany({
    select: { url: true },
  });
  const allUrls = [
    ...treePics.map((x) => x.url),
    ...roadPics.map((x) => x.url),
    ...reportPics.map((x) => x.url),
  ];

  // Cek file di folder upload
  for (const dir of uploadDirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      // Lewati folder
      if (fs.lstatSync(filePath).isDirectory()) continue;
      // Cek apakah file masih dipakai di database
      const isUsed = allUrls.some((url) => url.includes(file));
      if (!isUsed) {
        console.log("Menghapus file tidak dipakai:", filePath);
        fs.unlinkSync(filePath); // Hapus otomatis
      }
    }
  }
  await prisma.$disconnect();
}

main();
