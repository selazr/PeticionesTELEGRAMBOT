require('dotenv').config();
const connectDB = require('./db/mongo');
const setupBot = require('./bot/telegram');

(async () => {
  await connectDB();
  setupBot();
})();
