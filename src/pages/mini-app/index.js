import { useEffect } from 'react';
import useTelegramAuth from '@/hooks/mini-app/useTelegramAuth';
import TelegramProvider from '@/components/mini-app/TelegramProvider/TelegramProvider';

export default function MiniAppLoaderPage() {
  return (
    <TelegramProvider>
      <MiniAppLoader />
    </TelegramProvider>
  );
}

function MiniAppLoader() {
  const { isLoading, isTelegram } = useTelegramAuth();

  useEffect(() => {
    const storedTgId = localStorage.getItem('tg_id');

    if (storedTgId) {
      window.location.replace('/mini-app/dashboard');
      return;
    }

    window.location.replace('/mini-app/login');
  }, []);

  return null;
}