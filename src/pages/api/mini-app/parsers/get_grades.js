import { prismaMiniApp } from '@/lib/prisma/mini-app';

export default async function handler(req, res) {

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Метод не разрешен' });
  }

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

    const gradesData = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Ошибка API оценок',
        status: response.status,
        details: gradesData
      });
    }

    const sortedGrades = (gradesData || []).sort((a, b) => {
      if (a.date_visit > b.date_visit) return -1;
      if (a.date_visit < b.date_visit) return 1;
      return b.lesson_number - a.lesson_number;
    });

    res.status(200).json({
      success: true,
      grades: sortedGrades
    });

  } catch (err) {
    console.error('Ошибка:', err);
    res.status(500).json({
      error: 'Внутренняя ошибка сервера',
      details: err.message
    });
  }
}