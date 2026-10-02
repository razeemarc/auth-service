import { Router } from "express";
import { z } from "zod";
import { authService } from "../services/auth.service.js";
import { AppError } from "../utils/app-error.js";

export const authRouter = Router();
const emailSchema = z.string().email().max(320);

authRouter.post("/otp/request", async (req, res, next) => {
  try {
    const body = z.object({ email: emailSchema }).parse(req.body);
    res.status(202).json(await authService.requestOtp(body.email));
  } catch (error) { next(error instanceof z.ZodError ? new AppError(400, "A valid email address is required") : error); }
});

authRouter.post("/otp/verify", async (req, res, next) => {
  try {
    const body = z.object({ email: emailSchema, code: z.string().regex(/^\d{6}$/) }).parse(req.body);
    res.status(200).json(await authService.verifyOtp(body.email, body.code));
  } catch (error) { next(error instanceof z.ZodError ? new AppError(400, "A valid email address and six-digit code are required") : error); }
});
