import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

export interface AccessClaims { sub: string; email: string; }
export function signAccessToken(user: AccessClaims): string {
  return jwt.sign({ email: user.email }, config.JWT_SECRET, {
    subject: user.sub,
    expiresIn: "15m",
    issuer: "auth-service",
    audience: "services",
  });
}
export function verifyAccessToken(token: string): AccessClaims {
  const claims = jwt.verify(token, config.JWT_SECRET, { issuer: "auth-service", audience: "services" });
  if (typeof claims === "string" || !claims.sub || typeof claims.email !== "string") throw new Error("Invalid token claims");
  return { sub: claims.sub, email: claims.email };
}
