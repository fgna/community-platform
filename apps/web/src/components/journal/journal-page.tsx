'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Flame, Award, BookOpen, Trash2, Loader2, CheckSquare, Square, ChevronDown } from 'lucide-react';
import {
  useJournalEntries,
  useJournalEntry,
  useUpsertJournal,
  useDeleteJournal,
  useJournalStats,
  EMPTY_JOURNAL_CONTENT,
} from '@/hooks/use-journal';
import type { JournalContent, MustDoTask } from '@/hooks/use-journal';

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

function hasContent(content: JournalContent): boolean {
  return (
    content.threeGoals.some((g) => g.trim()) ||
    content.mustDoTasks.some((t) => t.text.trim()) ||
    content.whoIWantToBe.trim() !== '' ||
    content.lookingForwardTo.trim() !== '' ||
    content.importantPeople.trim() !== '' ||
    content.thoughts.trim() !== ''
  );
}

interface SectionFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}

function SectionField({ label, value, onChange, placeholder, rows = 2 }: SectionFieldProps) {
  const hasValue = value.trim() !== '';
  const [open, setOpen] = useState(hasValue);

  useEffect(() => {
    if (hasValue) setOpen(true);
  }, [hasValue]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 w-full text-left group"
      >
        <ChevronDown
          size={14}
          className="transition-transform duration-200 flex-shrink-0"
          style={{ color: 'var(--theme-primary)', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-primary)' }}>
          {label}
        </span>
        {!open && hasValue && (
          <span className="text-xs truncate max-w-[200px] ml-1" style={{ color: 'var(--theme-text-muted)' }}>
            — {value.slice(0, 50)}
          </span>
        )}
      </button>
      {open && (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full p-3 mt-1.5 rounded-lg text-sm leading-relaxed resize-y focus:outline-none focus:ring-1"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--theme-border)',
            color: 'var(--theme-text)',
          }}
        />
      )}
    </div>
  );
}

export function JournalPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string>(formatDateKey(today));
  const [content, setContent] = useState<JournalContent>({ ...EMPTY_JOURNAL_CONTENT });
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const monthKey = formatMonthKey(currentMonth);
  const { data: entries } = useJournalEntries(monthKey);
  const { data: entry, isLoading: entryLoading, error: entryError } = useJournalEntry(selectedDate);
  const { data: stats } = useJournalStats();
  const upsertMutation = useUpsertJournal();
  const deleteMutation = useDeleteJournal();

  const entryDates = new Set<string>();
  entries?.forEach((e) => {
    const d = new Date(e.date);
    entryDates.add(formatDateKey(d));
  });

  useEffect(() => {
    if (entry) {
      setContent(entry.content);
      setSelectedMood(entry.mood);
      setIsDirty(false);
    } else if (entryError) {
      setContent({ ...EMPTY_JOURNAL_CONTENT, threeGoals: ['', '', ''], mustDoTasks: EMPTY_JOURNAL_CONTENT.mustDoTasks.map((t) => ({ ...t })) });
      setSelectedMood(null);
      setIsDirty(false);
    }
  }, [entry, entryError]);

  const updateField = useCallback((field: keyof JournalContent, value: unknown) => {
    setContent((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  const updateGoal = useCallback((index: number, value: string) => {
    setContent((prev) => {
      const goals = [...prev.threeGoals];
      goals[index] = value;
      return { ...prev, threeGoals: goals };
    });
    setIsDirty(true);
  }, []);

  const updateTask = useCallback((index: number, updates: Partial<MustDoTask>) => {
    setContent((prev) => {
      const tasks = prev.mustDoTasks.map((t, i) => i === index ? { ...t, ...updates } : t);
      return { ...prev, mustDoTasks: tasks };
    });
    setIsDirty(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!selectedDate || !hasContent(content)) return;
    upsertMutation.mutate({
      date: selectedDate,
      content,
      mood: selectedMood || undefined,
    });
    setIsDirty(false);
  }, [selectedDate, content, selectedMood, upsertMutation]);

  const handleDelete = useCallback(() => {
    if (!selectedDate) return;
    if (!window.confirm('Delete this journal entry?')) return;
    deleteMutation.mutate(selectedDate);
    setContent({ ...EMPTY_JOURNAL_CONTENT, threeGoals: ['', '', ''], mustDoTasks: EMPTY_JOURNAL_CONTENT.mustDoTasks.map((t) => ({ ...t })) });
    setSelectedMood(null);
    setIsDirty(false);
  }, [selectedDate, deleteMutation]);

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const goToToday = () => {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(formatDateKey(today));
  };

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
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>Journal</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
          Your private space for reflection and growth
        </p>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Flame, color: '#ef4444', bg: 'rgba(239,68,68,0.15)', value: stats.currentStreak, label: 'Current Streak' },
            { icon: Award, color: '#eab308', bg: 'rgba(234,179,8,0.15)', value: stats.longestStreak, label: 'Longest Streak' },
            { icon: BookOpen, color: '#6366f1', bg: 'rgba(99,102,241,0.15)', value: stats.totalEntries, label: 'Total Entries' },
            { icon: Flame, color: '#22c55e', bg: 'rgba(34,197,94,0.15)', value: stats.last30DaysCount, label: 'Last 30 Days' },
          ].map(({ icon: Icon, color, bg, value, label }) => (
            <Card key={label} style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>{value}</p>
                  <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Main content: Calendar + Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <button onClick={prevMonth} className="p-1.5 rounded-md transition-colors hover:bg-white/5" aria-label="Previous month">
                <ChevronLeft size={18} style={{ color: 'var(--theme-text-muted)' }} />
              </button>
              <CardTitle className="text-base font-semibold cursor-pointer hover:opacity-80" style={{ color: 'var(--theme-text)' }} onClick={goToToday}>
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </CardTitle>
              <button onClick={nextMonth} className="p-1.5 rounded-md transition-colors hover:bg-white/5" aria-label="Next month">
                <ChevronRight size={18} style={{ color: 'var(--theme-text-muted)' }} />
              </button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {dayNames.map((name) => (
                <div key={name} className="text-center text-xs font-medium py-1" style={{ color: 'var(--theme-text-muted)' }}>{name}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((day, idx) => {
                if (day === null) return <div key={`empty-${idx}`} className="aspect-square" />;
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
                      background: isSelected ? 'var(--theme-primary)' : hasEntry ? 'rgba(197,168,128,0.15)' : 'transparent',
                      color: isSelected ? 'var(--theme-background)' : isFuture ? 'var(--theme-text-muted)' : 'var(--theme-text)',
                      opacity: isFuture ? 0.4 : 1,
                      fontWeight: isToday ? 700 : 400,
                      border: isToday && !isSelected ? '1px solid var(--theme-primary)' : '1px solid transparent',
                    }}
                  >
                    {day}
                    {hasEntry && !isSelected && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full" style={{ background: 'var(--theme-primary)' }} />
                    )}
                  </button>
                );
              })}
            </div>
            <button onClick={goToToday} className="w-full mt-3 py-1.5 text-xs font-medium rounded-md transition-colors hover:bg-white/5" style={{ color: 'var(--theme-primary)' }}>
              Go to Today
            </button>
          </CardContent>
        </Card>

        {/* Editor */}
        <Card className="lg:col-span-2" style={{ background: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base" style={{ color: 'var(--theme-text)' }}>
                  {selectedDate ? formatDisplayDate(selectedDate) : 'Select a date'}
                </CardTitle>
                {selectedDate === todayKey && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--theme-primary)' }}>Today</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {upsertMutation.isPending && (
                  <Loader2 size={16} className="animate-spin" style={{ color: 'var(--theme-text-muted)' }} />
                )}
                {(entry || hasContent(content)) && (
                  <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleteMutation.isPending || !entry} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                    <Trash2 size={14} className="mr-1" /> Delete
                  </Button>
                )}
                <Button size="sm" onClick={handleSave} disabled={!hasContent(content) || upsertMutation.isPending} style={{ background: 'var(--theme-primary)', color: 'var(--theme-background)' }}>
                  {upsertMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Mood selector */}
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--theme-text-muted)' }}>How are you feeling?</p>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => { setSelectedMood(selectedMood === mood.value ? null : mood.value); setIsDirty(true); }}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150"
                    style={{
                      background: selectedMood === mood.value ? 'rgba(197,168,128,0.2)' : 'rgba(255,255,255,0.05)',
                      border: selectedMood === mood.value ? '1px solid var(--theme-primary)' : '1px solid var(--theme-border)',
                      color: selectedMood === mood.value ? 'var(--theme-primary)' : 'var(--theme-text-muted)',
                    }}
                  >
                    {mood.emoji} {mood.label}
                  </button>
                ))}
              </div>
            </div>

            {entryLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin" style={{ color: 'var(--theme-text-muted)' }} />
              </div>
            ) : (
              <div className="space-y-5">
                {/* 1. Three goals */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-primary)' }}>
                    Drei Dinge, die ich heute erreichen will
                  </label>
                  <div className="space-y-2">
                    {content.threeGoals.map((goal, i) => (
                      <input
                        key={i}
                        type="text"
                        value={goal}
                        onChange={(e) => updateGoal(i, e.target.value)}
                        placeholder={`Ziel ${i + 1}…`}
                        className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-1"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--theme-border)',
                          color: 'var(--theme-text)',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* 2. Must-do tasks */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-primary)' }}>
                    Was heute erledigt werden muss
                  </label>
                  <div className="space-y-1.5">
                    {content.mustDoTasks.map((task, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => updateTask(i, { done: !task.done })}
                          className="flex-shrink-0 transition-colors"
                          style={{ color: task.done ? 'var(--theme-primary)' : 'var(--theme-text-muted)' }}
                        >
                          {task.done ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                        <input
                          type="text"
                          value={task.text}
                          onChange={(e) => updateTask(i, { text: e.target.value })}
                          placeholder={`Aufgabe ${i + 1}…`}
                          className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--theme-border)',
                            color: task.done ? 'var(--theme-text-muted)' : 'var(--theme-text)',
                            textDecoration: task.done ? 'line-through' : 'none',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Who I want to be */}
                <SectionField
                  label="Wer will ich heute sein?"
                  value={content.whoIWantToBe}
                  onChange={(v) => updateField('whoIWantToBe', v)}
                  placeholder="Beschreibe, wie du heute auftreten möchtest…"
                />

                {/* 4. Looking forward to */}
                <SectionField
                  label="Worauf ich mich heute freue"
                  value={content.lookingForwardTo}
                  onChange={(v) => updateField('lookingForwardTo', v)}
                  placeholder="Was bringt dir heute Freude…"
                />

                {/* 5. Important people */}
                <SectionField
                  label="Wer ist heute wichtig und wie will ich kommunizieren?"
                  value={content.importantPeople}
                  onChange={(v) => updateField('importantPeople', v)}
                  placeholder="Mit wem willst du heute in Kontakt treten…"
                />

                {/* 6. Thoughts */}
                <SectionField
                  label="Gedanken"
                  value={content.thoughts}
                  onChange={(v) => updateField('thoughts', v)}
                  placeholder="Freie Gedanken, Notizen, Reflexionen…"
                  rows={4}
                />
              </div>
            )}

            {isDirty && (
              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Unsaved changes</p>
            )}
            {upsertMutation.isSuccess && !isDirty && (
              <p className="text-xs" style={{ color: 'var(--theme-primary)' }}>Saved</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
