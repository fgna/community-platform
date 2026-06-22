'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Flame, Award, BookOpen, Trash2, Loader2 } from 'lucide-react';
import {
  useJournalEntries,
  useJournalEntry,
  useUpsertJournal,
  useDeleteJournal,
  useJournalStats,
} from '@/hooks/use-journal';
import { JournalPrompts } from './journal-prompts';

const MOODS = [
  { value: 'grateful', label: 'Grateful', emoji: '🙏' },
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'reflective', label: 'Reflective', emoji: '🤔' },
  { value: 'motivated', label: 'Motivated', emoji: '💪' },
  { value: 'calm', label: 'Calm', emoji: '😌' },
  { value: 'anxious', label: 'Anxious', emoji: '😟' },
  { value: 'tired', label: 'Tired', emoji: '😴' },
  { value: 'frustrated', label: 'Frustrated', emoji: '😤' },
];

function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function JournalPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string>(formatDateKey(today));
  const [editorContent, setEditorContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const monthKey = formatMonthKey(currentMonth);
  const { data: entries } = useJournalEntries(monthKey);
  const { data: entry, isLoading: entryLoading, error: entryError } = useJournalEntry(selectedDate);
  const { data: stats } = useJournalStats();
  const upsertMutation = useUpsertJournal();
  const deleteMutation = useDeleteJournal();

  // Build a set of dates that have entries for the current month view
  const entryDates = new Set<string>();
  entries?.forEach((e) => {
    const d = new Date(e.date);
    entryDates.add(formatDateKey(d));
  });

  // Sync editor with loaded entry
  useEffect(() => {
    if (entry) {
      setEditorContent(entry.content);
      setSelectedMood(entry.mood);
      setIsDirty(false);
    } else if (entryError) {
      // No entry for this date — blank slate
      setEditorContent('');
      setSelectedMood(null);
      setIsDirty(false);
    }
  }, [entry, entryError]);

  const handleSave = useCallback(() => {
    if (!selectedDate || !editorContent.trim()) return;
    upsertMutation.mutate({
      date: selectedDate,
      content: editorContent,
      mood: selectedMood || undefined,
    });
    setIsDirty(false);
  }, [selectedDate, editorContent, selectedMood, upsertMutation]);

  const handleBlur = useCallback(() => {
    if (isDirty && editorContent.trim()) {
      handleSave();
    }
  }, [isDirty, editorContent, handleSave]);

  const handleDelete = useCallback(() => {
    if (!selectedDate) return;
    if (!window.confirm('Delete this journal entry?')) return;
    deleteMutation.mutate(selectedDate);
    setEditorContent('');
    setSelectedMood(null);
    setIsDirty(false);
  }, [selectedDate, deleteMutation]);

  const handlePromptSelect = useCallback((text: string) => {
    const prefix = editorContent.trim() ? editorContent.trimEnd() + '\n\n' : '';
    setEditorContent(prefix + text + '\n');
    setIsDirty(true);
    // Focus the textarea so the user can continue writing
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [editorContent]);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(formatDateKey(today));
  };

  // Calendar grid
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const todayKey = formatDateKey(today);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>
          Journal
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
          Your private space for reflection and growth
        </p>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}>
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(239, 68, 68, 0.15)' }}
              >
                <Flame size={20} style={{ color: '#ef4444' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>
                  {stats.currentStreak}
                </p>
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  Current Streak
                </p>
              </div>
            </CardContent>
          </Card>

          <Card style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}>
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(234, 179, 8, 0.15)' }}
              >
                <Award size={20} style={{ color: '#eab308' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>
                  {stats.longestStreak}
                </p>
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  Longest Streak
                </p>
              </div>
            </CardContent>
          </Card>

          <Card style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}>
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(99, 102, 241, 0.15)' }}
              >
                <BookOpen size={20} style={{ color: '#6366f1' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>
                  {stats.totalEntries}
                </p>
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  Total Entries
                </p>
              </div>
            </CardContent>
          </Card>

          <Card style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}>
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(34, 197, 94, 0.15)' }}
              >
                <Flame size={20} style={{ color: '#22c55e' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>
                  {stats.last30DaysCount}
                </p>
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  Last 30 Days
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main content: Calendar + Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-md transition-colors hover:bg-white/5"
                aria-label="Previous month"
              >
                <ChevronLeft size={18} style={{ color: 'var(--theme-text-muted)' }} />
              </button>
              <CardTitle
                className="text-base font-semibold cursor-pointer hover:opacity-80"
                style={{ color: 'var(--theme-text)' }}
                onClick={goToToday}
              >
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </CardTitle>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-md transition-colors hover:bg-white/5"
                aria-label="Next month"
              >
                <ChevronRight size={18} style={{ color: 'var(--theme-text-muted)' }} />
              </button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {dayNames.map((name) => (
                <div
                  key={name}
                  className="text-center text-xs font-medium py-1"
                  style={{ color: 'var(--theme-text-muted)' }}
                >
                  {name}
                </div>
              ))}
            </div>

            {/* Calendar cells */}
            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="aspect-square" />;
                }

                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hasEntry = entryDates.has(dateKey);
                const isSelected = dateKey === selectedDate;
                const isToday = dateKey === todayKey;
                const isFuture = new Date(year, month, day) > today;

                return (
                  <button
                    key={dateKey}
                    onClick={() => !isFuture && setSelectedDate(dateKey)}
                    disabled={isFuture}
                    className="aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all duration-150 relative"
                    style={{
                      background: isSelected
                        ? 'var(--theme-primary)'
                        : hasEntry
                          ? 'rgba(197, 168, 128, 0.15)'
                          : 'transparent',
                      color: isSelected
                        ? 'var(--theme-background)'
                        : isFuture
                          ? 'var(--theme-text-muted)'
                          : 'var(--theme-text)',
                      opacity: isFuture ? 0.4 : 1,
                      fontWeight: isToday ? 700 : 400,
                      border: isToday && !isSelected
                        ? '1px solid var(--theme-primary)'
                        : '1px solid transparent',
                    }}
                  >
                    {day}
                    {hasEntry && !isSelected && (
                      <span
                        className="absolute bottom-1 w-1 h-1 rounded-full"
                        style={{ background: 'var(--theme-primary)' }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Today button */}
            <button
              onClick={goToToday}
              className="w-full mt-3 py-1.5 text-xs font-medium rounded-md transition-colors hover:bg-white/5"
              style={{ color: 'var(--theme-primary)' }}
            >
              Go to Today
            </button>
          </CardContent>
        </Card>

        {/* Editor */}
        <Card
          className="lg:col-span-2"
          style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base" style={{ color: 'var(--theme-text)' }}>
                  {selectedDate ? formatDisplayDate(selectedDate) : 'Select a date'}
                </CardTitle>
                {selectedDate === todayKey && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--theme-primary)' }}>
                    Today
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {upsertMutation.isPending && (
                  <Loader2 size={16} className="animate-spin" style={{ color: 'var(--theme-text-muted)' }} />
                )}
                {(entry || editorContent.trim()) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending || !entry}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 size={14} className="mr-1" />
                    Delete
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!editorContent.trim() || upsertMutation.isPending}
                  style={{
                    background: 'var(--theme-primary)',
                    color: 'var(--theme-background)',
                  }}
                >
                  {upsertMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mood selector */}
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--theme-text-muted)' }}>
                How are you feeling?
              </p>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => {
                      setSelectedMood(selectedMood === mood.value ? null : mood.value);
                      setIsDirty(true);
                    }}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150"
                    style={{
                      background:
                        selectedMood === mood.value
                          ? 'rgba(197, 168, 128, 0.2)'
                          : 'rgba(255, 255, 255, 0.05)',
                      border:
                        selectedMood === mood.value
                          ? '1px solid var(--theme-primary)'
                          : '1px solid var(--theme-border)',
                      color:
                        selectedMood === mood.value
                          ? 'var(--theme-primary)'
                          : 'var(--theme-text-muted)',
                    }}
                  >
                    {mood.emoji} {mood.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Prompts */}
            <JournalPrompts onSelect={handlePromptSelect} />

            {/* Text editor */}
            {entryLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin" style={{ color: 'var(--theme-text-muted)' }} />
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={editorContent}
                onChange={(e) => {
                  setEditorContent(e.target.value);
                  setIsDirty(true);
                }}
                onBlur={handleBlur}
                placeholder="What's on your mind today? Write about your experiences, insights, and reflections..."
                className="w-full min-h-[300px] p-4 rounded-lg text-sm leading-relaxed resize-y focus:outline-none focus:ring-1"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
              />
            )}

            {/* Auto-save indicator */}
            {isDirty && (
              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                Unsaved changes — will auto-save on blur
              </p>
            )}
            {upsertMutation.isSuccess && !isDirty && (
              <p className="text-xs" style={{ color: 'var(--theme-primary)' }}>
                Saved
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
