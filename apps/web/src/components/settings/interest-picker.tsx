'use client';

import { useState, useEffect } from 'react';
import { useCategories } from '@/hooks/use-categories';
import { useInterests, useUpdateInterests } from '@/hooks/use-interests';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Sparkles, Check } from 'lucide-react';

export function InterestPicker() {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: interests, isLoading: interestsLoading } = useInterests();
  const updateInterests = useUpdateInterests();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync from server data on load
  useEffect(() => {
    if (interests && !dirty) {
      setSelected(new Set(interests.map((i) => i.id)));
    }
  }, [interests, dirty]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setDirty(true);
    setSaved(false);
  };

  const handleSave = async () => {
    await updateInterests.mutateAsync(Array.from(selected));
    setDirty(false);
    setSaved(true);
  };

  // Auto-clear saved indicator
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(t);
  }, [saved]);

  const isLoading = categoriesLoading || interestsLoading;
  const allCategories = (categories as any[]) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles size={16} /> Interests
        </CardTitle>
        <CardDescription>
          Pick topics you care about. Your feed will prioritise matching posts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        ) : allCategories.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            No categories available yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allCategories.map((cat: any) => {
              const isSelected = selected.has(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggle(cat.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                  style={{
                    background: isSelected
                      ? `${cat.color || 'var(--theme-primary)'}20`
                      : 'rgba(255,255,255,0.04)',
                    color: isSelected
                      ? cat.color || 'var(--theme-primary)'
                      : 'var(--theme-text-muted)',
                    border: `1.5px solid ${
                      isSelected
                        ? `${cat.color || 'var(--theme-primary)'}60`
                        : 'var(--theme-border)'
                    }`,
                  }}
                  aria-pressed={isSelected}
                  type="button"
                >
                  {isSelected && <Check size={12} />}
                  {cat.icon && <span>{cat.icon}</span>}
                  {cat.name}
                </button>
              );
            })}
          </div>
        )}

        {allCategories.length > 0 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              {selected.size} topic{selected.size !== 1 ? 's' : ''} selected
            </p>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!dirty || updateInterests.isPending}
            >
              {updateInterests.isPending ? (
                <>
                  <Loader2 size={14} className="mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                'Saved'
              ) : (
                'Save interests'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
