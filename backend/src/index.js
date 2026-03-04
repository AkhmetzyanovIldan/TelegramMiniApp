const express = require('express');
const cors = require('cors');
const apiRouter = require('./api');
const bot = require('./bot');
const { setupWebSocket } = require('./websocket/server');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://akhmetzyanovildan.github.io'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

// --- Добавлено: маршрут для вебхуков Telegram в продакшене ---
if (process.env.NODE_ENV === 'production') {
  const BOT_TOKEN = process.env.BOT_TOKEN;
  if (BOT_TOKEN) {
    app.post(`/bot${BOT_TOKEN}`, (req, res) => {
      bot.processUpdate(req.body);
      res.sendStatus(200);
    });
    logger.info('Webhook route for Telegram bot registered');
  }
}
// ---------------------------------------------------------

app.use('/api', apiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Статические файлы
app.use(express.static('public'));

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  setupWebSocket(server);
  logger.info('Telegram bot is running (started automatically)');
});

// --- Добавлено: корректное завершение при SIGTERM ---
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    logger.info('HTTP server closed');
    if (process.env.NODE_ENV === 'production' && bot) {
      bot.deleteWebHook().then(() => {
        logger.info('Webhook deleted');
        process.exit(0);
      }).catch(err => {
        logger.error('Error deleting webhook', err);
        process.exit(1);
      });
    } else {
      process.exit(0);
    }
  });
});
// ---------------------------------------------------

module.exports = server;