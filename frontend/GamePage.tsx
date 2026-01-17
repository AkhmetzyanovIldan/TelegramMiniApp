import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { useWebSocket } from '../services/websocket';

interface GamePageProps {
  user?: any;
}

interface GameState {
  phase: 'night' | 'day' | 'voting' | 'result';
  dayNumber: number;
  players: Array<{
    id: string;
    name: string;
    role?: string;
    isAlive: boolean;
  }>;
  timeLeft: number;
}

const GamePage: React.FC<GamePageProps> = () => {
  const { gameType, roomId } = useParams<{ gameType: string; roomId: string }>();
  const { user } = useTelegram();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myRole, setMyRole] = useState<string>('');
  const { socket, isConnected } = useWebSocket();

  useEffect(() => {
    if (!socket || !roomId) return;

    // Слушаем события игры
    socket.on('role_assigned', (data: any) => {
      setMyRole(data.role);
      alert(`Ваша роль: ${data.role}\n\n${data.description}`);
    });

    socket.on('game_started', (data: any) => {
      console.log('Игра началась:', data);
    });

    socket.on('phase_changed', (data: any) => {
      setGameState(prev => prev ? {
        ...prev,
        phase: data.phase,
        timeLeft: data.duration
      } : null);
    });

    socket.on('game_state_update', (data: any) => {
      setGameState(data);
    });

    return () => {
      socket.off('role_assigned');
      socket.off('game_started');
      socket.off('phase_changed');
      socket.off('game_state_update');
    };
  }, [socket, roomId]);

  const renderMafiaGame = () => {
    if (!gameState) return null;

    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-4xl mx-auto">
          {/* Заголовок */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">🎮 Мафия</h1>
            <div className="text-gray-400">
              День {gameState.dayNumber} • {gameState.phase === 'night' ? '🌙 Ночь' : '☀️ День'}
            </div>
            <div className="text-sm text-gray-500">
              Время: {gameState.timeLeft} сек
            </div>
          </div>

          {/* Игровая информация */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Левая колонка: Игроки */}
            <div className="bg-gray-800 rounded-xl p-4">
              <h2 className="text-lg font-bold mb-4">👥 Игроки ({gameState.players.length})</h2>
              <div className="space-y-2">
                {gameState.players.map(player => (
                  <div
                    key={player.id}
                    className={`p-3 rounded-lg ${player.isAlive ? 'bg-gray-700' : 'bg-red-900/50'} ${player.id === user?.id?.toString() ? 'border-2 border-blue-500' : ''}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={!player.isAlive ? 'line-through text-gray-400' : ''}>
                        {player.name}
                        {player.id === user?.id?.toString() && ' (Вы)'}
                      </span>
                      <span className="text-sm text-gray-400">
                        {player.isAlive ? '❤️' : '💀'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Центральная колонка: Игровой процесс */}
            <div className="md:col-span-2 space-y-6">
              {/* Текущая фаза */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">
                  {gameState.phase === 'night' ? '🌙 Ночная фаза' : '☀️ Дневное обсуждение'}
                </h2>
                
                {gameState.phase === 'night' && myRole && (
                  <div className="mb-6">
                    <h3 className="font-bold mb-2">Ваше действие:</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {myRole === 'mafia' && (
                        <button className="p-4 bg-red-700 hover:bg-red-800 rounded-lg transition">
                          Выбрать жертву
                        </button>
                      )}
                      {myRole === 'sheriff' && (
                        <button className="p-4 bg-blue-700 hover:bg-blue-800 rounded-lg transition">
                          Проверить игрока
                        </button>
                      )}
                      {myRole === 'doctor' && (
                        <button className="p-4 bg-green-700 hover:bg-green-800 rounded-lg transition">
                          Вылечить игрока
                        </button>
                      )}
                      {myRole === 'civilian' && (
                        <div className="p-4 bg-gray-700 rounded-lg">
                          Вы спите. Ждите утра.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {gameState.phase === 'day' && (
                  <div>
                    <h3 className="font-bold mb-2">Обсуждение:</h3>
                    <textarea
                      placeholder="Напишите ваше предположение..."
                      className="w-full h-32 p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                    />
                    <button className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition">
                      Отправить сообщение
                    </button>
                  </div>
                )}

                {gameState.phase === 'voting' && (
                  <div>
                    <h3 className="font-bold mb-4">Голосование за изгнание</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {gameState.players
                        .filter(p => p.isAlive)
                        .map(player => (
                          <button
                            key={player.id}
                            className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                          >
                            {player.name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Чат игры */}
              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="font-bold mb-2">💬 Игровой чат</h3>
                <div className="h-48 overflow-y-auto mb-4 space-y-2">
                  <div className="p-2 bg-gray-700/50 rounded">
                    <span className="font-bold">Система:</span> Игра началась!
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Напишите сообщение..."
                    className="flex-1 p-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                  />
                  <button className="px-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition">
                    Отпр
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Статус подключения */}
          <div className="mt-6 text-center">
            <div className={`inline-flex items-center px-4 py-2 rounded-full ${isConnected ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              {isConnected ? 'Подключено' : 'Отключено'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSpyGame = () => {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-2xl mx-auto text-center pt-10">
          <h1 className="text-3xl font-bold mb-6">🕵️ Шпион</h1>
          <p className="text-gray-400">Игра "Шпион" в разработке</p>
          <p className="text-sm text-gray-500 mt-4">
            Эта игра появится в следующем обновлении
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      {gameType === 'mafia' && renderMafiaGame()}
      {gameType === 'spy' && renderSpyGame()}
    </>
  );
};

export default GamePage;
