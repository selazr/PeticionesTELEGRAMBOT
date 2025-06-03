const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  userId: String,
  username: String,
  fullName: String,
  budget: String, // 🆕 presupuesto
  text: String,
  status: { type: String, enum: ['pendiente', 'aprobada', 'rechazada'], default: 'pendiente' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Request', RequestSchema);
