import { createClient } from "redis";
import { config } from "./env.js";

export const redis = createClient({ url: config.REDIS_URL });
redis.on("error", (error) => console.error("Redis client error", error));
