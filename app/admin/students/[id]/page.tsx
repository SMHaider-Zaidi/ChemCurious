'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  GraduationCap,
  Trophy,
  TrendingUp,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { AttemptsChart } from '@/components/admin/charts/AttemptsChart';
import { ErrorState } from '@/components/admin/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useStudentDetail } from '@/lib/admin/hooks';

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const studentId = Number(resolvedParams.id);

  const { data: detail, isLoading, error, refetch } = useStudentDetail(studentId);

  if (error) {
    return <ErrorState error={error} onRetry={() => refetch()} />;
  }

  if (isLoading || !detail) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const { profile, totals, attempts, chapterPerformance, topicAccuracy, weakTopics, activityByDay } = detail;

  return (
    <div className="space-y-8">
      {/* Top back navigation */}
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs -ml-2">
          <Link href="/admin/students">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Students
          </Link>
        </Button>
      </div>

      {/* Student Profile Header */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary font-serif font-black text-2xl">
            {profile.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-foreground">{profile.name}</h1>
              <StatusBadge status={profile.status} />
            </div>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {profile.institution} · Joined {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="font-mono text-2xl font-black text-primary">{totals.points}</span>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase">
              Mastery Points
            </p>
          </div>
        </div>
      </div>

      {/* Totals Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Attempts"
          value={totals.attempts}
          subtitle={`${totals.chaptersAttempted} distinct chapters`}
          icon={FileText}
        />
        <StatCard
          title="Average Score"
          value={
            totals.avgPercentage != null && !isNaN(Number(totals.avgPercentage))
              ? `${totals.avgPercentage}%`
              : '0%'
          }
          subtitle="Across all attempts"
          icon={TrendingUp}
        />
        <StatCard
          title="Highest Score"
          value={
            totals.bestPercentage != null && !isNaN(Number(totals.bestPercentage))
              ? `${totals.bestPercentage}%`
              : '0%'
          }
          subtitle="Personal best"
          icon={Trophy}
        />
        <StatCard
          title="Curriculum Coverage"
          value={totals.chaptersAttempted}
          subtitle="Chapters completed"
          icon={GraduationCap}
        />
        <StatCard
          title="Last Active"
          value={
            totals.lastActiveAt
              ? new Date(totals.lastActiveAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                })
              : 'Never'
          }
          subtitle="Latest assessment"
          icon={Clock}
        />
      </div>

      {/* Weak Topics Callout (if any exist) */}
      {weakTopics && weakTopics.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-2">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Targeted Learning Opportunity: Weak Concept Areas Detected</span>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-300/80 leading-relaxed">
            The student scored below 60% accuracy on the following topics with ≥ 3 recorded answers:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {weakTopics.map((topic) => (
              <Badge
                key={topic.topic}
                variant="outline"
                className="bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-500/40 text-xs py-1"
              >
                {topic.topic}: {topic.accuracy}% ({topic.correct}/{topic.total} correct)
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* 2-Column: Chapter Performance & Activity Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chapter Performance Table */}
        <Card className="shadow-sm border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-base">Curriculum Chapter Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {chapterPerformance.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No chapter attempts recorded yet.
              </p>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-xs">Chapter</TableHead>
                      <TableHead className="w-20 text-center text-xs">Attempts</TableHead>
                      <TableHead className="w-20 text-center text-xs">Best %</TableHead>
                      <TableHead className="w-20 text-center text-xs">Avg %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chapterPerformance.map((ch, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-xs font-medium">
                          {ch.title}
                          {ch.classLevel && (
                            <span className="text-[10px] text-muted-foreground block">
                              Class {ch.classLevel}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs">
                          {ch.attempts}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs font-bold text-emerald-600">
                          {ch.bestPercentage}%
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs text-muted-foreground">
                          {ch.avgPercentage}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 30-Day Activity Area Chart */}
        <Card className="shadow-sm border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-base">30-Day Activity Frequency</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <AttemptsChart data={activityByDay} height={240} />
          </CardContent>
        </Card>
      </div>

      {/* Topic Accuracy Breakdown */}
      <Card className="shadow-sm border-border">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-base">Concept Topic Mastery Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {topicAccuracy.map((t) => (
              <div
                key={t.topic}
                className="rounded-lg border border-border p-3 space-y-1.5 bg-card/60"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground truncate">
                    {t.topic}
                  </span>
                  <span
                    className={`font-mono text-xs font-bold ${
                      t.accuracy >= 70
                        ? 'text-emerald-600'
                        : t.accuracy >= 50
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {t.accuracy}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      t.accuracy >= 70
                        ? 'bg-emerald-500'
                        : t.accuracy >= 50
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${t.accuracy}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {t.correct} of {t.total} answers correct
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Attempts History Table */}
      <Card className="shadow-sm border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="font-serif text-base">All Assessment Attempts</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Chronological log of submitted quizzes
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            Total {attempts.length} attempts
          </span>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Chapter</TableHead>
                  <TableHead className="text-center text-xs">Score</TableHead>
                  <TableHead className="text-center text-xs">Percentage</TableHead>
                  <TableHead className="text-center text-xs">Duration</TableHead>
                  <TableHead className="text-right text-xs">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((att) => (
                  <TableRow key={att.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {new Date(att.completedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="font-medium text-xs">
                      {att.chapterTitle}
                      {att.classLevel && (
                        <span className="text-[10px] text-muted-foreground block">
                          Class {att.classLevel}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs">
                      {att.score} / {att.totalQuestions}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`font-mono text-xs font-bold ${
                          att.percentage >= 80
                            ? 'text-emerald-600'
                            : att.percentage >= 60
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {att.percentage}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                      {att.timeSpentSeconds
                        ? `${Math.floor(att.timeSpentSeconds / 60)}m ${
                            att.timeSpentSeconds % 60
                          }s`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {att.hasAnswerDetail ? (
                        <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                          Breakdown Available
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">
                          Legacy (No Breakdown)
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground italic">
            * Note: Detailed question-by-question response breakdown is captured for newer attempts; legacy attempts record total score and completion percentage.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
