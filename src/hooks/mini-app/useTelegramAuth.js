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
          const devUserId = "721135016"; // Строка для консистентности
          logger.log(`Dev mode: using tg_id ${devUserId}`);
          setState({ tgId: devUserId, isLoading: false, isTelegram: true });
          return;
        }

        if (typeof window === 'undefined' || !window.Telegram?.WebApp) {
          setState(prev => ({ ...prev, isLoading: false, isTelegram: false }));
          return;
        }

        const tgWebApp = window.Telegram.WebApp;
        tgWebApp.expand?.();

        if (!tgWebApp.CloudStorage?.getItem) {
          logger.warn('CloudStorage not available');
          tryFallbackAuth(tgWebApp);
          return;
        }

        tgWebApp.CloudStorage.getItem('tg_id', (err, cachedId) => {
          if (err) {
            logger.error('CloudStorage error:', err);
            tryFallbackAuth(tgWebApp);
            return;
          }

          if (cachedId) {
            setState({ tgId: cachedId, isLoading: false, isTelegram: true });
            return;
          }

          tryFallbackAuth(tgWebApp);
        });

      } catch (error) {
        logger.error('Unexpected error:', error);
        setState({ tgId: null, isLoading: false, isTelegram: false });
      }
    };

    const tryFallbackAuth = (tgWebApp) => {
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
        .then(res => {
          if (!res.ok) throw new Error('Auth failed');
          return res.json();
        })
        .then(data => {
          if (data.valid) {
            const userIdStr = userId.toString();
            tgWebApp.CloudStorage?.setItem?.('tg_id', userIdStr, (err) => {
              if (err) logger.error('Failed to save to CloudStorage:', err);
            });
            setState({ tgId: userIdStr, isLoading: false, isTelegram: true });
          } else {
            setState({ tgId: null, isLoading: false, isTelegram: true });
          }
        })
        .catch(error => {
          logger.error('Auth error:', error);
          setState({ tgId: null, isLoading: false, isTelegram: true });
        });
    };

    verifyTgAuth();
  }, []);

  return state;
}