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

// Rate limiting - very lenient for testing
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10000, // very high limit for testing
  skip: (req) => {
    // Skip rate limiting in test environment or if running tests
    return (
      process.env.NODE_ENV === "test" ||
      req.headers["user-agent"]?.includes("test") ||
      false
    );
  },
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
  
  if (!swaggerDocument) {
    throw new Error("Failed to load OpenAPI document");
  }

  // Enhanced swagger setup for better compatibility
  app.use("/api-docs", swaggerUi.serve);
  app.get(
    "/api-docs",
    swaggerUi.setup(swaggerDocument, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Mentor-Mentee API",
      swaggerOptions: {
        persistAuthorization: true,
        tryItOutEnabled: true,
      },
    })
  );

  // Root redirect to swagger
  app.get("/", (req, res) => {
    res.redirect("/api-docs");
  });

  // OpenAPI JSON endpoint
  app.get("/openapi.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.json(swaggerDocument);
  });

  // OpenAPI YAML endpoint for better compatibility
  app.get("/openapi.yaml", (req, res) => {
    res.setHeader("Content-Type", "application/x-yaml");
    res.sendFile(path.join(__dirname, "../openapi.yaml"));
  });

  // Additional swagger endpoint for testing tools
  app.get("/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.json(swaggerDocument);
  });

  // Swagger UI endpoint
  app.get("/swagger-ui", (req, res) => {
    res.redirect("/api-docs");
  });

  console.log("Swagger documentation loaded successfully");
  console.log("OpenAPI document loaded with", Object.keys(swaggerDocument.paths || {}).length, "paths");
} catch (error) {
  console.error("Swagger documentation error:", error);

  // More robust fallback endpoints
  app.get("/", (req, res) => {
    res.json({
      message: "Mentor-Mentee API Server",
      version: "1.0.0",
      endpoints: {
        docs: "/api-docs",
        openapi: "/openapi.json",
      },
    });
  });

  // Fallback endpoints with proper error handling
  app.get("/api-docs", (req, res) => {
    res
      .status(503)
      .json({ error: "API documentation temporarily unavailable" });
  });

  app.get("/openapi.json", (req, res) => {
    res
      .status(503)
      .json({ error: "OpenAPI specification temporarily unavailable" });
  });

  app.get("/swagger.json", (req, res) => {
    res
      .status(503)
      .json({ error: "Swagger specification temporarily unavailable" });
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
const startServer = async () => {
  await initializeDatabase();

  if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(
        `API documentation available at http://localhost:${PORT}/api-docs`
      );
    });
  }
};

// Start server only if not in test environment
if (process.env.NODE_ENV !== "test") {
  startServer().catch((error) => {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  });
}

export { app };
