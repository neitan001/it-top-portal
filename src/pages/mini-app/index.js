import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function MiniAppLoader() {
  const router = useRouter();

  useEffect(() => {
    const tgId = localStorage.getItem('tg_id');

    if (tgId) {
      router.replace('/mini-app/dashboard');
    } else {
      router.replace('/mini-app/login');
    }
  }, [router]);

  return (
    <></>
  );
}