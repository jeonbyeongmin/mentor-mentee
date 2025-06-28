import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { run, get } from "../database/init";
import { User, JWTPayload } from "../types";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Signup
router.post("/signup", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;

    // Validation
    if (!email || !password || !role) {
      res.status(400).json({ error: "Email, password, and role are required" });
      return;
    }

    if (role !== "mentor" && role !== "mentee") {
      res.status(400).json({ error: "Role must be either mentor or mentee" });
      return;
    }

    // Check if user already exists
    const existingUser = await get("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (existingUser) {
      res.status(400).json({ error: "User already exists" });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const result = await run(
      "INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)",
      [email, hashedPassword, name || null, role]
    );

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    // Find user
    const user = (await get("SELECT * FROM users WHERE email = ?", [
      email,
    ])) as User;
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Generate JWT token
    const now = Math.floor(Date.now() / 1000);
    const payload: JWTPayload = {
      iss: "mentor-mentee-app",
      sub: user.id.toString(),
      aud: "mentor-mentee-app",
      exp: now + 3600, // 1 hour
      nbf: now,
      iat: now,
      jti: uuidv4(),
      name: user.name,
      email: user.email,
      role: user.role,
      id: user.id,
    };

    const token = jwt.sign(payload, JWT_SECRET);

    res.json({ token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
