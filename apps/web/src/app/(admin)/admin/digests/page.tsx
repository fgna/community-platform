'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Newspaper, CheckCircle, Trash2, Eye, Pencil, Plus } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

interface DigestTemplate {
  id: string;
  name: string;
  subject: string;
  headerHtml: string;
  footerHtml: string;
  sections: string[];
  accentColor: string;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const AVAILABLE_SECTIONS = [
  { value: 'new_posts', label: 'New Posts' },
  { value: 'upcoming_events', label: 'Upcoming Events' },
  { value: 'new_courses', label: 'New Courses' },
  { value: 'community_stats', label: 'Community Stats' },
];

function useDigestTemplates() {
  return useQuery<DigestTemplate[]>({
    queryKey: ['admin', 'digest-templates'],
    queryFn: () => apiClient.get('/digest-templates').then((r) => r.data),
  });
}

function TemplateFormDialog({
  open,
  onClose,
  template,
}: {
  open: boolean;
  onClose: () => void;
  template?: DigestTemplate | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!template;

  const [name, setName] = useState(template?.name ?? '');
  const [subject, setSubject] = useState(template?.subject ?? '');
  const [headerHtml, setHeaderHtml] = useState(template?.headerHtml ?? '');
  const [footerHtml, setFooterHtml] = useState(template?.footerHtml ?? '');
  const [accentColor, setAccentColor] = useState(template?.accentColor ?? '#c5a880');
  const [logoUrl, setLogoUrl] = useState(template?.logoUrl ?? '');
  const [sections, setSections] = useState<string[]>(template?.sections ?? ['new_posts', 'upcoming_events']);

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isEdit
        ? apiClient.patch(`/digest-templates/${template!.id}`, data)
        : apiClient.post('/digest-templates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'digest-templates'] });
      onClose();
    },
  });

  const handleSubmit = () => {
    mutation.mutate({
      name,
      subject,
      headerHtml,
      footerHtml,
      accentColor,
      logoUrl: logoUrl || undefined,
      sections,
    });
  };

  const toggleSection = (value: string) => {
    setSections((prev) =>
      prev.includes(value)
        ? prev.filter((s) => s !== value)
        : [...prev, value],
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Template' : 'New Digest Template'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="dt-name">Template Name</Label>
            <Input
              id="dt-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weekly Digest v2"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dt-subject">Email Subject</Label>
            <Input
              id="dt-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Your weekly community digest"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dt-header">Header HTML</Label>
            <Textarea
              id="dt-header"
              value={headerHtml}
              onChange={(e) => setHeaderHtml(e.target.value)}
              rows={3}
              placeholder='<div style="font-size: 20px; font-weight: 600;">My Community</div>'
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dt-footer">Footer HTML</Label>
            <Textarea
              id="dt-footer"
              value={footerHtml}
              onChange={(e) => setFooterHtml(e.target.value)}
              rows={3}
              placeholder='<div style="font-size: 12px; text-align: center;">Unsubscribe link here</div>'
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dt-accent">Accent Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="dt-accent"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
                />
                <Input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="flex-1"
                  placeholder="#c5a880"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dt-logo">Logo URL (optional)</Label>
              <Input
                id="dt-logo"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Digest Sections</Label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_SECTIONS.map(({ value, label }) => (
                <label
                  key={value}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors"
                  style={{
                    background: sections.includes(value) ? 'rgba(197,168,128,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${sections.includes(value) ? 'rgba(197,168,128,0.4)' : 'var(--theme-border)'}`,
                    color: 'var(--theme-text)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={sections.includes(value)}
                    onChange={() => toggleSection(value)}
                    className="rounded"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!name.trim() || !subject.trim() || mutation.isPending}
            style={{ background: 'var(--theme-primary)', color: 'var(--theme-background)' }}
          >
            {mutation.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewDialog({ open, onClose, templateId }: { open: boolean; onClose: () => void; templateId: string }) {
  const { data: previewHtml, isLoading } = useQuery({
    queryKey: ['admin', 'digest-templates', 'preview', templateId],
    queryFn: () =>
      apiClient.get(`/digest-templates/preview/${templateId}`, { responseType: 'text' }).then((r) => r.data),
    enabled: open && !!templateId,
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Digest Preview</DialogTitle>
        </DialogHeader>
        <div
          className="rounded-lg overflow-hidden"
          style={{ background: '#090d16', border: '1px solid var(--theme-border)' }}
        >
          {isLoading ? (
            <div className="p-8 flex items-center justify-center">
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <iframe
              srcDoc={previewHtml}
              title="Digest preview"
              className="w-full border-0"
              style={{ height: '500px' }}
              sandbox=""
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminDigestsPage() {
  const queryClient = useQueryClient();
  const { data: templates, isLoading } = useDigestTemplates();
  const [formOpen, setFormOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<DigestTemplate | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const activateMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/digest-templates/${id}/activate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'digest-templates'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/digest-templates/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'digest-templates'] }),
  });

  const handleEdit = (template: DigestTemplate) => {
    setEditTemplate(template);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditTemplate(null);
  };

  return (
    <div className="space-y-6">
      <TemplateFormDialog
        open={formOpen}
        onClose={handleCloseForm}
        template={editTemplate}
      />
      {previewId && (
        <PreviewDialog
          open={!!previewId}
          onClose={() => setPreviewId(null)}
          templateId={previewId}
        />
      )}

      <div className="flex items-start justify-between">
        <PageHeader
          title="Digest Templates"
          description={`${templates?.length ?? 0} templates`}
          icon={Newspaper}
        />
        <Button
          size="sm"
          style={{ background: 'var(--theme-primary)', color: 'var(--theme-background)' }}
          onClick={() => { setEditTemplate(null); setFormOpen(true); }}
        >
          <Plus size={14} className="mr-1" />
          New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : !templates || templates.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}
        >
          <Newspaper size={40} className="mx-auto mb-4" style={{ color: 'var(--theme-text-muted)' }} />
          <p className="text-lg font-medium" style={{ color: 'var(--theme-text)' }}>
            No digest templates yet
          </p>
          <p className="text-sm mt-1 mb-4" style={{ color: 'var(--theme-text-muted)' }}>
            Create your first template to customise how email digests look.
          </p>
          <Button
            size="sm"
            style={{ background: 'var(--theme-primary)', color: 'var(--theme-background)' }}
            onClick={() => setFormOpen(true)}
          >
            <Plus size={14} className="mr-1" />
            Create Template
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="rounded-xl p-5 relative"
              style={{
                background: 'var(--theme-card)',
                border: tpl.isActive
                  ? '1px solid rgba(197,168,128,0.5)'
                  : '1px solid var(--theme-border)',
              }}
            >
              {/* Status badge */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-semibold text-base truncate"
                    style={{ color: 'var(--theme-text)' }}
                  >
                    {tpl.name}
                  </h3>
                  <p
                    className="text-xs mt-0.5 truncate"
                    style={{ color: 'var(--theme-text-muted)' }}
                  >
                    Subject: {tpl.subject}
                  </p>
                </div>
                {tpl.isActive && (
                  <Badge
                    className="ml-2 flex-shrink-0 text-xs"
                    style={{
                      background: 'rgba(34,197,94,0.15)',
                      color: '#22c55e',
                      border: '1px solid rgba(34,197,94,0.3)',
                    }}
                  >
                    Active
                  </Badge>
                )}
              </div>

              {/* Accent color & sections */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ background: tpl.accentColor }}
                  title={`Accent: ${tpl.accentColor}`}
                />
                <div className="flex flex-wrap gap-1">
                  {(tpl.sections as string[]).map((s) => (
                    <span
                      key={s}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--theme-text-muted)',
                        border: '1px solid var(--theme-border)',
                      }}
                    >
                      {AVAILABLE_SECTIONS.find((as) => as.value === s)?.label ?? s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3" style={{ borderTop: '1px solid var(--theme-border)' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs gap-1"
                  style={{ color: 'var(--theme-text-muted)' }}
                  onClick={() => setPreviewId(tpl.id)}
                >
                  <Eye size={13} />
                  Preview
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs gap-1"
                  style={{ color: 'var(--theme-text-muted)' }}
                  onClick={() => handleEdit(tpl)}
                >
                  <Pencil size={13} />
                  Edit
                </Button>
                {!tpl.isActive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs gap-1"
                    style={{ color: '#22c55e' }}
                    onClick={() => activateMutation.mutate(tpl.id)}
                    disabled={activateMutation.isPending}
                  >
                    <CheckCircle size={13} />
                    Activate
                  </Button>
                )}
                <div className="flex-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs gap-1 text-red-400 hover:text-red-300"
                  onClick={() => {
                    if (confirm(`Delete "${tpl.name}"? This cannot be undone.`)) {
                      deleteMutation.mutate(tpl.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 size={13} />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
