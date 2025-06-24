import dynamic from 'next/dynamic';
import useTelegramAuth from '@/hooks/mini-app/useTelegramAuth';

const Navigation = dynamic(() => import('@/components/mini-app/Navigation/Navigation'));
const Feedback = dynamic(() => import('@/components/mini-app/Feedback/Feedback'));

export default function FeedbackPage() {
  const { tgId, isLoading } = useTelegramAuth();

  if (isLoading) {
    return;
  }

  return (
    <div>
      <Feedback tgId={tgId} />
      <div>
        <Navigation activePage="/mini-app/feedback" />
      </div>
    </div>
  );
}