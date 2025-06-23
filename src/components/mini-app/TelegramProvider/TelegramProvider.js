import styles from '@/styles/mini-app/Dashboard.module.css';
import dynamic from 'next/dynamic';
import TelegramProvider from '@/components/mini-app/TelegramProvider/TelegramProvider';

const Navigation = dynamic(() => import('@/components/mini-app/Navigation/Navigation'));
const Calendar = dynamic(() => import('@/components/mini-app/Calendar/Calendar'));

export default function DashboardPage() {
  return (
    <TelegramProvider>
      <DashboardContent />
    </TelegramProvider>
  );
}

function DashboardContent() {
  const { tgId, isLoading, isTelegram } = useTelegramAuth();

  if (isLoading) return <div>Загрузка...</div>;
  if (!isTelegram) return <div>Пожалуйста, откройте в Telegram WebApp</div>;
  if (!tgId) return <div>Ошибка авторизации</div>;

  return (
    <div className={styles.container}>
      <Calendar tgId={tgId} />
      <Navigation activePage="/mini-app/dashboard" />
    </div>
  );
}