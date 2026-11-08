'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { ErrorState } from '@/components/admin/ErrorState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AttemptsChart } from '@/components/admin/charts/AttemptsChart';
import { ScoreDistributionChart } from '@/components/admin/charts/ScoreDistributionChart';
import { useQuizAnalytics, useChapters } from '@/lib/admin/hooks';
import type { ClassLevel } from '@/lib/admin/types';
import {
  BarChart3,
  Users,
  Award,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [classFilter, setClassFilter] = React.useState<ClassLevel | 'all'>('all');
  const [period, setPeriod] = React.useState<'7d' | '30d' | 'all'>('30d');
  const [chapterId, setChapterId] = React.useState<number | undefined>(undefined);

  const { data: chaptersResponse } = useChapters();
  const chapters = chaptersResponse?.data || [];

  const {
    data: analytics,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuizAnalytics({
    classLevel: classFilter === 'all' ? undefined : classFilter,
    chapterId,
    period,
  });

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Quiz & Performance Analytics"
          description="Detailed breakdown of attempts, score distribution, and question-level difficulty"
        />
        <ErrorState
          title="Failed to load analytics"
          message={error?.message || 'Could not fetch quiz analytics data'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const summary = analytics?.summary;
  const attemptsByDay = analytics?.attemptsByDay || [];
  const scoreDistribution = analytics?.scoreDistribution || [];
  const perChapter = analytics?.perChapter || [];
  const difficultyAccuracy = analytics?.difficultyAccuracy || [];
  const topicAccuracy = analytics?.topicAccuracy || [];
  const mostMissedQuestions = analytics?.mostMissedQuestions || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quiz & Performance Analytics"
        description="Detailed breakdown of attempts, score distribution, and question-level difficulty"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Class Filter */}
            <Select
              value={String(classFilter)}
              onValueChange={(val) =>
                setClassFilter(val === 'all' ? 'all' : (Number(val) as ClassLevel))
              }
            >
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="9">Class 9</SelectItem>
                <SelectItem value="10">Class 10</SelectItem>
                <SelectItem value="11">Class 11</SelectItem>
                <SelectItem value="12">Class 12</SelectItem>
              </SelectContent>
            </Select>

            {/* Period Filter */}
            <Select
              value={period}
              onValueChange={(val) => setPeriod(val as '7d' | '30d' | 'all')}
            >
              <SelectTrigger className="w-[120px] h-9 text-xs">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>

            {/* Chapter Filter */}
            <Select
              value={chapterId ? String(chapterId) : 'all'}
              onValueChange={(val) => setChapterId(val === 'all' ? undefined : Number(val))}
            >
              <SelectTrigger className="w-[180px] h-9 text-xs truncate">
                <SelectValue placeholder="All Chapters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chapters</SelectItem>
                {chapters.map((ch) => (
                  <SelectItem key={ch.id} value={String(ch.id)} className="text-xs">
                    {ch.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Attempts"
          value={isLoading ? '—' : summary?.attempts.toLocaleString() ?? '0'}
          subtitle={period === '7d' ? 'Last 7 days' : period === '30d' ? 'Last 30 days' : 'All time'}
          icon={BarChart3}
        />
        <StatCard
          title="Unique Students"
          value={isLoading ? '—' : summary?.uniqueStudents.toLocaleString() ?? '0'}
          subtitle="Students who completed quizzes"
          icon={Users}
        />
        <StatCard
          title="Average Score"
          value={isLoading ? '—' : `${summary?.avgPercentage ?? 0}%`}
          subtitle="Overall cohort accuracy"
          icon={Award}
          badge={(summary?.avgPercentage ?? 0) >= 70 ? 'Proficient' : 'Needs Focus'}
        />
      </div>

      {/* Main Charts: Trends + Score Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AttemptsChart
            data={attemptsByDay}
            title="Daily Quiz Attempts & Accuracy"
            description="Volume of completed quiz sessions and daily average score"
          />
        </div>
        <div>
          <ScoreDistributionChart
            data={scoreDistribution}
            title="Score Distribution"
            description="Performance breakdown across score ranges"
          />
        </div>
      </div>

      {/* Accuracy Breakdowns: Difficulty & Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Difficulty Breakdown */}
        <Card className="rounded-xl border border-border shadow-xs">
          <CardHeader>
            <CardTitle className="font-serif text-base font-semibold">Accuracy by Difficulty</CardTitle>
            <CardDescription className="text-xs font-sans">
              How students perform across question complexity tiers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {difficultyAccuracy.length === 0 && !isLoading && (
              <p className="text-xs text-muted-foreground py-4 text-center">No difficulty data available</p>
            )}
            {difficultyAccuracy.map((diff) => {
              const color =
                diff.difficulty === 'easy'
                  ? 'bg-emerald-500'
                  : diff.difficulty === 'medium'
                    ? 'bg-amber-500'
                    : 'bg-rose-500';
              return (
                <div key={diff.difficulty} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-sans">
                    <span className="font-medium capitalize flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${color}`} />
                      {diff.difficulty}
                    </span>
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">{diff.accuracy}%</strong> ({diff.answers} answers)
                    </span>
                  </div>
                  <Progress value={diff.accuracy} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Topic Breakdown */}
        <Card className="rounded-xl border border-border shadow-xs">
          <CardHeader>
            <CardTitle className="font-serif text-base font-semibold">Accuracy by Topic</CardTitle>
            <CardDescription className="text-xs font-sans">
              Subject area mastery across all attempts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topicAccuracy.length === 0 && !isLoading && (
              <p className="text-xs text-muted-foreground py-4 text-center">No topic data available</p>
            )}
            {topicAccuracy.slice(0, 6).map((item) => (
              <div key={item.topic} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="font-medium truncate max-w-[220px]" title={item.topic}>
                    {item.topic}
                  </span>
                  <span className="text-muted-foreground">
                    <strong
                      className={
                        item.accuracy < 60
                          ? 'text-rose-600 dark:text-rose-400 font-semibold'
                          : 'text-foreground'
                      }
                    >
                      {item.accuracy}%
                    </strong>{' '}
                    ({item.answers} q)
                  </span>
                </div>
                <Progress
                  value={item.accuracy}
                  className={`h-2 ${item.accuracy < 60 ? '[&>div]:bg-rose-500' : ''}`}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Per-Chapter Performance Table */}
      <Card className="rounded-xl border border-border shadow-xs">
        <CardHeader>
          <CardTitle className="font-serif text-base font-semibold">Per-Chapter Analytics</CardTitle>
          <CardDescription className="text-xs font-sans">
            Aggregate engagement and accuracy metrics per curriculum module
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">Chapter</TableHead>
                  <TableHead className="text-xs font-semibold">Class</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Attempts</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Unique Students</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Avg Score</TableHead>
                  <TableHead className="text-xs font-semibold w-[160px]">Performance</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perChapter.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground">
                      No chapter analytics available for the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  perChapter.map((chap) => (
                    <TableRow key={chap.chapterId}>
                      <TableCell className="text-xs font-medium text-foreground">
                        {chap.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px] font-mono">
                          Class {chap.classLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-right font-mono">
                        {chap.attempts.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-right font-mono text-muted-foreground">
                        {chap.uniqueStudents.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-right font-semibold">
                        <span
                          className={
                            chap.avgPercentage >= 70
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : chap.avgPercentage >= 50
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-rose-600 dark:text-rose-400'
                          }
                        >
                          {chap.avgPercentage}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Progress value={chap.avgPercentage} className="h-2" />
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/quizzes/chapters/${chap.chapterId}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Top 10 Most Missed Questions */}
      <Card className="rounded-xl border border-border shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-serif text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Most Missed Questions
            </CardTitle>
            <CardDescription className="text-xs font-sans">
              Questions with the highest error rates across the cohort
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs font-mono">
            Top {mostMissedQuestions.length}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[50px] text-xs font-semibold">#</TableHead>
                  <TableHead className="text-xs font-semibold">Question</TableHead>
                  <TableHead className="text-xs font-semibold">Chapter</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Attempts</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Miss Rate</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mostMissedQuestions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-xs text-muted-foreground">
                      No problematic questions identified.
                    </TableCell>
                  </TableRow>
                ) : (
                  mostMissedQuestions.map((q, idx) => {
                    const plainText = q.text.replace(/<[^>]+>/g, '').trim();
                    return (
                      <TableRow key={q.questionId}>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="max-w-[340px]">
                          <p className="text-xs font-medium text-foreground line-clamp-2" title={plainText}>
                            {plainText}
                          </p>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {q.chapterTitle}
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono text-muted-foreground">
                          {q.answers}
                        </TableCell>
                        <TableCell className="text-xs text-right font-semibold">
                          <span className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded font-mono">
                            {q.missRate}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/quizzes/questions/${q.questionId}`}>
                            <Button variant="ghost" size="sm" className="h-7 text-xs font-sans text-primary">
                              Edit
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
