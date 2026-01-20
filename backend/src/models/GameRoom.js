const { generateRoomCode } = require('../utils/roomCodeGenerator');
const { redisClient } = require('../config/redis');

class GameRoom {
    constructor(data = {}) {
        this.id = data.id || generateRoomCode();
        this.gameType = data.gameType || 'mafia';
        this.players = data.players || [];
        this.settings = data.settings || {
            maxPlayers: 10,
            minPlayers: 4,
            roundTime: 60,
            discussionTime: 120
        };
        this.messages = data.messages || [];
        this.createdAt = data.createdAt || new Date().toISOString();
        this.status = data.status || 'waiting';
    }

    static async create(data) {
        try {
            const room = new GameRoom(data);

            if (data.creator) {
                room.players.push({
                    id: data.creator.id,
                    name: data.creator.name,
                    isHost: true,
                    isReady: false,
                    role: null,
                    isAlive: true
                });
            }

            await room.save();
            return room;
        } catch (error) {
            console.error('❌ Ошибка при создании комнаты:', error);
            throw error;
        }
    }

    static async getById(roomId) {
        try {
            const roomData = await redisClient.get(`room:${roomId}`);
            if (!roomData) return null;

            const parsedData = JSON.parse(roomData);
            return new GameRoom(parsedData);
        } catch (error) {
            console.error(`❌ Ошибка при получении комнаты ${roomId}:`, error);
            return null;
        }
    }

    async save() {
        try {
            const roomKey = `room:${this.id}`;
            const serializedData = JSON.stringify({
                id: this.id,
                gameType: this.gameType,
                players: this.players,
                settings: this.settings,
                messages: this.messages,
                createdAt: this.createdAt,
                status: this.status
            });

            await redisClient.set(roomKey, serializedData);
            console.log(`✅ Комната ${this.id} сохранена в Redis`);
            return true;
        } catch (error) {
            console.error(`❌ Ошибка сохранения комнаты ${this.id}:`, error);
            return false;
        }
    }

    async update(updates) {
        try {
            Object.assign(this, updates);
            await this.save();
            return true;
        } catch (error) {
            console.error(`❌ Ошибка обновления комнаты ${this.id}:`, error);
            return false;
        }
    }

    async addMessage(userId, userName, text) {
        try {
            this.messages.push({
                id: Date.now().toString(),
                userId,
                userName,
                text,
                timestamp: new Date().toISOString()
            });

            if (this.messages.length > 100) {
                this.messages = this.messages.slice(-100);
            }

            await this.save();
            return true;
        } catch (error) {
            console.error(`❌ Ошибка добавления сообщения в комнату ${this.id}:`, error);
            return false;
        }
    }

    async togglePlayerReady(userId) {
        try {
            const player = this.players.find(p => p.id === userId);
            if (player) {
                player.isReady = !player.isReady;
                await this.save();
                return player.isReady;
            }
            return false;
        } catch (error) {
            console.error(`❌ Ошибка обновления готовности игрока ${userId}:`, error);
            throw error;
        }
    }

    async removePlayer(userId) {
        try {
            this.players = this.players.filter(p => p.id !== userId);

            if (this.players.length === 0) {
                await redisClient.del(`room:${this.id}`);
                return 'deleted';
            }

            const wasHost = this.players.find(p => p.id === userId)?.isHost;
            if (wasHost && this.players.length > 0) {
                this.players[0].isHost = true;
            }

            await this.save();
            return 'updated';
        } catch (error) {
            console.error(`❌ Ошибка удаления игрока ${userId}:`, error);
            throw error;
        }
    }

    async removeDisconnectedPlayer(userId) {
        try {
            const playerIndex = this.players.findIndex(p => p.id === userId);
            if (playerIndex !== -1) {
                const player = this.players[playerIndex];
                
                // Если игрок - хост, передаем хостство следующему игроку
                if (player.isHost && this.players.length > 1) {
                    const nextPlayerIndex = playerIndex === 0 ? 1 : 0;
                    this.players[nextPlayerIndex].isHost = true;
                }
                
                // Удаляем игрока
                this.players.splice(playerIndex, 1);
                
                // Если комната пуста - удаляем ее
                if (this.players.length === 0) {
                    await redisClient.del(`room:${this.id}`);
                    console.log(`Комната ${this.id} удалена (нет игроков)`);
                    return 'deleted';
                }
                
                await this.save();
                console.log(`Игрок ${userId} удален из комнаты ${this.id}`);
                return 'removed';
            }
            return 'not_found';
        } catch (error) {
            console.error(`❌ Ошибка удаления игрока ${userId}:`, error);
            throw error;
        }
    }
}

module.exports = GameRoom;
