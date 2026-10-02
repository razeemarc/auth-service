import { config } from "../config/env.js";
import { authRepository } from "../repositories/auth.repository.js";
import { otpRepository } from "../repositories/otp.repository.js";
import { deliverOtp } from "./otp-delivery.service.js";
import { AppError } from "../utils/app-error.js";
import { createOtp, hashOtp, verifyOtpHash } from "../utils/otp.js";
import { signAccessToken } from "../utils/tokens.js";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const authService = {
  async requestOtp(rawEmail: string) {
    const email = normalizeEmail(rawEmail);
    const code = createOtp();
    const codeHash = hashOtp(email, code);
    const now = Date.now();
    const expiresAt = now + config.OTP_TTL_SECONDS * 1000;
    const saved = await otpRepository.saveChallenge(email, codeHash, now, expiresAt);
    if (!saved) throw new AppError(429, "Please wait before requesting another code");

    try {
      await deliverOtp(email, code);
    } catch (error) {
      await otpRepository.invalidateChallenge(email, codeHash);
      throw error;
    }
    return { message: "If the address can receive mail, a verification code has been sent" };
  },

  async verifyOtp(rawEmail: string, code: string) {
    const email = normalizeEmail(rawEmail);
    const challenge = await otpRepository.getAndIncrementAttempt(email);
    if (challenge === "missing") throw new AppError(401, "Invalid or expired verification code");
    if (challenge === "max-attempts") throw new AppError(429, "Too many attempts; request a new code");
    if (!verifyOtpHash(email, code, challenge.codeHash)) {
      throw new AppError(401, "Invalid or expired verification code");
    }

    const consumed = await otpRepository.consumeChallenge(email, challenge.codeHash);
    if (!consumed) throw new AppError(401, "Invalid or expired verification code");
    const user = await authRepository.findOrCreateUser(email);
    return { accessToken: signAccessToken({ sub: user.id, email: user.email }), tokenType: "Bearer", expiresIn: 900, user: { id: user.id, email: user.email } };
  },
};
