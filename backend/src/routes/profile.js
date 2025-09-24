import express from "express";
import prisma from "../prismaClient.js";
import { uploadAvatar } from "../middleware/upload.js";


const router = express.Router();

// Get all users
router.get("/all", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        phone: true,
        bio: true,
        address: true,
        country: true,
        city: true,
        postalcode: true,
        province: true,
        role: true,
        userpic: true,
      },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get user profile by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        phone: true,
        bio: true,
        address: true,
        country: true,
        city: true,
        postalcode: true,
        province: true,
        role: true,
        userpic: true,
      },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update user profile by id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    const user = await prisma.user.update({
      where: { id },
      data,
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

// Delete user by id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Gagal menghapus user" });
  }
});

export default router;

// Upload avatar (userpic) for user

router.patch("/:id/avatar", uploadAvatar.single("avatar"), async (req, res) => {
  const { id } = req.params;
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  // Jika upload ke Cloudinary, gunakan url dari req.file.path atau req.file.url
  const userpicUrl = req.file.path || req.file.url || req.file.filename;
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { userpic: userpicUrl },
    });
    res.json({ userpic: user.userpic });
  } catch (err) {
    res.status(500).json({ error: "Failed to update avatar" });
  }
});
