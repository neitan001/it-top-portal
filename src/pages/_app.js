import "@/styles/globals.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Script from "next/script";

import logger from '../lib/logger';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [tgId, setTgId] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const year = new Date().getFullYear();
      console.log(`%c
███╗   ██╗███████╗██╗████████╗ █████╗ ███╗   ██╗
████╗  ██║██╔════╝██║╚══██╔══╝██╔══██╗████╗  ██║
██╔██╗ ██║█████╗  ██║   ██║   ███████║██╔██╗ ██║
██║╚██╗██║██╔══╝  ██║   ██║   ██╔══██║██║╚██╗██║
██║ ╚████║███████╗██║   ██║   ██║  ██║██║ ╚████║
╚═╝  ╚═══╝╚══════╝╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═══╝
      © 2024-${year} | Developed by Neitan
      `, "color: #0A84FF; font-weight: bold; font-size: 10px;");
      console.log("%cLink: https://t.me/Neitan0", "color: #888888; font-size: 12px;");

      const PROTECTION_ENABLED = false;

      if (PROTECTION_ENABLED) {
        const blockKeys = (e) => {
          if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.shiftKey && e.key === 'J') ||
            (e.ctrlKey && e.key === 'U')
          ) {
            e.preventDefault();
          }
        };

        const blockContextMenu = (e) => e.preventDefault();

        document.addEventListener('keydown', blockKeys);
        document.addEventListener('contextmenu', blockContextMenu);

        return () => {
          document.removeEventListener('keydown', blockKeys);
          document.removeEventListener('contextmenu', blockContextMenu);
        };
      }

      const verifyTgAuth = async () => {
        try {
          if (!router.pathname.startsWith("/mini-app/")) return;

          const tgWebApp = window.Telegram?.WebApp;
          if (!tgWebApp) return;

          tgWebApp.expand?.();

          const initData = tgWebApp.initData;
          const userId = tgWebApp.initDataUnsafe?.user?.id;

          if (!userId || !initData) {
            if (process.env.NODE_ENV !== "development") {
              logger.info('userId или initData не найдены!');
            }
            return;
          }

          const res = await fetch("/api/auth/mini-app/validate-tg", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ initData }),
          });

          const data = await res.json();

          if (res.ok && data.valid) {
            setTgId(userId);
          } else {
            logger.info('Не валидный хэш');
          }
        } catch (error) {
          return
        }
      };

      verifyTgAuth();
    }
  }, [router.pathname]);

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />
      <Component {...pageProps} tg_id={tgId} />
    </>
  );
}