import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, (...args: any[]) => void> = new Map();

  connect(roomId: string, userId: string, username: string): void {
    if (this.socket?.connected) {
      console.log('Socket уже подключен');
      return;
    }

    console.log('Подключение к Socket.IO серверу...', { roomId, userId, username });

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.IO подключен, ID:', this.socket?.id);
      
      // Аутентификация
      this.socket?.emit('authenticate', { userId });
      
      // Присоединение к комнате
      this.socket?.emit('join_room', { roomId, userId });
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Ошибка подключения Socket.IO:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('📴 Socket.IO отключен:', reason);
    });

    // Регистрируем обработчики событий
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Обновление комнаты
    this.socket.on('room_update', (roomData) => {
      console.log('📊 Обновление комнаты:', roomData);
      this.emitToListener('room_update', roomData);
    });

    // Новое сообщение в чате
    this.socket.on('chat_message', (messageData) => {
      console.log('💬 Новое сообщение:', messageData);
      this.emitToListener('chat_message', messageData);
    });

    // Готовность игрока
    this.socket.on('player_ready', (data) => {
      console.log('🎮 Готовность игрока обновлена:', data);
      this.emitToListener('player_ready', data);
    });

    // Игра начинается
    this.socket.on('game_starting', (data) => {
      console.log('⏳ Игра начинается:', data);
      this.emitToListener('game_starting', data);
    });

    // Обновление таймера
    this.socket.on('countdown_update', (data) => {
      console.log('⏱️ Таймер:', data.countdown);
      this.emitToListener('countdown_update', data);
    });

    // Игра началась
    this.socket.on('game_started', (data) => {
      console.log('🚀 Игра началась!', data);
      this.emitToListener('game_started', data);
    });
  }

  // Методы для отправки событий
  sendChatMessage(roomId: string, userId: string, userName: string, message: string): void {
    this.socket?.emit('chat_message', { roomId, userId, userName, message });
  }

  togglePlayerReady(roomId: string, userId: string, isReady: boolean): void {
    this.socket?.emit('player_ready', { roomId, userId, isReady });
  }

  startGame(roomId: string, userId: string): void {
    this.socket?.emit('start_game', { roomId, userId });
  }

  // Подписка на события
  on(event: string, callback: (...args: any[]) => void): void {
    this.listeners.set(event, callback);
    this.socket?.on(event, callback);
  }

  off(event: string): void {
    this.listeners.delete(event);
    this.socket?.off(event);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      console.log('👋 Socket.IO отключен');
    }
  }

  private emitToListener(event: string, data: any): void {
    const listener = this.listeners.get(event);
    if (listener) {
      listener(data);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default new SocketService();
