import multer from 'multer';
import jwt from 'jsonwebtoken';
import { getConnection } from '../../../lib/db';
import { logger } from '../../../lib/logger';
import path from 'path';
import fs from 'fs';
import cookie from 'cookie'; // Для парсинга кук

const JWT_SECRET = process.env.JWT_SECRET;

const uploadFolder = path.resolve('./uploads');
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не поддерживается' });
  }

  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'Токен не найден в куках' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Неверный или просроченный токен' });
    }

    const userId = decoded.userId;

    // ✅ Создаём папку для пользователя
    const userFolder = path.join(uploadFolder, `user_${userId}`);
    if (!fs.existsSync(userFolder)) {
      fs.mkdirSync(userFolder, { recursive: true });
    }

    // ✅ Создаём новое хранилище для конкретного запроса
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, userFolder);
      },
      filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
      },
    });

    const upload = multer({ storage });

    // ✅ Загружаем файл
    await new Promise((resolve, reject) => {
      upload.single('file')(req, res, (err) => {
        if (err) {
          reject(new Error('Ошибка при загрузке файла'));
          return;
        }
        resolve();
      });
    });

    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    // ✅ Сохраняем информацию в БД
    const connection = await getConnection();
    try {
      const sql = `INSERT INTO files (owner_id, original_name, server_name, size, mime_type) VALUES (?, ?, ?, ?, ?)`;
      const params = [
        userId,
        req.file.originalname,
        req.file.filename,
        req.file.size,
        req.file.mimetype,
      ];

      logger.error(`Upload error: userId=${userId}, originalName=${req.file?.originalname}, serverName=${req.file?.filename}, size=${req.file?.size}, mimeType=${req.file?.mimetype}`);

      await connection.execute(sql, params);
      return res.status(201).json({ message: 'Файл успешно загружен', file: req.file.filename });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Ошибка в API:', error);
    return res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
}