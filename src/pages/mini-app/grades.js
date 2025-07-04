import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import useTelegramAuth from '@/hooks/mini-app/useTelegramAuth';
import { coreAlert } from '@/components/CoreAlert';
import PageWrapper from '@/components/mini-app/Navigation/PageWrapper';

const Navigation = dynamic(() => import('@/components/mini-app/Navigation/Navigation'));
const Grades = dynamic(() => import('@/components/mini-app/Grades/Grades'));

export default function GradesPage() {
  const { tgId, isLoading } = useTelegramAuth();

  useEffect(() => {
    coreAlert({
      type: "info",
      title: "Загрузка оценок...",
      loader: true,
      successButton: { show: false },
      cancelButton: { show: false },
    });
  }, []);

  if (isLoading) {
    return null;
  }

  const handleGradesReady = () => {
    coreAlert.close();
  };

  return (
    <>
      <PageWrapper pagePath="/mini-app/grades">
        <div>
          <Grades tgId={tgId} onGradesReady={handleGradesReady} />
        </div>
      </PageWrapper>
      <Navigation activePage="/mini-app/grades" />
    </>
  );
}