import { useEffect } from 'react';
import styles from '@/styles/Dashboard.module.css';
import Navigation from '@/components/mini-app/Navigation/Navigation';

export default function Dashboard() {
  useEffect(() => {
    // Сюда логику работы с calendar.js
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.navButton}>
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" fill="none" strokeWidth="2" />
          </svg>
        </button>
        <div className={styles.monthYear}>
          <h1></h1>
          <span></span>
        </div>
        <button className={styles.navButton}>
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path d="M9 6l6 6-6 6" stroke="currentColor" fill="none" strokeWidth="2" />
          </svg>
        </button>
      </header>

      <div className={styles.calendar}>
        <div className={styles.weekdays}>
          <div>П</div>
          <div>В</div>
          <div>С</div>
          <div>Ч</div>
          <div>П</div>
          <div>С</div>
          <div>В</div>
        </div>
        <div className={styles.days}>
        </div>
      </div>

      <div className={styles.schedule}>
        <div className={styles.scheduleItems}></div>
      </div>

      <div>
        <Navigation activePage="/dashboard" />
      </div>
    </div>
  );
}