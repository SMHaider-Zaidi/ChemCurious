'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Download, Eye } from 'lucide-react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { ErrorState } from '@/components/admin/ErrorState';
import { useStudents } from '@/lib/admin/hooks';
import type { StudentSummary, ClassLevel } from '@/lib/admin/types';

export default function AdminStudentsPage() {
  const [activeDays, setActiveDays] = useState<string>('all');
  const [institutionFilter, setInstitutionFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('points_desc');

  const { data, isLoading, error, refetch } = useStudents({
    activeWithin: activeDays === '7' ? 7 : activeDays === '30' ? 30 : undefined,
    institution: institutionFilter !== 'all' ? institutionFilter : undefined,
    sort: sortOrder,
    pageSize: 50,
  });

  const students = data?.data || [];

  // Extract unique institutions for filter
  const institutions = Array.from(new Set(students.map((s) => s.institution))).filter(Boolean);

  const handleExportCSV = () => {
    if (students.length === 0) return;
    const csvData = students.map((s) => ({
      ID: s.id,
      Name: s.name,
      Email: s.email,
      Institution: s.institution,
      Status: s.status,
      'Total Attempts': s.attempts,
      'Chapters Attempted': s.chaptersAttempted,
      'Average %': s.avgPercentage,
      'Best %': s.bestPercentage,
      'Mastery Points': s.points,
      'Last Active': s.lastActiveAt ? new Date(s.lastActiveAt).toLocaleString() : 'Never',
    }));

    const csvString = Papa.unparse(csvData);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `students_cohort_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: Column<StudentSummary>[] = [
    {
      header: 'Student',
      accessorKey: 'name',
      sortable: true,
      cell: (s) => (
        <div>
          <Link
            href={`/admin/students/${s.id}`}
            className="font-serif font-bold text-sm text-foreground hover:text-primary transition-colors hover:underline block"
          >
            {s.name}
          </Link>
          <span className="text-xs text-muted-foreground">{s.email}</span>
        </div>
      ),
    },
    {
      header: 'Institution',
      accessorKey: 'institution',
      sortable: true,
      cell: (s) => <span className="text-xs text-muted-foreground">{s.institution}</span>,
    },
    {
      header: 'Mastery Pts',
      accessorKey: 'points',
      sortable: true,
      cell: (s) => (
        <span className="font-mono font-bold text-xs text-primary">
          {s.points}
        </span>
      ),
    },
    {
      header: 'Attempts',
      accessorKey: 'attempts',
      sortable: true,
      cell: (s) => (
        <span className="font-mono text-xs">
          {s.attempts} <span className="text-muted-foreground text-[10px]">({s.chaptersAttempted} ch)</span>
        </span>
      ),
    },
    {
      header: 'Avg %',
      accessorKey: 'avgPercentage',
      sortable: true,
      cell: (s) => (
        <span
          className={`font-mono text-xs font-semibold ${
            s.avgPercentage >= 80
              ? 'text-emerald-600 dark:text-emerald-400'
              : s.avgPercentage >= 60
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {s.avgPercentage}%
        </span>
      ),
    },
    {
      header: 'Best %',
      accessorKey: 'bestPercentage',
      sortable: true,
      cell: (s) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          {s.bestPercentage}%
        </span>
      ),
    },
    {
      header: 'Last Active',
      accessorKey: 'lastActiveAt',
      sortable: true,
      cell: (s) => (
        <span className="text-xs text-muted-foreground font-mono">
          {s.lastActiveAt
            ? new Date(s.lastActiveAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
              })
            : 'Never'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (s) => <StatusBadge status={s.status} />,
    },
    {
      header: 'Action',
      cell: (s) => (
        <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs text-primary">
          <Link href={`/admin/students/${s.id}`}>
            <Eye className="h-3.5 w-3.5 mr-1" /> Profile
          </Link>
        </Button>
      ),
    },
  ];

  if (error) {
    return <ErrorState error={error} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Cohort Tracking"
        description="Monitor individual student quiz histories, curriculum coverage, accuracy by concept topic, and overall mastery points."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={students.length === 0}
            className="gap-1.5"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <DataTable
        data={students}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search student name, email, or school..."
        searchFilter={(item, q) =>
          item.name.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q) ||
          item.institution.toLowerCase().includes(q)
        }
        filters={
          <>
            <Select value={activeDays} onValueChange={setActiveDays}>
              <SelectTrigger className="h-9 w-36 text-xs">
                <SelectValue placeholder="Activity period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="7">Active in 7 days</SelectItem>
                <SelectItem value="30">Active in 30 days</SelectItem>
              </SelectContent>
            </Select>

            {institutions.length > 0 && (
              <Select value={institutionFilter} onValueChange={setInstitutionFilter}>
                <SelectTrigger className="h-9 w-44 text-xs">
                  <SelectValue placeholder="Institution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Institutions</SelectItem>
                  {institutions.map((inst) => (
                    <SelectItem key={inst} value={inst}>
                      {inst}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="h-9 w-36 text-xs">
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="points_desc">Points (High to Low)</SelectItem>
                <SelectItem value="avg_desc">Average % (High to Low)</SelectItem>
                <SelectItem value="attempts_desc">Attempts (Most to Least)</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
        emptyTitle="No student records found"
        emptyDescription="Students will appear here automatically as they sign up and complete chapter quizzes."
      />
    </div>
  );
}
