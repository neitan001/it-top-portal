import { prismaMiniApp } from '@/lib/prisma/mini-app';

const SEND_EVALUATION_LESSONS = process.env.SEND_EVALUATION_LESSONS;
const { USER_AGENT, ORIGIN, REFERER } = process.env;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не разрешён' });
  }

  try {
    const tgId = req.headers['x-telegram-id'] || req.body.tgId;
    if (!tgId) {
      return res.status(400).json({ error: 'Не передан Telegram ID' });
    }

    const user = await prismaMiniApp.user.findUnique({
      where: { tg_id: tgId }
    });

    if (!user || !user.token) {
      return res.status(401).json({ error: 'Пользователь не найден или токен отсутствует' });
    }

    const payload = {
      key: req.body.key,
      mark_lesson: req.body.mark_lesson,
      mark_teach: req.body.mark_teach,
      tags_lesson: req.body.tags_lesson,
      tags_teach: req.body.tags_teach,
      comment_lesson: req.body.comment_lesson || "",
      comment_teach: req.body.comment_teach || ""
    };

    const response = await fetch(SEND_EVALUATION_LESSONS, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'User-Agent': USER_AGENT,
        'Origin': ORIGIN,
        'Referer': REFERER,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text().catch(() => 'Unknown error');
      return res.status(response.status).json({ error: `Ошибка HTTP: ${response.status}. Тело: ${error}` });
    }

    const rawResponse = await response.text();
    let result = null;

    if (rawResponse) {
      try {
        result = JSON.parse(rawResponse);
      } catch (e) {
        throw new Error(`Не удалось разобрать JSON: ${rawResponse}`);
      }
    }

    if (result && result.error) {
      throw new Error(result.error);
    }

    res.status(200).json({
      success: true,
      result
    });

  } catch (err) {
    console.error('Ошибка:', err);
    res.status(500).json({
      error: 'Внутренняя ошибка сервера',
      details: err.message
    });
  }
}