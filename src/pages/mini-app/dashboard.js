import styles from '@/styles/mini-app/Dashboard.module.css';
import dynamic from 'next/dynamic';
import useTelegramAuth from '@/hooks/mini-app/useTelegramAuth';
import PageWrapper from '@/components/mini-app/Navigation/PageWrapper';

const Navigation = dynamic(() => import('@/components/mini-app/Navigation/Navigation'));
const Calendar = dynamic(() => import('@/components/mini-app/Calendar/Calendar'));
const EvaluationModal = dynamic(() => import('@/components/mini-app/EvaluationModal/EvaluationModal'));

export default function Dashboard() {
  const { tgId, isLoading } = useTelegramAuth();

  if (isLoading) {
    return;
  }

  return (
    <>
      <PageWrapper pagePath="/mini-app/dashboard">
        <div className={styles.container}>
          <EvaluationModal tgId={tgId} />
          <Calendar tgId={tgId} />
        </div>
      </PageWrapper>
      <Navigation activePage="/mini-app/dashboard" />
    </>
  );
}