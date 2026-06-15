import { Topbar } from '@/components/layout/topbar';
import { MembersPage } from '@/components/members/members-page';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Members',
};

export default function Members() {
  return (
    <>
      <Topbar title="Members" />
      <div className="flex-1 overflow-y-auto p-6">
        <MembersPage />
      </div>
    </>
  );
}
