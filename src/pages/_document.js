import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ru">
      <Head />
      <body>
        <Main />
        <NextScript />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                  try {
                      const theme = localStorage.getItem('theme') || 'dark';
                      document.documentElement.setAttribute('data-theme', theme);
                  } catch(e) {}
              })();
            `,
          }}
        />
      </body>
    </Html>
  );
}