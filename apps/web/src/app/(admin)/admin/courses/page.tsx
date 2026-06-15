'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Globe, Lock } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@community/shared';
import type { Course } from '@community/shared';

function useAdminCourses() {
  return useQuery({
    queryKey: ['admin', 'courses'],
    queryFn: () => apiClient.get('/courses', { params: { limit: 100, all: true } }).then((r) => r.data),
  });
}

export default function AdminCoursesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useAdminCourses();

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
      <div className="flex items-start justify-between">
        <PageHeader title="Course Management" description={`${data?.total ?? 0} courses`} icon={BookOpen} />
        <Button
          size="sm"
          style={{ background: 'var(--theme-primary)', color: 'var(--theme-background)' }}
          onClick={() => alert('Course creation form — add modal in next sprint')}
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
