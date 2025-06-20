import dynamic from 'next/dynamic';

const Navigation = dynamic(() => import('@/components/mini-app/Navigation/Navigation'));
const Grades = dynamic(() => import('@/components/mini-app/Grades/Grades'));


export default function GradesPage() {
  return (
    <div>
      <Grades />
      <div>
        <Navigation activePage="/mini-app/grades" />
      </div>
    </div>
  );
}