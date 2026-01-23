import "dotenv/config";
import http from "http";
import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";
import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./route/auth";
import { inviteRouter } from "./route/invites";
import { organizationsRouter } from "./route/organizations";
import { webhooksRouter } from "./route/webhooks";

import "./subscribers";

const app = express();
let server: http.Server;

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRouter);
app.use("/api/webhooks/", webhooksRouter);
app.use("/api/organizations", organizationsRouter);
app.use("/api/invites", inviteRouter);
app.use(errorHandler);

const startServer = async () => {
  process.on("SIGINT", shutdownServer);
  process.on("SIGTERM", shutdownServer);

  server = app.listen(Number(env.PORT), '0.0.0.0', () => {
    console.log(`UnitFix listening on port ${env.PORT}`);
  });
};

const shutdownServer = async () => {
  console.log("Shutting down gracefully...");

  server.close();
  await prisma.$disconnect();
  process.exit(0);
};

startServer();
