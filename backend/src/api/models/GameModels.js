const redis = require('../../database/redis-client');
const { generateRoomCode } = require('../utils/roomUtils');

class GameRoom {
  static async create(roomData) {
    const roomId = generateRoomCode();
    const room = {
      id: roomId,
      ...roomData,
      status: 'waiting',
      createdAt: new Date().toISOString()
    };

    // Сохраняем в Redis
    await redis.setex(`room:${roomId}`, 1800, JSON.stringify(room));
    await redis.sadd('rooms:active', roomId);
    
    console.log(`Комната ${roomId} создана и сохранена в Redis`);
    return room;
  }

  static async getById(roomId) {
    try {
      const roomData = await redis.get(`room:${roomId}`);
      if (!roomData) return null;
      
      return JSON.parse(roomData);
    } catch (error) {
      console.error('Ошибка при получении комнаты из Redis:', error);
      return null;
    }
  }

  static async getAllActive() {
    try {
      const roomIds = await redis.smembers('rooms:active');
      const rooms = [];
      
      for (const roomId of roomIds) {
        const roomData = await redis.get(`room:${roomId}`);
        if (roomData) {
          const room = JSON.parse(roomData);
          rooms.push({
            id: room.id,
            gameType: room.gameType,
            playersCount: room.players?.length || 0,
            maxPlayers: room.settings?.maxPlayers || 10,
            status: room.status,
            hostName: room.players?.find(p => p.isHost)?.name || 'Хост'
          });
        }
      }
      
      return rooms;
    } catch (error) {
      console.error('Ошибка при получении списка комнат:', error);
      return [];
    }
  }

  static async addPlayer(roomId, playerData) {
    try {
      const room = await this.getById(roomId);
      if (!room) throw new Error('Комната не найдена');
      
      room.players = room.players || [];
      room.players.push({
        ...playerData,
        joinedAt: new Date().toISOString()
      });
      
      await redis.setex(`room:${roomId}`, 1800, JSON.stringify(room));
      return room;
    } catch (error) {
      console.error('Ошибка при добавлении игрока:', error);
      throw error;
    }
  }

  static async delete(roomId) {
    try {
      await redis.del(`room:${roomId}`);
      await redis.srem('rooms:active', roomId);
      return true;
    } catch (error) {
      console.error('Ошибка при удалении комнаты:', error);
      throw error;
    }
  }

  static async update(roomId, updates) {
    try {
      const room = await this.getById(roomId);
      if (!room) throw new Error('Комната не найдена');
      
      const updatedRoom = { ...room, ...updates };
      await redis.setex(`room:${roomId}`, 1800, JSON.stringify(updatedRoom));
      
      return updatedRoom;
    } catch (error) {
      console.error('Ошибка при обновлении комнаты:', error);
      throw error;
    }
  }
}

module.exports = { GameRoom };
