// src/database/redis-client.js
const Redis = require('ioredis');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  // Подключение к Redis
  async connect() {
    if (!this.client || !this.isConnected) {
      console.log('🔗 Подключение к Redis...');
      
      this.client = new Redis({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
        retryStrategy: function(times) {
          const delay = Math.min(times * 50, 2000);
          console.log(`♻️ Переподключение к Redis через ${delay}ms...`);
          return delay;
        },
        maxRetriesPerRequest: 3
      });

      // Обработчики событий
      this.client.on('connect', () => {
        console.log('✅ Redis подключен!');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis ошибка:', err.message);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('⚠️ Redis соединение закрыто');
        this.isConnected = false;
      });

      // Ждем подключения
      await this.client.ping();
    }
    
    return this.client;
  }

  // Проверка подключения
  async ping() {
    try {
      if (!this.client || !this.isConnected) {
        await this.connect();
      }
      const result = await this.client.ping();
      return result === 'PONG' ? 'connected' : 'error';
    } catch (error) {
      return 'disconnected: ' + error.message;
    }
  }

  // Установить значение
  async set(key, value, ttl = null) {
    try {
      if (!this.isConnected) await this.connect();
      
      const stringValue = JSON.stringify(value);
      if (ttl) {
        return await this.client.setex(key, ttl, stringValue);
      } else {
        return await this.client.set(key, stringValue);
      }
    } catch (error) {
      console.error('Redis set error:', error);
      throw error;
    }
  }

  // Получить значение
  async get(key) {
    try {
      if (!this.isConnected) await this.connect();
      
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      throw error;
    }
  }

  // Удалить ключ
  async del(key) {
    try {
      if (!this.isConnected) await this.connect();
      return await this.client.del(key);
    } catch (error) {
      console.error('Redis del error:', error);
      throw error;
    }
  }

  // Получить все ключи по шаблону
  async keys(pattern) {
    try {
      if (!this.isConnected) await this.connect();
      return await this.client.keys(pattern);
    } catch (error) {
      console.error('Redis keys error:', error);
      return [];
    }
  }

  // Методы для комнат
  async setRoom(roomId, roomData) {
    return await this.set(`room:${roomId}`, roomData);
  }

  async getRoom(roomId) {
    return await this.get(`room:${roomId}`);
  }

  async deleteRoom(roomId) {
    return await this.del(`room:${roomId}`);
  }

  // Получить все комнаты
  async getAllRooms() {
    try {
      const keys = await this.keys('room:*');
      const rooms = [];
      
      for (const key of keys) {
        const room = await this.get(key);
        if (room) {
          rooms.push(room);
        }
      }
      
      return rooms;
    } catch (error) {
      console.error('Error getting all rooms:', error);
      return [];
    }
  }
}

// Экспортируем экземпляр класса
module.exports = new RedisClient();
