// src/types/index.ts
export interface User {
  id: string | number;
  name: string;
  username?: string;
  isHost?: boolean;
  isReady?: boolean;
}

export interface Room {
  id: string;
  gameType: 'mafia' | 'spy';
  creator: User;
  players: User[];
  status: 'waiting' | 'playing' | 'finished';
  settings: {
    maxPlayers: number;
    minPlayers: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GameMessage {
  id: string;
  userId: string | number;
  username: string;
  message: string;
  timestamp: number;
  roomId: string;
}

export interface GameAction {
  type: string;
  data: any;
  from: string | number;
  timestamp: number;
}

export interface WebSocketEvent {
  type: string;
  data: any;
}
