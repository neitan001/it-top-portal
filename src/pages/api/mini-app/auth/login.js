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
  } = process.env;

  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ error: 'Логин и пароль обязательны' });
  }

  try {
    const response = await fetch(AUTH_URL, {
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

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: 'Ошибка авторизации',
        status: response.status,
        details: errorText
      });
    }

    const data = await response.json();
    return res.status(200).json({ token: data.token || data.jwt });
  } catch (err) {
    return res.status(500).json({ 
      error: 'Внутренняя ошибка сервера',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}