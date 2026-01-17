require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

// ========== ПРОВЕРКА ТОКЕНА ==========
const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_USERNAME = process.env.BOT_USERNAME || 'SocialGamesHubBot';

if (!BOT_TOKEN || BOT_TOKEN.includes('ВАШ_ТОКЕН')) {
  console.error('❌ ОШИБКА: BOT_TOKEN не настроен в .env файле!');
  console.log('==========================================');
  console.log('1. Откройте файл .env в корне проекта');
  console.log('2. Замените ВАШ_ТОКЕН на реальный токен');
  console.log('3. Получите токен у @BotFather:');
  console.log('   - Напишите /mybots');
  console.log('   - Выберите бота');
  console.log('   - Нажмите "API Token"');
  console.log('==========================================');
  process.exit(1);
}

// ========== СОЗДАНИЕ БОТА ==========
console.log('🤖 Запуск Telegram бота...');
console.log(`📱 Бот: @${BOT_USERNAME}`);

const bot = new TelegramBot(BOT_TOKEN, {
  polling: {
    interval: 300,
    autoStart: true,
    params: {
      timeout: 10
    }
  }
});

// ========== ПЕРЕМЕННЫЕ ДЛЯ ИГР ==========
// Временное хранилище комнат (потом заменим на Redis)
const gameRooms = new Map();

// ========== КОМАНДА /START ==========
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const user = msg.from;
  const userName = user.first_name || 'Игрок';
  
  console.log(`🚀 /start от ${userName} (ID: ${user.id})`);
  
  // Проверяем, есть ли параметр приглашения (например, /start join_ABC123)
  const params = msg.text.split(' ');
  if (params.length > 1 && params[1].startsWith('join_')) {
    const roomId = params[1].replace('join_', '').toUpperCase();
    handleJoinRoom(chatId, user, roomId);
    return;
  }
  
  // Основное меню
  const welcomeText = `🎮 *Добро пожаловать, ${userName}!*

Я — *Social Games Hub*, бот для увлекательных социальных игр прямо в Telegram!

✨ *Что умею:*
• 🎭 Создавать комнаты для игры в *Мафию*
• 🕵️ Организовывать игру в *Шпиона*
• 👥 Поддерживать до 12 игроков одновременно
• ⚡ Работать быстро и без лагов

Выберите действие:`;
  
  bot.sendMessage(chatId, welcomeText, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🎭 Создать Мафию', callback_data: 'create_mafia' },
          { text: '🕵️ Создать Шпиона', callback_data: 'create_spy' }
        ],
        [
          { text: '📖 Правила игр', callback_data: 'show_rules' },
          { text: '👥 Пригласить друзей', callback_data: 'invite_friends' }
        ],
        [
          { text: '⚙️ Настройки', callback_data: 'settings' },
          { text: '❓ Помощь', callback_data: 'help' }
        ]
      ]
    }
  });
});

// ========== КОМАНДА /MAFIA ==========
bot.onText(/\/mafia/, (msg) => {
  createGameRoom(msg, 'mafia');
});

// ========== КОМАНДА /SPY ==========
bot.onText(/\/spy/, (msg) => {
  createGameRoom(msg, 'spy');
});

// ========== КОМАНДА /HELP ==========
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  const helpText = `🆘 *Помощь по боту*

*Основные команды:*
/start — Главное меню
/mafia — Быстро создать Мафию
/spy — Быстро создать Шпиона
/help — Эта справка
/rules — Правила игр

*Как создать игру?*
1\\. Нажмите "Создать Мафию" или "Создать Шпиона"
2\\. Скопируйте код комнаты
3\\. Отправьте друзьям ссылку-приглашение
4\\. Когда все готовы — начинайте игру\\!

*Проблемы?*
• Бот не отвечает — отправьте /start заново
• Не приходит сообщение — проверьте интернет
• Другая проблема — @ваш\\_username\\_для\\_поддержки`;

  bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
});

// ========== КОМАНДА /RULES ==========
bot.onText(/\/rules/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, '📚 Выберите игру для просмотра правил:', {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🎭 Правила Мафии', callback_data: 'rules_mafia' },
          { text: '🕵️ Правила Шпиона', callback_data: 'rules_spy' }
        ],
        [
          { text: '🔙 Назад в меню', callback_data: 'back_to_main' }
        ]
      ]
    }
  });
});

// ========== ОБРАБОТКА CALLBACK-КНОПОК ==========
bot.on('callback_query', async (callbackQuery) => {
  const msg = callbackQuery.message;
  const data = callbackQuery.data;
  const user = callbackQuery.from;
  const chatId = msg.chat.id;
  
  console.log(`🔘 Callback: ${data} от ${user.first_name}`);
  
  try {
    // Создание игр
    if (data === 'create_mafia') {
      await createGameRoom(msg, 'mafia');
    }
    else if (data === 'create_spy') {
      await createGameRoom(msg, 'spy');
    }
    
    // Правила
    else if (data === 'show_rules') {
      await bot.editMessageText('📚 Выберите игру для просмотра правил:', {
        chat_id: chatId,
        message_id: msg.message_id,
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🎭 Правила Мафии', callback_data: 'rules_mafia' },
              { text: '🕵️ Правила Шпиона', callback_data: 'rules_spy' }
            ],
            [
              { text: '🔙 Назад', callback_data: 'back_to_main' }
            ]
          ]
        }
      });
    }
    else if (data === 'rules_mafia') {
      await bot.editMessageText(`🎭 *ПРАВИЛА МАФИИ*

*Цель игры:*
Мафия должна устранить всех мирных жителей.
Мирные должны вычислить и устранить мафию.

*Роли:*
• 🕶️ Мафия (1/3 игроков) — знают друг друга
• 👮 Шериф (1) — ночью проверяет игроков
• 🩺 Доктор (если игроков ≥6) — лечит ночью
• 👨‍🌾 Мирные — обычные жители

*Ход игры:*
1. 🌙 Ночь — мафия убивает, шериф проверяет
2. ☀️ День — обсуждение и голосование
3. Повтор до победы одной из команд

*Для победы нужно:*
✓ Мафия: мафиози ≥ мирных жителей
✓ Мирные: вся мафия устранена`, {
        chat_id: chatId,
        message_id: msg.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🕵️ Правила Шпиона', callback_data: 'rules_spy' }
            ],
            [
              { text: '🔙 Назад', callback_data: 'show_rules' },
              { text: '🎮 Создать игру', callback_data: 'create_mafia' }
            ]
          ]
        }
      });
    }
    else if (data === 'rules_spy') {
      await bot.editMessageText(`🕵️ *ПРАВИЛА ШПИОНА*

*Цель игры:*
Игроки должны вычислить шпиона.
Шпион должен угадать локацию.

*Подготовка:*
1. Все игроки (кроме шпиона) получают одинаковую локацию
2. Шпион НЕ знает локацию
3. Локация выбирается случайно

*Пример локаций:*
• 🍽️ Ресторан
• ✈️ Аэропорт
• 🏥 Больница
• 🏫 Школа

*Ход игры:*
1. Игроки по кругу задают вопросы о локации
2. Вопросы не должны раскрывать локацию прямо
3. Пример: "Часто ли там платят деньги?"
4. После раунда — голосование за шпиона

*Для победы нужно:*
✓ Игроки: правильно угадать шпиона
✓ Шпион: правильно угадать локацию`, {
        chat_id: chatId,
        message_id: msg.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🎭 Правила Мафии', callback_data: 'rules_mafia' }
            ],
            [
              { text: '🔙 Назад', callback_data: 'show_rules' },
              { text: '🎮 Создать игру', callback_data: 'create_spy' }
            ]
          ]
        }
      });
    }
    
    // Приглашение друзей
    else if (data === 'invite_friends') {
      const inviteText = `👥 *Пригласить друзей*

Поделитесь ссылкой на бота:
\`https://t.me/${BOT_USERNAME}\`

Или создайте комнату и отправьте друзьям код комнаты. Они смогут присоединиться по команде:
\`/start join_КОД_КОМНАТЫ\``;
      
      await bot.editMessageText(inviteText, {
        chat_id: chatId,
        message_id: msg.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { 
                text: '📤 Поделиться ботом', 
                switch_inline_query: 'Играй в Мафию и Шпиона в Telegram!'
              }
            ],
            [
              { text: '🔙 Назад', callback_data: 'back_to_main' }
            ]
          ]
        }
      });
    }
    
    // Назад в главное меню
    else if (data === 'back_to_main') {
      const userName = user.first_name || 'Игрок';
      await bot.editMessageText(`🎮 *Добро пожаловать, ${userName}!*\n\nВыберите действие:`, {
        chat_id: chatId,
        message_id: msg.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🎭 Создать Мафию', callback_data: 'create_mafia' },
              { text: '🕵️ Создать Шпиона', callback_data: 'create_spy' }
            ],
            [
              { text: '📖 Правила игр', callback_data: 'show_rules' },
              { text: '👥 Приглашить друзей', callback_data: 'invite_friends' }
            ]
          ]
        }
      });
    }
    
    // Помощь
    else if (data === 'help') {
      await bot.sendMessage(chatId, 'Напишите /help для подробной справки');
    }
    
    // Подтверждаем обработку callback
    await bot.answerCallbackQuery(callbackQuery.id);
    
  } catch (error) {
    console.error('Ошибка в callback:', error);
    bot.answerCallbackQuery(callbackQuery.id, {
      text: 'Произошла ошибка'
    });
  }
});

// ========== ФУНКЦИЯ СОЗДАНИЯ КОМНАТЫ ==========
async function createGameRoom(msg, gameType) {
  const chatId = msg.chat.id;
  const user = msg.from;
  const userName = user.first_name || 'Игрок';
  
  try {
    // Генерируем уникальный код комнаты
    const roomId = generateRoomCode();
    const gameName = gameType === 'mafia' ? '🎭 Мафия' : '🕵️ Шпион';
    
    // Создаем комнату
    const room = {
      id: roomId,
      gameType: gameType,
      creatorId: user.id,
      creatorName: userName,
      players: [{
        id: user.id,
        name: userName,
        isHost: true,
        isReady: true
      }],
      status: 'waiting',
      createdAt: new Date(),
      maxPlayers: gameType === 'mafia' ? 12 : 8,
      minPlayers: gameType === 'mafia' ? 4 : 3
    };
    
    // Сохраняем комнату
    gameRooms.set(roomId, room);
    console.log(`✅ Создана комната ${roomId} (${gameType}) от ${userName}`);
    
    // Отправляем сообщение о создании
    const roomMessage = `${gameName} *создана!*

*Код комнаты:* \`${roomId}\`
*Создатель:* ${userName}
*Игроков:* 1/${room.maxPlayers}
*Статус:* Ожидание игроков ⏳

*Чтобы присоединиться:*
1. Отправьте друзьям этот код: \`${roomId}\`
2. Или отправьте им ссылку ниже
3. Когда все присоединятся — начните игру!`;
    
    await bot.sendMessage(chatId, roomMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { 
              text: '📤 Пригласить друзей', 
              callback_data: `invite_${roomId}` 
            },
            { 
              text: '👥 Список игроков', 
              callback_data: `players_${roomId}` 
            }
          ],
          [
            { 
              text: '▶️ Начать игру', 
              callback_data: `start_${roomId}` 
            },
            { 
              text: '❌ Отменить', 
              callback_data: `cancel_${roomId}` 
            }
          ]
        ]
      }
    });
    
    // Отдельное сообщение с ссылкой для приглашения
    const inviteLink = `https://t.me/${BOT_USERNAME}?start=join_${roomId}`;
    
    await bot.sendMessage(chatId, `🔗 *Ссылка для приглашения:*
\`${inviteLink}\`

Отправьте эту ссылку друзьям, чтобы они могли присоединиться одним кликом!`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { 
            text: '📤 Поделиться приглашением', 
            switch_inline_query: `Присоединяйся к игре в ${gameName}! Код комнаты: ${roomId}` 
          }
        ]]
      }
    });
    
  } catch (error) {
    console.error('Ошибка создания комнаты:', error);
    bot.sendMessage(chatId, '❌ Не удалось создать комнату. Попробуйте еще раз.');
  }
}

// ========== ФУНКЦИЯ ПРИСОЕДИНЕНИЯ К КОМНАТЕ ==========
function handleJoinRoom(chatId, user, roomId) {
  const room = gameRooms.get(roomId);
  
  if (!room) {
    bot.sendMessage(chatId, `❌ Комната \`${roomId}\` не найдена.\nВозможно, она была удалена или игра уже началась.`, {
      parse_mode: 'Markdown'
    });
    return;
  }
  
  if (room.status !== 'waiting') {
    bot.sendMessage(chatId, '❌ Игра уже началась. Присоединиться нельзя.');
    return;
  }
  
  // Проверяем, не присоединился ли уже
  const alreadyJoined = room.players.find(p => p.id === user.id);
  if (alreadyJoined) {
    bot.sendMessage(chatId, '✅ Вы уже в этой комнате.');
    return;
  }
  
  // Проверяем, есть ли место
  if (room.players.length >= room.maxPlayers) {
    bot.sendMessage(chatId, `❌ Комната заполнена (${room.maxPlayers}/${room.maxPlayers} игроков).`);
    return;
  }
  
  // Добавляем игрока
  const userName = user.first_name || 'Игрок';
  room.players.push({
    id: user.id,
    name: userName,
    isHost: false,
    isReady: false
  });
  
  console.log(`✅ Игрок ${userName} присоединился к комнате ${roomId}`);
  
  // Приветствуем нового игрока
  const gameName = room.gameType === 'mafia' ? '🎭 Мафия' : '🕵️ Шпион';
  
  bot.sendMessage(chatId, `👋 *Добро пожаловать, ${userName}!*

Вы присоединились к комнате:
*Игра:* ${gameName}
*Код:* \`${roomId}\`
*Игроков:* ${room.players.length}/${room.maxPlayers}
*Создатель:* ${room.creatorName}

Ожидайте начала игры от создателя комнаты!`, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Я готов', callback_data: `ready_${roomId}_${user.id}` },
          { text: '⏸️ Не готов', callback_data: `unready_${roomId}_${user.id}` }
        ],
        [
          { text: '👥 Список игроков', callback_data: `players_${roomId}` },
          { text: '🚪 Покинуть комнату', callback_data: `leave_${roomId}` }
        ]
      ]
    }
  });
  
  // Уведомляем создателя комнаты о новом игроке
  bot.sendMessage(chatId, `*📢 Уведомление для создателя комнаты ${roomId}:*
Новый игрок присоединился: ${userName}
Теперь игроков: ${room.players.length}/${room.maxPlayers}`, {
    parse_mode: 'Markdown'
  }).catch(err => {
    // Игнорируем ошибку, если создатель отписался от бота
  });
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Без 0, O, I, 1 для избежания путаницы
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ========== ЛОГИРОВАНИЕ ==========
bot.on('polling_error', (error) => {
  console.error('❌ Ошибка polling:', error.message);
});

bot.on('webhook_error', (error) => {
  console.error('❌ Ошибка webhook:', error.message);
});

// ========== ЗАПУСК ==========
console.log('==========================================');
console.log('✅ Бот успешно запущен!');
console.log(`🤖 Username: @${BOT_USERNAME}`);
console.log('📝 Команды для тестирования:');
console.log('   /start - Главное меню');
console.log('   /mafia - Создать Мафию');
console.log('   /spy - Создать Шпиона');
console.log('   /help - Помощь');
console.log('   /rules - Правила игр');
console.log('==========================================');