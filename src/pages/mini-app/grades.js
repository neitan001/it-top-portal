import Grades from '@/components/mini-app/Grades/Grades';
import Navigation from '@/components/mini-app/Navigation/Navigation';

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