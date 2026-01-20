import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { createRoom } from '../services/api';
import './HomePage.css';

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
      console.log('=== НАЧАЛО СОЗДАНИЯ КОМНАТЫ ===');
      console.log('Тип игры:', gameType);
      console.log('Данные пользователя из useTelegram:', user);
      console.log('ID пользователя:', user?.id, 'Тип:', typeof user?.id);
      
      // Готовим данные для отправки
      const creatorId = user?.id?.toString() || Math.floor(Math.random() * 10000).toString();
      const creatorName = user?.username || user?.first_name || 'Игрок';
      
      console.log('Данные для отправки на сервер:', {
        gameType,
        creatorId,
        creatorName,
        creatorIdType: typeof creatorId
      });

      const response = await createRoom({
        gameType,
        creatorId,
        creatorName,
        maxPlayers: gameType === 'mafia' ? 10 : 8
      });

      console.log('Ответ от сервера при создании комнаты:', response);
      console.log('=== УСПЕШНО СОЗДАНО ===');
      
      navigate(`/room/${response.roomId}`);
    } catch (err: any) {
      console.error('=== ОШИБКА СОЗДАНИЯ КОМНАТЫ ===');
      console.error('Полная ошибка:', err);
      console.error('Сообщение ошибки:', err.message);
      console.error('Стек ошибки:', err.stack);
      setError(err.message || 'Ошибка при создании комнаты');
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
      navigate(`/room/${roomCode.trim().toUpperCase()}`);
    } catch (err: any) {
      setError('Не удалось присоединиться к комнате');
      console.error('Ошибка присоединения:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="home-container">
      <h1 className="home-title">🎮 Игровая Площадка</h1>
      <p className="home-subtitle">Выберите игру или присоединитесь к комнате</p>

      <div className="games-grid">
        <div className="game-card">
          <h2 className="game-title">🕵️‍♂️ Мафия</h2>
          <p className="game-description">
            Классическая социальная игра. Распознайте мафию среди мирных жителей!
          </p>
          <button
            className="game-button primary"
            onClick={() => handleCreateRoom('mafia')}
            disabled={isLoading}
          >
            {isLoading ? 'Создание...' : 'Создать комнату'}
          </button>
        </div>

        <div className="game-card">
          <h2 className="game-title">🔍 Шпион</h2>
          <p className="game-description">
            Найдите шпиона среди игроков! Задавайте вопросы и вычисляйте незнакомца.
          </p>
          <button
            className="game-button secondary"
            onClick={() => handleCreateRoom('spy')}
            disabled={isLoading}
          >
            {isLoading ? 'Создание...' : 'Создать комнату'}
          </button>
        </div>
      </div>

      <div className="join-section">
        <h3 className="join-title">Или присоединитесь к существующей комнате</h3>
        <div className="join-input-group">
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="Введите код комнаты"
            className="join-input"
            maxLength={6}
            disabled={isLoading}
          />
          <button
            className="join-button"
            onClick={handleJoinRoom}
            disabled={isLoading || !roomCode.trim()}
          >
            {isLoading ? 'Присоединение...' : 'Присоединиться'}
          </button>
        </div>
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default HomePage;
