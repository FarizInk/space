import { Hono, type Context } from "hono";
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

const fileRoutes = new Hono()
  .use(async (_, next) => {
    try {
      const pathes = _.req.path.replace("/f", "").split("/");
      if (pathes.length >= 2) {
        const fullFileName = pathes[1];
        const id = fullFileName?.split(".")[0] ?? null;
        // const mime = getMimeType(fullFileName)
        // const extension = mime ? fullFileName.split('.').pop() : null
        // console.log({ filename, extension })
        const pb = await PBClient();
        if (id)
          await pb
            .collection("files")
            .update(id, { last_view_at: new Date(), destroy_at: next24() });
      }
    } catch (error) {
      if (ENV.DEBUG) console.log(error);
    }
    await next();
  })
  .use(
    "/f/*",
    serveStatic({
      root: "./",
      rewriteRequestPath: (path) => path.replace(/^\/f/, "/uploads"),
    }),
  )
  .get("/f/:filename", async (c: Context) => {
    const { filename } = c.req.param();
    const id = filename?.split(".")[0];
    if (id) {
      const pb = await PBClient();
      const payload = await pb.collection("files").getOne(id);
      const msgId = payload?.info?.message_id ?? null;
      const ext = payload.info.extension ? `.${payload.info.extension}` : "";
      const filePath = `./uploads/${payload.id}${ext}`;

      const client = getTelegramClient();
      if (!ENV.TELEGRAM_CHAT_ID || client === null)
        return c.json(
          { message: "Something Wrong! please contact admin." },
          500,
        );
      const messages = await client.getMessages(ENV.TELEGRAM_CHAT_ID, {
        ids: msgId,
      });
      if (messages.length >= 1) {
        const message = messages[0];
        if (!message || !message.media)
          return c.json(
            { message: "Something Wrong! please contact admin." },
            500,
          );
        await client.downloadMedia(message.media, {
          outputFile: filePath,
        });
      }

      return c.redirect(`/f/${filename}`);
    }

    return c.json({ message: "File Not Found." }, 404);
  });

const app = new Hono()
  .use("*", logger())
  .route("/api", apiRoutes)
  .route("/f", fileRoutes);

app.get("*", serveStatic({ root: "./frontend/dist" }));
app.get("*", serveStatic({ path: "./frontend/dist/index.html" }));

export default app;
export type ApiRoutes = typeof apiRoutes;
export type FileRoutes = typeof fileRoutes;
