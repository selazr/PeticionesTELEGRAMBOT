// Asegúrate de que estas funciones estén exportadas desde adminActions.js
const { showRequestsByStatus, showPendingRequests } = require('./adminActions');

// 🧑‍💼 Comando /admin con panel interactivo
async function handleAdminCommand(bot, msg) {
  if (msg.from.id.toString() !== process.env.ADMIN_ID) {
    return bot.sendMessage(msg.chat.id, '🚫 No tienes permiso para usar este comando.');
  }

  await bot.sendMessage(msg.chat.id, '🧑‍💼 *Panel de Administración*', {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📬 Ver pendientes', callback_data: 'list_pending' }],
        [{ text: '✅ Ver aprobadas', callback_data: 'list_approved' }],
        [{ text: '❌ Ver rechazadas', callback_data: 'list_rejected' }],
        [{ text: '📊 Ver estadísticas', callback_data: 'stats_panel' }]

      ]
    }
  });
}

// 💬 Mensajes naturales del admin (texto tipo "ver aprobadas", "hola", etc.)
async function handleAdminMessage(bot, msg) {
  const text = msg.text?.trim().toLowerCase() || '';
  const chatId = msg.chat.id;

  if (text === '/admin' || text.includes('panel')) {
    return handleAdminCommand(bot, msg);
  }

  if (text.includes('ver aprobadas')) {
    return showRequestsByStatus(bot, chatId, 'aprobada');
  }

  if (text.includes('ver rechazadas')) {
    return showRequestsByStatus(bot, chatId, 'rechazada');
  }

  if (text.includes('ver pendientes')) {
    return showPendingRequests(bot, chatId);
  }

  if (text.includes('hola')) {
    return bot.sendMessage(
      chatId,
      `👋 Hola admin *${msg.from.first_name}*, ¿qué deseas hacer?\n\nPuedes escribir:\n- *ver pendientes*\n- *ver aprobadas*\n- *ver rechazadas*\n- o usar /admin para el menú`,
      { parse_mode: 'Markdown' }
    );
  }

  return bot.sendMessage(
    chatId,
    '🤖 Comando no reconocido. Escribe `/admin` o frases como:\n- "ver pendientes"\n- "ver aprobadas"\n- "ver rechazadas"',
    { parse_mode: 'Markdown' }
  );
}

module.exports = {
  handleAdminCommand,
  handleAdminMessage
};
