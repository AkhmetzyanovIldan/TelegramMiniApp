// Конфигурация API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = `${API_BASE_URL}/api`;

interface CreateRoomRequest {
  gameType: 'mafia' | 'spy';
  maxPlayers?: number;
  creatorId: string;
  creatorName: string;
}

interface JoinRoomRequest {
  userId: string;
  userName: string;
}

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

export const createRoom = async (data: CreateRoomRequest): Promise<Room> => {
  const response = await fetch(`${API_URL}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }

  return response.json();
};

export const joinRoom = async (roomId: string, data: JoinRoomRequest): Promise<Room> => {
  const response = await fetch(`${API_URL}/rooms/${roomId}/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }

  return response.json();
};

export const getRoom = async (roomId: string): Promise<Room> => {
  const response = await fetch(`${API_URL}/rooms/${roomId}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }

  return response.json();
};

export const listRooms = async (): Promise<Room[]> => {
  const response = await fetch(`${API_URL}/rooms`);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }

  return response.json();
};

export const deleteRoom = async (roomId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/rooms/${roomId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }
};
