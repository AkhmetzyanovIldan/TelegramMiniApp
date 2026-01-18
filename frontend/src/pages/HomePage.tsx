import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../services/api';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async (gameType: 'mafia' | 'spy') => {
    setLoading(true);
    try {
      console.log('🔄 Создаю комнату:', gameType);
      
      const response = await createRoom({
        gameType,
        creatorId: 'test_' + Date.now(),
        creatorName: 'Test User'
      });
      
      console.log('✅ Комната создана:', response);
      
      if (response.roomId) {
        console.log('🔄 Перенаправляю на:', `/room/${response.roomId}`);
        navigate(`/room/${response.roomId}`);
      } else {
        alert('Ошибка: нет roomId в ответе');
      }
    } catch (error: any) {
      console.error('❌ Ошибка создания комнаты:', error);
      alert('Ошибка создания комнаты: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <h1>🎮 Тест Игровой Площадки</h1>
      <p>Простой тест создания комнаты</p>
      
      <div style={{ margin: 20 }}>
        <button 
          onClick={() => handleCreateRoom('mafia')}
          disabled={loading}
          style={{ padding: '10px 20px', fontSize: 16, margin: 10 }}
        >
          {loading ? 'Создаю...' : 'Создать Мафию'}
        </button>
        
        <button 
          onClick={() => handleCreateRoom('spy')}
          disabled={loading}
          style={{ padding: '10px 20px', fontSize: 16, margin: 10 }}
        >
          {loading ? 'Создаю...' : 'Создать Шпиона'}
        </button>
      </div>
      
      <div style={{ marginTop: 30 }}>
        <p>Открой Console (F12) чтобы видеть логи</p>
        <p>Проверь Network вкладку для запросов</p>
      </div>
    </div>
  );
};

export default HomePage;
