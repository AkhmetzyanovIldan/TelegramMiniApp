import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { getRoom, joinRoom } from '../services/api';
import socketService from '../services/socket';
import './RoomPage.css';

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  isAlive?: boolean;
}

interface Message {
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

interface RoomData {
  id: string;
  gameType: 'mafia' | 'spy';
  players: Player[];
  settings: {
    maxPlayers: number;
    minPlayers: number;
    roundTime: number;
    discussionTime: number;
  };
  messages: Message[];
  createdAt: string;
  status: 'waiting' | 'starting' | 'playing' | 'finished';
}

const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useTelegram();

  const [room, setRoom] = useState<RoomData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);

  // Получение данных комнаты
  const fetchRoomData = useCallback(async () => {
    if (!roomId) return;

    try {
      const response = await getRoom(roomId);
      console.log('Получены данные комнаты:', response);
      
      if (response.success && response.room) {
        setRoom(response.room);
      } else {
        setError('Комната не найдена');
      }
    } catch (err: any) {
      console.error('Ошибка загрузки комнаты:', err);
      setError(err.message || 'Ошибка загрузки комнаты');
    }
  }, [roomId]);

  // Инициализация
  useEffect(() => {
    if (!roomId || !user) return;

    const initialize = async () => {
      try {
        setIsLoading(true);
        console.log('Инициализация комнаты:', { roomId, user });

        // 1. Получаем данные комнаты
        const roomData = await getRoom(roomId);
        console.log('Данные комнаты получены:', roomData);

        const userId = user.id?.toString() || '';
        const userName = user.username || user.first_name || 'Игрок';

        // 2. Проверяем, есть ли пользователь в комнате
        const isUserInRoom = roomData.room?.players?.some((p: any) => p.id === userId);

        console.log('Проверка наличия пользователя в комнате:', {
          userId,
          isUserInRoom,
          players: roomData.room?.players?.map((p: any) => ({ id: p.id, name: p.name }))
        });

        // 3. Присоединяемся только если пользователя нет в комнате
        if (!isUserInRoom) {
          console.log('Пользователь не найден в комнате, присоединяемся...');
          try {
            await joinRoom(roomId, userId, userName);
            console.log('Присоединение успешно');
            
            // Обновляем данные комнаты после присоединения
            const updatedRoom = await getRoom(roomId);
            setRoom(updatedRoom.room);
          } catch (joinErr: any) {
            console.error('Ошибка присоединения:', joinErr);
            // Если ошибка не критическая (например, уже в комнате), продолжаем
            if (!joinErr.message?.includes('уже в комнате')) {
              throw joinErr;
            }
          }
        } else {
          // Пользователь уже в комнате
          console.log('Пользователь уже в комнате, пропускаем присоединение');
          setRoom(roomData.room);
        }

        // 4. Подключаем Socket.IO
        console.log('Подключение Socket.IO...');
        socketService.connect(roomId, userId, userName);

        // Настраиваем обработчики событий Socket.IO
        socketService.on('room_update', (updatedRoom: RoomData) => {
          console.log('Получено обновление комнаты:', updatedRoom);
          setRoom(updatedRoom);
        });

        socketService.on('chat_message', (newMessage: Message) => {
          console.log('Новое сообщение чата:', newMessage);
          setRoom(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              messages: [...(prev.messages || []), newMessage]
            };
          });
        });

        socketService.on('player_ready', (data: { userId: string; userName: string; isReady: boolean }) => {
          console.log('Игрок изменил готовность:', data);
          // Обновляем данные комнаты
          fetchRoomData();
        });

        socketService.on('game_starting', (data: { countdown: number }) => {
          console.log('Игра начинается!', data);
          setCountdown(data.countdown);
        });

        socketService.on('countdown_update', (data: { countdown: number }) => {
          console.log('Таймер:', data.countdown);
          setCountdown(data.countdown);
        });

        socketService.on('game_started', (data: any) => {
          console.log('Игра началась!', data);
          // Перенаправляем на игровую страницу
          if (room) {
            navigate(`/game/${room.gameType}/${roomId}`);
          }
        });

        socketService.on('error', (errorData: any) => {
          console.error('Socket.IO ошибка:', errorData);
          setError('Ошибка соединения с сервером');
        });

      } catch (err: any) {
        console.error('Ошибка инициализации:', err);
        setError(err.message || 'Ошибка загрузки комнаты');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    // Очистка при размонтировании
    return () => {
      console.log('Очистка RoomPage...');
      socketService.disconnect();
      socketService.off('room_update');
      socketService.off('chat_message');
      socketService.off('player_ready');
      socketService.off('game_starting');
      socketService.off('countdown_update');
      socketService.off('game_started');
      socketService.off('error');
    };
  }, [roomId, user, fetchRoomData, navigate]);

  // Обработчики действий
  const handleReadyToggle = () => {
    if (!roomId || !user || !room) return;

    const userId = user.id?.toString() || '';
    const currentPlayer = room.players.find(p => p.id === userId);
    const newReadyState = !currentPlayer?.isReady;

    console.log('Изменение готовности:', { userId, newReadyState });
    socketService.togglePlayerReady(roomId, userId, newReadyState);
  };

  const handleStartGame = () => {
    if (!roomId || !user) return;

    const userId = user.id?.toString() || '';
    console.log('Запуск игры:', { roomId, userId });
    socketService.startGame(roomId, userId);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !roomId || !user || !socketService.isConnected()) return;

    const userId = user.id?.toString() || '';
    const userName = user.username || user.first_name || 'Игрок';

    console.log('Отправка сообщения:', { roomId, userId, userName, message: chatMessage });
    socketService.sendChatMessage(roomId, userId, userName, chatMessage.trim());
    setChatMessage('');
  };

  const handleCopyCode = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      alert('Код комнаты скопирован!');
    }
  };

  const handleLeaveRoom = () => {
    socketService.disconnect();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Загрузка комнаты...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Ошибка</h2>
        <p>{error}</p>
        <button
          className="back-button"
          onClick={() => navigate('/')}
        >
          На главную
        </button>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="error-container">
        <h2>Комната не найдена</h2>
        <p>Комната {roomId} не существует или была удалена</p>
        <button
          className="back-button"
          onClick={() => navigate('/')}
        >
          На главную
        </button>
      </div>
    );
  }

  const userId = user?.id?.toString() || '';
  const currentPlayer = room.players.find(p => p.id === userId);
  const isHost = currentPlayer?.isHost || false;
  const allReady = room.players.every(p => p.isReady);
  const minPlayersMet = room.players.length >= (room.settings?.minPlayers || 4);
  const canStartGame = isHost && allReady && minPlayersMet && room.status === 'waiting';
  const socketConnected = socketService.isConnected();

  return (
    <div className="room-container">
      <div className="room-header">
        <button
          className="back-button"
          onClick={handleLeaveRoom}
        >
          ← Назад
        </button>
        <h1 className="room-title">
          {room.gameType === 'mafia' ? '🕵️‍♂️ Мафия' : '🔍 Шпион'} - Комната: <span className="room-code">{roomId}</span>
          <span className="room-status">
            {room.status === 'playing' ? '🎮 Игра идет' : 
             room.status === 'starting' ? '⏳ Начинается...' : 
             '⏳ Ожидание игроков'}
            {socketConnected && ' ✅ Online'}
          </span>
        </h1>
        <button
          className="copy-button"
          onClick={handleCopyCode}
          title="Скопировать код"
        >
          📋
        </button>
      </div>

      {countdown !== null && (
        <div className="countdown-overlay">
          <div className="countdown-content">
            <h2>Игра начинается через...</h2>
            <div className="countdown-number">{countdown}</div>
          </div>
        </div>
      )}

      <div className="room-content">
        <div className="players-section">
          <h2>
            Игроки ({room.players.length}/{room.settings?.maxPlayers || 10})
          </h2>
          <div className="players-list">
            {room.players.map((player) => (
              <div key={player.id} className={`player-card ${player.id === userId ? 'current-player' : ''}`}>
                <div className="player-info">
                  <span className="player-name">
                    {player.name} 
                    {player.isHost && ' 👑'}
                    {player.id === userId && ' (Вы)'}
                  </span>
                  <span className={`player-status ${player.isReady ? 'ready' : 'not-ready'}`}>
                    {player.isReady ? '✅ Готов' : '⏳ Не готов'}
                  </span>
                </div>
                {player.id === userId && (
                  <button
                    className={`ready-toggle ${player.isReady ? 'active' : ''}`}
                    onClick={handleReadyToggle}
                    disabled={room.status !== 'waiting'}
                  >
                    {player.isReady ? 'Не готов' : 'Я готов!'}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="room-actions">
            {isHost && room.status === 'waiting' && (
              <button
                className="start-button"
                onClick={handleStartGame}
                disabled={!canStartGame}
                title={!allReady ? 'Не все игроки готовы' : !minPlayersMet ? 'Недостаточно игроков' : ''}
              >
                Начать игру
              </button>
            )}

            <div className="requirements">
              <p>Для начала игры нужно:</p>
              <ul>
                <li className={minPlayersMet ? 'met' : ''}>
                  {minPlayersMet ? '✅' : '❌'} Минимум {room.settings?.minPlayers || 4} игрока
                </li>
                <li className={allReady ? 'met' : ''}>
                  {allReady ? '✅' : '❌'} Все игроки готовы
                </li>
                <li className={isHost ? 'met' : ''}>
                  {isHost ? '✅' : '❌'} Только хост может начать игру
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="chat-section">
          <h2>Чат комнаты {socketConnected ? '✅' : '❌'}</h2>
          <div className="chat-messages">
            {room.messages?.map((msg, index) => (
              <div key={index} className={`message ${msg.userId === userId ? 'own' : ''}`}>
                <span className="message-sender">{msg.userName}:</span>
                <span className="message-text">{msg.message}</span>
                <span className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>

          <form className="chat-input-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Введите сообщение..."
              className="chat-input"
              maxLength={200}
              disabled={!socketConnected}
            />
            <button
              type="submit"
              className="send-button"
              disabled={!chatMessage.trim() || !socketConnected}
            >
              Отправить
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
