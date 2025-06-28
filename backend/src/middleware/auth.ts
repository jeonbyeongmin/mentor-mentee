import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWTPayload } from "../types";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
}

export function requireRole(role: "mentor" | "mentee") {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({ error: `${role} role required` });
      return;
    }

    next();
  };
}
