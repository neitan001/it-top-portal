import { useEffect } from 'react';
import { useRouter } from 'next/router';
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
  const router = useRouter();
  const { isLoading, isTelegram } = useTelegramAuth();

  useEffect(() => {
    const storedTgId = localStorage.getItem('tg_id');

    if (storedTgId) {
      router.replace('/mini-app/dashboard');
      return;
    }

    router.replace('/mini-app/login');
  }, [router]);

  return null;
}