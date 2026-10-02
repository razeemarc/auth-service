import express from "express";
import helmet from "helmet";
import cors from "cors";
import { authRouter } from "./routes/auth.routes.js";
import { errorHandler } from "./middleware/error-handler.js";
import swaggerUi from "swagger-ui-express";

import { swaggerSpec } from "./config/swagger.js";

export const app = express();
app.get("/api-docs.json", (_req, res) => res.json(swaggerSpec));
// Serve Swagger UI before Helmet's default CSP, which blocks its inline bootstrap script.
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? false }));
app.use(express.json({ limit: "16kb" }));
app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
app.use("/auth", authRouter);
app.use(errorHandler);
