import { prismaMiniApp } from '@/lib/prisma/mini-app';
import refreshToken from '@/lib/mini-app/refreshToken';

async function fetchSchedule(url, headers) {
  const response = await fetch(url, { method: 'GET', headers });
  const text = await response.text();

  if (response.status === 401) {
    return { shouldRetry: true };
  }

  if (!response.ok) {
    let error;
    try {
      error = await response.json();
    } catch {
      error = await response.text();
    }
    return { error, status: response.status };
  }

  if (!text) {
    return { data: null };
  }

  try {
    return { data: JSON.parse(text) };
  } catch (e) {
    return { data: text };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Метод не разрешен' });
  }

  const tg_id = req.headers['x-telegram-id'];
  const { date } = req.query;

  if (!tg_id) {
    return res.status(400).json({ error: 'Не указан tg_id' });
  }

  const targetDate = date || new Date().toISOString().split('T')[0];
  const { USER_AGENT, ORIGIN, REFERER } = process.env;

  try {
    const user = await prismaMiniApp.user.findUnique({
      where: { tg_id: String(tg_id) },
      select: { token: true }
    });

    if (!user?.token) {
      return res.status(404).json({ error: 'Токен не найден в базе' });
    }

    const scheduleUrl = process.env.SCHEDULE_URL.replace('{date}', targetDate);
    const headers = {
      'Authorization': `Bearer ${user.token}`,
      'User-Agent': USER_AGENT,
      'Origin': ORIGIN,
      'Referer': REFERER,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    let result = await fetchSchedule(scheduleUrl, headers);

    if (result.shouldRetry) {
      const newToken = await refreshToken(tg_id);
      if (newToken) {
        headers.Authorization = `Bearer ${newToken}`;
        result = await fetchSchedule(scheduleUrl, headers);
      } else {
        return res.status(401).json({
          error: "Не удалось обновить токен",
          details: "Попробуйте войти заново"
        });
      }
    }

    if (result.error) {
      return res.status(result.status || 500).json({
        error: 'Ошибка API расписания',
        details: result.error
      });
    }

    if (typeof result.data === 'undefined') {
      return res.status(502).json({
        error: 'Не удалось получить расписание',
        details: 'Пустой ответ от API расписания'
      });
    }

    res.status(200).json({
      success: true,
      date: targetDate,
      schedule: result.data ?? null
    });

  } catch (err) {
    console.error('Ошибка:', err);
    res.status(500).json({
      error: 'Внутренняя ошибка сервера',
      details: err.message
    });
  }
}