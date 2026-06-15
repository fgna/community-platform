import { Topbar } from '@/components/layout/topbar';
import { SettingsPage } from '@/components/settings/settings-page';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings',
};

export default function Settings() {
  return (
    <>
      <Topbar title="Settings" />
      <div className="flex-1 overflow-y-auto p-6">
        <SettingsPage />
      </div>
    </>
  );
}
