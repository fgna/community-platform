'use client';

import { useState } from 'react';
import { Loader2, ChevronRight, ChevronLeft, BarChart3, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/common/page-header';
import { GrowthRadarChart } from './growth-radar-chart';
import {
  useAssessmentQuestions,
  useLatestAssessment,
  useAssessmentHistory,
  useAssessmentRecommendations,
  useSubmitAssessment,
} from '@/hooks/use-assessments';
import Link from 'next/link';

export function AssessmentPage() {
  const { data: questions, isLoading: questionsLoading } = useAssessmentQuestions();
  const { data: latest, isLoading: latestLoading } = useLatestAssessment();
  const { data: history } = useAssessmentHistory();
  const { data: recommendations } = useAssessmentRecommendations();
  const submitMutation = useSubmitAssessment();

  const [mode, setMode] = useState<'view' | 'assess'>('view');
  const [currentDim, setCurrentDim] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<any>(null);

  if (questionsLoading || latestLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--theme-primary)' }} />
      </div>
    );
  }

  const dimensions = questions?.dimensions || [];

  const startAssessment = () => {
    setAnswers({});
    setCurrentDim(0);
    setResult(null);
    setMode('assess');
  };

  const handleAnswer = (questionId: string, score: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: score }));
  };

  const currentDimension = dimensions[currentDim];
  const currentDimQuestions = currentDimension?.questions || [];
  const allCurrentAnswered = currentDimQuestions.every(
    (q: any) => answers[q.id] !== undefined,
  );

  const handleNext = () => {
    if (currentDim < dimensions.length - 1) {
      setCurrentDim(currentDim + 1);
    }
  };

  const handlePrev = () => {
    if (currentDim > 0) {
      setCurrentDim(currentDim - 1);
    }
  };

  const handleSubmit = async () => {
    const answerArray = Object.entries(answers).map(([questionId, score]) => ({
      questionId,
      score,
    }));
    const res = await submitMutation.mutateAsync(answerArray);
    setResult(res);
    setMode('view');
  };

  const isLastDim = currentDim === dimensions.length - 1;
  const progressPercent = ((currentDim + 1) / dimensions.length) * 100;

  const displayAssessment = result || latest;

  if (mode === 'assess' && currentDimension) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader title="GROWTH Self-Assessment" description={`Section ${currentDim + 1} of ${dimensions.length}: ${currentDimension.label}`} />

        <Progress value={progressPercent} className="h-2" />

        <div className="rounded-xl p-6 space-y-5" style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>
            {currentDimension.label}
          </h2>

          {currentDimQuestions.map((q: any) => (
            <div key={q.id} className="space-y-2">
              <p className="text-sm" style={{ color: 'var(--theme-text)' }}>{q.text}</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => handleAnswer(q.id, score)}
                    className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: answers[q.id] === score ? 'rgba(197,168,128,0.15)' : 'rgba(255,255,255,0.03)',
                      color: answers[q.id] === score ? 'var(--theme-primary)' : 'var(--theme-text-muted)',
                      border: answers[q.id] === score ? '1px solid rgba(197,168,128,0.3)' : '1px solid var(--theme-border)',
                    }}
                  >
                    {score}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                <span>Strongly disagree</span>
                <span>Strongly agree</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handlePrev} disabled={currentDim === 0}>
            <ChevronLeft size={14} className="mr-1" /> Previous
          </Button>
          {isLastDim ? (
            <Button onClick={handleSubmit} disabled={!allCurrentAnswered || submitMutation.isPending}>
              {submitMutation.isPending ? (
                <><Loader2 size={14} className="mr-1 animate-spin" /> Submitting...</>
              ) : (
                'Complete Assessment'
              )}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!allCurrentAnswered}>
              Next <ChevronRight size={14} className="ml-1" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // View mode
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title="GROWTH Self-Assessment" description="Evaluate your leadership development across 6 key dimensions" />

      {displayAssessment ? (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Radar chart */}
            <div className="rounded-xl p-6 flex flex-col items-center" style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}>
              <GrowthRadarChart
                scores={displayAssessment.scores as Record<string, number>}
                labels={displayAssessment.dimensionLabels}
              />
              <div className="mt-4 text-center">
                <p className="text-3xl font-bold" style={{ color: 'var(--theme-primary)' }}>
                  {displayAssessment.overallScore.toFixed(1)}
                </p>
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  Overall Score (out of 5)
                </p>
              </div>
            </div>

            {/* Dimension breakdown */}
            <div className="rounded-xl p-6 space-y-4" style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>Dimension Scores</h3>
              {Object.entries(displayAssessment.scores as Record<string, number>).map(([key, score]) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--theme-text)' }}>
                      {(displayAssessment.dimensionLabels as Record<string, string>)?.[key] || key}
                    </span>
                    <span style={{ color: 'var(--theme-primary)' }}>{score.toFixed(1)}/5</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(score / 5) * 100}%`,
                        background: 'var(--theme-primary)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              Completed {new Date(displayAssessment.completedAt).toLocaleDateString()}
            </p>
            <Button onClick={startAssessment} variant="outline" size="sm">
              <RotateCcw size={14} className="mr-1.5" /> Retake Assessment
            </Button>
          </div>

          {/* Development Path */}
          {recommendations?.dimensions?.length > 0 && (
            <div className="rounded-xl p-6 space-y-4" style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>Your Development Path</h3>
              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                Based on your assessment, here are your focus areas and personalized recommendations.
              </p>

              <div className="space-y-3">
                {recommendations.dimensions.map((d: any) => (
                  <div key={d.key} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--theme-border)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>{d.label}</span>
                      <span className="text-xs font-medium" style={{ color: d.score < 3 ? '#ef4444' : d.score < 4 ? '#eab308' : '#22c55e' }}>
                        {d.score.toFixed(1)}/5
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{d.suggestion}</p>
                  </div>
                ))}
              </div>

              {recommendations.courses?.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>Suggested Courses</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {recommendations.courses.map((c: any) => (
                      <Link key={c.id} href={`/courses/${c.id}`} className="block p-3 rounded-lg transition-all hover:opacity-80" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--theme-border)' }}>
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--theme-text)' }}>{c.title}</p>
                        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{c.description}</p>
                        {c.progress > 0 && (
                          <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <div className="h-full rounded-full" style={{ width: `${c.progress}%`, background: 'var(--theme-primary)' }} />
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {recommendations.events?.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>Upcoming Relevant Events</h4>
                  <div className="space-y-2">
                    {recommendations.events.map((e: any) => (
                      <Link key={e.id} href={`/events/${e.id}`} className="flex items-center gap-3 p-3 rounded-lg transition-all hover:opacity-80" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--theme-border)' }}>
                        <div className="text-center flex-shrink-0 w-10">
                          <p className="text-xs font-bold" style={{ color: 'var(--theme-primary)' }}>
                            {new Date(e.startsAt).toLocaleDateString(undefined, { day: 'numeric' })}
                          </p>
                          <p className="text-[10px] uppercase" style={{ color: 'var(--theme-text-muted)' }}>
                            {new Date(e.startsAt).toLocaleDateString(undefined, { month: 'short' })}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--theme-text)' }}>{e.title}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--theme-text-muted)' }}>{e.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* History */}
          {history?.data?.length > 1 && (
            <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>Assessment History</h3>
              <div className="space-y-2">
                {history.data.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                      {new Date(a.completedAt).toLocaleDateString()}
                    </span>
                    <span className="text-sm font-medium" style={{ color: 'var(--theme-primary)' }}>
                      {a.overallScore.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl p-12 text-center space-y-4" style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}>
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center" style={{ background: 'rgba(197,168,128,0.1)' }}>
            <BarChart3 size={28} style={{ color: 'var(--theme-primary)' }} />
          </div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>
            Discover Your GROWTH Profile
          </h2>
          <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--theme-text-muted)' }}>
            Take a quick self-assessment across 6 leadership dimensions: Growth mindset, Rhythms, Ownership, Willpower, Teamwork, and Holistic balance.
          </p>
          <Button onClick={startAssessment} size="lg">
            Start Assessment
          </Button>
        </div>
      )}
    </div>
  );
}
