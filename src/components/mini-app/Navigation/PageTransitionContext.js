import { createContext, useContext, useState } from 'react';

const PageTransitionContext = createContext();

export function PageTransitionProvider({ children }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentPage, setCurrentPage] = useState('');

  const navigateWithTransition = (newPath) => {
    if (isTransitioning || currentPage === newPath) return;
    
    setIsTransitioning(true);
    
    setTimeout(() => {
      window.location.href = newPath;
    }, 300);
  };

  return (
    <PageTransitionContext.Provider value={{
      isTransitioning,
      currentPage,
      setCurrentPage,
      navigateWithTransition
    }}>
      {children}
    </PageTransitionContext.Provider>
  );
}

export function usePageTransition() {
  const context = useContext(PageTransitionContext);
  if (!context) {
    throw new Error('usePageTransition must be used within PageTransitionProvider');
  }
  return context;
} 