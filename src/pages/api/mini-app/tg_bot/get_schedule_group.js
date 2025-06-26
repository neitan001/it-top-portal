import { prismaMiniApp } from '@/lib/prisma/mini-app';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Метод не разрешен' });
  }

  const { group_name, date } = req.query;

  if (!group_name) {
    return res.status(400).json({ error: 'Не указан group_name' });
  }

  try {
    const users = await prismaMiniApp.user.findMany({
      where: { group_name: String(group_name) },
      select: { tg_id: true },
    });

    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'Пользователи с таким group_name не найдены' });
    }

    let schedule = null;
    let lastError = null;

    for (const user of users) {
      try {
        const apiUrl = `/api/mini-app/parsers/get_schedule?date=${date || ''}`;
        console.log('Запрос к:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'x-telegram-id': user.tg_id,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok && data.success) {
          schedule = data.schedule;
          break;
        } else {
          lastError = data.error || 'Ошибка при получении расписания';
        }
      } catch (err) {
        lastError = err.message;
        console.error('Ошибка запроса:', err);
      }
    }

    if (!schedule) {
      return res.status(500).json({
        error: 'Не удалось получить расписание ни для одного пользователя',
        details: lastError || 'Неизвестная ошибка',
      });
    }

    res.status(200).json({
      success: true,
      schedule,
    });
  } catch (err) {
    console.error('Ошибка:', err);
    res.status(500).json({
      error: 'Внутренняя ошибка сервера',
      details: err.message,
    });
  }
}
