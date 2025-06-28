import express, { Request, Response } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import { all } from "../database/init";
import { User } from "../types";

const router = express.Router();

// Get mentors list (mentee only)
router.get(
  "/mentors",
  authenticateToken,
  requireRole("mentee"),
  async (req: Request, res: Response) => {
    try {
      const { skill, order_by } = req.query;

      let query = 'SELECT * FROM users WHERE role = "mentor"';
      const params: any[] = [];

      // Filter by skill
      if (skill) {
        query += " AND tech_stacks LIKE ?";
        params.push(`%"${skill}"%`);
      }

      // Order by
      if (order_by === "name") {
        query += " ORDER BY name ASC";
      } else if (order_by === "skill") {
        query += " ORDER BY tech_stacks ASC";
      } else {
        query += " ORDER BY id ASC";
      }

      const mentors = (await all(query, params)) as User[];

      const mentorList = mentors.map((mentor) => ({
        id: mentor.id,
        email: mentor.email,
        role: mentor.role,
        profile: {
          name: mentor.name,
          bio: mentor.bio,
          imageUrl:
            mentor.profile_image ||
            "https://placehold.co/500x500.jpg?text=MENTOR",
          skills: mentor.tech_stacks ? JSON.parse(mentor.tech_stacks) : [],
        },
      }));

      res.json(mentorList);
    } catch (error) {
      console.error("Get mentors error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
