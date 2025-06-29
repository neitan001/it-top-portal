import { useEffect, useState } from 'react';
import Script from 'next/script';

export default function TelegramProvider({ children }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (
      isReady &&
      window.Telegram &&
      window.Telegram.WebApp &&
      typeof window.Telegram.WebApp.expand === 'function'
    ) {
      window.Telegram.WebApp.expand();

      if (typeof window.Telegram.WebApp.disableClosingConfirmation === 'function') {
        window.Telegram.WebApp.disableClosingConfirmation();
      }
      if (typeof window.Telegram.WebApp.setSwipeBackAllowed === 'function') {
        window.Telegram.WebApp.setSwipeBackAllowed(false);
      }
    }
  }, [isReady]);

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="afterInteractive"
        onLoad={() => setIsReady(true)}
      />
      {isReady ? children : null}
    </>
  );
}