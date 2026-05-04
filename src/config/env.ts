import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 5000),
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
};

export const isProduction = env.nodeEnv === "production";
