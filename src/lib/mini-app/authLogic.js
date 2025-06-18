import { useState } from "react";
import { useRouter } from "next/router";

export function useAuthLogic(tg_id) {
  const [message, setMessage] = useState(null);
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);

    const formData = new FormData(event.target);
    const login = formData.get("login");
    const password = formData.get("password");

    if (!tg_id) {
      setMessage("Ошибка: не удалось определить Telegram ID.");
      return;
    }

    try {
      const res = await fetch("/api/mini-app/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          login,
          password,
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Ошибка входа");
        return;
      }

      router.push("/mini-app/dashboard");
    } catch (err) {
      console.error(err);
      setMessage("Ошибка сети. Попробуйте позже.");
    }
  };

  return {
    message,
    handleSubmit
  };
}