import axios from 'axios';

// ВАЖНО: Добавляем /api в URL
const API_BASE_URL = 'http://localhost:3000/api';

// Простая функция создания комнаты
export const createRoom = async (data: any) => {
  console.log('📤 Отправляю запрос на:', `${API_BASE_URL}/rooms`);
  console.log('Данные:', data);
  
  try {
    const response = await axios.post(`${API_BASE_URL}/rooms`, data);
    console.log('✅ Ответ сервера:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Ошибка запроса:', error.message);
    if (error.response) {
      console.error('Детали:', error.response.data);
    }
    throw error;
  }
};

// Получение комнаты
export const getRoom = async (roomId: string) => {
  console.log('📥 Запрашиваю комнату:', `${API_BASE_URL}/rooms/${roomId}`);
  
  try {
    const response = await axios.get(`${API_BASE_URL}/rooms/${roomId}`);
    return response.data;
  } catch (error: any) {
    console.error(`❌ Ошибка получения комнаты ${roomId}:`, error.message);
    throw error;
  }
};

export const joinRoom = async (roomId: string, userData: any) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/rooms/${roomId}/join`, {
      userId: userData.id || 'user_' + Date.now(),
      userName: userData.name || 'Player'
    });
    return response.data;
  } catch (error: any) {
    console.error(`❌ Ошибка присоединения:`, error.message);
    throw error;
  }
};
