const { Server } = require('socket.io');
const redis = require('../database/redis-client');
const logger = require('../utils/logger');
const GameRoom = require('../models/GameRoom');

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
              await redis.set(`room:${roomId}`, room, 1800);

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
                await redis.set(`room:${roomId}`, room, 1800);

                io.to(roomId).emit('game_starting', { roomId, countdown: 5 });
                logger.info(`Игра начинается в комнате ${roomId}`);

                // Таймер обратного отсчета
                let countdown = 3;
                const interval = setInterval(async () => {
                  io.to(roomId).emit('countdown_update', { countdown });
                  countdown--;

                  if (countdown < 0) {
                    clearInterval(interval);
                    // Запускаем игровую логику
                    await startGameLogic(roomId);
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

        // Ночное действие (врач, комиссар, дон, мафия)
    socket.on('night_action', async (data) => {
      const { roomId, userId, actionType, targetId } = data;
      if (!roomId || !userId || !actionType) return;

      try {
        const room = await GameRoom.getById(roomId);
        if (!room) return;

        if (room.phase !== 'night') return;

        const player = room.players.find(p => p.id === userId);
        if (!player || !player.isAlive) return;

        // Проверка соответствия роли и действия
        if (actionType === 'heal' && player.role !== 'doctor') return;
        if (actionType === 'investigate' && player.role !== 'sheriff') return;
        if (actionType === 'don_check' && player.role !== 'don') return;
        if (actionType === 'kill' && !['mafia', 'don'].includes(player.role)) return;

        // Сохраняем действие
        if (actionType === 'heal') {
          room.nightActions.heal = targetId;
        } else if (actionType === 'investigate') {
          room.nightActions.investigate = targetId;
          const target = room.players.find(p => p.id === targetId);
          const isMafia = target && ['mafia', 'don'].includes(target.role);
          socket.emit('investigation_result', { targetId, isMafia });
        } else if (actionType === 'don_check') {
          room.nightActions.donCheck = targetId;
          const target = room.players.find(p => p.id === targetId);
          const isSheriff = target && target.role === 'sheriff';
          socket.emit('don_check_result', { targetId, isSheriff });
        } else if (actionType === 'kill') {
          room.nightActions.kills.push(targetId);
        }

        await room.save();
        socket.emit('night_action_ack', { actionType, targetId });
      } catch (error) {
        logger.error('Ошибка в night_action:', error);
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

    async function startGameLogic(roomId) {
    try {
      const room = await GameRoom.getById(roomId);
      if (!room) return;

      const success = room.assignRoles();
      if (!success) {
        io.to(roomId).emit('game_error', { message: 'Недостаточно игроков для распределения ролей' });
        return;
      }

      await room.save();

      // Отправляем каждому игроку его роль
      room.players.forEach(player => {
        io.to(player.id).emit('role_assigned', { role: player.role });
      });

      // Начинаем ночную фазу
      room.phase = 'night';
      room.phaseEndTime = Date.now() + 15000; // 15 секунд на ночь
      room.nightActions = { heal: null, investigate: null, donCheck: null, kills: [] };
      await room.save();

      io.to(roomId).emit('night_start', { phaseEndTime: room.phaseEndTime });

      // Таймер окончания ночи
      setTimeout(async () => {
        await processNight(roomId);
      }, 15000);
    } catch (error) {
      logger.error('Ошибка в startGameLogic:', error);
    }
  }

  async function processNight(roomId) {
    try {
      const room = await GameRoom.getById(roomId);
      if (!room) return;

      const actions = room.nightActions;
      let victim = null;

      // Определяем жертву мафии
      if (actions.kills.length > 0) {
        victim = actions.kills[0]; // упрощённо: первый голос
      }

      // Проверяем лечение
      if (actions.heal && actions.heal === victim) {
        victim = null; // спасли
      }

      // Убиваем жертву
      if (victim) {
        const player = room.players.find(p => p.id === victim);
        if (player) player.isAlive = false;
      }

      // Переходим к дневной фазе
      room.phase = 'day_speech';
      room.phaseEndTime = Date.now() + 15000; // 15 сек на последнее слово
      await room.save();

      io.to(roomId).emit('day_start', {
        victim: victim ? room.players.find(p => p.id === victim)?.name : null,
        phaseEndTime: room.phaseEndTime
      });

      // Здесь будет следующий этап (речи, голосование)
    } catch (error) {
      logger.error('Ошибка в processNight:', error);
    }
  }

  logger.info('WebSocket сервер запущен');
  return io;
};

module.exports = { setupWebSocket };


