import '../styles/globals.css';
import '../styles/index.css';
import '../styles/dashboard.css';
import '../styles/personal.css';

export default function App({ Component, pageProps }) {
  return (
    <div className="app-container">
      <main className="app-main">
        <Component {...pageProps} />
      </main>
    </div>
  );
}