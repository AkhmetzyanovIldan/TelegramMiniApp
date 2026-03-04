import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  connect(roomId: string, userId: string, username: string): void {
    if (this.socket?.connected) {
      console.log('Socket уже подключен');
      return;
    }

    console.log('Подключение к Socket.IO серверу...', { roomId, userId, username, SOCKET_URL });

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.IO подключен, ID:', this.socket?.id);
      this.socket?.emit('authenticate', { userId });
      this.socket?.emit('join_room', { roomId, userId });
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Ошибка подключения Socket.IO:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('📴 Socket.IO отключен:', reason);
    });

    // Единый обработчик для всех событий
    const events = ['room_update', 'chat_message', 'player_ready', 'game_starting', 'countdown_update', 'game_started'];
    events.forEach(event => {
      this.socket?.on(event, (data: any) => {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
          callbacks.forEach(cb => cb(data));
        }
      });
    });
  }

  sendChatMessage(roomId: string, userId: string, userName: string, message: string): void {
    this.socket?.emit('chat_message', { roomId, userId, userName, message });
  }

  togglePlayerReady(roomId: string, userId: string, isReady: boolean): void {
    this.socket?.emit('player_ready', { roomId, userId, isReady });
  }

  startGame(roomId: string, userId: string): void {
    this.socket?.emit('start_game', { roomId, userId });
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    if (callback) {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
      }
    } else {
      this.listeners.delete(event);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      console.log('👋 Socket.IO отключен');
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default new SocketService();