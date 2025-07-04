import { useEffect, useState } from 'react';
import { usePageTransition } from './PageTransitionContext';
import styles from './Navigation.module.css';

export default function PageWrapper({ children, pagePath }) {
  const { isTransitioning, setCurrentPage } = usePageTransition();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setCurrentPage(pagePath);
  }, [pagePath, setCurrentPage]);

  useEffect(() => {
    if (isTransitioning) {
      setIsExiting(true);
    }
  }, [isTransitioning]);

  return (
    <div className={`${styles.pageEnter} ${isExiting ? styles.pageExit : ''}`}>
      {children}
    </div>
  );
} 