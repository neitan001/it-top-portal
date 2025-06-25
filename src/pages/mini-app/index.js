import { useEffect, useState } from 'react';
import TelegramProvider from '@/components/mini-app/TelegramProvider/TelegramProvider';
import styles from '@/styles/mini-app/Loader.module.css';
import { versions } from '@/lib/versions';

export default function MiniAppLoaderPage() {
  return (
    <TelegramProvider>
      <MiniAppLoader />
    </TelegramProvider>
  );
}

function MiniAppLoader() {
  const [showLoader] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const storedTgId = localStorage.getItem('tg_id');
      if (storedTgId) {
        window.location.replace('/mini-app/dashboard');
      } else {
        window.location.replace('/mini-app/login');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (showLoader) {
    return (
      <div className={styles.loaderContainer}>
        <h1 className={styles.title}>Загрузка мини-приложения</h1>
        <p className={styles.text}>Мы активно работаем над улучшением сервиса</p>
        <p className={styles.text}>Ваши отзывы помогают нам становиться лучше!</p>
        <div className={styles.spinner}></div>
        <p className={styles.subtitle}>{versions.MINI_APP}</p>
      </div>
    );
  }

  return null;
}