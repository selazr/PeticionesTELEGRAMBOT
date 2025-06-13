const Request = require('../models/Request');
const escapeMarkdown = require('../utils/escapeMarkdown');

// Paginación en memoria por usuario
const paginationState = {}; // { userId: { status, page } }

// Inicializa o reinicia la paginación para un admin
function initPaginationState(userId, status) {
  paginationState[userId] = { status, page: 1 };
}

function registerAdminActions(bot) {
  bot.on('callback_query', async (query) => {
    const [action, idOrState] = query.data.split('_');
    const chatId = query.message.chat.id;
    const userId = query.from.id.toString();

    if (userId !== process.env.ADMIN_ID) {
      return bot.answerCallbackQuery(query.id, {
        text: '🚫 No tienes permiso para hacer esto.',
        show_alert: true
      });
    }

    // ✅❌ Aprobar o rechazar
    if (['approve', 'reject'].includes(action)) {
      const request = await Request.findById(idOrState);
      if (!request) return;

      request.status = action === 'approve' ? 'aprobada' : 'rechazada';
      await request.save();

      const statusText = request.status === 'aprobada' ? '✅ *Aprobada*' : '❌ *Rechazada*';

      await bot.sendMessage(
        request.userId,
        `🔔 Tu solicitud ha sido ${statusText}.\n\n📝 *Petición:*\n${escapeMarkdown(request.text)}`,
        { parse_mode: 'Markdown' }
      );

      await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
        chat_id: chatId,
        message_id: query.message.message_id
      });

      return bot.answerCallbackQuery(query.id, {
        text: `Solicitud ${statusText}`,
        show_alert: false
      });
    }

    // 📊 Estadísticas
    if (query.data === 'stats_panel') {
      return showAdminStats(bot, chatId, query.id);
    }

    // Listar por estado
    const statusMap = {
      list: {
        pending: 'pendiente',
        approved: 'aprobada',
        rejected: 'rechazada'
      }
    };

    if (action === 'list' && statusMap.list[idOrState]) {
      const estado = statusMap.list[idOrState];
      const page = 1;
      initPaginationState(userId, estado);

      if (estado === 'pendiente') {
        return showPendingRequests(bot, chatId, page, query.id);
      } else {
        return showRequestsByStatus(bot, chatId, estado, page, query.id);
      }
    }

    // Botón "Ver más"
    if (action === 'more') {
      const { status, page } = paginationState[userId] || {};
      if (!status) {
        return bot.answerCallbackQuery(query.id, {
          text: '❌ No hay contexto de paginación.',
          show_alert: true
        });
      }

      const nextPage = page + 1;
      paginationState[userId].page = nextPage;

      if (status === 'pendiente') {
        return showPendingRequests(bot, chatId, nextPage, query.id);
      } else {
        return showRequestsByStatus(bot, chatId, status, nextPage, query.id);
      }
    }
  });
}

// 📬 Mostrar solicitudes pendientes con botones de acción
async function showPendingRequests(bot, chatId, page = 1, callbackQueryId = null) {
  const perPage = 5;
  const skip = (page - 1) * perPage;

  const total = await Request.countDocuments({ status: 'pendiente' });
  const requests = await Request.find({ status: 'pendiente' })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(perPage);

  if (requests.length === 0) {
    await bot.sendMessage(chatId, `📭 No hay más solicitudes *pendientes*.`, { parse_mode: 'Markdown' });
    if (callbackQueryId) bot.answerCallbackQuery(callbackQueryId);
    return;
  }

  for (const r of requests) {
    const text =
      `📩 *Petición pendiente:*\n` +
      `🧍‍♂️ Nombre: *${r.fullName || 'No indicado'}*\n` +
      `👤 Usuario: @${r.username || 'Desconocido'}\n` +
      `💰 Presupuesto: *${r.budget || 'No especificado'}*\n` +
      `📝 Texto: ${escapeMarkdown(r.text)}`;

    await bot.sendMessage(chatId, text, {
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

  const hasMore = skip + perPage < total;
  if (hasMore) {
    await bot.sendMessage(chatId, '🔽 Hay más solicitudes pendientes.', {
      reply_markup: {
        inline_keyboard: [[{ text: '🔽 Ver más', callback_data: 'more_' }]]
      }
    });
  }

  if (callbackQueryId) bot.answerCallbackQuery(callbackQueryId);
}

// 📂 Mostrar solicitudes aprobadas/rechazadas como lista
async function showRequestsByStatus(bot, chatId, estado, page = 1, callbackQueryId = null) {
  const perPage = 5;
  const skip = (page - 1) * perPage;

  const total = await Request.countDocuments({ status: estado });
  const requests = await Request.find({ status: estado })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(perPage);

  if (requests.length === 0) {
    await bot.sendMessage(chatId, `📭 No hay más solicitudes *${estado}*.`, { parse_mode: 'Markdown' });
    if (callbackQueryId) bot.answerCallbackQuery(callbackQueryId);
    return;
  }

  let text = `📂 *Solicitudes ${estado}* (página ${page}):\n\n`;

  requests.forEach((r, i) => {
    text += `*${(skip + i + 1)}.* ${r.fullName || 'Sin nombre'}\n`;
    text += `🗓 ${r.createdAt.toLocaleDateString('es-ES')}\n`;
    text += `💬 ${escapeMarkdown(r.text.slice(0, 80))}\n`;
    text += `💰 ${r.budget || 'Sin presupuesto'}\n\n`;
  });

  const hasMore = skip + perPage < total;

  const replyMarkup = {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: hasMore
        ? [[{ text: '🔽 Ver más', callback_data: 'more_' }]]
        : []
    }
  };

  await bot.sendMessage(chatId, text, replyMarkup);

  if (callbackQueryId) bot.answerCallbackQuery(callbackQueryId);
}

// 📊 Panel de estadísticas
async function showAdminStats(bot, chatId, callbackQueryId = null) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const approvedThisMonth = await Request.find({
    status: 'aprobada',
    createdAt: { $gte: startOfMonth }
  });

  const rejectedThisMonth = await Request.find({
    status: 'rechazada',
    createdAt: { $gte: startOfMonth }
  });

  const allApproved = await Request.find({ status: 'aprobada' });
  const totalApproved = allApproved.reduce((sum, r) => sum + (parseFloat(r.budget) || 0), 0);

  const allRejected = await Request.find({ status: 'rechazada' });
  const totalRejected = allRejected.reduce((sum, r) => sum + (parseFloat(r.budget) || 0), 0);

  const text =
    `📊 *Estadísticas del Panel*\n\n` +
    `📅 *Este mes:*\n` +
    `✅ Aprobadas: *${approvedThisMonth.length}*\n` +
    `❌ Rechazadas: *${rejectedThisMonth.length}*\n\n` +
    `💰 *Presupuesto aprobado total:* €${totalApproved.toFixed(2)}\n` +
    `💸 *Presupuesto ahorrado (rechazado):* €${totalRejected.toFixed(2)}`;

  await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });

  if (callbackQueryId) {
    await bot.answerCallbackQuery(callbackQueryId);
  }
}

module.exports = {
  registerAdminActions,
  showRequestsByStatus,
  showPendingRequests,
  showAdminStats,
  initPaginationState
};
