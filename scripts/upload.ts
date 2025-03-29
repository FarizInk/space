import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import PocketBase from "pocketbase";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? ""; // put your bot token here

async function pbClient() {
  const username = process.env.POCKETBASE_USERNAME ?? "";
  const password = process.env.POCKETBASE_PASSWORD ?? "";
  if (!username || !password) {
    throw new Error("Please set POCKETBASE_USERNAME & POCKETBASE_PASSWORD");
  }

  const pb = new PocketBase(process.env.POCKETBASE_URL);
  pb.autoCancellation(false);
  await pb.collection("_superusers").authWithPassword(username, password, {
    autoRefreshThreshold: 30 * 60,
  });
  return pb;
}

async function connect() {
  const apiId = process.env.TELEGRAM_API_ID
    ? parseInt(process.env.TELEGRAM_API_ID)
    : 0;
  const apiHash = process.env.TELEGRAM_API_HASH ?? "";
  if (apiId === 0 || !apiHash || !BOT_TOKEN) {
    throw new Error(
      "Please set TELEGRAM_API_ID & TELEGRAM_API_HASH & TELEGRAM_BOT_TOKEN",
    );
  }

  const key = "bot-session";

  const pb = await pbClient();
  const payload = await pb.collection("vars").getList(1, 1, {
    filter: `key = '${key}'`,
  });
  const item = payload.items[0] ?? null;
  let client = null;
  client = new TelegramClient(
    new StringSession(item?.value ?? ""),
    apiId,
    apiHash,
    { connectionRetries: 5 },
  );

  if (!client) throw new Error("Failed to Connect Bot");

  await client.start({
    botAuthToken: BOT_TOKEN,
  });
  const stringSession = client.session.save() ?? "";

  if (stringSession) {
    if (item) {
      await pb.collection("vars").update(item.id, {
        ...item,
        value: stringSession,
      });
    } else {
      await pb.collection("vars").create({
        key,
        value: stringSession,
      });
    }
  }

  return client;
}

async function cacheFiles() {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) throw new Error("Please set TELEGRAM_CHAT_ID");

  const pb = await pbClient();
  const payload = await pb.collection("files").getList(1, 50, {
    filter: "info.message_id = null && info.is_cached = true",
  });
  const items = payload.items;
  if (items.length === 0) return null;

  const client = await connect();
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item) continue;
    const ext = item.info.extension ? "." + item.info.extension : "";
    const message = await client.sendFile(chatId, {
      caption: "",
      file: `./uploads/${item.id}${ext}`,
      forceDocument: true,
      progressCallback: (progress) => {
        console.info(progress);
      },
    });
    await pb.collection("files").update(item.id, {
      ...item,
      info: {
        ...item.info,
        message_id: message.id,
      },
    });
  }

  await client.disconnect();
  await client.destroy();
}

await cacheFiles();
console.info("DONE");
