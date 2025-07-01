import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import useTelegramAuth from '@/hooks/mini-app/useTelegramAuth';
import { coreAlert } from '@/components/CoreAlert';

const Profile = dynamic(() => import('@/components/mini-app/Profile/Profile'));

const Navigation = dynamic(() => import('@/components/mini-app/Navigation/Navigation'));

export default function ProfilePage() {
  const { tgId, isLoading } = useTelegramAuth();

  useEffect(() => {
    coreAlert({
      type: "info",
      title: "Загрузка профиля...",
      loader: true,
      successButton: { show: false },
      cancelButton: { show: false },
    });
  }, []);

  if (isLoading) {
    return null;
  }

  const handleProfileReady = () => {
    coreAlert.close();
  };

  return (
    <div className="container">
      <Profile tgId={tgId} onProfileReady={handleProfileReady} />
      <Navigation activePage="/mini-app/profile" />
    </div>
  );
}