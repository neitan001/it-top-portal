import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import useTelegramAuth from '@/hooks/mini-app/useTelegramAuth';
import { coreAlert } from '@/components/CoreAlert';
import PageWrapper from '@/components/mini-app/Navigation/PageWrapper';

const Navigation = dynamic(() => import('@/components/mini-app/Navigation/Navigation'));
const Feedback = dynamic(() => import('@/components/mini-app/Feedback/Feedback'));

export default function FeedbackPage() {
  const { tgId, isLoading } = useTelegramAuth();

  useEffect(() => {
    coreAlert({
      type: "info",
      title: "Загрузка отзывов...",
      loader: true,
      successButton: { show: false },
      cancelButton: { show: false },
    });
  }, []);

  if (isLoading) {
    return null;
  }

  const handleFeedbackReady = () => {
    coreAlert.close();
  };

  return (
    <>
      <PageWrapper pagePath="/mini-app/feedback">
        <div>
          <Feedback tgId={tgId} onFeedbackReady={handleFeedbackReady} />
        </div>
      </PageWrapper>
      <Navigation activePage="/mini-app/feedback" />
    </>
  );
}