import { prismaMiniApp } from '@/lib/prisma/mini-app';
import refreshToken from '@/lib/mini-app/refreshToken';

async function fetchEvaluateLessonList(url, headers) {
  const response = await fetch(url, { method: 'GET', headers });

  if (response.status === 401) {
    return { shouldRetry: true };
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    return { error, status: response.status };
  }

  return { data: await response.json() };
}

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

    const evaluateLessonUrl = process.env.EVALUATION_LESSONS_LIST;

    const headers = {
      'Authorization': `Bearer ${user.token}`,
      'User-Agent': USER_AGENT,
      'Origin': ORIGIN,
      'Referer': REFERER,
      'Accept': "application/json",
      'Content-Type': "application/json",
    };

    let result = await fetchEvaluateLessonList(evaluateLessonUrl, headers);

    if (result.shouldRetry) {
      const newToken = await refreshToken(tg_id);
      if (newToken) {
        headers.Authorization = `Bearer ${newToken}`;
        result = await fetchEvaluateLessonList(evaluateLessonUrl, headers);
      }
    }

    if (result.error) {
      return res.status(result.status || 500).json({
        error: 'Ошибка API райтинг потока',
        status: result.status,
        details: result.error
      });
    }

    res.status(200).json({
      success: true,
      evaluateLesson: result.data
    });

  } catch (err) {
    console.error('Ошибка:', err);
    res.status(500).json({
      error: 'Внутренняя ошибка сервера',
      details: err.message
    });
  }
}