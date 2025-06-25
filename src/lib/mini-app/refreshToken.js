import { prismaMiniApp } from '@/lib/prisma/mini-app';
import { decryptPassword } from './crypto';

export default async function refreshToken(tg_id) {
  try {
    const user = await prismaMiniApp.user.findUnique({
      where: { tg_id: String(tg_id) },
      select: { login: true, password: true }
    });

    if (!user?.login || !user?.password) {
      console.error('Логин или пароль не найдены в базе');
      return null;
    }

    const { AUTH_URL, USER_AGENT, ORIGIN, REFERER } = process.env;

    if (!AUTH_URL) {
      console.error('Переменная окружения AUTH_URL не определена');
      return null;
    }

    const decryptedPassword = decryptPassword(user.password);

    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
        'Origin': ORIGIN,
        'Referer': REFERER,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: user.login,
        password: decryptedPassword,
        application_key: process.env.APPLICATION_KEY
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Ошибка HTTP при обновлении токена: ${response.status}. Тело: ${errorText}`);
      return null;
    }

    const authData = await response.json();
    const token = authData?.access_token;

    if (!token) {
      console.error('Токен не получен в ответе');
      return null;
    }

    await prismaMiniApp.user.update({
      where: { tg_id: String(tg_id) },
      data: { token }
    });

    return token;

  } catch (err) {
    console.error('Ошибка при обновлении токена:', err);
    return null;
  }
}
