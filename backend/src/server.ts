import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { initializeDatabase } from "./database/init";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import mentorRoutes from "./routes/mentors";
import requestRoutes from "./routes/requests";

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API routes
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", mentorRoutes);
app.use("/api", requestRoutes);

// Swagger documentation
try {
  const swaggerDocument = YAML.load(path.join(__dirname, "../openapi.yaml"));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Root redirect to swagger
  app.get("/", (req, res) => {
    res.redirect("/api-docs");
  });

  // OpenAPI JSON endpoint
  app.get("/openapi.json", (req, res) => {
    res.json(swaggerDocument);
  });
} catch (error) {
  console.log("Swagger documentation not available");
  app.get("/", (req, res) => {
    res.json({ message: "Mentor-Mentee API Server" });
  });
}

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal server error" });
  }
);

// Initialize database and start server
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(
        `API documentation available at http://localhost:${PORT}/api-docs`
      );
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  });
