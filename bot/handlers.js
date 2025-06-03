const Request = require('../models/Request');

const awaitingInfo = {}; // { userId: { step: 'name' | 'budget', requestId } }

async function handleMessage(bot, msg) {
  const { id, username, first_name } = msg.from;
  const text = msg.text.trim();
  const state = awaitingInfo[id];

  // 🔍 Log de mensajes entrantes
  console.log(`📩 Usuario ${first_name} (@${username}) escribió: ${text}`);

  // 🧾 Paso 2: Espera el nombre
  if (state?.step === 'name') {
    const request = await Request.findById(state.requestId);
    if (request) {
      request.fullName = text;
      await request.save();
      awaitingInfo[id].step = 'budget';

      return bot.sendMessage(id, '💰 ¿Cuál es tu presupuesto estimado para esta petición?');
    }
  }

  // 💵 Paso 3: Espera el presupuesto
 if (state?.step === 'budget') {
  const request = await Request.findById(state.requestId);
  if (request) {
    request.budget = text;
    await request.save();
    delete awaitingInfo[id];

    await bot.sendMessage(id, '✅ Gracias, tu solicitud ha sido registrada correctamente.');

    const adminId = process.env.ADMIN_ID; // o tu ID directamente, por ejemplo 123456789
    const msgAdmin =
      `📬 *Nueva solicitud recibida:*\n` +
      `🧍‍♂️ Nombre: *${request.fullName}*\n` +
      `👤 Usuario: @${request.username || 'Desconocido'}\n`;
    await bot.sendMessage(adminId, msgAdmin, { parse_mode: 'Markdown' });

    return;
    }
  }
  // 📩 Paso 1: Inicia petición
  if (text.toLowerCase().includes("necesito")) {
    const req = await Request.create({ userId: id, username, text });
    awaitingInfo[id] = { step: 'name', requestId: req._id };

    return bot.sendMessage(id, `📝 Recibido: "${text}".\n\nPor favor, ¿puedes decirme tu nombre completo?`);
  }

  // ❓ Mensaje genérico
  await bot.sendMessage(id, `Hola ${first_name} 👋. Escribe tu petición comenzando con "necesito..."`);
}

async function handleAdminCommand(bot, msg) {
  const requests = await Request.find({ status: 'pendiente' });

  if (requests.length === 0) {
    return bot.sendMessage(msg.chat.id, '📭 No hay peticiones pendientes.');
  }

  for (const r of requests) {
    const text =
      `📩 *Petición pendiente:*\n` +
      `🧍‍♂️ Nombre: *${r.fullName || 'No indicado'}*\n` +
      `👤 Usuario: @${r.username || 'Desconocido'}\n` +
      `🧾 Presupuesto: *${r.budget || 'No especificado'}*\n` +
      `📝 Petición: ${r.text}`;

    await bot.sendMessage(msg.chat.id, text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Aprobar', callback_data: `approve_${r._id}` },
            { text: '❌ Rechazar', callback_data: `reject_${r._id}` }
          ]
        ]
      }
    });
  }
  // 🧑‍💼 Manejo de botones de acción
  bot.on('callback_query', async (query) => {
    const [action, id] = query.data.split('_');

    if (query.from.id.toString() !== process.env.ADMIN_ID) {
      return bot.answerCallbackQuery(query.id, {
        text: '🚫 No tienes permiso para hacer esto.',
        show_alert: true
      });
    }
    const request = await Request.findById(id);
    if (!request) return;

    request.status = action === 'approve' ? 'aprobada' : 'rechazada';
    await request.save();

    const statusText = request.status === 'aprobada' ? '✅ *Aprobada*' : '❌ *Rechazada*';

    // 🧠 Log de acciones del admin
    console.log(`🔧 Admin ${query.from.username} ${request.status} la solicitud de ${request.fullName || 'desconocido'}: "${request.text}"`);

    // Notificar al solicitante con detalle
    await bot.sendMessage(
      request.userId,
      `🔔 Tu solicitud ha sido ${statusText}.\n\n📝 *Petición:*\n${request.text}`,
      { parse_mode: 'Markdown' }
    );

    // Limpiar botones
    await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id
    });

    // Confirmación al admin
    await bot.answerCallbackQuery(query.id, {
      text: `Solicitud ${request.status === 'aprobada' ? '✅ Aprobada' : '❌ Rechazada'}`,
      show_alert: false
    });
  });
}

module.exports = {
  handleMessage,
  handleAdminCommand
};
