import { Hono } from "hono";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import ENV from "@/env";
import {
  deleteFile,
  generateLodingTicket,
  uploadFile,
} from "./controllers/file-controller";
import { PBClient } from "./clients/pocketbase-client";
import { next24 } from "@UTILS/index";
import { getTelegramClient } from "./clients/telegram-client";
import { existsSync } from "fs";

const apiRoutes = new Hono()
  .get("/config", (c) => {
    return c.json({
      DEBUG: ENV.DEBUG,
      FILE_SIZE: ENV.FILE_SIZE,
      POCKETBASE_URL: ENV.PUBLIC_POCKETBASE_URL,
    });
  })
  .post("/upload", uploadFile)
  .get("/ticket", generateLodingTicket)
  .post("/delete", deleteFile); // NOTE: delete API is only for authenticated user

const fileRoutes = new Hono().use(
  "/*",
  async (c, next) => {
    const fileNameParam = c.req.path.replace("/f/", "");
    const id = fileNameParam?.split(".")[0];

    if (id && !existsSync(`./uploads/${fileNameParam}`)) {
      try {
        const pb = await PBClient();
        const payload = await pb.collection("files").getOne(id);

        const msgId = payload?.info?.message_id ?? null;
        const ext = payload.info.extension ? `.${payload.info.extension}` : "";
        const fileName = `${payload.id}${ext}`;
        const filePath = `./uploads/${fileName}`;

        if (!existsSync(filePath)) {
          const client = getTelegramClient();
          if (!ENV.TELEGRAM_CHAT_ID || client === null) {
            return c.json({ message: "File Not Found." }, 404);
          }
          const messages = await client.getMessages(ENV.TELEGRAM_CHAT_ID, {
            ids: msgId,
          });
          if (messages.length >= 1) {
            const message = messages[0];
            if (!message || !message.media) {
              return c.json({ message: "File Not Found." }, 404);
            }
            await client.downloadMedia(message.media, {
              outputFile: filePath,
            });
          }
        }

        if (!existsSync(filePath)) {
          return c.json({ message: "File Not Found." }, 404);
        }

        const file = Bun.file(filePath);
        return new Response(await file.arrayBuffer(), {
          headers: {
            "Content-Disposition": `attachment; filename="${payload.name}"`,
            "Content-Type": payload?.info?.mime ?? "",
          },
        });
      } catch (error) {
        if (ENV.DEBUG) console.error(error);
      }

      return c.json({ message: "File Not Found." }, 404);
    }

    await next();
  },
  serveStatic({
    root: "./",
    rewriteRequestPath: (path) => path.replace(/^\/f/, "/uploads"),
    onFound: async (path) => {
      try {
        const pathes = path.replace("./uploads", "").split("/");
        if (pathes.length >= 2) {
          const fullFileName = pathes[1];
          const id = fullFileName?.split(".")[0] ?? null;
          if (id) {
            const pb = await PBClient();
            await pb
              .collection("files")
              .update(id, { last_view_at: new Date(), expired_at: next24() });
          }
        }
      } catch (error) {
        if (ENV.DEBUG) console.log(error);
      }
    },
  }),
);

const app = new Hono().route("/api", apiRoutes).route("/f", fileRoutes);

if (ENV.DEBUG) {
  app.use(logger());
}

app.get("*", serveStatic({ root: "./frontend/dist" }));
app.get("*", serveStatic({ path: "./frontend/dist/index.html" }));

export default app;
export type ApiRoutes = typeof apiRoutes;
export type FileRoutes = typeof fileRoutes;
