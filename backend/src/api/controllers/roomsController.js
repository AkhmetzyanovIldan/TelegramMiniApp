const GameRoom = require('../../models/GameRoom');

class RoomsController {
  async getAllRooms(req, res) {
    try {
      const rooms = await GameRoom.getAllActive();
      res.json({
        success: true,
        rooms
      });
    } catch (error) {
      console.error('Ошибка при получении комнат:', error);
      res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера'
      });
    }
  }

  async createRoom(req, res) {
    try {
      const { gameType, maxPlayers = 10, creatorId, creatorName } = req.body;
      
      console.log('Получены данные для создания комнаты:', {
        gameType,
        maxPlayers,
        creatorId,
        creatorName
      });

      if (!gameType || !creatorId || !creatorName) {
        return res.status(400).json({
          success: false,
          error: 'Не указаны обязательные поля: gameType, creatorId, creatorName'
        });
      }

      const room = await GameRoom.create({
        gameType,
        creator: { id: creatorId, name: creatorName },
        settings: {
          maxPlayers: maxPlayers || (gameType === 'mafia' ? 10 : 8),
          minPlayers: gameType === 'mafia' ? 4 : 3
        }
      });

      console.log('Создаем комнату с данными:', {
        gameType: room.gameType,
        creator: room.players.find(p => p.isHost),
        players: room.players,
        settings: room.settings
      });

      res.status(201).json({
        success: true,
        roomId: room.id,
        roomCode: room.id,
        message: 'Комната создана успешно'
      });
    } catch (error) {
      console.error('Ошибка при создании комнаты:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Внутренняя ошибка сервера'
      });
    }
  }

  async getRoom(req, res) {
    try {
      const { id } = req.params;
      
      console.log(`Запрос комнаты: ${id}`);
      
      const room = await GameRoom.getById(id);
      
      if (!room) {
        return res.status(404).json({
          success: false,
          error: 'Комната не найдена'
        });
      }

      res.json({
        success: true,
        room: {
          id: room.id,
          gameType: room.gameType,
          players: room.players,
          settings: room.settings,
          messages: room.messages || [],
          createdAt: room.createdAt,
          status: room.status || 'waiting'
        }
      });
    } catch (error) {
      console.error(`Ошибка при получении комнаты ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        error: error.message || 'Внутренняя ошибка сервера'
      });
    }
  }

    async joinRoom(req, res) {
    try {
      const { id } = req.params;
      const { userId, userName } = req.body;

      console.log('Запрос присоединения:', { roomId: id, userId, userName });

      if (!userId || !userName) {
        return res.status(400).json({
          success: false,
          error: 'Не указаны userId и userName'
        });
      }

      const room = await GameRoom.getById(id);
      if (!room) {
        return res.status(404).json({
          success: false,
          error: 'Комната не найдена'
        });
      }

      // Проверяем, есть ли уже пользователь в комнате
      const existingPlayer = room.players.find(p => p.id === userId);
      if (existingPlayer) {
        console.log('Пользователь уже в комнате:', { userId, userName });
        return res.json({
          success: true,
          roomId: room.id,
          message: 'Вы уже в комнате',
          isAlreadyMember: true
        });
      }

      // Проверяем максимальное количество игроков
      if (room.players.length >= (room.settings?.maxPlayers || 10)) {
        return res.status(400).json({
          success: false,
          error: 'Комната заполнена'
        });
      }

      // Добавляем нового игрока
      room.players.push({
        id: userId,
        name: userName,
        isHost: false,
        isReady: false,
        isAlive: true
      });

      await room.save();

      console.log('Новый игрок добавлен:', { userId, userName, totalPlayers: room.players.length });

      res.json({
        success: true,
        roomId: room.id,
        message: 'Вы присоединились к комнате',
        isAlreadyMember: false
      });
    } catch (error) {
      console.error('Ошибка при присоединении к комнате:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Внутренняя ошибка сервера'
      });
    }
  }

  async deleteRoom(req, res) {
    try {
      const { id } = req.params;
      
      const { redisClient } = require('../../config/redis');
      await redisClient.del(`room:${id}`);
      
      res.json({
        success: true,
        message: 'Комната удалена'
      });
    } catch (error) {
      console.error('Ошибка при удалении комнаты:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Внутренняя ошибка сервера'
      });
    }
  }
}

module.exports = new RoomsController();

