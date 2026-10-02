import "dotenv/config";
import { app } from "./app.js";
import { prisma } from "./config/prisma.js";
import { startGrpcServer } from "./grpc/server.js";
import { config } from "./config/env.js";
import { redis } from "./config/redis.js";

const port = config.PORT;
await Promise.all([prisma.$connect(), redis.connect()]);
const httpServer = app.listen(port, () => console.log(`HTTP auth service listening on ${port}`));
const grpcServer = startGrpcServer();

async function shutdown(signal: string) {
  console.log(`${signal} received; shutting down`);
  httpServer.close();
  grpcServer.tryShutdown(() => {
    void Promise.allSettled([prisma.$disconnect(), redis.quit()]).finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
