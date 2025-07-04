import "@/styles/globals.css";
import { useEffect } from "react";
import { CoreAlertRoot } from "../components/CoreAlert";
import { PageTransitionProvider } from "../components/mini-app/Navigation/PageTransitionContext";

export default function App({ Component, pageProps, router }) {

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
    }
  }, []);

  // Проверяем, является ли текущая страница mini-app
  const isMiniAppPage = router?.pathname?.startsWith('/mini-app/');

  return (
    <CoreAlertRoot>
      {isMiniAppPage ? (
        <PageTransitionProvider>
          <Component {...pageProps} />
        </PageTransitionProvider>
      ) : (
        <Component {...pageProps} />
      )}
    </CoreAlertRoot>
  );
}