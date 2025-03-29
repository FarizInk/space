import { z } from "zod";

const ServeEnv = z.object({
  PORT: z
    .string()
    .regex(/^\d+$/, "Port must be a numeric string")
    .default("3000")
    .transform(Number),
  DEBUG: z.string().default("false").transform(Boolean),

  PUBLIC_POCKETBASE_URL: z.string().nullable(),
  POCKETBASE_URL: z.string().nullable(),
  POCKETBASE_USERNAME: z.string().nullable(),
  POCKETBASE_PASSWORD: z.string().nullable(),

  FILE_SIZE: z.string().default("2").transform(Number),

  TELEGRAM_BOT_TOKEN: z.string().nullable(),
  TELEGRAM_API_ID: z.string().nullable().transform(Number),
  TELEGRAM_API_HASH: z.string().nullable(),
  TELEGRAM_CHAT_ID: z.string().nullable().transform(Number),

  DOCKER_APP_PORT: z
    .string()
    .regex(/^\d+$/, "Port must be a numeric string")
    .default("3000")
    .transform(Number),
  DOCKER_POCKETBASE_PORT: z
    .string()
    .regex(/^\d+$/, "Port must be a numeric string")
    .default("8090")
    .transform(Number),
});

const ENV = ServeEnv.parse(process.env);

export default ENV;
