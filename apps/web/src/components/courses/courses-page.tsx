'use client';

import { useCourses } from '@/hooks/use-courses';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Clock, BarChart2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { CourseWithProgress } from '@community/shared';

function ProgressBar({ value }: { value: number }) {
  return (
    <div
      className="h-1.5 rounded-full overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.08)' }}
    >
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: 'var(--theme-primary)',
        }}
      />
    </div>
  );
}

function CourseCard({ course }: { course: CourseWithProgress }) {
  const progress = course.progress?.percentage ?? 0;
  const isStarted = progress > 0;
  const isCompleted = progress >= 100;

  return (
    <Link href={`/courses/${course.id}`}>
      <Card className="hover:scale-[1.02] transition-all cursor-pointer group h-full">
        <CardContent className="p-5 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(197,168,128,0.12)', color: 'var(--theme-primary)' }}
            >
              <BookOpen size={20} />
            </div>
            <div className="flex gap-1.5 flex-wrap justify-end">
              {isCompleted ? (
                <Badge style={{ background: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.3)', color: '#22c55e' }}>
                  Completed
                </Badge>
              ) : isStarted ? (
                <Badge>In Progress</Badge>
              ) : (
                <Badge variant="outline" style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
                  Not started
                </Badge>
              )}
            </div>
          </div>

          <CardTitle className="text-sm mb-1 line-clamp-2">{course.title}</CardTitle>
          <CardDescription className="text-xs line-clamp-2 mb-4 flex-1">
            {course.description}
          </CardDescription>

          {/* Meta */}
          <div className="flex items-center gap-4 mb-3 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            {course.duration && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {course.duration}
              </span>
            )}
            {course.level && (
              <span className="flex items-center gap-1">
                <BarChart2 size={12} />
                {course.level}
              </span>
            )}
          </div>

          {/* Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <ProgressBar value={progress} />
          </div>

          <div
            className="flex items-center justify-end gap-1 mt-3 text-xs group-hover:gap-2 transition-all"
            style={{ color: 'var(--theme-primary)' }}
          >
            <span>{isStarted ? 'Continue' : 'Start course'}</span>
            <ChevronRight size={12} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function CoursesPage() {
  const { data, isLoading, error } = useCourses();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>
          Courses
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
          Expand your knowledge with our curated learning paths.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-3 w-3/5" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p style={{ color: 'var(--theme-danger)' }}>Failed to load courses.</p>
          </CardContent>
        </Card>
      ) : !data?.data?.length ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen size={40} className="mx-auto mb-3" style={{ color: 'var(--theme-text-muted)' }} />
            <p className="font-medium" style={{ color: 'var(--theme-text)' }}>No courses yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
              Check back later for new content.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.data.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
