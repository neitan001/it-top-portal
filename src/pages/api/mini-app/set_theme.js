import { prismaMiniApp } from '@/lib/prisma/mini-app';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Метод не разрешен' });
    }

    const tg_id = req.headers['x-telegram-id'];

    if (!tg_id) {
        return res.status(400).json({ error: 'Не указан tg_id' });
    }

    const { theme } = req.body;

    if (!theme) {
        return res.status(400).json({ error: 'Не указана тема' });
    }

    try {
        await prismaMiniApp.user.update({
            where: { tg_id: String(tg_id) },
            data: { theme }
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Ошибка при сохранении темы:', error);
        return res.status(500).json({ error: 'Ошибка сервера' });
    }
}