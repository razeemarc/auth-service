import path from "node:path";
import * as grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import { prisma } from "../config/prisma.js";
import { config } from "../config/env.js";
import { verifyAccessToken } from "../utils/tokens.js";

const protoPath = path.resolve("src/grpc/proto/auth.proto");
const definition = protoLoader.loadSync(protoPath, { keepCase: false, longs: String, enums: String, defaults: true, oneofs: true });
const loaded = grpc.loadPackageDefinition(definition) as any;

export function startGrpcServer(): grpc.Server {
  const server = new grpc.Server();
  server.addService(loaded.auth.v1.AuthService.service, {
    validateAccessToken(call: any, callback: (error: grpc.ServiceError | null, response?: unknown) => void) {
      try {
        const claims = verifyAccessToken(call.request.accessToken);
        callback(null, { valid: true, userId: claims.sub, email: claims.email });
      } catch {
        callback(null, { valid: false, userId: "", email: "" });
      }
    },
    async getUser(call: any, callback: (error: grpc.ServiceError | null, response?: unknown) => void) {
      try {
        const user = await prisma.user.findUnique({ where: { id: call.request.userId } });
        callback(null, user ? { found: true, userId: user.id, email: user.email, verified: user.verified } : { found: false, userId: "", email: "", verified: false });
      } catch (error) {
        callback({ code: grpc.status.INTERNAL, message: error instanceof Error ? error.message : "Database error" } as grpc.ServiceError);
      }
    },
  });
  const address = process.env.GRPC_BIND_ADDRESS ?? "0.0.0.0";
  server.bindAsync(`${address}:${config.GRPC_PORT}`, grpc.ServerCredentials.createInsecure(), (error) => {
    if (error) throw error;
    server.start();
    console.log(`gRPC auth service listening on ${address}:${config.GRPC_PORT}`);
  });
  return server;
}

