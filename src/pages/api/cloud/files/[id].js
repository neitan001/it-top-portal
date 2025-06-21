import { db } from '@/lib/cloud/db';
import jwt from 'jsonwebtoken';
import * as cookie from 'cookie';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET;
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    const { id } = req.query;

    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ error: 'Неверный ID файла' });
    }

    try {
        const cookies = cookie.parse(req.headers.cookie || '');
        const token = cookies.token;

        if (!token) {
            return res.status(401).json({ error: 'Токен не найден' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        const [fileRows] = await db.execute(
            `SELECT id, original_name, server_name, size, mime_type, owner_id 
             FROM files WHERE id = ?`,
            [parseInt(id)]
        );

        if (fileRows.length === 0) {
            return res.status(404).json({ error: 'Файл не найден в базе данных' });
        }

        const file = fileRows[0];

        if (file.owner_id !== userId) {
            return res.status(403).json({ error: 'Нет доступа к файлу' });
        }

        switch (req.method) {
            case 'GET':
                return handleDownload(res, file);
            case 'DELETE':
                return handleDelete(res, file, id);
            default:
                return res.status(405).json({ error: 'Метод не поддерживается' });
        }
    } catch (error) {
        console.error('Ошибка при обработке файла:', error);
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ error: 'Неверный или просроченный токен' });
        }
        return res.status(500).json({ error: 'Ошибка сервера' });
    }
}

async function handleDownload(res, file) {
    const userUploadDir = path.join(UPLOAD_DIR, `user_${file.owner_id}`);
    const filePath = path.join(userUploadDir, file.server_name);
    
    try {
        await fsp.access(filePath);
        
        res.setHeader('Content-Type', file.mime_type);
        res.setHeader('Content-Length', file.size);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_name)}"`);

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        
        fileStream.on('error', (err) => {
            console.error('Ошибка потока файла:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Ошибка при чтении файла' });
            }
        });
        
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({ 
                error: 'Файл не найден на сервере',
                detail: `Путь: ${filePath}`
            });
        }
        return res.status(500).json({ error: 'Ошибка сервера' });
    }
}

async function handleDelete(res, file, id) {
    const userUploadDir = path.join(UPLOAD_DIR, `user_${file.owner_id}`);
    const filePath = path.join(userUploadDir, file.server_name);

    try {
        try {
            await fsp.unlink(filePath);
        } catch (err) {
            if (err.code !== 'ENOENT') {
                throw err;
            }
            console.warn(`Файл не найден при удалении: ${filePath}`);
        }

        await db.execute(
            `DELETE FROM files WHERE id = ?`,
            [parseInt(id)]
        );

        return res.status(200).json({ message: 'Файл успешно удален' });
    } catch (error) {
        console.error('Ошибка при удалении файла:', error);
        return res.status(500).json({ 
            error: 'Ошибка при удалении файла',
            detail: error.message
        });
    }
}