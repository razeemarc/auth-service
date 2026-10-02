import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) return res.status(400).json({ error: "Invalid request" });
  if (error instanceof AppError) return res.status(error.statusCode).json({ error: error.message });
  console.error("Unhandled request error", error);
  return res.status(500).json({ error: "Internal server error" });
};
