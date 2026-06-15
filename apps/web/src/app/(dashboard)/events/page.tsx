import { Topbar } from '@/components/layout/topbar';
import { EventsPage } from '@/components/events/events-page';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events',
};

export default function Events() {
  return (
    <>
      <Topbar title="Events" />
      <div className="flex-1 overflow-y-auto p-6">
        <EventsPage />
      </div>
    </>
  );
}
