import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { config } from "../config/env.js";

export function createOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtp(email: string, code: string): string {
  return createHmac("sha256", config.OTP_SECRET).update(`${email}:${code}`).digest("hex");
}

export function verifyOtpHash(email: string, code: string, storedHash: string): boolean {
  const supplied = Buffer.from(hashOtp(email, code), "hex");
  const stored = Buffer.from(storedHash, "hex");
  return supplied.length === stored.length && timingSafeEqual(supplied, stored);
}
