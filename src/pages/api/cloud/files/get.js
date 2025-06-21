import { db } from '@/lib/cloud/db';
import jwt from 'jsonwebtoken';
import * as cookie from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET;

export const config = {
  api: { bodyParser: false },
};

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      error: 'Метод не поддерживается',
      allowedMethods: ['GET']
    });
  }

  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.token;

    if (!token) {
      return res.status(401).json({
        error: 'Не авторизован: токен не найден',
        code: 'TOKEN_MISSING'
      });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.userId;
    } catch (jwtError) {
      console.error('Ошибка верификации JWT:', jwtError);
      return res.status(401).json({
        error: 'Недействительный токен',
        code: 'TOKEN_INVALID'
      });
    }

    let retries = 0;
    let rows;
    let lastError;

    while (retries <= MAX_RETRIES) {
      try {
        [rows] = await db.execute(
          `SELECT id, original_name, server_name, size, mime_type
          FROM files
          WHERE owner_id = ?
          ORDER BY id DESC
          LIMIT 100`,
          [userId]
        );
        break;
      } catch (dbError) {
        lastError = dbError;
        retries++;

        if (dbError.code === 'ECONNRESET' && retries <= MAX_RETRIES) {
          console.warn(`Повторная попытка ${retries} из-за ECONNRESET...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          continue;
        }

        throw dbError;
      }
    }

    return res.status(200).json({
      success: true,
      count: rows.length,
      files: rows
    });

  } catch (error) {
    console.error('Ошибка при получении файлов:', error);

    let statusCode = 500;
    let errorMessage = 'Ошибка сервера';
    let errorCode = 'SERVER_ERROR';

    if (error.code === 'ECONNRESET') {
      statusCode = 503;
      errorMessage = 'Временная проблема с базой данных';
      errorCode = 'DB_CONNECTION_FAILED';
    } else if (error.name === 'JsonWebTokenError') {
      statusCode = 401;
      errorMessage = 'Недействительный токен';
      errorCode = 'TOKEN_INVALID';
    }

    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      code: errorCode,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}