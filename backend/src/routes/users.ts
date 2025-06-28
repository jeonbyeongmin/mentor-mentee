import express, { Request, Response } from "express";
import multer from "multer";
import { authenticateToken } from "../middleware/auth";
import { run, get } from "../database/init";
import { User } from "../types";

const router = express.Router();

// Configure multer for image uploads (for potential future use)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024, // 1MB
  },
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(new Error("Only .jpg and .png files are allowed"));
    }
  },
});

// Get my profile
router.get(
  "/me",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (await get("SELECT * FROM users WHERE id = ?", [
        req.user!.id,
      ])) as User;
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const profile: any = {
        name: user.name,
        bio: user.bio,
        imageUrl:
          user.profile_image ||
          (user.role === "mentor"
            ? "https://placehold.co/500x500.jpg?text=MENTOR"
            : "https://placehold.co/500x500.jpg?text=MENTEE"),
      };

      if (user.role === "mentor" && user.tech_stacks) {
        profile.skills = JSON.parse(user.tech_stacks);
      }

      res.json({
        id: user.id,
        email: user.email,
        role: user.role,
        profile,
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update profile
router.put(
  "/profile",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { id, name, role, bio, image, skills } = req.body;
      const userId = req.user!.id;

      // Validate that the request is for the authenticated user
      if (id && id !== userId) {
        res.status(400).json({ error: "Cannot update profile for different user" });
        return;
      }

      // Validate role matches authenticated user's role
      if (role && role !== req.user!.role) {
        res.status(400).json({ error: "Cannot change user role" });
        return;
      }

      let profileImageUrl = null;

      // Handle base64 image
      if (image) {
        try {
          // Remove data URL prefix if present (data:image/jpeg;base64,)
          const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
          const imageBuffer = Buffer.from(base64Data, 'base64');
          
          // Determine MIME type from original data URL or default to JPEG
          const mimeType = image.match(/^data:image\/([a-z]+);base64,/) 
            ? `image/${image.match(/^data:image\/([a-z]+);base64,/)[1]}`
            : 'image/jpeg';

          // Store image in database
          await run(
            "INSERT OR REPLACE INTO profile_images (user_id, filename, mime_type, size, data) VALUES (?, ?, ?, ?, ?)",
            [
              userId,
              `profile_${userId}.${mimeType.split('/')[1]}`,
              mimeType,
              imageBuffer.length,
              imageBuffer,
            ]
          );
          profileImageUrl = `/images/${req.user!.role}/${userId}`;
        } catch (error) {
          res.status(400).json({ error: "Invalid base64 image data" });
          return;
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (bio !== undefined) updateData.bio = bio;
      if (profileImageUrl) updateData.profile_image = profileImageUrl;

      if (req.user!.role === "mentor" && skills !== undefined) {
        updateData.tech_stacks = JSON.stringify(
          Array.isArray(skills) ? skills : [skills]
        );
      }

      // Build dynamic update query
      const fields = Object.keys(updateData);
      if (fields.length > 0) {
        const setClause = fields.map((field) => `${field} = ?`).join(", ");
        const values = fields.map((field) => updateData[field]);
        values.push(userId);

        await run(
          `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          values
        );
      }

      // Return updated profile
      const updatedUser = (await get("SELECT * FROM users WHERE id = ?", [
        userId,
      ])) as User;

      const profile: any = {
        name: updatedUser.name,
        bio: updatedUser.bio,
        imageUrl:
          updatedUser.profile_image ||
          (updatedUser.role === "mentor"
            ? "https://placehold.co/500x500.jpg?text=MENTOR"
            : "https://placehold.co/500x500.jpg?text=MENTEE"),
      };

      if (updatedUser.role === "mentor" && updatedUser.tech_stacks) {
        profile.skills = JSON.parse(updatedUser.tech_stacks);
      }

      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        profile,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get profile image
router.get(
  "/images/:role/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const image = await get(
        "SELECT * FROM profile_images WHERE user_id = ?",
        [id]
      );

      if (!image) {
        // Redirect to default image
        const role = req.params.role;
        const defaultUrl =
          role === "mentor"
            ? "https://placehold.co/500x500.jpg?text=MENTOR"
            : "https://placehold.co/500x500.jpg?text=MENTEE";
        return res.redirect(defaultUrl);
      }

      res.set({
        "Content-Type": image.mime_type,
        "Content-Length": image.size,
      });
      res.send(image.data);
    } catch (error) {
      console.error("Get image error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
