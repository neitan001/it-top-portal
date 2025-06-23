import { useEffect, useState } from 'react';
import logger from '@/lib/logger';

export default function useTelegramAuth() {
  const [state, setState] = useState({
    tgId: null,
    isLoading: true,
    isTelegram: false
  });

  useEffect(() => {
    const verifyTgAuth = async () => {
      try {

        if (process.env.NODE_ENV === "development") {
          const devUserId = 721135016;
          logger.log(`Dev mode: using tg_id ${devUserId}`);

          setState({ tgId: devUserId, isLoading: false, isTelegram: true });
          return;
        }

        const tgWebApp = window.Telegram?.WebApp;
        const isTelegram = !!tgWebApp;

        if (!isTelegram) {
          setState({ tgId: null, isLoading: false, isTelegram: false });
          return;
        }

        if (!tgWebApp.CloudStorage || !tgWebApp.CloudStorage.getItem) {
          setState({ tgId: null, isLoading: false, isTelegram: true });
          return;
        }

        tgWebApp.expand?.();

        Telegram.WebApp.CloudStorage.getItem('tg_id', (err, cachedId) => {
          if (!err && cachedId) {
            setState({ tgId: cachedId, isLoading: false, isTelegram: true });
            return;
          }

          const userId = tgWebApp.initDataUnsafe?.user?.id;
          const initData = tgWebApp.initData;

          if (!userId || !initData) {
            setState({ tgId: null, isLoading: false, isTelegram: true });
            return;
          }

          fetch("/api/mini-app/auth/validate-tg", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ initData }),
          })
            .then(res => res.json())
            .then(data => {
              if (data.valid) {
                Telegram.WebApp.CloudStorage.setItem('tg_id', userId.toString(), () => {
                  setState({ tgId: userId, isLoading: false, isTelegram: true });
                });
              } else {
                setState({ tgId: null, isLoading: false, isTelegram: true });
              }
            })
            .catch(error => {
              logger.error('Auth error:', error);
              setState({ tgId: null, isLoading: false, isTelegram: true });
            });
        });
      } catch (error) {
        logger.error('Unexpected error:', error);
        setState({ tgId: null, isLoading: false, isTelegram: false });
      }
    };

    verifyTgAuth();
  }, []);

  return state;
}