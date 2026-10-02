import express from "express";
import helmet from "helmet";
import cors from "cors";
import { authRouter } from "./routes/auth.routes.js";
import { errorHandler } from "./middleware/error-handler.js";

export const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? false }));
app.use(express.json({ limit: "16kb" }));
app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
app.use("/auth", authRouter);
app.use(errorHandler);
