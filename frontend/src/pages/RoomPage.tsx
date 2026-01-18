import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getRoom } from '../services/api';

const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!roomId) {
      setError('Нет roomId в URL');
      setLoading(false);
      return;
    }

    const fetchRoomData = async () => {
      try {
        console.log('📥 Запрашиваю комнату:', roomId);
        const response = await getRoom(roomId);
        
        if (response.success) {
          setRoom(response.room);
          console.log('✅ Комната получена:', response.room);
        } else {
          setError(response.error || 'Не удалось загрузить комнату');
        }
      } catch (err: any) {
        console.error('❌ Ошибка:', err);
        setError(err.message || 'Ошибка загрузки комнаты');
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [roomId]);

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h2>Загрузка комнаты...</h2>
        <p>roomId: {roomId}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h2>Ошибка</h2>
        <p>{error}</p>
        <p>roomId: {roomId}</p>
        <button onClick={() => window.location.href = '/'}>
          На главную
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Комната: {roomId}</h1>
      <div style={{ background: '#f5f5f5', padding: 20, borderRadius: 10 }}>
        <h2>Информация о комнате:</h2>
        <pre>{JSON.stringify(room, null, 2)}</pre>
      </div>
      <div style={{ marginTop: 20 }}>
        <button onClick={() => window.location.href = '/'}>
          На главную
        </button>
      </div>
    </div>
  );
};

export default RoomPage;
