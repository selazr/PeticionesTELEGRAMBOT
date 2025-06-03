const TelegramBot = require('node-telegram-bot-api');
const { handleMessage, handleAdminCommand } = require('./handlers');

module.exports = function setupBot() {
  const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

  bot.on('message', async (msg) => {
    const isAdmin = msg.from.id.toString() === process.env.ADMIN_ID;
    if (isAdmin && msg.text.startsWith('/admin')) {
      return handleAdminCommand(bot, msg);
    } else {
      return handleMessage(bot, msg);
    }
  });

  console.log('🤖 Bot de Telegram iniciado');
};
