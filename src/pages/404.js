import { useEffect, useRef } from 'react'

export default function Custom404() {
  const textRef = useRef(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      const text = textRef.current
      if (text) {
        text.classList.add('text-hit')
      }
    }, 600)

    return () => clearTimeout(timeout)
  }, [])

  return (
    <>
      <style>{`
        @media (prefers-color-scheme: dark) {
          .error-container {
            color: #fff !important;
            background: #000;
          }
          .error-code {
            border-right: 1px solid rgba(255,255,255,0.3) !important;
          }
        }

        .error-code {
          transform: translateX(-100vw);
          animation: flyIn 0.6s ease-out forwards;
        }

        @keyframes flyIn {
          0% {
            transform: translateX(-100vw);
          }
          100% {
            transform: translateX(0);
          }
        }

        .error-text {
          display: inline-block;
          transition: transform 0.3s ease-out;
        }

        .text-hit {
          animation: nudgeRight 0.4s ease-in-out;
        }

        @keyframes nudgeRight {
          0% { transform: translateX(0); }
          30% { transform: translateX(10px); }
          60% { transform: translateX(-5px); }
          100% { transform: translateX(0); }
        }
      `}</style>

      <div
        className="error-container"
        style={{
          fontFamily:
            'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
          height: '100vh',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000',
          margin: 0,
          position: 'relative',
          zIndex: 10,
          background: 'transparent',
        }}
      >
        <div style={{ lineHeight: '48px' }}>
          <h1
            className="error-code"
            style={{
              display: 'inline-block',
              margin: '0 20px 0 0',
              paddingRight: '23px',
              fontSize: '24px',
              fontWeight: 500,
              verticalAlign: 'top',
              borderRight: '1px solid rgba(0,0,0,0.3)',
              userSelect: 'none',
            }}
          >
            404
          </h1>
          <h2
            ref={textRef}
            className="error-text"
            style={{
              display: 'inline-block',
              margin: 0,
              fontSize: '14px',
              fontWeight: 400,
              lineHeight: '28px',
              color: 'gray',
              userSelect: 'none',
              verticalAlign: 'top',
            }}
          >
            Упс! Что-то пошло не так.<br />
            Попробуйте обновить страницу или вернитесь на главную.
          </h2>
        </div>
      </div>
    </>
  )
}