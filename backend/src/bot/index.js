require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const logger = require('../utils/logger');

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN не указан в .env файле!');
  process.exit(1);
}

// Инициализация бота
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
console.log('🤖 Telegram бот запущен...');

// Команда /start
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

// Создание комнаты Мафия
bot.onText(/\/mafia/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const response = await axios.post('http://localhost:3000/api/rooms', {
      gameType: 'mafia',
      creatorId: msg.from.id.toString(),
      creatorName: msg.from.first_name || 'Игрок'
    });
    
    const roomCode = response.data.id;
    
    bot.sendMessage(chatId, 
      `🎮 *Комната Мафия создана!*

Код комнаты: \`${roomCode}\`
Игроков: 1/10

*Пригласите друзей:*
1. Отправьте им код: \`${roomCode}\`
2. Или используйте команду: /join ${roomCode}`,
      { parse_mode: 'Markdown' }
    );
    
    logger.info(`Комната Мафия создана: ${roomCode} для пользователя ${msg.from.id}`);
  } catch (error) {
    logger.error('Ошибка при создании комнаты Мафия:', error);
    bot.sendMessage(chatId, '❌ Не удалось создать комнату. Попробуйте позже.');
  }
});

// Создание комнаты Шпион
bot.onText(/\/spy/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const response = await axios.post('http://localhost:3000/api/rooms', {
      gameType: 'spy',
      creatorId: msg.from.id.toString(),
      creatorName: msg.from.first_name || 'Игрок'
    });
    
    const roomCode = response.data.id;
    
    bot.sendMessage(chatId, 
      `🕵️ *Комната Шпион создана!*

Код комнаты: \`${roomCode}\`
Игроков: 1/8

*Пригласите друзей:*
1. Отправьте им код: \`${roomCode}\`
2. Или используйте команду: /join ${roomCode}`,
      { parse_mode: 'Markdown' }
    );
    
    logger.info(`Комната Шпион создана: ${roomCode} для пользователя ${msg.from.id}`);
  } catch (error) {
    logger.error('Ошибка при создании комнаты Шпион:', error);
    bot.sendMessage(chatId, '❌ Не удалось создать комнату. Попробуйте позже.');
  }
});

// Присоединение к комнате
bot.onText(/\/join (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const roomCode = match[1].trim().toUpperCase();
  
  try {
    await axios.post(`http://localhost:3000/api/rooms/${roomCode}/join`, {
      userId: msg.from.id.toString(),
      userName: msg.from.first_name || 'Игрок'
    });
    
    bot.sendMessage(chatId,
      `✅ *Вы присоединились к комнате!*

Код комнаты: \`${roomCode}\`

Перейдите в приложение и введите код комнаты.`,
      { parse_mode: 'Markdown' }
    );
    
    logger.info(`Пользователь ${msg.from.id} присоединился к комнате ${roomCode}`);
  } catch (error) {
    logger.error('Ошибка при присоединении к комнате:', error);
    bot.sendMessage(chatId, `❌ Комната ${roomCode} не найдена или произошла ошибка.`);
  }
});

// Экспорт бота
module.exports = bot;
