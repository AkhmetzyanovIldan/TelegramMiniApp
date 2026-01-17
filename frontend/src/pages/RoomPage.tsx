import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { useWebSocket } from '../services/websocket';
import { getRoom } from '../services/api';

interface Player {
  id: string;
  name: string;
  isReady: boolean;
  isHost: boolean;
}

interface Room {
  id: string;
  gameType: string;
  maxPlayers: number;
  players: Player[];
  status: string;
}

const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useTelegram();
  
  const [room, setRoom] = useState<Room | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const { socket, isConnected, messages, sendMessage } = useWebSocket({
    roomId,
    userId: user?.id?.toString(),
  });

  useEffect(() => {
    const fetchRoom = async () => {
      if (!roomId) return;
      
      try {
        setIsLoading(true);
        const roomData = await getRoom(roomId);
        setRoom(roomData);
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки комнаты');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  useEffect(() => {
    // Обработка WebSocket сообщений
    messages.forEach((msg) => {
      if (msg.type === 'room_update' && msg.data) {
        setRoom(msg.data);
      }
    });
  }, [messages]);

  const handleReadyToggle = () => {
    if (socket && user && roomId) {
      sendMessage('player_ready', {
        roomId,
        userId: user.id?.toString(),
        isReady: !room?.players.find((p: Player) => p.id === user.id?.toString())?.isReady
      });
    }
  };

  const handleStartGame = () => {
    if (socket && user && roomId) {
      sendMessage('start_game', {
        roomId,
        userId: user.id?.toString()
      });
    }
  };

  const handleSendMessage = () => {
    if (chatMessage.trim() && socket && user && roomId) {
      sendMessage('chat_message', {
        roomId,
        userId: user.id?.toString(),
        userName: user.first_name || 'Игрок',
        message: chatMessage.trim()
      });
      setChatMessage('');
    }
  };

  const handleCopyCode = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      alert('Код комнаты скопирован!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4">Загрузка комнаты...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Ошибка</h1>
          <p>{error || 'Комната не найдена'}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  const currentPlayer = room.players.find((p: Player) => p.id === user?.id?.toString());
  const isHost = currentPlayer?.isHost;
  const allPlayersReady = room.players.length > 0 && room.players.every((p: Player) => p.isReady);
  const canStartGame = isHost && allPlayersReady && room.players.length >= 4;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Шапка комнаты */}
        <div className="flex justify-between items-center mb-6 pt-4">
          <div>
            <h1 className="text-2xl font-bold">
              {room.gameType === 'mafia' ? '🔫 Мафия' : '🕵️ Шпион'}
            </h1>
            <p className="text-gray-400">
              Игроков: {room.players.length}/{room.maxPlayers}
            </p>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">
                {isConnected ? 'Подключено' : 'Отключено'}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="mt-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
            >
              Код: <span className="font-mono font-bold">{roomId}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Левая колонка: Игроки */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">👥 Игроки в комнате</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {room.players.map((player: Player) => (
                  <div
                    key={player.id}
                    className={`p-4 rounded-lg ${player.isReady ? 'bg-green-900/30 border border-green-700' : 'bg-gray-800'} ${player.id === user?.id?.toString() ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold truncate">
                          {player.name}
                          {player.isHost && ' 👑'}
                          {player.id === user?.id?.toString() && ' (Вы)'}
                        </p>
                        <p className="text-sm text-gray-400">
                          {player.isReady ? '✅ Готов' : '⏳ Ожидание'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Управление */}
              <div className="mt-8 space-y-4">
                <button
                  onClick={handleReadyToggle}
                  className={`w-full py-4 rounded-xl font-bold transition ${currentPlayer?.isReady ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {currentPlayer?.isReady ? 'Не готов' : 'Я готов!'}
                </button>

                {isHost && (
                  <button
                    onClick={handleStartGame}
                    disabled={!canStartGame}
                    className={`w-full py-4 rounded-xl font-bold transition ${canStartGame ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 cursor-not-allowed'}`}
                  >
                    {canStartGame ? '🚀 Начать игру!' : 'Ожидание игроков...'}
                  </button>
                )}

                <button
                  onClick={() => navigate('/')}
                  className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                >
                  ← Выйти из комнаты
                </button>
              </div>
            </div>
          </div>

          {/* Правая колонка: Чат */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 rounded-xl p-6 h-full flex flex-col">
              <h2 className="text-xl font-bold mb-4">💬 Чат комнаты</h2>
              
              <div className="flex-1 overflow-y-auto mb-4 space-y-3 max-h-96">
                {messages
                  .filter(msg => msg.type === 'chat_message' && msg.data)
                  .map((msg, index) => (
                    <div key={index} className="bg-gray-800/50 p-3 rounded-lg">
                      <div className="flex justify-between">
                        <span className="font-bold text-blue-300">
                          {msg.data.userName}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-1">{msg.data.message}</p>
                    </div>
                  ))}
                
                {messages
                  .filter(msg => msg.type === 'player_ready' && msg.data)
                  .map((msg, index) => (
                    <div key={index} className="bg-gray-900/50 p-2 rounded-lg text-sm text-gray-300">
                      {msg.data.userName} {msg.data.isReady ? 'готов' : 'не готов'}
                    </div>
                  ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Напишите сообщение..."
                  className="flex-1 p-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="px-6 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                >
                  Отпр
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Инструкция */}
        <div className="mt-8 p-4 bg-gray-800/30 rounded-xl">
          <h3 className="font-bold mb-2">📋 Как играть?</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>1. Пригласите друзей по коду комнаты</li>
            <li>2. Все игроки должны нажать "Я готов!"</li>
            <li>3. Когда все будут готовы, хост нажмет "Начать игру"</li>
            <li>4. Наслаждайтесь игрой!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
