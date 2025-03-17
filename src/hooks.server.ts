import { stopTelegramClient } from "$lib/server/telegramClient";

process.on("SIGINT", async () => {
    await stopTelegramClient();
    process.exit();
});

process.on("SIGTERM", async () => {
    await stopTelegramClient();
    process.exit();
});