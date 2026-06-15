import { Topbar } from '@/components/layout/topbar';
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function DashboardPage() {
  return (
    <>
      <Topbar title="Dashboard" />
      <div className="flex-1 overflow-y-auto p-6">
        <DashboardOverview />
      </div>
    </>
  );
}
