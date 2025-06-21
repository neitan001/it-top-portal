import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styles from '@/styles/cloud/Index.module.css';

export default function Home() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [userName, setUserName] = useState("");
  const [isExiting, setIsExiting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
  const savedName = localStorage.getItem('userName');
  if (savedName) {
    setUserName(savedName);
  }
  }, []);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/cloud/auth/authenticate', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (res.ok) {
          setShowWelcome(true);
        } else {
          setIsCheckingAuth(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsCheckingAuth(false);
      }
    }

    checkAuth();
  }, [router]);

  useEffect(() => {
  if (showWelcome) {
    const exitTimeout = setTimeout(() => {
      setIsExiting(true);
    }, 2000);
    
    const redirectTimeout = setTimeout(() => {
      router.push('/desktop/cloud/dashboard');
    }, 3000);
    
    return () => {
      clearTimeout(exitTimeout);
      clearTimeout(redirectTimeout);
    };
  }
}, [showWelcome, router]);

  if (isCheckingAuth === null) {
    return null;
  }

  const handleLogin = async (e) => {
  e.preventDefault();
  setError(null);
  setIsLoading(true);

  try {
    const response = await fetch('/api/cloud/auth/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Ошибка авторизации');

    localStorage.setItem('authToken', data.token);
    setUserName(data.user?.name || login);
    localStorage.setItem('userName', data.user.name);
    setShowWelcome(true);
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
  };

  const Logo = () => (
  <svg width="127" height="89" viewBox="0 0 127 89" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M65.3261 27.8818L60.3314 37.0869L56.0527 20.0216L126.1 1L65.3261 27.8818Z" fill="#C1C1C1" stroke="black" stroke-linejoin="round"/>
  <path d="M71.2473 32.4757L60.3848 37.087L65.3794 27.8818L71.2473 32.4757Z" fill="black" stroke="black" stroke-linejoin="round"/>
  <path d="M50.0795 8.37109L126.047 1L56.0521 20.0216L48.4204 14.537C45.8706 12.7029 46.9534 8.6855 50.0795 8.37109Z" fill="white" stroke="black" stroke-linejoin="round"/>
  <path d="M126.049 1L65.3271 27.8818L79.6475 38.5716C82.5116 40.7026 86.5109 40.4231 89.0431 37.9079L126.049 1Z" fill="white" stroke="black" stroke-linejoin="round"/>
  <path d="M60.2002 36.9102C49.023 36.9102 34.3057 47.0122 35.0432 56.69C35.371 60.9822 39.6158 63.5934 44.3194 62.402C49.023 61.2106 51.0388 57.2286 48.0396 53.883C44.0408 49.4113 33.7649 47.9588 21.3421 56.9022C10.9024 64.4094 3.62575 76.2414 1.2002 87.9102" stroke="#1C1C1E" stroke-width="1.34152" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  );

return (
    <div className={styles.pageWrapper}>
      <div className={`${styles.logoContainer} ${isExiting ? styles.logoContainerFlyInto : ''}`}>
        <Logo />
        <div className={styles.logoText}>IT TOP | Cloud</div>
      </div>

      <div className={`${styles.container} ${isExiting ? styles.containerSlideOutDown : ''}`} id="container">
        <div className={styles.formContainer}>
          {showWelcome ? (
            <div className={styles.welcomeBox}>
              <h1>Добро пожаловать, {userName}!</h1>
              <div className={styles.redirectMessage}>
                <p>Перенаправляем на панель...</p>
                <div className={styles.loadingSpinner}></div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className={styles.form}>
              <h1>Вход</h1>
              <input
                type="text"
                placeholder="Логин"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                className={styles.input}
              />
              <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.input}
              />
              {error && <p className={styles.errorText}>{error}</p>}
              <button type="submit" disabled={isLoading} className={`${styles.button} ${isLoading ? styles.buttonDisabled : ''}`}>
                {isLoading ? "Вход..." : "Войти"}
              </button>
            </form>
          )}
        </div>

        <div className={styles.overlayContainer}>
          <div className={styles.overlay}>
            <div className={styles.overlayPanel}>
              <h1>Добро пожаловать!</h1>
              <p>
                Войдите, используя логин и пароль от&nbsp;
                <a href="https://journal.top-academy.ru" target="_blank" rel="noreferrer" className={styles.link}>Journal</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}