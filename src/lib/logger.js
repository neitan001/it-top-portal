const sendLogToServer = async (level, message, meta) => {
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message, meta }),
    });
  } catch (e) {
    console.error('Failed to send log to server:', e);
  }
};

const isServer = typeof window === 'undefined';

function log(...args) {
  if (isServer) {
    console.log('[SERVER]', ...args);
  } else {
    console.log('[CLIENT]', ...args);
    sendLogToServer('log', args.join(' '));
  }
}

function info(...args) {
  if (isServer) {
    console.info('[SERVER][INFO]', ...args);
  } else {
    console.info('[CLIENT][INFO]', ...args);
    sendLogToServer('info', args.join(' '));
  }
}

function warn(...args) {
  if (isServer) {
    console.warn('[SERVER][WARN]', ...args);
  } else {
    console.warn('[CLIENT][WARN]', ...args);
    sendLogToServer('warn', args.join(' '));
  }
}

function error(...args) {
  if (isServer) {
    console.error('[SERVER][ERROR]', ...args);
  } else {
    console.error('[CLIENT][ERROR]', ...args);
    sendLogToServer('error', args.join(' '));
  }
}

const logger = {
  log,
  info,
  warn,
  error,
};

export default logger;