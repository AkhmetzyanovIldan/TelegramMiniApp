module.exports = {
  // Game Types
  GAME_TYPES: {
    MAFIA: 'mafia',
    SPY: 'spy'
  },

  // Game Status
  GAME_STATUS: {
    WAITING: 'waiting',
    ACTIVE: 'active',
    FINISHED: 'finished'
  },

  // Redis Keys
  REDIS_KEYS: {
    ROOM_PREFIX: 'room:',
    USER_PREFIX: 'user:',
    SESSION_PREFIX: 'session:'
  },

  // Game Settings
  MAX_PLAYERS: {
    MAFIA: 12,
    SPY: 8
  },
  
  MIN_PLAYERS: {
    MAFIA: 4,
    SPY: 3
  }
};
