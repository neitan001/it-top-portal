import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const Profile = dynamic(() => import ('@/components/mini-app/Profile/Profile'));
const Navigation = dynamic(() => import ('@/components/mini-app/Navigation/Navigation'));

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="container">
      <Profile />
      <Navigation activePage="/mini-app/profile" />
    </div>
  );
}