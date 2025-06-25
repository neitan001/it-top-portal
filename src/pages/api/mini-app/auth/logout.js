import { prismaMiniApp } from '@/lib/prisma/mini-app';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не разрешен' });
  }

  const tgId = req.headers['x-telegram-id'];
  if (!tgId) {
    return res.status(400).json({ error: 'Не указан Telegram ID' });
  }

  try {
    await prismaMiniApp.user.updateMany({
      where: {
        tg_id: tgId.toString()
      },
      data: {
        tg_id: null
      }
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Ошибка при выходе:', error);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
}
