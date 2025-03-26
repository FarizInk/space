import app from "./app";
import ENV from "./env";
import {
  startTelegramClient,
  stopTelegramClient,
} from "./clients/telegram-client";

const server = Bun.serve({
  port: ENV.PORT,
  hostname: "0.0.0.0",
  fetch: app.fetch,
});
console.log("server running", server.port);

// Auto-start the Telegram client when SvelteKit starts
startTelegramClient().catch(console.error);

// Stop GramJS when the process exits
process.on("SIGINT", async () => {
  await stopTelegramClient();
  process.exit();
});

process.on("SIGTERM", async () => {
  await stopTelegramClient();
  process.exit();
});
