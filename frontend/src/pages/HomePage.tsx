import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { createRoom, joinRoom } from '../services/api';

// Удаляем или делаем опциональным
// interface HomePageProps {
//   user?: any;
// }

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useTelegram();
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = async (gameType: 'mafia' | 'spy') => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await createRoom({
        gameType,
        maxPlayers: gameType === 'mafia' ? 10 : 8,
        creatorId: user?.id?.toString() || 'unknown',
        creatorName: user?.username || user?.first_name || 'Игрок'
      });
      
      navigate(`/room/${response.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при создании комнаты');
      console.error('Ошибка создания комнаты:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      setError('Введите код комнаты');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await joinRoom(roomCode, {
        userId: user?.id?.toString() || 'unknown',
        userName: user?.username || user?.first_name || 'Игрок'
      });
      
      navigate(`/room/${roomCode}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Комната не найдена');
      console.error('Ошибка присоединения:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
      <div className="max-w-md mx-auto pt-10">
        <h1 className="text-3xl font-bold text-center mb-8">🎮 Игровая Площадка</h1>
        
        {user && (
          <div className="mb-6 p-4 bg-gray-800 rounded-lg">
            <p className="text-lg">Привет, <span className="font-bold">{user.first_name}</span>!</p>
            <p className="text-gray-400 text-sm">Выберите игру или присоединитесь к существующей комнате</p>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Создать комнату</h2>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleCreateRoom('mafia')} disabled={isLoading} className="p-6 bg-red-600 hover:bg-red-700 rounded-xl flex flex-col items-center justify-center transition disabled:opacity-50">
              <span className="text-3xl mb-2">🔫</span>
              <span className="font-bold">Мафия</span>
              <span className="text-sm text-gray-300">до 10 игроков</span>
            </button>
            <button onClick={() => handleCreateRoom('spy')} disabled={isLoading} className="p-6 bg-blue-600 hover:bg-blue-700 rounded-xl flex flex-col items-center justify-center transition disabled:opacity-50">
              <span className="text-3xl mb-2">🕵️</span>
              <span className="font-bold">Шпион</span>
              <span className="text-sm text-gray-300">до 8 игроков</span>
            </button>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Присоединиться к комнате</h2>
          <div className="flex gap-2">
            <input type="text" value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())} placeholder="Введите код комнаты" className="flex-1 p-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500" maxLength={6} />
            <button onClick={handleJoinRoom} disabled={isLoading || !roomCode.trim()} className="px-6 bg-green-600 hover:bg-green-700 rounded-lg transition disabled:opacity-50">Войти</button>
          </div>
          <p className="text-gray-400 text-sm mt-2">Попросите код комнаты у друга или создайте свою</p>
        </div>

        {error && (
          <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg mb-4">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        <div className="mt-12 p-4 bg-gray-800/50 rounded-lg">
          <h3 className="font-bold mb-2">Как играть?</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>1. Создайте комнату или присоединитесь по коду</li>
            <li>2. Пригласите друзей в комнату</li>
            <li>3. Нажмите "Готов" когда все присоединятся</li>
            <li>4. Начните игру!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
