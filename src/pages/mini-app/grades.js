import dynamic from 'next/dynamic';
import useTelegramAuth from '@/hooks/mini-app/useTelegramAuth';

const Navigation = dynamic(() => import('@/components/mini-app/Navigation/Navigation'));
const Grades = dynamic(() => import('@/components/mini-app/Grades/Grades'));


export default function GradesPage() {
  const { tgId, isLoading } = useTelegramAuth();

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div>
      <Grades tgId={tgId} />
      <div>
        <Navigation activePage="/mini-app/grades" />
      </div>
    </div>
  );
}