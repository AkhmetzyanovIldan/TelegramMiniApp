import { useEffect, useState } from 'react';

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
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      
      const initUser = tg.initDataUnsafe?.user;
      if (initUser) {
        setUser(initUser);
      }

      // Устанавливаем CSS-переменные темы
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
      
      setIsLoaded(true);
    } else {
      console.log('Telegram Web App не обнаружен, используем режим разработки');
      setUser({
        id: Math.floor(Math.random() * 10000),
        first_name: 'Разработчик',
        username: 'dev_user'
      });
      setIsLoaded(true);
    }
  }, []);

  return { user, isLoaded };
}