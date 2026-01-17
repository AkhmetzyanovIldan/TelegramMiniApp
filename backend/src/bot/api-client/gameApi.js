// src/bot/api-client/gameApi.js
const axios = require('axios');

class GameApiClient {
  constructor() {
    this.baseURL = process.env.API_URL || 'http://localhost:3000/api';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Создать комнату
  async createRoom(gameType, creator) {
    try {
      const response = await this.client.post('/rooms', {
        gameType,
        creator,
        settings: {
          maxPlayers: gameType === 'mafia' ? 12 : 8,
          minPlayers: gameType === 'mafia' ? 4 : 3
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('API Error creating room:', error.response?.data || error.message);
      throw error;
    }
  }

  // Получить информацию о комнате
  async getRoom(roomId) {
    try {
      const response = await this.client.get(`/rooms/${roomId}`);
      return response.data;
    } catch (error) {
      console.error('API Error getting room:', error.response?.data || error.message);
      throw error;
    }
  }

  // Присоединиться к комнате
  async joinRoom(roomId, player) {
    try {
      const response = await this.client.post(`/rooms/${roomId}/join`, {
        player
      });
      return response.data;
    } catch (error) {
      console.error('API Error joining room:', error.response?.data || error.message);
      throw error;
    }
  }

  // Получить все активные комнаты
  async getActiveRooms() {
    try {
      const response = await this.client.get('/rooms');
      return response.data;
    } catch (error) {
      console.error('API Error getting rooms:', error.response?.data || error.message);
      throw error;
    }
  }

  // Удалить комнату
  async deleteRoom(roomId, userId) {
    try {
      const response = await this.client.delete(`/rooms/${roomId}`, {
        data: { userId }
      });
      return response.data;
    } catch (error) {
      console.error('API Error deleting room:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new GameApiClient();
