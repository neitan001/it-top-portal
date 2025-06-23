import { useEffect, useState } from 'react';
import Script from 'next/script';

export default function TelegramProvider({ children }) {
  const [isReady, setIsReady] = useState(false);

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