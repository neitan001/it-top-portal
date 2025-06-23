import { prismaMiniApp } from '@/lib/prisma/mini-app';

export default async function handler(req, res) {
  const tg_id = req.headers['x-telegram-id'];

  if (!tg_id) {
    return res.status(400).json({ error: 'Не указан tg_id' });
  }

  const {
    USER_AGENT,
    ORIGIN,
    REFERER,
  } = process.env;

  try {
    const user = await prismaMiniApp.user.findUnique({
      where: { tg_id: String(tg_id) },
      select: { token: true }
    });

    if (!user?.token) {
      return res.status(404).json({ error: 'Токен не найден в базе' });
    }

    const gradesUrl = process.env.STUDENT_VISITS;

    const response = await fetch(gradesUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'User-Agent': USER_AGENT,
        'Origin': ORIGIN,
        'Referer': REFERER,
        'Accept': "application/json",
        'Content-Type': "application/json",
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: 'Ошибка API оценок',
        status: response.status,
        details: error
      });
    }

    const grades = await response.json();
    res.status(200).json({
      success: true,
      grades
    });

  } catch (err) {
    console.error('Ошибка:', err);
    res.status(500).json({
      error: 'Внутренняя ошибка сервера',
      details: err.message
    });
  }
}