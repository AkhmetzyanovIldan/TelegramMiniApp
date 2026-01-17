import { io, Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';

// Конфигурация WebSocket
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

export const createWebSocketConnection = (roomId?: string, userId?: string): Socket => {
  const socket = io(WS_URL, {
    transports: ['websocket', 'polling'],
    query: { roomId, userId },
  });

  return socket;
};

interface WebSocketMessage {
  type: string;
  data?: any;
}

interface UseWebSocketProps {
  roomId?: string;
  userId?: string;
}

export const useWebSocket = ({ roomId, userId }: UseWebSocketProps = {}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);

  useEffect(() => {
    const newSocket = io(WS_URL, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('WebSocket подключен:', newSocket.id);
      setIsConnected(true);
      
      if (userId) {
        newSocket.emit('authenticate', { userId });
      }
      
      if (roomId) {
        newSocket.emit('join_room', { roomId, userId });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket отключен');
      setIsConnected(false);
    });

    newSocket.on('room_update', (data: any) => {
      console.log('Обновление комнаты:', data);
      setMessages(prev => [...prev, { type: 'room_update', data }]);
    });

    newSocket.on('chat_message', (data: any) => {
      console.log('Новое сообщение:', data);
      setMessages(prev => [...prev, { type: 'chat_message', data }]);
    });

    newSocket.on('error', (error: any) => {
      console.error('WebSocket ошибка:', error);
      setMessages(prev => [...prev, { type: 'error', data: error }]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, userId]);

  const sendMessage = (type: string, data?: any) => {
    if (socket && socket.connected) {
      socket.emit(type, data);
    } else {
      console.error('WebSocket не подключен');
    }
  };

  return {
    socket,
    isConnected,
    messages,
    sendMessage,
  };
};
