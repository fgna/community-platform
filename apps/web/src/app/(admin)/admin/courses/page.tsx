'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Globe, Lock } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { formatDate } from '@community/shared';
import type { Course } from '@community/shared';

function useAdminCourses() {
  return useQuery({
    queryKey: ['admin', 'courses'],
    queryFn: () => apiClient.get('/courses', { params: { limit: 100, all: true } }).then((r) => r.data),
  });
}

function CreateCourseDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  const create = useMutation({
    mutationFn: () => apiClient.post('/courses', { title, description, coverUrl: coverUrl || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      setTitle(''); setDescription(''); setCoverUrl('');
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Course</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="c-title">Title</Label>
            <Input id="c-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Leadership Fundamentals" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-desc">Description</Label>
            <Textarea id="c-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="What will members learn?" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-cover">Cover image URL (optional)</Label>
            <Input id="c-cover" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            onClick={() => create.mutate()}
            disabled={!title.trim() || !description.trim() || create.isPending}
            style={{ background: 'var(--theme-primary)', color: 'var(--theme-background)' }}
          >
            {create.isPending ? 'Creating…' : 'Create Course'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminCoursesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useAdminCourses();
  const [createOpen, setCreateOpen] = useState(false);

  const togglePublish = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      apiClient.patch(`/courses/${id}`, { isPublished: published }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] }),
  });

  const deleteCourse = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/courses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] }),
  });

  const courses: Course[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <CreateCourseDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <div className="flex items-start justify-between">
        <PageHeader title="Course Management" description={`${data?.total ?? 0} courses`} icon={BookOpen} />
        <Button
          size="sm"
          style={{ background: 'var(--theme-primary)', color: 'var(--theme-background)' }}
          onClick={() => setCreateOpen(true)}
        >
          + New Course
        </Button>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--theme-border)' }}>
              {['Course', 'Modules', 'Status', 'Created', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--theme-text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--theme-border)' }}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    ))}
                  </tr>
                ))
              : courses.map((course) => (
                  <tr key={course.id} style={{ borderBottom: '1px solid var(--theme-border)' }}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium" style={{ color: 'var(--theme-text)' }}>{course.title}</p>
                        <p className="text-xs line-clamp-1" style={{ color: 'var(--theme-text-muted)' }}>{course.description}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                      {course.modules?.length ?? 0} modules
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={course.isPublished}
                          onCheckedChange={(checked) => togglePublish.mutate({ id: course.id, published: checked })}
                        />
                        <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                          {course.isPublished ? <><Globe size={10} className="inline mr-1" />Published</> : <><Lock size={10} className="inline mr-1" />Draft</>}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                      {formatDate(course.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-red-400 hover:text-red-300"
                        onClick={() => {
                          if (confirm(`Delete "${course.title}"? This cannot be undone.`)) {
                            deleteCourse.mutate(course.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
