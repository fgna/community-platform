import { Topbar } from '@/components/layout/topbar';
import { CoursesPage } from '@/components/courses/courses-page';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Courses',
};

export default function Courses() {
  return (
    <>
      <Topbar title="Courses" />
      <div className="flex-1 overflow-y-auto p-6">
        <CoursesPage />
      </div>
    </>
  );
}
