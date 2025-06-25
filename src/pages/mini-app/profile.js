import dynamic from 'next/dynamic';
import useTelegramAuth from '@/hooks/mini-app/useTelegramAuth';
import Swal from 'sweetalert2';

const Profile = dynamic(() => import ('@/components/mini-app/Profile/Profile'), {
  loading: () => {
    Swal.fire({
      title: 'Загрузка профиля',
      html: 'Пожалуйста, подождите...',
      allowOutsideClick: false,
      customClass: {
        popup: 'mini-app-swal-popup-loading',
        title: 'mini-app-swal-title-loading',
        confirmButton: 'mini-app-swal-confirm-button'
      },
      didOpen: () => {
        Swal.showLoading();
      }
    });
    return null;
  }
});

const Navigation = dynamic(() => import ('@/components/mini-app/Navigation/Navigation'));

export default function ProfilePage() {
  const { tgId, isLoading } = useTelegramAuth();

  if (isLoading) {
    return;
  }

  const handleProfileReady = () => {
    Swal.close();
  };

  return (
    <div className="container">
      <Profile tgId={tgId} onProfileReady={handleProfileReady} />
      <Navigation activePage="/mini-app/profile" />
    </div>
  );
}