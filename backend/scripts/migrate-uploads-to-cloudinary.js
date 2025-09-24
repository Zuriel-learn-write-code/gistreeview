import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

const prisma = new PrismaClient();

// Konfigurasi Cloudinary dari .env

console.log("CLOUDINARY CONFIG:", {
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? "***" : undefined,
});
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadDirs = [
  path.join(process.cwd(), "public", "uploads"),
  path.join(process.cwd(), "public", "uploads", "report"),
  path.join(process.cwd(), "public", "uploads", "road"),
  path.join(process.cwd(), "public", "uploads", "tree"),
];

async function uploadToCloudinary(localPath, publicId) {
  return cloudinary.uploader.upload(localPath, {
    public_id: publicId,
    folder: "uploads",
    overwrite: true,
    resource_type: "image",
  });
}

async function main() {
  // Ambil semua url gambar dari database
  const treePics = await prisma.treePicture.findMany({
    select: { id: true, url: true },
  });
  const roadPics = await prisma.roadPicture.findMany({
    select: { id: true, url: true },
  });
  const reportPics = await prisma.reportPicture.findMany({
    select: { id: true, url: true },
  });

  // Gabungkan semua data
  const allPics = [
    ...treePics.map((x) => ({ ...x, type: "treePicture" })),
    ...roadPics.map((x) => ({ ...x, type: "roadPicture" })),
    ...reportPics.map((x) => ({ ...x, type: "reportPicture" })),
  ];

  for (const pic of allPics) {
    // Cek apakah url mengarah ke file lokal
    if (pic.url && pic.url.startsWith("/uploads")) {
      // Cari file lokal
      const localPath = path.join(
        process.cwd(),
        "public",
        pic.url.replace("/uploads", "uploads")
      );
      if (fs.existsSync(localPath)) {
        try {
          // Upload ke Cloudinary dengan nama file yang sama
          const fileName = path.basename(localPath);
          const result = await uploadToCloudinary(localPath, fileName);
          if (!result || !result.secure_url) {
            throw new Error(
              "Cloudinary upload response tidak valid: " +
                JSON.stringify(result)
            );
          }
          // Update url di database
          const newUrl = result.secure_url;
          if (pic.type === "treePicture") {
            await prisma.treePicture.update({
              where: { id: pic.id },
              data: { url: newUrl },
            });
          } else if (pic.type === "roadPicture") {
            await prisma.roadPicture.update({
              where: { id: pic.id },
              data: { url: newUrl },
            });
          } else if (pic.type === "reportPicture") {
            await prisma.reportPicture.update({
              where: { id: pic.id },
              data: { url: newUrl },
            });
          }
          console.log(`Berhasil upload dan update: ${localPath} -> ${newUrl}`);
        } catch (err) {
          console.error(`Gagal upload: ${localPath}`, err);
        }
      } else {
        console.warn(`File tidak ditemukan: ${localPath}`);
      }
    }
  }
  await prisma.$disconnect();
}

main();
