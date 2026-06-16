'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/lib/theme-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Palette, User, Bell, Shield, Download, Trash2, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function SettingsPage() {
  const { user, logout } = useAuth();
  const { themes, setTheme, theme: currentTheme } = useTheme();
  const { updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [profileName, setProfileName] = useState(user?.name ?? '');
  const [profileBio, setProfileBio] = useState('');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatarUrl ?? '');

  const [savedProfile, setSavedProfile] = useState(false);
  const saveProfile = useMutation({
    mutationFn: () =>
      apiClient.patch('/users/me', {
        name: profileName || undefined,
        bio: profileBio || undefined,
        avatarUrl: profileAvatar || undefined,
      }).then((r) => r.data),
    onSuccess: (data) => {
      updateUser({ name: data.name, avatarUrl: data.avatarUrl });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setSavedProfile(true);
    },
  });

  useEffect(() => {
    if (!savedProfile) return;
    const t = setTimeout(() => setSavedProfile(false), 2000);
    return () => clearTimeout(t);
  }, [savedProfile]);

  const exportData = useMutation({
    mutationFn: () => apiClient.get('/gdpr/export').then((r) => r.data),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  const deleteAccount = useMutation({
    mutationFn: () => apiClient.delete('/gdpr/delete').then((r) => r.data),
    onSuccess: () => logout(),
  });

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="w-full justify-start gap-1 h-auto p-1 flex-wrap">
          <TabsTrigger value="profile" className="flex items-center gap-1.5 text-xs">
            <User size={13} /> Profile
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-1.5 text-xs">
            <Palette size={13} /> Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1.5 text-xs">
            <Bell size={13} /> Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-1.5 text-xs">
            <Shield size={13} /> Privacy & Data
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Public Profile</CardTitle>
              <CardDescription>This information will be visible to other community members.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profileAvatar || undefined} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>{user.name}</p>
                  <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{user.email}</p>
                  <p className="text-xs capitalize" style={{ color: 'var(--theme-text-muted)' }}>
                    {user.role}
                  </p>
                  <Button variant="outline" size="sm" className="mt-2 text-xs h-7">
                    Change photo
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Display name</Label>
                  <Input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Your name"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Bio</Label>
                  <Input
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    placeholder="Tell others about yourself"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Avatar URL</Label>
                  <Input
                    value={profileAvatar}
                    onChange={(e) => setProfileAvatar(e.target.value)}
                    placeholder="https://..."
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => saveProfile.mutate()}
                  disabled={saveProfile.isPending}
                >
                  {saveProfile.isPending ? 'Saving…' : savedProfile ? 'Saved ✓' : 'Save changes'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account</CardTitle>
              <CardDescription>Irreversible actions for your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                onClick={logout}
                className="flex items-center gap-2"
              >
                <LogOut size={15} />
                Sign out
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Theme</CardTitle>
              <CardDescription>Choose your preferred look and feel.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {themes.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => setTheme(t.name)}
                    className="relative p-4 rounded-xl text-left transition-all"
                    style={{
                      background: t.colors.surface,
                      border: `2px solid ${currentTheme?.name === t.name ? t.colors.primary : t.colors.border ?? 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ background: t.colors.primary }}
                      />
                      <span className="text-sm font-medium" style={{ color: t.colors.text }}>
                        {t.name}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      {[t.colors.background, t.colors.surface, t.colors.card, t.colors.primary].map((c, i) => (
                        <div key={i} className="h-4 flex-1 rounded" style={{ background: c }} />
                      ))}
                    </div>
                    {currentTheme?.name === t.name && (
                      <div
                        className="absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded"
                        style={{ background: t.colors.primary, color: t.colors.background }}
                      >
                        Active
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notification Preferences</CardTitle>
              <CardDescription>Control how and when you receive notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Email notifications', description: 'Receive activity summaries via email', value: emailNotifs, set: setEmailNotifs },
                { label: 'Push notifications', description: 'Browser push notifications for mentions', value: pushNotifs, set: setPushNotifs },
                { label: 'Marketing emails', description: 'News and feature announcements', value: marketingEmails, set: setMarketingEmails },
              ].map(({ label, description, value, set }) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>{label}</p>
                    <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{description}</p>
                  </div>
                  <Switch checked={value} onCheckedChange={set} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Data</CardTitle>
              <CardDescription>
                Under GDPR you have the right to access and delete your personal data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--theme-text)' }}>Data Export</p>
                <p className="text-xs mb-3" style={{ color: 'var(--theme-text-muted)' }}>
                  Download a copy of all data associated with your account.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportData.mutate()}
                  disabled={exportData.isPending}
                  className="flex items-center gap-2"
                >
                  {exportData.isPending ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                  Export my data
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}
                  disabled={deleteAccount.isPending}
                  onClick={() => {
                    if (confirm('Permanently delete your account? This cannot be undone.')) {
                      deleteAccount.mutate();
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  {deleteAccount.isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  Delete account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
