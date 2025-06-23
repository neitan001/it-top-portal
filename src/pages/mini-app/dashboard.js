import styles from '@/styles/mini-app/Dashboard.module.css';
import dynamic from 'next/dynamic';
import useTelegramAuth from '@/hooks/mini-app/useTelegramAuth';
import TelegramProvider from '@/components/mini-app/TelegramProvider/TelegramProvider';

const Navigation = dynamic(() => import('@/components/mini-app/Navigation/Navigation'));
const Calendar = dynamic(() => import('@/components/mini-app/Calendar/Calendar'));

export default function DashboardPage() {
  return (
    <TelegramProvider>
      <Dashboard />
    </TelegramProvider>
  );
}

function Dashboard() {
  const { tgId, isLoading, isTelegram } = useTelegramAuth();

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  if (!isTelegram) {
    return <div>Откройте это в Telegram WebApp</div>;
  }

  return (
    <div className={styles.container}>
      <Calendar tgId={tgId} />
      <Navigation activePage="/mini-app/dashboard" />
    </div>
  );
}