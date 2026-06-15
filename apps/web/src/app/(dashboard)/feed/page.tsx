import { Topbar } from '@/components/layout/topbar';
import { FeedPage } from '@/components/feed/feed-page';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Feed',
};

export default function Feed() {
  return (
    <>
      <Topbar title="Community Feed" />
      <div className="flex-1 overflow-y-auto p-6">
        <FeedPage />
      </div>
    </>
  );
}
