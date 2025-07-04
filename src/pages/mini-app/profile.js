import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import useTelegramAuth from '@/hooks/mini-app/useTelegramAuth';
import { coreAlert } from '@/components/CoreAlert';
import PageWrapper from '@/components/mini-app/Navigation/PageWrapper';

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
    <>
      <PageWrapper pagePath="/mini-app/profile">
        <div className="container">
          <Profile tgId={tgId} onProfileReady={handleProfileReady} />
        </div>
      </PageWrapper>
      <Navigation activePage="/mini-app/profile" />
    </>
  );
}