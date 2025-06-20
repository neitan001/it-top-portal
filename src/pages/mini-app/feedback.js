import dynamic from 'next/dynamic';

const Navigation = dynamic(() => import('@/components/mini-app/Navigation/Navigation'));
const Feedback = dynamic(() => import('@/components/mini-app/Feedback/Feedback'));

export default function FeedbackPage() {
  return (
    <div>
      <Feedback />
      <div>
        <Navigation activePage="/mini-app/feedback" />
      </div>
    </div>
  );
}