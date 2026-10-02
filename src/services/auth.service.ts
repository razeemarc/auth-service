import { config } from "../config/env.js";
import { authRepository } from "../repositories/auth.repository.js";
import { deliverOtp } from "./otp-delivery.service.js";
import { AppError } from "../utils/app-error.js";
import { createOtp, hashOtp, verifyOtpHash } from "../utils/otp.js";
import { signAccessToken } from "../utils/tokens.js";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const authService = {
  async requestOtp(rawEmail: string) {
    const email = normalizeEmail(rawEmail);
    const previous = await authRepository.findChallenge(email);
    if (previous && Date.now() - previous.lastSentAt.getTime() < config.OTP_RESEND_SECONDS * 1000) {
      throw new AppError(429, "Please wait before requesting another code");
    }
    const code = createOtp();
    const expiresAt = new Date(Date.now() + config.OTP_TTL_SECONDS * 1000);
    await authRepository.saveChallenge(email, hashOtp(email, code), expiresAt);
    try {
      await deliverOtp(email, code);
    } catch (error) {
      await authRepository.findChallenge(email).then((challenge) => challenge && authRepository.consumeChallenge(challenge.id));
      throw error;
    }
    return { message: "If the address can receive mail, a verification code has been sent" };
  },

  async verifyOtp(rawEmail: string, code: string) {
    const email = normalizeEmail(rawEmail);
    const challenge = await authRepository.findChallenge(email);
    if (!challenge || challenge.consumedAt || challenge.expiresAt <= new Date()) {
      throw new AppError(401, "Invalid or expired verification code");
    }
    if (challenge.attempts >= config.OTP_MAX_ATTEMPTS) throw new AppError(429, "Too many attempts; request a new code");
    if (!verifyOtpHash(email, code, challenge.codeHash)) {
      await authRepository.incrementAttempts(challenge.id);
      throw new AppError(401, "Invalid or expired verification code");
    }
    const consumed = await authRepository.consumeChallenge(challenge.id);
    if (consumed.count !== 1) throw new AppError(401, "Invalid or expired verification code");
    const user = await authRepository.findOrCreateUser(email);
    return { accessToken: signAccessToken({ sub: user.id, email: user.email }), tokenType: "Bearer", expiresIn: 900, user: { id: user.id, email: user.email } };
  },
};
