'use client';

import { useState } from 'react';
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
import { LogOut, Palette, User, Bell, Shield } from 'lucide-react';

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
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);

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
                  <Button variant="outline" size="sm" className="mt-2 text-xs h-7">
                    Change photo
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    defaultValue={user.name}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user.email}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button size="sm">Save changes</Button>
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
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notification Preferences</CardTitle>
              <CardDescription>Control how and when you receive notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                {
                  label: 'Email notifications',
                  description: 'Receive notifications about activity in your feed.',
                  value: emailNotifs,
                  onChange: setEmailNotifs,
                },
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
                <Button variant="outline" size="sm">
                  Export my data
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}
                >
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
