import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

// Simple .env loader fallback (reads backend/.env)
function loadDotenv(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2] || "";
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      process.env[key] = val;
    }
  } catch (err) {
    // ignore
  }
}

loadDotenv(path.join(process.cwd(), ".env"));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function main() {
  try {
    // 1x1 transparent PNG base64
    const dataUri =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "road",
      public_id: "placeholder_for_road_folder",
      overwrite: true,
      resource_type: "image",
    });
    console.log("Created placeholder in road folder:", result.secure_url);
    // Keep the placeholder so the folder remains visible in Media Library.
  } catch (err) {
    console.error("Failed to create road folder:", err);
    process.exit(1);
  }
}

main();
