const { Server } = require('socket.io');
const redis = require('../database/redis-client');
const logger = require('../utils/logger');

let io;

const setupWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Новое WebSocket подключение: ${socket.id}`);

    // Храним ID пользователя для этого сокета
    let currentUserId = null;
    let currentRoomId = null;

    // Аутентификация
    socket.on('authenticate', async (data) => {
      const { userId } = data;
      if (userId) {
        currentUserId = userId;
        socket.userId = userId;
        logger.info(`Пользователь аутентифицирован: ${userId}`);
        
        // Проверяем, есть ли у пользователя другие активные соединения
        try {
          const sockets = await io.in(userId).fetchSockets();
          if (sockets.length > 1) {
            // Уведомляем о новом подключении
            logger.info(`Пользователь ${userId} переподключился`);
          }
        } catch (error) {
          logger.error('Ошибка проверки активных соединений:', error);
        }
      }
    });

    // Присоединение к комнате
    socket.on('join_room', async (data) => {
      const { roomId, userId } = data;
      if (roomId) {
        // Выходим из предыдущей комнаты если были там
        if (currentRoomId) {
          socket.leave(currentRoomId);
        }
        
        socket.join(roomId);
        currentRoomId = roomId;
        socket.roomId = roomId;

        logger.info(`Пользователь ${userId} присоединился к комнате ${roomId}`);

        // Обновляем комнату в Redis
        try {
          const roomData = await redis.get(`room:${roomId}`);
          if (roomData) {
            const room = roomData;
            io.to(roomId).emit('room_update', room);
          }
        } catch (error) {
          logger.error('Ошибка при обновлении комнаты:', error);
        }
      }
    });

    // Сообщения чата
    socket.on('chat_message', (data) => {
      const { roomId, userId, userName, message } = data;
      if (roomId && message) {
        const chatMessage = {
          userId,
          userName,
          message,
          timestamp: new Date().toISOString()
        };

        io.to(roomId).emit('chat_message', chatMessage);
        logger.info(`Чат сообщение в комнате ${roomId} от ${userName}: ${message}`);
      }
    });

    // Готовность игрока
    socket.on('player_ready', async (data) => {
      const { roomId, userId, isReady } = data;
      if (roomId && userId) {
        try {
          const roomData = await redis.get(`room:${roomId}`);
          if (roomData) {
            const room = roomData;
            const playerIndex = room.players.findIndex(p => p.id === userId);

            if (playerIndex !== -1) {
              room.players[playerIndex].isReady = isReady;
              await redis.setex(`room:${roomId}`, 1800, JSON.stringify(room));

              io.to(roomId).emit('room_update', room);
              io.to(roomId).emit('player_ready', { userId, userName: room.players[playerIndex].name, isReady });

              logger.info(`Игрок ${userId} ${isReady ? 'готов' : 'не готов'} в комнате ${roomId}`);
            }
          }
        } catch (error) {
          logger.error('Ошибка при обновлении готовности:', error);
        }
      }
    });

    // Начать игру
    socket.on('start_game', async (data) => {
      const { roomId, userId } = data;
      if (roomId && userId) {
        try {
          const roomData = await redis.get(`room:${roomId}`);
          if (roomData) {
            const room = roomData;

            // Проверяем что пользователь - хост
            const player = room.players.find(p => p.id === userId);
            if (player && player.isHost) {
              // Проверяем что все готовы
              const allReady = room.players.every(p => p.isReady);
              if (allReady && room.players.length >= 4) {
                room.status = 'starting';
                await redis.setex(`room:${roomId}`, 1800, JSON.stringify(room));

                io.to(roomId).emit('game_starting', { roomId, countdown: 5 });
                logger.info(`Игра начинается в комнате ${roomId}`);

                // Таймер обратного отсчета
                let countdown = 5;
                const interval = setInterval(() => {
                  io.to(roomId).emit('countdown_update', { countdown });
                  countdown--;

                  if (countdown < 0) {
                    clearInterval(interval);
                    // Здесь будет логика распределения ролей
                    io.to(roomId).emit('game_started', {
                      roomId,
                      gameType: room.gameType,
                      players: room.players
                    });
                  }
                }, 1000);
              }
            }
          }
        } catch (error) {
          logger.error('Ошибка при старте игры:', error);
        }
      }
    });

    // Отключение
    socket.on('disconnect', () => {
      logger.info(`WebSocket отключен: ${socket.id}`);
      
      // Здесь можно добавить логику удаления игрока при отключении
      // Но лучше делать это по таймауту, а не сразу
    });

    // Ошибки
    socket.on('error', (error) => {
      logger.error(`WebSocket ошибка: ${error}`);
    });
  });

  logger.info('WebSocket сервер запущен');
  return io;
};

module.exports = { setupWebSocket };

