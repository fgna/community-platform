'use client';

import { useState } from 'react';
import { useTestimonials, useCreateTestimonial } from '@/hooks/use-testimonials';
import type { Testimonial } from '@/hooks/use-testimonials';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@community/shared';
import { Star, Quote, Loader2, Send } from 'lucide-react';

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <Quote size={24} style={{ color: 'var(--theme-primary)', opacity: 0.4 }} />
          {testimonial.isFeatured && (
            <Badge>
              <Star size={10} className="mr-1" />
              Featured
            </Badge>
          )}
        </div>

        <p className="text-sm leading-relaxed" style={{ color: 'var(--theme-text)' }}>
          {testimonial.content}
        </p>

        <div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid var(--theme-border)' }}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={testimonial.author.avatarUrl || undefined} />
            <AvatarFallback className="text-xs">
              {getInitials(testimonial.author.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--theme-text)' }}>
              {testimonial.author.name}
            </p>
            {testimonial.role && (
              <p className="text-xs truncate" style={{ color: 'var(--theme-text-muted)' }}>
                {testimonial.role}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SubmitForm() {
  const [content, setContent] = useState('');
  const [role, setRole] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const createTestimonial = useCreateTestimonial();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    await createTestimonial.mutateAsync({
      content: content.trim(),
      role: role.trim() || undefined,
    });

    setContent('');
    setRole('');
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-2">
          <Star size={32} className="mx-auto" style={{ color: 'var(--theme-primary)' }} />
          <p className="font-medium" style={{ color: 'var(--theme-text)' }}>
            Thank you for sharing your story!
          </p>
          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            Your testimonial has been submitted and will appear once approved by an admin.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSubmitted(false)}
            className="mt-2"
          >
            Submit Another
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--theme-text)' }}>
          Share Your Story
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tell us about your experience with the community..."
            rows={4}
            className="w-full rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--theme-border)',
              color: 'var(--theme-text)',
            }}
          />
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Your role (optional, e.g. Product Manager)"
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--theme-border)',
              color: 'var(--theme-text)',
            }}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              Submitted testimonials require admin approval.
            </p>
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || createTestimonial.isPending}
            >
              {createTestimonial.isPending ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : (
                <Send size={14} className="mr-1" />
              )}
              Submit
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function TestimonialsPage() {
  const { data, isLoading, error, refetch } = useTestimonials();
  const { user } = useAuth();

  const testimonials: Testimonial[] = data?.data ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>
          Success Stories
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
          Hear from members about how this community has made a difference.
        </p>
      </div>

      {user && <SubmitForm />}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-5 w-5" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <p style={{ color: 'var(--theme-danger)' }}>Failed to load testimonials.</p>
            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              {(error as { message?: string })?.message || 'Unknown error'}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : !testimonials.length ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Star size={40} className="mx-auto mb-3" style={{ color: 'var(--theme-text-muted)' }} />
            <p className="font-medium" style={{ color: 'var(--theme-text)' }}>
              No stories yet
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
              Be the first to share your experience with the community.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      )}
    </div>
  );
}
