'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Pencil, Trash2, X, Eye, EyeOff } from 'lucide-react';

interface Question {
  id: string;
  questionId: string;
  dimension: string;
  text: string;
  sortOrder: number;
  isActive: boolean;
}

const DIMENSIONS = [
  { key: 'G', label: 'Growth Mindset', color: '#10b981' },
  { key: 'R', label: 'Rhythms & Habits', color: '#3b82f6' },
  { key: 'O', label: 'Ownership', color: '#f59e0b' },
  { key: 'W', label: 'Willpower & Resilience', color: '#ef4444' },
  { key: 'T', label: 'Teamwork', color: '#8b5cf6' },
  { key: 'H', label: 'Holistic Balance', color: '#ec4899' },
];

export default function AdminAssessmentPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Question | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ questionId: '', dimension: 'G', text: '', sortOrder: 0 });

  const { data: questions, isLoading } = useQuery<Question[]>({
    queryKey: ['admin-assessment-questions'],
    queryFn: () => apiClient.get('/assessments/admin/questions').then((r) => r.data),
  });

  const createMut = useMutation({
    mutationFn: (data: typeof form) => apiClient.post('/assessments/admin/questions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-assessment-questions'] });
      setCreating(false);
      setForm({ questionId: '', dimension: 'G', text: '', sortOrder: 0 });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Question>) =>
      apiClient.patch(`/assessments/admin/questions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-assessment-questions'] });
      setEditing(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/assessments/admin/questions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-assessment-questions'] }),
  });

  const toggleActive = (q: Question) => {
    updateMut.mutate({ id: q.id, isActive: !q.isActive });
  };

  const startEdit = (q: Question) => {
    setEditing(q);
    setForm({ questionId: q.questionId, dimension: q.dimension, text: q.text, sortOrder: q.sortOrder });
    setCreating(false);
  };

  const startCreate = () => {
    const maxSort = Math.max(0, ...(questions?.map((q) => q.sortOrder) ?? []));
    setCreating(true);
    setEditing(null);
    setForm({ questionId: '', dimension: 'G', text: '', sortOrder: maxSort + 1 });
  };

  const grouped = DIMENSIONS.map((d) => ({
    ...d,
    questions: (questions ?? []).filter((q) => q.dimension === d.key).sort((a, b) => a.sortOrder - b.sortOrder),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>Assessment Questions</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
            Manage GROWTH self-assessment questions.
          </p>
        </div>
        <Button onClick={startCreate} className="flex items-center gap-2">
          <Plus size={16} /> Add Question
        </Button>
      </div>

      {(creating || editing) && (
        <div className="rounded-xl p-6" style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ color: 'var(--theme-text)' }}>
              {editing ? 'Edit Question' : 'New Question'}
            </h3>
            <button onClick={() => { setCreating(false); setEditing(null); }}>
              <X size={18} style={{ color: 'var(--theme-text-muted)' }} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Question ID</Label>
              <Input
                value={form.questionId}
                onChange={(e) => setForm((f) => ({ ...f, questionId: e.target.value }))}
                placeholder="G6"
                disabled={!!editing}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Dimension</Label>
              <select
                value={form.dimension}
                onChange={(e) => setForm((f) => ({ ...f, dimension: e.target.value }))}
                className="mt-1 w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: 'var(--theme-background)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
              >
                {DIMENSIONS.map((d) => (
                  <option key={d.key} value={d.key}>{d.key} — {d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-3">
              <Label>Question Text</Label>
              <Input
                value={form.text}
                onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                placeholder="I actively seek out new learning opportunities."
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { setCreating(false); setEditing(null); }}>Cancel</Button>
            <Button
              onClick={() => {
                if (editing) {
                  updateMut.mutate({ id: editing.id, text: form.text, dimension: form.dimension, sortOrder: form.sortOrder });
                } else {
                  createMut.mutate(form);
                }
              }}
              disabled={createMut.isPending || updateMut.isPending || !form.text || !form.questionId}
            >
              {(createMut.isPending || updateMut.isPending) && <Loader2 size={14} className="animate-spin mr-1" />}
              {editing ? 'Save' : 'Create'}
            </Button>
          </div>
          {(createMut.error || updateMut.error) && (
            <p className="text-xs mt-2" style={{ color: 'var(--theme-danger)' }}>
              {((createMut.error || updateMut.error) as any)?.response?.data?.message || 'An error occurred'}
            </p>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--theme-primary)' }} />
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((dim) => (
            <div key={dim.key}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ background: dim.color }} />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>
                  {dim.key} — {dim.label}
                </h3>
                <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  ({dim.questions.filter((q) => q.isActive).length} active)
                </span>
              </div>
              <div className="space-y-2">
                {dim.questions.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{
                      background: 'var(--theme-card)',
                      border: '1px solid var(--theme-border)',
                      opacity: q.isActive ? 1 : 0.5,
                    }}
                  >
                    <span className="text-xs font-mono w-8 flex-shrink-0" style={{ color: 'var(--theme-text-muted)' }}>
                      {q.questionId}
                    </span>
                    <p className="text-sm flex-1" style={{ color: 'var(--theme-text)' }}>{q.text}</p>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(q)} title={q.isActive ? 'Disable' : 'Enable'}>
                        {q.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => startEdit(q)}>
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { if (confirm(`Delete "${q.questionId}"?`)) deleteMut.mutate(q.id); }}
                        style={{ color: 'var(--theme-danger)' }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
                {dim.questions.length === 0 && (
                  <p className="text-xs py-2 px-3" style={{ color: 'var(--theme-text-muted)' }}>No questions for this dimension.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
