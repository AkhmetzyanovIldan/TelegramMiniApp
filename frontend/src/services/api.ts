// API сервис
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Room {
  id: string;
  gameType: "mafia" | "spy";
  players: Array<{
    id: string;
    name: string;
    isReady: boolean;
    role?: string;
  }>;
  creatorId: string;
  status: "waiting" | "playing" | "finished";
  code: string;
}

export interface CreateRoomParams {
  gameType: "mafia" | "spy";
  creatorId: string;
  creatorName: string;
  maxPlayers?: number;
}

export interface CreateRoomResponse {
  success: boolean;
  roomId: string;
  roomCode: string;
  message: string;
}

export async function createRoom(params: CreateRoomParams): Promise<CreateRoomResponse> {
  console.log('Отправка запроса на создание комнаты:', params);
  console.log('API_BASE_URL:', API_BASE_URL);

  const response = await fetch(`${API_BASE_URL}/api/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      gameType: params.gameType,
      creatorId: params.creatorId,
      creatorName: params.creatorName,
      maxPlayers: params.maxPlayers || (params.gameType === 'mafia' ? 10 : 8)
    }),
  });

  console.log('Статус ответа:', response.status);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
    console.error('Ошибка от сервера:', errorData);
    throw new Error(errorData.error || "Ошибка создания комнаты");
  }

  const result = await response.json();
  console.log('Успешный ответ от сервера:', result);
  return result;
}

export async function getRoom(roomId: string): Promise<any> {
  console.log('API_BASE_URL:', API_BASE_URL);
  const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Ошибка получения комнаты");
  }

  const result = await response.json();
  console.log('Данные комнаты:', result);
  return result;
}

export async function joinRoom(roomId: string, playerId: string, playerName: string): Promise<any> {
  console.log('Присоединение к комнате:', { roomId, playerId, playerName });
  console.log('API_BASE_URL:', API_BASE_URL);

  const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: playerId,
      userName: playerName
    }),
  });

  console.log('Статус ответа join:', response.status);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
    console.error('Ошибка от сервера при присоединении:', errorData);
    throw new Error(errorData.error || "Ошибка присоединения к комнате");
  }

  const result = await response.json();
  console.log('Успешное присоединение:', result);
  return result;
}