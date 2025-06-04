const TelegramBot = require('node-telegram-bot-api');
const { handleMessage } = require('./handlers');
const { handleAdminMessage } = require('./adminHandlers');
const { registerAdminActions } = require('./adminActions');


module.exports = function setupBot() {
  const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

  bot.on('message', async (msg) => {
    const { id, first_name, username } = msg.from;
    const text = msg.text;

    // 📋 Log básico en consola
    console.log(`📥 [${new Date().toLocaleString()}] Mensaje de ${first_name} (@${username}) [ID: ${id}]: ${text}`);

    const isAdmin = id.toString() === process.env.ADMIN_ID;

    if (isAdmin) {
      return require('./adminHandlers').handleAdminMessage(bot, msg);
    } else {
      return require('./handlers').handleMessage(bot, msg);
    }
  });

  require('./adminActions').registerAdminActions(bot);

  console.log('🤖 Bot de Telegram iniciado');
};

