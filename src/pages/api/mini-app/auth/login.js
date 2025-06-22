import { prismaMiniApp } from '../../lib/prisma/mini-app';
const { encryptPassword } = require('../../lib/crypto');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не разрешён' });
  }

  const {
    AUTH_URL,
    APPLICATION_KEY,
    USER_AGENT,
    ORIGIN,
    REFERER,
    USER_INFO
  } = process.env;

  const { login, password, tg_id } = req.body;

  if (!login || !password || !tg_id) {
    return res.status(400).json({ error: 'Логин, пароль и Telegram ID обязательны' });
  }

  try {

    const encryptedPassword = encryptPassword(password);

    const authResponse = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
        'Origin': ORIGIN,
        'Referer': REFERER,
      },
      body: JSON.stringify({
        username: login,
        password,
        application_key: APPLICATION_KEY,
      }),
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      return res.status(authResponse.status).json({
        error: 'Ошибка авторизации',
        status: authResponse.status,
        details: errorText
      });
    }

    const authData = await authResponse.json();
    const token = authData.token || authData.jwt;

    let group_name = null;
    if (USER_INFO) {
      try {
        const userInfoResponse = await fetch(USER_INFO, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': USER_AGENT,
            'Origin': ORIGIN,
            'Referer': REFERER,
          }
        });

        if (userInfoResponse.ok) {
          const userInfo = await userInfoResponse.json();
          group_name = userInfo.group_name || userInfo.group?.name || null;
        } else {
          console.warn('Не удалось получить информацию о пользователе, status:', userInfoResponse.status);
        }
      } catch (infoError) {
        console.error('Ошибка при получении информации о пользователе:', infoError);
      }
    }

    const user = await prismaMiniApp.user.create({
      data: {
        login,
        password: encryptedPassword,
        tg_id,
        token,
        group_name,
        last_visit: new Date()
      },
      select: {
        user_id: true,
        login: true,
        tg_id: true,
        group_name: true,
        theme: true,
        last_visit: true
      }
    });

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Ошибка:', err);
    return res.status(500).json({
      error: 'Внутренняя ошибка сервера',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}