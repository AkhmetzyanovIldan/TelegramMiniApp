import { useState } from 'react';

declare global {
  interface Window {
    Telegram?: any;
  }
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export function useTelegram() {
  const tg = window.Telegram?.WebApp;
  
  // Функция для получения или создания тестового пользователя
  const getTestUser = (): TelegramUser => {
    const stored = localStorage.getItem('test_user');
    if (stored) {
      return JSON.parse(stored);
    }
    const newUser = {
      id: Math.floor(Math.random() * 10000) + 1,
      first_name: 'Разработчик',
      username: 'dev_user',
    };
    localStorage.setItem('test_user', JSON.stringify(newUser));
    return newUser;
  };

  const initialUser = tg?.initDataUnsafe?.user
    ? tg.initDataUnsafe.user
    : import.meta.env.DEV
    ? getTestUser()
    : null;

  const [user] = useState<TelegramUser | null>(initialUser);
  const [isReady] = useState(!!initialUser);

  // Применяем тему Telegram, если есть
  if (tg) {
    tg.ready();
    tg.expand();
    
    const theme = tg.themeParams;
    if (theme) {
      const root = document.documentElement;
      root.style.setProperty('--tg-bg-color', theme.bg_color || '#ffffff');
      root.style.setProperty('--tg-text-color', theme.text_color || '#000000');
      root.style.setProperty('--tg-hint-color', theme.hint_color || '#999999');
      root.style.setProperty('--tg-link-color', theme.link_color || '#2481cc');
      root.style.setProperty('--tg-button-color', theme.button_color || '#40a7e3');
      root.style.setProperty('--tg-button-text-color', theme.button_text_color || '#ffffff');
      root.style.setProperty('--tg-secondary-bg-color', theme.secondary_bg_color || '#f0f0f0');
    }
  } else if (!import.meta.env.DEV) {
    console.warn('Приложение должно быть открыто в Telegram Mini App');
  }

  return { user, isReady };
}