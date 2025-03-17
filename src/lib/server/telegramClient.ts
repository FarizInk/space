import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import config, { pbClient } from "@/config";

let client: TelegramClient | null = null;

export async function startTelegramClient() {
    const key = 'bot-session'

    const pb = await pbClient();
    const payload = await pb.collection('vars').getList(1, 1, {
        filter: `key = '${key}'`,
    });
    const item = payload.items[0] ?? null
    client = new TelegramClient(
        new StringSession(item.value ?? ''),
        config.TELEGRAM_API_ID,
        config.TELEGRAM_API_HASH,
        { connectionRetries: 5 }
    );

    if (!client) throw new Error("Failed to Connect Bot");

    await client.start({
        botAuthToken: config.TELEGRAM_BOT_TOKEN,
    });
    
    const stringSession = client.session.save() ?? ''
    if (stringSession) {
        if (item) {
            await pb.collection('vars').update(item.id, {
                ...item,
                value: stringSession,
            });
        } else {
            await pb.collection('vars').create({
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

// Auto-start the Telegram client when SvelteKit starts
startTelegramClient().catch(console.error);
