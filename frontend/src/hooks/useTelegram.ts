import React, { useState, useEffect } from 'react';

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initDataUnsafe?: {
          user?: TelegramUser;
        };
        expand: () => void;
        ready: () => void;
      };
    };
  }
}

export const useTelegram = () => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initTelegram = () => {
      try {
        console.log('Инициализация Telegram Web App...');
        
        // Проверяем наличие Telegram Web App
        if (window.Telegram?.WebApp) {
          const { WebApp } = window.Telegram;
          console.log('Telegram WebApp найден:', WebApp);

          // Инициализируем приложение
          WebApp.expand();
          WebApp.ready();

          const telegramUser = WebApp.initDataUnsafe?.user;
          console.log('Данные пользователя от Telegram:', telegramUser);
          
          if (telegramUser) {
            console.log('ID пользователя:', telegramUser.id, 'Тип:', typeof telegramUser.id);
            setUser(telegramUser);
          } else {
            // Режим разработки без Telegram
            console.log('Telegram Web App не обнаружил пользователя, используем режим разработки');
            const devUser = {
              id: Math.floor(Math.random() * 10000),
              first_name: 'Разработчик',
              username: 'dev_user'
            };
            console.log('Создан тестовый пользователь:', devUser);
            setUser(devUser);
          }
        } else {
          // Режим разработки в браузере
          console.warn('Telegram Web App не доступен. Запущен режим разработки.');
          const devUser = {
            id: Math.floor(Math.random() * 10000),
            first_name: 'Тестовый',
            username: 'test_user'
          };
          console.log('Создан тестовый пользователь:', devUser);
          setUser(devUser);
        }

        setIsLoaded(true);
      } catch (error) {
        console.error('Ошибка инициализации Telegram:', error);
        // Fallback для разработки
        const fallbackUser = {
          id: Math.floor(Math.random() * 10000),
          first_name: 'Ошибка',
          username: 'error_user'
        };
        console.log('Создан пользователь при ошибке:', fallbackUser);
        setUser(fallbackUser);
        setIsLoaded(true);
      }
    };

    initTelegram();

    return () => {
      // Очистка при размонтировании
    };
  }, []);

  return { user, isLoaded };
};
