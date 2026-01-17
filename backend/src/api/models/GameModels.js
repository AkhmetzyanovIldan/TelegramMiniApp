// src/api/models/GameModels.js
const redisClient = require('../../database/redis-client');

class GameRoom {
  static async create(roomData) {
    const roomId = this.generateRoomCode();
    const room = {
      id: roomId,
      ...roomData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'waiting'
    };
    
    await redisClient.setRoom(roomId, room);
    return room;
  }
  
  static async findById(roomId) {
    return await redisClient.getRoom(roomId);
  }
  
  static async update(roomId, updates) {
    const room = await this.findById(roomId);
    if (!room) return null;
    
    const updatedRoom = {
      ...room,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await redisClient.setRoom(roomId, updatedRoom);
    return updatedRoom;
  }
  
  static async delete(roomId) {
    return await redisClient.deleteRoom(roomId);
  }
  
  static async addPlayer(roomId, player) {
    const room = await this.findById(roomId);
    if (!room) return null;
    
    // Проверяем, не присоединился ли уже
    const alreadyJoined = room.players?.find(p => p.id === player.id);
    if (alreadyJoined) return room;
    
    // Добавляем игрока
    room.players = room.players || [];
    room.players.push({
      ...player,
      joinedAt: new Date().toISOString(),
      isReady: false
    });
    
    room.updatedAt = new Date().toISOString();
    await redisClient.setRoom(roomId, room);
    return room;
  }
  
  static async removePlayer(roomId, userId) {
    const room = await this.findById(roomId);
    if (!room || !room.players) return room;
    
    room.players = room.players.filter(p => p.id !== userId);
    room.updatedAt = new Date().toISOString();
    await redisClient.setRoom(roomId, room);
    return room;
  }
  
  static generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
  
  static async getAllActive() {
    try {
      // Получаем все ключи комнат
      const keys = await redisClient.keys('room:*');
      const rooms = [];
      
      for (const key of keys) {
        const room = await redisClient.get(key);
        if (room && room.status === 'waiting') {
          rooms.push(room);
        }
      }
      
      return rooms;
    } catch (error) {
      console.error('Error getting active rooms:', error);
      return [];
    }
  }
}

module.exports = { GameRoom };
