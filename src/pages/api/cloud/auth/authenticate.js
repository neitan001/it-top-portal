import jwt from 'jsonwebtoken';
import { encryptPassword } from '../../../lib/crypto';
import { getConnection } from '../../../lib/db';
import { logger } from '../../../lib/logger';

const JWT_SECRET = process.env.JWT_SECRET;

function getDefaultHeaders() {
  return {
    'User-Agent': process.env.USER_AGENT,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Origin': process.env.ORIGIN,
    'Referer': process.env.REFERER
  };
}

async function requestAuthToken(login, password, applicationKey) {
  try {
    const response = await fetch(process.env.AUTH_URL, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify({
        username: login,
        password,
        application_key: applicationKey
      })
    });

    if (!response.ok) {
      logger.error(`Auth error: ${response.status} - ${await response.text()}`);
      return null;
    }

    const data = await response.json();
    return data.access_token || null;
  } catch (error) {
    logger.error('Auth request error:', error);
    return null;
  }
}

async function fetchUserName(accessToken) {
  try {
    const response = await fetch(process.env.USER_INFO, {
      method: 'GET',
      headers: {
        ...getDefaultHeaders(),
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      logger.error(`User info fetch error: ${response.status} - ${await response.text()}`);
      return null;
    }

    const data = await response.json();

    // Выделяем имя из full_name (второе слово)
    function extractFirstName(fullName) {
      if (!fullName) return null;
      const parts = fullName.trim().split(/\s+/);
      return parts.length >= 2 ? parts[1] : null;
    }

    return extractFirstName(data.full_name);
  } catch (error) {
    logger.error('Fetch user info error:', error);
    return null;
  }
}

async function saveOrUpdateUser(login, password, token) {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    logger.error('Ошибка: не удалось загрузить ключ шифрования.');
    return null;
  }

  let connection;
  try {
    connection = await getConnection();

    const encryptedPassword = encryptPassword(password, encryptionKey);

    const [users] = await connection.execute(
      `SELECT user_id FROM users WHERE login = ?`,
      [login]
    );

    let user_id;

    if (users.length === 0) {
      const [result] = await connection.execute(
        `INSERT INTO users (login, password, token) VALUES (?, ?, ?)`,
        [login, encryptedPassword, token]
      );
      user_id = result.insertId;
      logger.info(`Новый пользователь с логином ${login} добавлен в базу.`);
    } else {
      user_id = users[0].user_id;
      await connection.execute(
        `UPDATE users SET password = ?, token = ? WHERE user_id = ?`,
        [encryptedPassword, token, user_id]
      );
      logger.info(`Данные пользователя с логином ${login} обновлены.`);
    }

    return user_id;
  } catch (error) {
    logger.error('Database error:', error);
    return null;
  } finally {
    if (connection) connection.release();
  }
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // твоя уже существующая логика входа
    try {
      const { login, password } = req.body;
      const applicationKey = process.env.APPLICATION_KEY;

      if (!login || !password || !applicationKey) {
        return res.status(400).json({ error: 'Необходимы login, password и application_key' });
      }

      const accessToken = await requestAuthToken(login, password, applicationKey);

      if (!accessToken) {
        return res.status(401).json({ error: 'Не удалось авторизоваться. Проверьте введенные данные.' });
      }

      const userName = await fetchUserName(accessToken);

      const userId = await saveOrUpdateUser(login, password, accessToken);

      const tokenPayload = { login, name: userName, userId };
      const jwtToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

      res.setHeader('Set-Cookie', `token=${jwtToken}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict`);

      return res.status(200).json({
        message: 'Авторизация успешна',
        token: jwtToken,
        user: { login, name: userName }
      });
    } catch (error) {
      logger.error('Authentication error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    // сюда добавляем проверку авторизации по cookie
    try {
      const token = req.cookies.token;

      if (!token) {
        return res.status(401).json({ error: 'Нет токена, пользователь не авторизован' });
      }

      const decoded = jwt.verify(token, JWT_SECRET);

      return res.status(200).json({ user: decoded });
    } catch (error) {
      return res.status(401).json({ error: 'Неверный или просроченный токен' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}