import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import ENV from "@/env";
import { PBClient } from "./pocketbase-client";

let client: TelegramClient | null = null;

export async function startTelegramClient() {
  if (!ENV.TELEGRAM_API_ID || !ENV.TELEGRAM_API_HASH || !ENV.TELEGRAM_BOT_TOKEN)
    return null;

  const key = "bot-session";

  const pb = await PBClient();
  const payload = await pb.collection("vars").getList(1, 1, {
    filter: `key = '${key}'`,
  });
  const item = payload.items[0] ?? null;
  client = new TelegramClient(
    new StringSession(item?.value ?? ""),
    ENV.TELEGRAM_API_ID,
    ENV.TELEGRAM_API_HASH,
    { connectionRetries: 5 },
  );

  if (!client) throw new Error("Failed to Connect Bot");

  await client.start({
    botAuthToken: ENV.TELEGRAM_BOT_TOKEN,
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

export async function stopTelegramClient() {
  if (client) {
    await client.disconnect();
    await client.destroy();
    console.log("Telegram client disconnected!");
    client = null;
  }
}

export function getTelegramClient(): TelegramClient | null {
  return client;
}
