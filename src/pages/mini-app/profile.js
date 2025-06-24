import dynamic from 'next/dynamic';
import useTelegramAuth from '@/hooks/mini-app/useTelegramAuth';

const Profile = dynamic(() => import ('@/components/mini-app/Profile/Profile'));
const Navigation = dynamic(() => import ('@/components/mini-app/Navigation/Navigation'));

export default function ProfilePage() {
  const { tgId, isLoading } = useTelegramAuth();

  if (isLoading) {
    return;
  }

  return (
    <div className="container">
      <Profile tgId={tgId} />
      <Navigation activePage="/mini-app/profile" />
    </div>
  );
}