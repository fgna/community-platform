'use client';

import Link from 'next/link';
import { BookOpen, Users, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CourseProgress } from './course-progress';
import type { Course, Progress } from '@community/shared';

interface CourseCardProps {
  course: Course & { progress?: Progress[] };
}

export function CourseCard({ course }: CourseCardProps) {
  const progress = course.progress?.[0];
  const percentage = progress?.percentage ?? 0;

  return (
    <Link href={`/courses/${course.id}`}>
      <Card className="overflow-hidden hover:border-[var(--theme-primary)] transition-all duration-200 cursor-pointer group">
        {/* Cover */}
        <div
          className="h-36 flex items-center justify-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(197,168,128,0.1), rgba(99,102,241,0.1))',
            borderBottom: '1px solid var(--theme-border)',
          }}
        >
          <BookOpen size={40} style={{ color: 'var(--theme-primary)', opacity: 0.4 }} />
          {!course.isPublished && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" style={{ background: 'rgba(0,0,0,0.6)', color: 'var(--theme-text-muted)' }}>
                Draft
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-3">
          <div>
            <h3
              className="font-semibold text-sm leading-snug group-hover:text-[var(--theme-primary)] transition-colors"
              style={{ color: 'var(--theme-text)' }}
            >
              {course.title}
            </h3>
            <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--theme-text-muted)' }}>
              {course.description}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            <span className="flex items-center gap-1">
              <BookOpen size={11} />
              {course._count?.modules ?? course.modules?.length ?? 0} modules
            </span>
            <span className="flex items-center gap-1">
              <Users size={11} />
              {course._count?.progress ?? 0} enrolled
            </span>
          </div>

          {percentage > 0 && (
            <CourseProgress percentage={percentage} />
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
