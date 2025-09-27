import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/register
router.post("/", async (req, res) => {
  const { firstname, lastname, email, password } = req.body;
  if (!firstname || !lastname || !email || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already registered." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        firstname,
        lastname,
        email,
        password: hashedPassword,
      },
    });
    res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    res.status(500).json({ error: "Registration failed." });
  }
});

export default router;
