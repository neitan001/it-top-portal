import styles from '@/styles/mini-app/Dashboard.module.css';
import dynamic from 'next/dynamic';
import useTelegramAuth from '@/hooks/mini-app/useTelegramAuth';

const Navigation = dynamic(() => import('@/components/mini-app/Navigation/Navigation'));
const Calendar = dynamic(() => import('@/components/mini-app/Calendar/Calendar'));

export default function Dashboard() {
  const { tgId, isLoading } = useTelegramAuth();

  if (isLoading || !tgId ) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <Calendar tgId={tgId} />
      <div>
        <Navigation activePage="/mini-app/dashboard" />
      </div>
    </div>
  );
}