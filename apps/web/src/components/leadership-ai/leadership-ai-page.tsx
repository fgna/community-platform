'use client';

import Link from 'next/link';
import {
  Loader2,
  Sparkles,
  GraduationCap,
  FileText,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useCategoryContent } from '@/hooks/use-categories';
import { getInitials, timeAgo } from '@community/shared';

export function LeadershipAIPage() {
  const { data: content, isLoading } = useCategoryContent('ai', 1, 20);

  const courses: any[] = content?.courses ?? [];
  const posts: any[] = content?.posts ?? [];
  const events: any[] = content?.events ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Hero section */}
      <div
        className="relative rounded-xl overflow-hidden p-8"
        style={{
          background:
            'linear-gradient(135deg, rgba(197,168,128,0.12) 0%, rgba(17,24,39,0.7) 100%)',
          border: '1px solid rgba(197,168,128,0.2)',
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'rgba(197,168,128,0.15)',
              color: 'var(--theme-primary)',
            }}
          >
            <Sparkles size={20} />
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--theme-text)' }}
          >
            Leadership &amp; AI
          </h1>
        </div>
        <p
          className="text-sm max-w-2xl leading-relaxed"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          Explore the intersection of artificial intelligence and modern
          leadership. Discover curated courses, articles, and events that help
          leaders navigate AI-driven transformation, build AI-literate teams, and
          make strategic decisions in an era of rapid technological change.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2
            size={24}
            className="animate-spin"
            style={{ color: 'var(--theme-primary)' }}
          />
        </div>
      ) : (
        <>
          {/* Courses section */}
          <ContentSection
            title="Featured Courses"
            icon={GraduationCap}
            count={courses.length}
            linkHref="/explore/ai"
            linkLabel="View all AI content"
          >
            {courses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3">
                {courses.map((course: any) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-white/5"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        background: 'rgba(197,168,128,0.1)',
                        color: 'var(--theme-primary)',
                      }}
                    >
                      <GraduationCap size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: 'var(--theme-text)' }}
                      >
                        {course.title}
                      </p>
                      {course.description && (
                        <p
                          className="text-xs mt-0.5 line-clamp-2"
                          style={{ color: 'var(--theme-text-muted)' }}
                        >
                          {course.description.slice(0, 100)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge className="text-[10px] px-1.5 py-0">
                          AI
                        </Badge>
                        {course._count?.modules !== undefined && (
                          <span
                            className="text-[10px]"
                            style={{ color: 'var(--theme-text-muted)' }}
                          >
                            {course._count.modules} module
                            {course._count.modules !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight
                      size={14}
                      className="flex-shrink-0 mt-1"
                      style={{ color: 'var(--theme-text-muted)' }}
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptySectionState
                icon={GraduationCap}
                message="No AI-tagged courses yet."
              />
            )}
          </ContentSection>

          {/* Posts/Articles section */}
          <ContentSection
            title="Articles & Posts"
            icon={FileText}
            count={posts.length}
            linkHref="/explore/ai"
            linkLabel="View all AI content"
          >
            {posts.length > 0 ? (
              <div className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
                {posts.map((post: any) => (
                  <Link
                    key={post.id}
                    href={`/feed/${post.id}`}
                    className="flex items-start gap-3 p-3 transition-colors hover:bg-white/5"
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
                      <AvatarImage
                        src={post.author?.avatarUrl ?? undefined}
                      />
                      <AvatarFallback className="text-[10px]">
                        {getInitials(post.author?.name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm line-clamp-2"
                        style={{ color: 'var(--theme-text)' }}
                      >
                        {post.content?.replace(/<[^>]*>/g, '').slice(0, 180)}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className="text-xs"
                          style={{ color: 'var(--theme-text-muted)' }}
                        >
                          {post.author?.name}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: 'var(--theme-text-muted)', opacity: 0.5 }}
                        >
                          {'·'}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: 'var(--theme-text-muted)' }}
                        >
                          {timeAgo(post.createdAt)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptySectionState
                icon={FileText}
                message="No AI-tagged articles yet."
              />
            )}
          </ContentSection>

          {/* Events section */}
          <ContentSection
            title="Upcoming Events"
            icon={Calendar}
            count={events.length}
            linkHref="/explore/ai"
            linkLabel="View all AI content"
          >
            {events.length > 0 ? (
              <div className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
                {events.map((event: any) => {
                  const date = new Date(event.startsAt);
                  return (
                    <Link
                      key={event.id}
                      href="/events"
                      className="flex items-center gap-3 p-3 transition-colors hover:bg-white/5"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0 text-center"
                        style={{
                          background: 'rgba(197,168,128,0.1)',
                          color: 'var(--theme-primary)',
                        }}
                      >
                        <span className="text-[10px] font-medium leading-none">
                          {date.toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-sm font-bold leading-none">
                          {date.getDate()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: 'var(--theme-text)' }}
                        >
                          {event.title}
                        </p>
                        {event.location && (
                          <p
                            className="text-xs truncate mt-0.5"
                            style={{ color: 'var(--theme-text-muted)' }}
                          >
                            {event.location}
                          </p>
                        )}
                      </div>
                      <ArrowRight
                        size={14}
                        className="flex-shrink-0"
                        style={{ color: 'var(--theme-text-muted)' }}
                      />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptySectionState
                icon={Calendar}
                message="No AI-tagged events yet."
              />
            )}
          </ContentSection>
        </>
      )}
    </div>
  );
}

function ContentSection({
  title,
  icon: Icon,
  count,
  linkHref,
  linkLabel,
  children,
}: {
  title: string;
  icon: React.ElementType;
  count: number;
  linkHref: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--theme-card)',
        border: '1px solid var(--theme-border)',
      }}
    >
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: '1px solid var(--theme-border)' }}
      >
        <Icon size={14} style={{ color: 'var(--theme-primary)' }} />
        <span
          className="text-sm font-semibold flex-1"
          style={{ color: 'var(--theme-text)' }}
        >
          {title}
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded-full"
          style={{
            background: 'rgba(255,255,255,0.06)',
            color: 'var(--theme-text-muted)',
          }}
        >
          {count}
        </span>
      </div>
      {children}
      {count > 0 && (
        <Link
          href={linkHref}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors hover:bg-white/5"
          style={{
            color: 'var(--theme-primary)',
            borderTop: '1px solid var(--theme-border)',
          }}
        >
          {linkLabel}
          <ArrowRight size={12} />
        </Link>
      )}
    </div>
  );
}

function EmptySectionState({
  icon: Icon,
  message,
}: {
  icon: React.ElementType;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Icon
        size={24}
        style={{ color: 'var(--theme-text-muted)', opacity: 0.4 }}
      />
      <p
        className="text-sm mt-2"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        {message}
      </p>
    </div>
  );
}
