'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Download,
  Info,
  Medal,
  Award,
} from 'lucide-react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { PageHeader } from '@/components/admin/PageHeader';
import { Podium } from '@/components/admin/Podium';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { ErrorState } from '@/components/admin/ErrorState';
import { useLeaderboard, useChapters } from '@/lib/admin/hooks';
import type { LeaderboardEntry, LeaderboardMetric, ClassLevel } from '@/lib/admin/types';

export default function AdminLeaderboardPage() {
  const [metric, setMetric] = useState<LeaderboardMetric>('points');
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');

  const { data: chaptersData } = useChapters();
  const chapters = chaptersData?.data || [];

  const { data, isLoading, error, refetch } = useLeaderboard({
    metric,
    period,
    classLevel: selectedClass !== 'all' ? (Number(selectedClass) as ClassLevel) : undefined,
    chapterId: selectedChapter !== 'all' ? Number(selectedChapter) : undefined,
    limit: 100,
  });

  const entries = data?.data || [];

  const handleExportCSV = () => {
    if (entries.length === 0) return;
    const csvData = entries.map((e) => ({
      Rank: e.rank,
      Name: e.name,
      Institution: e.institution,
      'Mastery Points': e.points,
      'Average %': e.avgPercentage,
      'Best %': e.bestPercentage,
      Attempts: e.attempts,
      'Chapters Covered': e.chaptersAttempted,
      'Last Active': e.lastActiveAt ? new Date(e.lastActiveAt).toLocaleString() : 'Never',
    }));

    const csvString = Papa.unparse(csvData);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leaderboard_${metric}_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: Column<LeaderboardEntry>[] = [
    {
      header: 'Rank',
      accessorKey: 'rank',
      sortable: true,
      className: 'w-16 text-center',
      cell: (e) => {
        const isPodium = e.rank <= 3;
        return (
          <div className="flex items-center justify-center">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                e.rank === 1
                  ? 'bg-amber-400 text-amber-950 shadow-xs'
                  : e.rank === 2
                  ? 'bg-slate-300 text-slate-800'
                  : e.rank === 3
                  ? 'bg-amber-700/20 text-amber-700 dark:text-amber-400'
                  : 'text-muted-foreground font-mono'
              }`}
            >
              {e.rank}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Student',
      accessorKey: 'name',
      sortable: true,
      cell: (e) => (
        <div>
          <Link
            href={`/admin/students/${e.userId}`}
            className="font-serif font-bold text-sm text-foreground hover:text-primary transition-colors hover:underline block"
          >
            {e.name}
          </Link>
          <span className="text-xs text-muted-foreground">{e.institution}</span>
        </div>
      ),
    },
    {
      header: 'Mastery Points',
      accessorKey: 'points',
      sortable: true,
      cell: (e) => (
        <span
          className={`font-mono font-bold text-sm ${
            metric === 'points' ? 'text-primary font-black' : 'text-foreground'
          }`}
        >
          {e.points}
        </span>
      ),
    },
    {
      header: 'Average %',
      accessorKey: 'avgPercentage',
      sortable: true,
      cell: (e) => (
        <span
          className={`font-mono text-xs font-semibold ${
            metric === 'average' ? 'text-primary font-bold' : 'text-muted-foreground'
          }`}
        >
          {e.avgPercentage}%
        </span>
      ),
    },
    {
      header: 'Best %',
      accessorKey: 'bestPercentage',
      sortable: true,
      cell: (e) => <span className="font-mono text-xs">{e.bestPercentage}%</span>,
    },
    {
      header: 'Attempts',
      accessorKey: 'attempts',
      sortable: true,
      cell: (e) => (
        <span
          className={`font-mono text-xs ${
            metric === 'attempts' ? 'text-primary font-bold' : ''
          }`}
        >
          {e.attempts}{' '}
          <span className="text-muted-foreground text-[10px]">({e.chaptersAttempted} ch)</span>
        </span>
      ),
    },
    {
      header: 'Last Active',
      accessorKey: 'lastActiveAt',
      sortable: true,
      cell: (e) => (
        <span className="text-xs text-muted-foreground font-mono">
          {e.lastActiveAt
            ? new Date(e.lastActiveAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
              })
            : 'Never'}
        </span>
      ),
    },
  ];

  if (error) {
    return <ErrorState error={error} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Leaderboard & Standings"
        description="Comprehensive ranking engine based on curriculum breadth, highest score per chapter, and total assessment completions."
        actions={
          <div className="flex items-center gap-2">
            {/* How points are calculated popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Info className="h-4 w-4 text-primary" /> How points are calculated
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 text-xs space-y-2 shadow-lg">
                <h4 className="font-serif font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Trophy className="h-4 w-4 text-amber-500" /> Mastery Points Formula
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  For each chapter, we take the student's <strong>highest percentage score</strong> (0–100%).
                </p>
                <p className="text-muted-foreground leading-relaxed font-mono bg-muted/50 p-2 rounded text-[11px]">
                  Points = Sum(Best % of each attempted chapter)
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  This rewards <em>curriculum breadth and mastery</em> over repeated drilling of a single chapter. Ties are broken by points, then average percentage, then earliest completion.
                </p>
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={entries.length === 0}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        }
      />

      {/* Metric Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <Tabs
          value={metric}
          onValueChange={(val) => setMetric(val as LeaderboardMetric)}
        >
          <TabsList className="bg-muted p-1">
            <TabsTrigger value="points" className="text-xs sm:text-sm font-medium gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-amber-500" /> Mastery Points
            </TabsTrigger>
            <TabsTrigger value="average" className="text-xs sm:text-sm font-medium gap-1.5">
              <Medal className="h-3.5 w-3.5 text-primary" /> Average %
            </TabsTrigger>
            <TabsTrigger value="attempts" className="text-xs sm:text-sm font-medium gap-1.5">
              <Award className="h-3.5 w-3.5 text-secondary" /> Total Attempts
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Time Period Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Period:</span>
          <Select value={period} onValueChange={(val) => setPeriod(val as '7d' | '30d' | 'all')}>
            <SelectTrigger className="h-8 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Top 3 Visual Podium */}
      {entries.length >= 3 && <Podium entries={entries.slice(0, 3)} />}

      {/* Full Ranked Table */}
      <DataTable
        data={entries}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search rank list by student or school..."
        searchFilter={(item, q) =>
          item.name.toLowerCase().includes(q) || item.institution.toLowerCase().includes(q)
        }
        filters={
          <>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="h-9 w-32 text-xs">
                <SelectValue placeholder="Class level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="9">Class 9</SelectItem>
                <SelectItem value="10">Class 10</SelectItem>
                <SelectItem value="11">Class 11</SelectItem>
                <SelectItem value="12">Class 12</SelectItem>
              </SelectContent>
            </Select>

            {chapters.length > 0 && (
              <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                <SelectTrigger className="h-9 w-44 text-xs">
                  <SelectValue placeholder="Chapter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Chapters</SelectItem>
                  {chapters.map((ch) => (
                    <SelectItem key={ch.id} value={String(ch.id)}>
                      {ch.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </>
        }
        emptyTitle="No leaderboard rankings found"
        emptyDescription="Rankings will recalculate automatically as assessments are recorded."
      />
    </div>
  );
}
