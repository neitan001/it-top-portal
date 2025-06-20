import styles from '@/styles/Dashboard.module.css';
import dynamic from 'next/dynamic';

const Navigation = dynamic(() => import('@/components/mini-app/Navigation/Navigation'));
const Calendar = dynamic(() => import('@/components/mini-app/Calendar/Calendar'));

export default function Dashboard() {
  return (
    <div className={styles.container}>
      <Calendar />
      
      <div>
        <Navigation activePage="/mini-app/dashboard" />
      </div>
    </div>
  );
}