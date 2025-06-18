import Head from 'next/head';
import styles from '@/styles/Login.module.css';
import { useAuthLogic } from '@/lib/mini-app/authLogic';

export default function LoginPage({ tg_id }) {
  const { message, handleSubmit } = useAuthLogic(tg_id);

  return (
    <>
      <Head>
        <title>Добро пожаловать</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.loginPage} id="login-page">
        <div className={styles.loginBox}>
          <div className={styles.textLogo}>
            <span className={styles.itTop}>IT TOP</span>
            <span className={styles.idBadge}>ID</span>
          </div>
          <h1 className={styles.welcomeText}>
            <span className={styles.boldLine}>Введите данные</span><br />
            Для входа в аккаунт
          </h1>
          <form onSubmit={handleSubmit} className={styles.loginForm}>
            <div className={styles.inputGroup}>
              <input
                type="text"
                id="login"
                name="login"
                placeholder="Ваш логин от Journal..."
                required
                className={`${styles.input} ${styles.inputleft}`}
              />
            </div>
            <div className={styles.inputGroup}>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Ваш пароль от Journal..."
                required
                className={`${styles.input} ${styles.inputright}`}
              />
            </div>
            <button type="submit" className={styles.submitButton}>
              Вход
            </button>
            {message && <div className={styles.errorMessage}>{message}</div>}
          </form>
          <div className={styles.copyright}>
            Mini App by{' '}
            <a
              href="https://neitan-dev.ru/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.highlightLink}
            >
              Neitan
            </a>{' '}
            © {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </>
  );
}