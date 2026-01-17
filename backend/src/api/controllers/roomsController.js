const { GameRoom } = require('../models/GameModels');

class RoomsController {
  async getAllRooms(req, res) {
    try {
      const rooms = await GameRoom.getAllActive();
      res.json({
        success: true,
        count: rooms.length,
        rooms: rooms
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async createRoom(req, res) {
    try {
      const { gameType, creator, creatorId, creatorName, maxPlayers } = req.body;
      
      console.log('Получены данные для создания комнаты:', req.body);

      // Поддержка старого и нового формата
      const creatorData = creator || {
        id: creatorId || 'unknown',
        name: creatorName || 'Игрок'
      };

      if (!gameType || !['mafia', 'spy'].includes(gameType)) {
        return res.status(400).json({
          success: false,
          error: 'Неверный тип игры. Допустимые значения: mafia, spy'
        });
      }

      if (!creatorData.id) {
        return res.status(400).json({
          success: false,
          error: 'creator.id или creatorId обязателен'
        });
      }

      const roomData = {
        gameType,
        creator: creatorData,
        players: [{
          id: creatorData.id,
          name: creatorData.name,
          isHost: true,
          isReady: false
        }],
        settings: {
          maxPlayers: maxPlayers || (gameType === 'mafia' ? 10 : 8),
          minPlayers: gameType === 'mafia' ? 4 : 3
        }
      };

      console.log('Создаем комнату с данными:', roomData);
      const room = await GameRoom.create(roomData);

      res.status(201).json({
        success: true,
        room: room,
        id: room.id
      });
    } catch (error) {
      console.error('Ошибка при создании комнаты:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async joinRoom(req, res) {
    try {
      const { id } = req.params;
      const { userId, userName } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId обязателен'
        });
      }

      const room = await GameRoom.getById(id);
      if (!room) {
        return res.status(404).json({
          success: false,
          error: 'Комната не найдена'
        });
      }

      // Проверяем, не присоединился ли уже игрок
      const existingPlayer = room.players.find(p => p.id === userId);
      if (existingPlayer) {
        return res.status(200).json({
          success: true,
          message: 'Игрок уже в комнате',
          room: room
        });
      }

      // Добавляем игрока
      await room.addPlayer({
        id: userId,
        name: userName || 'Игрок',
        isHost: false,
        isReady: false
      });

      const updatedRoom = await GameRoom.getById(id);
      
      res.status(200).json({
        success: true,
        room: updatedRoom
      });
    } catch (error) {
      console.error('Ошибка при присоединении к комнате:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getRoom(req, res) {
    try {
      const { id } = req.params;
      const room = await GameRoom.getById(id);
      
      if (!room) {
        return res.status(404).json({
          success: false,
          error: 'Комната не найдена'
        });
      }
      
      res.status(200).json({
        success: true,
        room: room
      });
    } catch (error) {
      console.error('Ошибка при получении комнаты:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async deleteRoom(req, res) {
    try {
      const { id } = req.params;
      await GameRoom.delete(id);
      
      res.status(200).json({
        success: true,
        message: 'Комната удалена'
      });
    } catch (error) {
      console.error('Ошибка при удалении комнаты:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new RoomsController();
