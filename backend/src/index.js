const express = require('express');
const cors = require('cors');
const apiRouter = require('./api');
const bot = require('./bot'); // Бот уже запускается сам
const { setupWebSocket } = require('./websocket/server');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());
app.use('/api', apiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Статические файлы
app.use(express.static('public'));

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  
  // WebSocket
  setupWebSocket(server);
  
  logger.info('Telegram bot is running (started automatically)');
});

module.exports = server;
