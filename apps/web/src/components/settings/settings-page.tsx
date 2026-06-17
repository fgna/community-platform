'use client';

import { useState, useEffect, useRef } from 'react';
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
import { LogOut, Palette, User, Bell, Shield, Download, Trash2, Loader2, Mail } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

const DIGEST_OPTIONS = [
  { value: 'DAILY', label: 'Daily', description: 'Receive a summary every morning at 8 AM' },
  { value: 'WEEKLY', label: 'Weekly', description: 'Receive a summary every Monday at 8 AM' },
  { value: 'NONE', label: 'Off', description: 'No email digests' },
] as const;

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [profileName, setProfileName] = useState(user?.name ?? '');
  const [profileBio, setProfileBio] = useState('');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatarUrl ?? '');

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => apiClient.get('/users/me').then((r) => r.data),
  });

  const profileInitialized = useRef(false);
  useEffect(() => {
    if (!profile || profileInitialized.current) return;
    profileInitialized.current = true;
    setProfileName(profile.name ?? '');
    setProfileBio(profile.bio ?? '');
    setProfileAvatar(profile.avatarUrl ?? '');
  }, [profile]);


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

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return apiClient.post('/users/me/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data);
    },
    onSuccess: (data) => {
      setProfileAvatar(data.avatarUrl);
      updateUser({ avatarUrl: data.avatarUrl });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

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
    mutationFn: () => apiClient.delete('/gdpr/account'),
    onSuccess: () => logout(),
  });

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>
          Settings
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
          Manage your account and preferences.
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="profile" className="flex items-center gap-1.5">
            <User size={14} /> Profile
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-1.5">
            <Palette size={14} /> Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1.5">
            <Bell size={14} /> Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-1.5">
            <Shield size={14} /> Privacy
          </TabsTrigger>
        </TabsList>

        {/* Profile tab */}
        <TabsContent value="profile" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile Information</CardTitle>
              <CardDescription>Update your name, email and avatar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
                  <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                    {user.name}
                  </p>
                  <p className="text-xs capitalize" style={{ color: 'var(--theme-text-muted)' }}>
                    {user.role}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadAvatar.mutate(file);
                      e.target.value = '';
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs h-7"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadAvatar.isPending}
                  >
                    {uploadAvatar.isPending ? (
                      <><Loader2 size={11} className="animate-spin mr-1" />Uploading…</>
                    ) : 'Change photo'}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    disabled={profileLoading}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Input
                    id="bio"
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    disabled={profileLoading}
                    placeholder={profileLoading ? 'Loading…' : 'Tell us about yourself'}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="avatar">Avatar URL</Label>
                  <Input
                    id="avatar"
                    value={profileAvatar}
                    onChange={(e) => setProfileAvatar(e.target.value)}
                    disabled={profileLoading}
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user.email}
                    disabled
                    className="mt-1 opacity-60"
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
              <CardTitle className="text-base text-red-400">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions for your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                onClick={logout}
                className="flex items-center gap-2"
                style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}
              >
                <LogOut size={15} />
                Sign out
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance tab */}
        <TabsContent value="appearance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Theme</CardTitle>
              <CardDescription>Choose the look and feel of the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {themes.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => setTheme(t.name)}
                    className="flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                    style={{
                      border: `2px solid ${t.name === currentTheme.name ? t.colors.primary : 'var(--theme-border)'}`,
                      background:
                        t.name === currentTheme.name
                          ? `${t.colors.primary}10`
                          : 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex-shrink-0"
                      style={{ background: t.colors.background, border: `2px solid ${t.colors.primary}` }}
                    />
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: 'var(--theme-text)' }}
                      >
                        {t.displayName}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                        {t.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications tab */}
        <TabsContent value="notifications" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Mail size={16} /> Email Digest
              </CardTitle>
              <CardDescription>
                Get a summary of new posts, events, and notifications delivered to your inbox.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {DIGEST_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    apiClient.patch('/users/me/digest', { frequency: opt.value }).then(() => {
                      queryClient.invalidateQueries({ queryKey: ['me'] });
                    });
                  }}
                  className="flex items-center gap-3 w-full p-3 rounded-lg text-left transition-all"
                  style={{
                    border: `2px solid ${profile?.emailDigest === opt.value ? 'var(--theme-primary)' : 'var(--theme-border)'}`,
                    background: profile?.emailDigest === opt.value ? 'rgba(197,168,128,0.06)' : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: profile?.emailDigest === opt.value ? 'var(--theme-primary)' : 'var(--theme-text-muted)' }}
                  >
                    {profile?.emailDigest === opt.value && (
                      <div className="w-2 h-2 rounded-full" style={{ background: 'var(--theme-primary)' }} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>{opt.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{opt.description}</p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">In-App Notifications</CardTitle>
              <CardDescription>Control in-app notification preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                {
                  label: 'Push notifications',
                  description: 'Receive push notifications in your browser.',
                  value: pushNotifs,
                  onChange: setPushNotifs,
                },
                {
                  label: 'Marketing emails',
                  description: 'Receive updates about new features and promotions.',
                  value: marketingEmails,
                  onChange: setMarketingEmails,
                },
              ].map(({ label, description, value, onChange }) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                      {label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                      {description}
                    </p>
                  </div>
                  <Switch checked={value} onCheckedChange={onChange} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy tab */}
        <TabsContent value="privacy" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Privacy & Data</CardTitle>
              <CardDescription>Manage your data and privacy settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="p-4 rounded-lg text-sm leading-relaxed"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--theme-border)',
                  color: 'var(--theme-text-muted)',
                }}
              >
                <p className="font-medium mb-1" style={{ color: 'var(--theme-text)' }}>
                  Your data rights (GDPR)
                </p>
                <p>
                  You have the right to access, correct, export or delete your personal data at any
                  time. We only store data necessary to provide the service and never sell your data
                  to third parties.
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
