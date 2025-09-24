import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const roadDir = path.join(process.cwd(), "public", "uploads", "road");

async function uploadFile(filePath, publicId) {
  return cloudinary.uploader.upload(filePath, {
    public_id: publicId,
    folder: "road",
    overwrite: true,
    resource_type: "image",
  });
}

async function main() {
  if (!fs.existsSync(roadDir)) {
    console.error("Folder not found:", roadDir);
    process.exit(1);
  }

  const files = fs
    .readdirSync(roadDir)
    .filter((f) => fs.lstatSync(path.join(roadDir, f)).isFile());
  console.log("Found", files.length, "files in", roadDir);

  for (const file of files) {
    const localPath = path.join(roadDir, file);
    try {
      const publicId = path.parse(file).name;
      console.log("Uploading", localPath, "as", publicId);
      const res = await uploadFile(localPath, publicId);
      if (!res || !res.secure_url) {
        console.error("Upload returned no secure_url for", file, res);
        continue;
      }
      const cloudUrl = res.secure_url;

      // Update any roadPicture entries that reference this local filename
      const updated = await prisma.roadPicture.updateMany({
        where: { url: { contains: file } },
        data: { url: cloudUrl },
      });

      console.log(
        `Uploaded ${file} -> ${cloudUrl}. DB updated: ${updated.count}`
      );
    } catch (err) {
      console.error("Failed uploading", file, err);
    }
  }

  await prisma.$disconnect();
}

main();
