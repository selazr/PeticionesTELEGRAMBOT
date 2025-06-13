// handlers.js
const Request = require('../models/Request');
const { handleAdminCommand } = require('./adminHandlers');
const escapeMarkdown = require('../utils/escapeMarkdown');

const awaitingInfo = {}; // { userId: { step: 'name' | 'budget', requestId } }

async function handleMessage(bot, msg) {
  const { id, username, first_name } = msg.from;
  const text = msg.text.trim();
  const state = awaitingInfo[id];

  console.log(`📩 Usuario ${first_name} (@${username}) escribió: ${text}`);

  if (state?.step === 'name') {
    const request = await Request.findById(state.requestId);
    if (request) {
      request.fullName = text;
      await request.save();
      awaitingInfo[id].step = 'budget';

      return bot.sendMessage(id, '💰 ¿Cuál es tu presupuesto estimado para esta petición?');
    }
  }

  if (state?.step === 'budget') {
    const request = await Request.findById(state.requestId);
    if (request) {
      request.budget = text;
      await request.save();
      delete awaitingInfo[id];

      await bot.sendMessage(id, '✅ Gracias, tu solicitud ha sido registrada correctamente.');

      const adminId = process.env.ADMIN_ID;
      const msgAdmin =
        `📬 *Nueva solicitud recibida:*\n` +
        `🧍‍♂️ Nombre: *${escapeMarkdown(request.fullName)}*\n` +
        `👤 Usuario: @${request.username || 'Desconocido'}\n`;
      await bot.sendMessage(adminId, msgAdmin, { parse_mode: 'Markdown' });

      return;
    }
  }

  if (text.toLowerCase().includes("necesito")) {
    const req = await Request.create({ userId: id, username, text });
    awaitingInfo[id] = { step: 'name', requestId: req._id };

    return bot.sendMessage(id, `📝 Recibido: "${text}".\n\nPor favor, ¿puedes decirme tu nombre completo?`);
  }

  await bot.sendMessage(id, `Hola ${first_name} 👋. Escribe tu petición comenzando con "necesito..."`);
}

module.exports = {
  handleMessage,
  handleAdminCommand // reexportado desde el nuevo archivo
};
