import nodemailer from "nodemailer";
import { config } from "../config/env.js";

export async function deliverOtp(email: string, code: string): Promise<void> {
  if (config.SMTP_HOST && config.SMTP_FROM) {
    const transport = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASSWORD } : undefined,
    });
    await transport.sendMail({
      from: config.SMTP_FROM,
      to: email,
      subject: "Your sign-in code",
      text: `Your verification code is ${code}. It expires in ${Math.ceil(config.OTP_TTL_SECONDS / 60)} minutes.`,
    });
    return;
  }
  if (config.NODE_ENV !== "production") {
    console.info(`[DEV OTP] ${email}: ${code}`);
    return;
  }
  throw new Error("SMTP_HOST and SMTP_FROM must be configured in production");
}
