import { prismaMiniApp } from '../../../../lib/prisma/mini-app';
const { encryptPassword } = require('../../../../lib/mini-app/crypto');

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
    const token = authData?.access_token;
    let group_name = null;

    if (!token) {
      return res.status(400).json({ error: "Токен (access_token) не получен от сервера" });
    }

    if (USER_INFO) {
      try {
        const userInfoResponse = await fetch(USER_INFO, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': USER_AGENT,
            'Origin': ORIGIN,
            'Referer': REFERER,
          }
        });

        if (!userInfoResponse.ok) {
          console.error('Ошибка запроса USER_INFO:', userInfoResponse.status);
        } else {
          const userInfo = await userInfoResponse.json();
          group_name = userInfo.group_name || null;
        }
      } catch (error) {
        console.error('Ошибка при запросе USER_INFO:', error);
      }
    }

    const existingUser = await prismaMiniApp.user.findFirst({
      where: {
        OR: [
          { tg_id: String(tg_id) },
          { login: login }
        ]
      }
    });

    const userData = {
      tg_id: String(tg_id),
      token: token,
      group_name: group_name,
      last_visit: new Date(),
      password: encryptedPassword,
    };

    if (existingUser) {
      const updatedUser = await prismaMiniApp.user.update({
        where: { user_id: existingUser.user_id },
        data: userData,
        select: {
          user_id: true,
          login: true,
          tg_id: true,
          group_name: true,
          theme: true,
          last_visit: true,
        },
      });
    } else {
      const newUser = await prismaMiniApp.user.create({
        data: {
          login,
          ...userData
        },
        select: {
          user_id: true,
          login: true,
          tg_id: true,
          group_name: true,
          theme: true,
          last_visit: true,
        },
      });
    }

    const userForTheme = existingUser ? 
      await prismaMiniApp.user.findUnique({
        where: { user_id: existingUser.user_id },
        select: { theme: true },
      }) : 
      await prismaMiniApp.user.findUnique({
        where: { tg_id: String(tg_id) },
        select: { theme: true },
      });

    return res.status(200).json({ 
      success: true,
      theme: userForTheme?.theme || 'dark'
    });

  } catch (err) {
    console.error('Ошибка:', err);
    return res.status(500).json({
      error: 'Внутренняя ошибка сервера',
      details: err.message
    });
  }
}