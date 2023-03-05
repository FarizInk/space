const { Telegraf } = require('telegraf')
const { createZasifer } = require('./commands.js')
require('dotenv').config()

const bot = new Telegraf(process.env.TELE_BOT_TOKEN);
bot.catch((err, ctx) => {
  console.log(`Ooops, encountered an error for ${ctx.updateType}`, err)
})

bot.start((ctx) => {
  const botInfo = ctx.botInfo
  const chatInfo = ctx.chat
  ctx.replyWithMarkdownV2(
    "`TELE_BOT_USERNAME=" + botInfo.username +
    "\nTELE_BOT_ID=" + botInfo.id +
    "\n\nTELE_USERNAME=" + chatInfo.username +
    "\nTELE_USER_ID=" + chatInfo.id + "`"
  )
});
bot.help((ctx) => {
  ctx.replyWithMarkdownV2(
    "Available Commands: _coming soon_"
  );
});
bot.on('sticker', (ctx) => ctx.reply('👍'));
// bot.hears('hi', (ctx) => ctx.reply('Hey there'));


bot.on('text', (ctx) => {
  if (process.env.TELE_USERNAME === ctx.chat.username || process.env.TELE_USER_ID === ctx.chat.id) {
    if (ctx.message.reply_to_message) {
      console.log(ctx.message.reply_to_message);
    } else {
      createZasifer(ctx)
    }
  } else {
    ctx.reply('You are not my master 😠.')
  }
});

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
