'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, FileText, Calendar, BookOpen, Download, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api-client';

interface ReportConfig {
  key: string;
  label: string;
  description: string;
  endpoint: string;
  filename: string;
  icon: React.ElementType;
  color: string;
  supportsDateRange: boolean;
}

const REPORTS: ReportConfig[] = [
  {
    key: 'members',
    label: 'Members',
    description: 'Export all member profiles with activity counts',
    endpoint: '/admin/reports/members',
    filename: 'members.csv',
    icon: Users,
    color: '#3b82f6',
    supportsDateRange: true,
  },
  {
    key: 'posts',
    label: 'Posts',
    description: 'Export community posts with engagement metrics',
    endpoint: '/admin/reports/posts',
    filename: 'posts.csv',
    icon: FileText,
    color: '#22c55e',
    supportsDateRange: true,
  },
  {
    key: 'events',
    label: 'Events',
    description: 'Export events with RSVP counts',
    endpoint: '/admin/reports/events',
    filename: 'events.csv',
    icon: Calendar,
    color: '#f59e0b',
    supportsDateRange: true,
  },
  {
    key: 'course-progress',
    label: 'Course Progress',
    description: 'Export learner progress across all courses',
    endpoint: '/admin/reports/course-progress',
    filename: 'course-progress.csv',
    icon: BookOpen,
    color: '#8b5cf6',
    supportsDateRange: false,
  },
];

export default function ReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  async function handleDownload(report: ReportConfig) {
    setDownloading(report.key);
    try {
      const params: Record<string, string> = {};
      if (report.supportsDateRange && dateFrom) params.from = dateFrom;
      if (report.supportsDateRange && dateTo) params.to = dateTo;

      const response = await apiClient.get(report.endpoint, {
        params,
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // silently fail — user sees button reset
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>Reports</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
          Download CSV exports of platform data.
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--theme-text)' }}>
            Date Range (optional)
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs mb-1 block" style={{ color: 'var(--theme-text-muted)' }}>From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs mb-1 block" style={{ color: 'var(--theme-text-muted)' }}>To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            {(dateFrom || dateTo) && (
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setDateFrom(''); setDateTo(''); }}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          const isDownloading = downloading === report.key;
          return (
            <Card key={report.key}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${report.color}18` }}
                  >
                    <Icon size={20} style={{ color: report.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>
                      {report.label}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                      {report.description}
                    </p>
                    {!report.supportsDateRange && (dateFrom || dateTo) && (
                      <p className="text-xs mt-1 italic" style={{ color: 'var(--theme-text-muted)' }}>
                        Date filter not applicable
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(report)}
                    disabled={isDownloading}
                    className="flex-shrink-0"
                  >
                    {isDownloading ? (
                      <Loader2 size={14} className="animate-spin mr-1" />
                    ) : (
                      <Download size={14} className="mr-1" />
                    )}
                    CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
