'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, CheckCircle, Circle, ArrowLeft, BookOpen } from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CourseProgress } from '@/components/courses/course-progress';
import { LessonNotes } from '@/components/courses/lesson-notes';

function useCourseDetail(id: string) {
  return useQuery({
    queryKey: ['courses', id],
    queryFn: () => apiClient.get(`/courses/${id}`).then((r) => r.data),
  });
}

function useCourseProgress(id: string) {
  return useQuery({
    queryKey: ['courses', id, 'progress'],
    queryFn: () => apiClient.get(`/courses/${id}/progress`).then((r) => r.data),
  });
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: course, isLoading } = useCourseDetail(id);
  const { data: progress } = useCourseProgress(id);

  const updateProgress = useMutation({
    mutationFn: (lessonId: string) =>
      apiClient.post(`/courses/${id}/progress`, { lessonId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', id, 'progress'] });
    },
  });

  const completedLessons: string[] = progress?.completedLessons ?? [];
  const percentage = progress?.percentage ?? 0;

  const toggleModule = (moduleId: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId);
      return next;
    });
  };

  const activeLessonData = course?.modules
    ?.flatMap((m: any) => m.lessons)
    ?.find((l: any) => l.id === activeLesson);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!course) {
    return <p style={{ color: 'var(--theme-text-muted)' }}>Course not found.</p>;
  }

  return (
    <div className="space-y-6">
      <Link href="/courses" className="inline-flex items-center gap-1 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
        <ArrowLeft size={14} /> Back to courses
      </Link>

      <PageHeader title={course.title} description={course.description} icon={BookOpen} />

      <CourseProgress percentage={percentage} completedLessons={completedLessons.length} totalLessons={
        course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length ?? 0), 0) ?? 0
      } />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module accordion */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold mb-3" style={{ color: 'var(--theme-text-muted)' }}>COURSE CONTENT</h3>
          {(course.modules ?? []).map((module: any) => {
            const isOpen = openModules.has(module.id);
            const moduleLessons: any[] = module.lessons ?? [];
            const completedCount = moduleLessons.filter((l) => completedLessons.includes(l.id)).length;
            return (
              <div key={module.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--theme-border)' }}>
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-left"
                  style={{ background: 'var(--theme-card)', color: 'var(--theme-text)' }}
                  onClick={() => toggleModule(module.id)}
                >
                  <span>{module.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                      {completedCount}/{moduleLessons.length}
                    </span>
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                </button>
                {isOpen && (
                  <div style={{ background: 'rgba(0,0,0,0.2)' }}>
                    {moduleLessons.map((lesson: any) => {
                      const done = completedLessons.includes(lesson.id);
                      const isActive = activeLesson === lesson.id;
                      return (
                        <button
                          key={lesson.id}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors"
                          style={{
                            color: isActive ? 'var(--theme-primary)' : done ? 'var(--theme-text-muted)' : 'var(--theme-text)',
                            background: isActive ? 'rgba(197,168,128,0.08)' : 'transparent',
                          }}
                          onClick={() => setActiveLesson(lesson.id)}
                        >
                          {done ? (
                            <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                          ) : (
                            <Circle size={14} className="flex-shrink-0 opacity-40" />
                          )}
                          <span className="line-clamp-1">{lesson.title}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Lesson content */}
        <div className="lg:col-span-2">
          {activeLessonData ? (
            <div
              className="rounded-xl p-6 space-y-4"
              style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}
            >
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-semibold" style={{ color: 'var(--theme-text)' }}>
                  {activeLessonData.title}
                </h2>
                {completedLessons.includes(activeLessonData.id) ? (
                  <Badge className="bg-green-500/15 text-green-400 border-green-500/20">Completed</Badge>
                ) : null}
              </div>
              <div
                className="prose prose-sm max-w-none text-sm leading-relaxed"
                style={{ color: 'var(--theme-text)' }}
              >
                {activeLessonData.content}
              </div>
              {!completedLessons.includes(activeLessonData.id) && (
                <Button
                  onClick={() => updateProgress.mutate(activeLessonData.id)}
                  disabled={updateProgress.isPending}
                  style={{ background: 'var(--theme-primary)', color: 'var(--theme-background)' }}
                >
                  <CheckCircle size={14} className="mr-2" />
                  Mark as Complete
                </Button>
              )}
              <LessonNotes lessonId={activeLessonData.id} />
            </div>
          ) : (
            <div
              className="rounded-xl p-12 flex flex-col items-center justify-center text-center"
              style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}
            >
              <BookOpen size={40} className="mb-4 opacity-20" style={{ color: 'var(--theme-primary)' }} />
              <p className="font-medium mb-1" style={{ color: 'var(--theme-text)' }}>Select a lesson to begin</p>
              <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                Choose a module and lesson from the left to start learning
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
