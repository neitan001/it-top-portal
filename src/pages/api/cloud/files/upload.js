import multer from 'multer';
import { slugify } from 'transliteration';
import { Buffer } from 'buffer';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/cloud/db';
import { logger } from '@/lib/cloud/logger';
import path from 'path';
import fs from 'fs';
import * as cookie from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET;

const uploadFolder = path.resolve('./uploads');
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

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

    // Проверка доступного места
    const [[{ totalSize }]] = await db.execute(
      'SELECT SUM(size) AS totalSize FROM files WHERE owner_id = ?',
      [userId]
    );

    const usedSpace = totalSize || 0;
    const STORAGE_LIMIT_BYTES = 1 * 1024 * 1024 * 1024; // 1GB

    if (usedSpace >= STORAGE_LIMIT_BYTES) {
      return res.status(403).json({
        error: 'Превышен лимит хранилища',
        code: 'STORAGE_LIMIT_EXCEEDED',
        used: usedSpace,
        limit: STORAGE_LIMIT_BYTES
      });
    }

    const userFolder = path.join(uploadFolder, `user_${userId}`);
    if (!fs.existsSync(userFolder)) {
      fs.mkdirSync(userFolder, { recursive: true });
    }

    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, userFolder);
      },
      filename: (req, file, cb) => {
        try {
          const originalNameUtf8 = Buffer.from(file.originalname, 'latin1').toString('utf8');
          const safeName = slugify(originalNameUtf8.replace(/\s+/g, '_'));
          const uniqueName = Date.now() + '-' + safeName;
          cb(null, uniqueName);
        } catch (err) {
          cb(err);
        }
      },
    });

    const remainingSpace = STORAGE_LIMIT_BYTES - usedSpace;
    const upload = multer({
      storage,
      limits: {
        fileSize: remainingSpace
      }
    });

    // Обработка загрузки файлов
    const files = await new Promise((resolve, reject) => {
      upload.array('files[]', 10)(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return reject({
              status: 403,
              error: 'Размер файла превышает доступное свободное место',
              code: 'FILE_TOO_LARGE',
              limit: remainingSpace,
            });
          }
          return reject({
            status: 400,
            error: 'Ошибка загрузки файла',
            code: err.code || 'UPLOAD_MULTER_ERROR',
          });
        } else if (err) {
          return reject({
            status: 500,
            error: 'Неизвестная ошибка при загрузке файла',
            code: 'UPLOAD_UNKNOWN_ERROR',
          });
        }
        resolve(req.files);
      });
    });

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Файлы не загружены' });
    }

    try {
      const results = [];
      for (const file of files) {
        const originalNameFixed = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const sql = `INSERT INTO files (owner_id, original_name, server_name, size, mime_type) VALUES (?, ?, ?, ?, ?)`;
        const params = [
          userId,
          originalNameFixed,
          file.filename,
          file.size,
          file.mimetype,
        ];

        await db.execute(sql, params);
        results.push({
          original_name: originalNameFixed,
          server_name: file.filename,
          size: file.size,
          mime_type: file.mimetype
        });
      }

      return res.status(201).json({
        success: true,
        files: results,
        message: `Успешно загружено ${files.length} файлов`
      });
    } catch (error) {
      // Удаляем все загруженные файлы в случае ошибки
      files.forEach(file => {
        try {
          fs.unlinkSync(path.join(userFolder, file.filename));
        } catch (unlinkError) {
          logger.error('Ошибка при удалении файла:', unlinkError);
        }
      });
      
      throw error;
    }

  } catch (error) {
    console.error('Ошибка в API:', error);
    const status = error.status || 500;
    return res.status(status).json({
      error: error.error || error.message || 'Ошибка сервера',
      code: error.code || 'UPLOAD_ERROR'
    });
  }
}