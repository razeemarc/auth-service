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

/**
 * @openapi
 * /auth/otp/verify:
 *   post:
 *     summary: Verify an OTP code for a given email address
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The email address to verify the OTP for
 *               code:
 *                 type: string
 *                 pattern: '^\d{6}$'
 *                 description: The six-digit OTP code to verify
 *             required:
 *               - email
 *               - code
 *     responses:
 *       200:
 *         description: OTP verified successfully, returns a JWT token and user info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: The JWT token for the authenticated user
 *                 user:
 *                   type: object
 *                   description: The authenticated user's information
 *       400:
 *         description: Invalid request body or OTP verification failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message describing the issue
 */
authRouter.post("/otp/verify", async (req, res, next) => {
  try {
    const body = z.object({ email: emailSchema, code: z.string().regex(/^\d{6}$/) }).parse(req.body);
    res.status(200).json(await authService.verifyOtp(body.email, body.code));
  } catch (error) { next(error instanceof z.ZodError ? new AppError(400, "A valid email address and six-digit code are required") : error); }
});
