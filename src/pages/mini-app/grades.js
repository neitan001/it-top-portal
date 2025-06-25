import dynamic from 'next/dynamic';
import useTelegramAuth from '@/hooks/mini-app/useTelegramAuth';
import Swal from 'sweetalert2';

const Navigation = dynamic(() => import('@/components/mini-app/Navigation/Navigation'));
const Grades = dynamic(() => import('@/components/mini-app/Grades/Grades'), {
  loading: () => {
    Swal.fire({
      title: 'Загрузка оценок',
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


export default function GradesPage() {
  const { tgId, isLoading } = useTelegramAuth();

  if (isLoading) {
    return;
  }

  const handleGradesReady = () => {
    Swal.close();
  };

  return (
    <div>
      <Grades tgId={tgId} onGradesReady={handleGradesReady} />
      <div>
        <Navigation activePage="/mini-app/grades" />
      </div>
    </div>
  );
}