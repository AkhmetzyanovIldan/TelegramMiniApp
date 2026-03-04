require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const logger = require('../utils/logger');

const BOT_TOKEN = process.env.BOT_TOKEN;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN не указан в .env файле!');
  process.exit(1);
}

let bot;

if (process.env.NODE_ENV === 'production') {
  // Продакшен: вебхуки
  const externalUrl = process.env.RENDER_EXTERNAL_URL;
  if (!externalUrl) {
    logger.error('RENDER_EXTERNAL_URL не задан, невозможно установить вебхук');
    process.exit(1);
  }
  bot = new TelegramBot(BOT_TOKEN);
  bot.setWebHook(`${externalUrl}/bot${BOT_TOKEN}`);
  logger.info(`✅ Бот настроен на вебхук: ${externalUrl}/bot${BOT_TOKEN}`);
} else {
  // Разработка: polling
  bot = new TelegramBot(BOT_TOKEN, { polling: true });
  console.log('🤖 Telegram бот запущен в режиме polling...');
}

// Обработчики команд (остаются без изменений, но используем BACKEND_URL)
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeText = `🎮 *Добро пожаловать в Игровую Площадку!*

Выберите игру:
/mafia - Создать комнату для Мафии
/spy - Создать комнату для Шпиона
/rooms - Список активных комнат
/join <код> - Присоединиться к комнате

*Для игры используйте веб-приложение:*`;
  
  bot.sendMessage(chatId, welcomeText, { parse_mode: 'Markdown' });
  logger.info(`Пользователь ${msg.from.id} использовал /start`);
});

bot.onText(/\/mafia/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const response = await axios.post(`${BACKEND_URL}/api/rooms`, {
      gameType: 'mafia',
      creatorId: msg.from.id.toString(),
      creatorName: msg.from.first_name || 'Игрок'
    });
    const roomCode = response.data.id;
    bot.sendMessage(chatId, 
      `🎮 *Комната Мафия создана!*\n\nКод комнаты: \`${roomCode}\`\nИгроков: 1/10\n\n*Пригласите друзей:*\n1. Отправьте им код: \`${roomCode}\`\n2. Или используйте команду: /join ${roomCode}`,
      { parse_mode: 'Markdown' }
    );
    logger.info(`Комната Мафия создана: ${roomCode} для пользователя ${msg.from.id}`);
  } catch (error) {
    logger.error('Ошибка при создании комнаты Мафия:', error);
    bot.sendMessage(chatId, '❌ Не удалось создать комнату. Попробуйте позже.');
  }
});

bot.onText(/\/spy/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const response = await axios.post(`${BACKEND_URL}/api/rooms`, {
      gameType: 'spy',
      creatorId: msg.from.id.toString(),
      creatorName: msg.from.first_name || 'Игрок'
    });
    const roomCode = response.data.id;
    bot.sendMessage(chatId, 
      `🕵️ *Комната Шпион создана!*\n\nКод комнаты: \`${roomCode}\`\nИгроков: 1/8\n\n*Пригласите друзей:*\n1. Отправьте им код: \`${roomCode}\`\n2. Или используйте команду: /join ${roomCode}`,
      { parse_mode: 'Markdown' }
    );
    logger.info(`Комната Шпион создана: ${roomCode} для пользователя ${msg.from.id}`);
  } catch (error) {
    logger.error('Ошибка при создании комнаты Шпион:', error);
    bot.sendMessage(chatId, '❌ Не удалось создать комнату. Попробуйте позже.');
  }
});

bot.onText(/\/join (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const roomCode = match[1].trim().toUpperCase();
  try {
    await axios.post(`${BACKEND_URL}/api/rooms/${roomCode}/join`, {
      userId: msg.from.id.toString(),
      userName: msg.from.first_name || 'Игрок'
    });
    bot.sendMessage(chatId,
      `✅ *Вы присоединились к комнате!*\n\nКод комнаты: \`${roomCode}\`\n\nПерейдите в приложение и введите код комнаты.`,
      { parse_mode: 'Markdown' }
    );
    logger.info(`Пользователь ${msg.from.id} присоединился к комнате ${roomCode}`);
  } catch (error) {
    logger.error('Ошибка при присоединении к комнате:', error);
    bot.sendMessage(chatId, `❌ Комната ${roomCode} не найдена или произошла ошибка.`);
  }
});

module.exports = bot;