import { createHmac } from "node:crypto";
import { config } from "../config/env.js";
import { redis } from "../config/redis.js";

const keyFor = (email: string) =>
  `auth:otp:${createHmac("sha256", config.OTP_SECRET).update(email).digest("hex")}`;

const SAVE_CHALLENGE = `
local lastSentAt = redis.call('HGET', KEYS[1], 'lastSentAt')
if lastSentAt and tonumber(ARGV[1]) - tonumber(lastSentAt) < tonumber(ARGV[5]) then
  return 0
end
redis.call('HSET', KEYS[1],
  'codeHash', ARGV[2],
  'expiresAt', ARGV[3],
  'attempts', '0',
  'lastSentAt', ARGV[1])
redis.call('EXPIRE', KEYS[1], ARGV[4])
return 1
`;

const GET_AND_INCREMENT_ATTEMPT = `
if redis.call('EXISTS', KEYS[1]) == 0 then return {} end
local codeHash = redis.call('HGET', KEYS[1], 'codeHash')
if not codeHash or codeHash == '' then return {} end
local expiresAt = tonumber(redis.call('HGET', KEYS[1], 'expiresAt') or '0')
if tonumber(ARGV[1]) >= expiresAt then return {} end
local attempts = tonumber(redis.call('HGET', KEYS[1], 'attempts') or '0')
if attempts >= tonumber(ARGV[2]) then return {'__MAX_ATTEMPTS__'} end
attempts = redis.call('HINCRBY', KEYS[1], 'attempts', 1)
return {codeHash, tostring(expiresAt), tostring(attempts)}
`;

const CONSUME_IF_MATCHES = `
if redis.call('HGET', KEYS[1], 'codeHash') == ARGV[1] then
  redis.call('HSET', KEYS[1], 'codeHash', '', 'expiresAt', '0')
  return 1
end
return 0
`;

const INVALIDATE_IF_MATCHES = `
if redis.call('HGET', KEYS[1], 'codeHash') == ARGV[1] then
  redis.call('HSET', KEYS[1], 'codeHash', '', 'expiresAt', '0')
  return 1
end
return 0
`;

export const otpRepository = {
  async saveChallenge(email: string, codeHash: string, now: number, expiresAt: number): Promise<boolean> {
    const ttlSeconds = Math.max(1, config.OTP_TTL_SECONDS, config.OTP_RESEND_SECONDS);
    const result = await redis.eval(SAVE_CHALLENGE, {
      keys: [keyFor(email)],
      arguments: [
        String(now),
        codeHash,
        String(expiresAt),
        String(ttlSeconds),
        String(config.OTP_RESEND_SECONDS * 1000),
      ],
    });
    return Number(result) === 1;
  },

  async getAndIncrementAttempt(email: string): Promise<{ codeHash: string } | "missing" | "max-attempts"> {
    const result = await redis.eval(GET_AND_INCREMENT_ATTEMPT, {
      keys: [keyFor(email)],
      arguments: [String(Date.now()), String(config.OTP_MAX_ATTEMPTS)],
    });
    if (!Array.isArray(result) || result.length === 0) return "missing";
    if (String(result[0]) === "__MAX_ATTEMPTS__") return "max-attempts";
    return { codeHash: String(result[0]) };
  },

  async consumeChallenge(email: string, codeHash: string): Promise<boolean> {
    const result = await redis.eval(CONSUME_IF_MATCHES, { keys: [keyFor(email)], arguments: [codeHash] });
    return Number(result) === 1;
  },

  async invalidateChallenge(email: string, codeHash: string): Promise<void> {
    await redis.eval(INVALIDATE_IF_MATCHES, { keys: [keyFor(email)], arguments: [codeHash] });
  },
};
