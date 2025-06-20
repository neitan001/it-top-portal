import { getConnection } from '../../../lib/db';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET;

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Метод не поддерживается' });
  }

  try {
    // Получаем токен из cookie
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'Токен не найден' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Неверный или просроченный токен' });
    }

    const userId = decoded.userId;

    const connection = await getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT id, original_name, server_name, size, mime_type FROM files WHERE owner_id = ? ORDER BY id DESC`,
        [userId]
      );

      return res.status(200).json({ files: rows });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Ошибка при получении файлов:', error);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
}