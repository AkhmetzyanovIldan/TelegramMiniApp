import { useState, useEffect } from 'react';

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
        // Проверяем наличие Telegram Web App
        if (window.Telegram?.WebApp) {
          const { WebApp } = window.Telegram;
          
          // Инициализируем приложение
          WebApp.expand();
          WebApp.ready();
          
          if (WebApp.initDataUnsafe?.user) {
            setUser(WebApp.initDataUnsafe.user);
          } else {
            // Режим разработки без Telegram
            console.log('Telegram Web App не обнаружен, используем режим разработки');
            setUser({
              id: Math.floor(Math.random() * 10000),
              first_name: 'Разработчик',
              username: 'dev_user'
            });
          }
        } else {
          // Режим разработки в браузере
          console.warn('Telegram Web App не доступен. Запущен режим разработки.');
          setUser({
            id: Math.floor(Math.random() * 10000),
            first_name: 'Тестовый',
            username: 'test_user'
          });
        }
        
        setIsLoaded(true);
      } catch (error) {
        console.error('Ошибка инициализации Telegram:', error);
        // Fallback для разработки
        setUser({
          id: Math.floor(Math.random() * 10000),
          first_name: 'Ошибка',
          username: 'error_user'
        });
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
