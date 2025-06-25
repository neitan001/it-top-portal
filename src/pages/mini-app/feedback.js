import dynamic from 'next/dynamic';
import useTelegramAuth from '@/hooks/mini-app/useTelegramAuth';
import Swal from 'sweetalert2';

const Navigation = dynamic(() => import('@/components/mini-app/Navigation/Navigation'));
const Feedback = dynamic(() => import('@/components/mini-app/Feedback/Feedback'), {
  loading: () => {
    Swal.fire({
      title: 'Загрузка отзывов',
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

export default function FeedbackPage() {
  const { tgId, isLoading } = useTelegramAuth();

  if (isLoading) {
    return;
  }

  const handleFeedbackReady = () => {
    Swal.close();
  };

  return (
    <div>
      <Feedback tgId={tgId} onFeedbackReady={handleFeedbackReady} />
      <div>
        <Navigation activePage="/mini-app/feedback" />
      </div>
    </div>
  );
}