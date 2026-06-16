'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Save } from 'lucide-react';

interface PlatformSettings {
  id: string;
  platformName: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  allowSignups: boolean;
}

function ColorSwatch({ color }: { color: string }) {
  const isValid = /^#[0-9a-fA-F]{6}$/.test(color);
  return (
    <div
      className="w-8 h-8 rounded-lg border flex-shrink-0"
      style={{
        background: isValid ? color : 'var(--theme-border)',
        borderColor: 'var(--theme-border)',
      }}
    />
  );
}

export default function PlatformSettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<PlatformSettings>({
    queryKey: ['admin', 'platform-settings'],
    queryFn: () => apiClient.get('/admin/settings').then(r => r.data),
  });

  const [form, setForm] = useState<Partial<PlatformSettings>>({});

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: () => apiClient.put('/admin/settings', form).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'platform-settings'] }),
  });

  const set = (key: keyof PlatformSettings, value: string | boolean) =>
    setForm(f => ({ ...f, [key]: value }));

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl animate-fade-in">
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>Platform Settings</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
          Configure branding and platform-wide options.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Branding</CardTitle>
          <CardDescription>Platform name, logo and colours.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label htmlFor="platformName">Platform name</Label>
            <Input
              id="platformName"
              value={form.platformName ?? ''}
              onChange={e => set('platformName', e.target.value)}
              className="mt-1"
              maxLength={60}
            />
          </div>

          <div>
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              value={form.logoUrl ?? ''}
              onChange={e => set('logoUrl', e.target.value)}
              placeholder="https://…"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="primaryColor">Primary colour</Label>
            <div className="flex items-center gap-3 mt-1">
              <ColorSwatch color={form.primaryColor ?? ''} />
              <Input
                id="primaryColor"
                value={form.primaryColor ?? ''}
                onChange={e => set('primaryColor', e.target.value)}
                placeholder="#c5a880"
                className="font-mono"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="accentColor">Accent colour</Label>
            <div className="flex items-center gap-3 mt-1">
              <ColorSwatch color={form.accentColor ?? ''} />
              <Input
                id="accentColor"
                value={form.accentColor ?? ''}
                onChange={e => set('accentColor', e.target.value)}
                placeholder="#6366f1"
                className="font-mono"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Access</CardTitle>
          <CardDescription>Control who can join the platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>Allow public sign-ups</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                New members can register without an invitation.
              </p>
            </div>
            <Switch
              checked={form.allowSignups ?? true}
              onCheckedChange={v => set('allowSignups', v)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="flex items-center gap-2">
          {save.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save changes
        </Button>
      </div>
    </div>
  );
}
