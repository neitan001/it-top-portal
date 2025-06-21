import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  idleTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

pool.getConnection()
  .then(conn => {
    console.log('Successfully connected to the database');
    conn.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err);
  });

pool.on('acquire', connection => {
  console.log('Connection %d acquired', connection.threadId);
});

pool.on('release', connection => {
  console.log('Connection %d released', connection.threadId);
});

pool.on('enqueue', () => {
  console.log('Waiting for available connection slot');
});

pool.on('error', err => {
  console.error('Pool error:', err);
});

export const db = pool;