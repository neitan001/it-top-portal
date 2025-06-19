import styles from '@/styles/Dashboard.module.css';
import Navigation from '@/components/mini-app/Navigation/Navigation';
import Calendar from '@/components/mini-app/Calendar/Calendar';

export default function Dashboard() {
  return (
    <div className={styles.container}>
      <Calendar />
      
      <div>
        <Navigation activePage="/dashboard" />
      </div>
    </div>
  );
}