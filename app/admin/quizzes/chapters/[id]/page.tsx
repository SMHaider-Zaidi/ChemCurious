'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import {
  Plus,
  ArrowLeft,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  FileQuestion,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatusBadge, DifficultyBadge } from '@/components/admin/StatusBadge';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { BulkImportDialog } from '@/components/admin/BulkImportDialog';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { SafeHtml } from '@/components/admin/SafeHtml';
import { ErrorState } from '@/components/admin/ErrorState';
import { useChapter, useQuestions, useQuestionMutations, useAdminMe } from '@/lib/admin/hooks';
import type { Question, ContentStatus, Difficulty } from '@/lib/admin/types';

export default function ChapterQuestionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const chapterId = Number(resolvedParams.id);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [diffFilter, setDiffFilter] = useState<string>('all');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);

  const { data: chapter, isLoading: chapterLoading } = useChapter(chapterId);
  const { data: questionsData, isLoading: questionsLoading, error, refetch } = useQuestions({
    chapterId,
    status: statusFilter !== 'all' ? (statusFilter as ContentStatus) : undefined,
    difficulty: diffFilter !== 'all' ? (diffFilter as Difficulty) : undefined,
  });

  const { data: me } = useAdminMe();
  const isAdmin = me?.role === 'admin';
  const { setStatus, remove } = useQuestionMutations();

  const questions = questionsData?.data || [];

  const handleToggleStatus = (q: Question) => {
    const nextStatus: ContentStatus = q.status === 'published' ? 'draft' : 'published';
    setStatus.mutate({ id: q.id, status: nextStatus });
  };

  const handleDeleteClick = (q: Question) => {
    setQuestionToDelete(q);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!questionToDelete) return;
    await remove.mutateAsync(questionToDelete.id);
    setDeleteConfirmOpen(false);
    setQuestionToDelete(null);
  };

  const columns: Column<Question>[] = [
    {
      header: 'Question',
      accessorKey: 'textPlain',
      sortable: true,
      cell: (q) => (
        <div className="max-w-md">
          <Link
            href={`/admin/quizzes/questions/${q.id}`}
            className="font-serif font-semibold text-sm hover:text-primary transition-colors line-clamp-2"
          >
            <SafeHtml html={q.text} />
          </Link>
          <span className="text-[11px] text-muted-foreground block mt-0.5">
            Ans: <strong className="text-foreground">{q.correct}</strong> · {q.marks}{' '}
            {q.marks === 1 ? 'mark' : 'marks'}
          </span>
        </div>
      ),
    },
    {
      header: 'Topic',
      accessorKey: 'topic',
      sortable: true,
      cell: (q) => (
        <span className="text-xs font-medium text-foreground bg-muted px-2 py-0.5 rounded">
          {q.topic || 'General'}
        </span>
      ),
    },
    {
      header: 'Difficulty',
      accessorKey: 'difficulty',
      sortable: true,
      cell: (q) => <DifficultyBadge difficulty={q.difficulty} />,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (q) => <StatusBadge status={q.status} />,
    },
    {
      header: 'Actions',
      cell: (q) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Link href={`/admin/quizzes/questions/${q.id}`} aria-label="Edit question">
              <Edit2 className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleToggleStatus(q)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title={q.status === 'published' ? 'Set to draft' : 'Publish question'}
          >
            {q.status === 'published' ? (
              <XCircle className="h-4 w-4 text-amber-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            )}
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteClick(q)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              aria-label="Delete question"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (error) {
    return <ErrorState error={error} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs -ml-2">
          <Link href="/admin/quizzes">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Chapters List
          </Link>
        </Button>
      </div>

      <PageHeader
        title={chapter ? chapter.title : `Chapter #${chapterId}`}
        description={
          chapter
            ? `Class ${chapter.classLevel} · ${chapter.questionCount} Questions (${chapter.publishedQuestionCount} Published)`
            : 'Loading chapter curriculum details...'
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <BulkImportDialog
              chapterId={chapterId}
              chapterTitle={chapter?.title || `Chapter #${chapterId}`}
            />
            <Button asChild size="sm" className="gap-1.5">
              <Link href={`/admin/quizzes/questions/new?chapterId=${chapterId}`}>
                <Plus className="h-4 w-4" /> Add Question
              </Link>
            </Button>
          </div>
        }
      />

      {/* Filter toolbar */}
      <DataTable
        data={questions}
        columns={columns}
        isLoading={questionsLoading || chapterLoading}
        searchPlaceholder="Search question text or topic..."
        searchFilter={(item, q) =>
          item.textPlain.toLowerCase().includes(q) ||
          item.topic.toLowerCase().includes(q)
        }
        filters={
          <>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-32 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={diffFilter} onValueChange={setDiffFilter}>
              <SelectTrigger className="h-9 w-32 text-xs">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
        emptyTitle="No questions found in this chapter"
        emptyDescription="Add questions manually using the Question Builder or use the Bulk Import tool to upload multiple items via CSV or JSON."
        emptyAction={
          <Button asChild size="sm">
            <Link href={`/admin/quizzes/questions/new?chapterId=${chapterId}`}>
              <Plus className="h-4 w-4 mr-1" /> Create Question
            </Link>
          </Button>
        }
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Question?"
        description="Are you sure you want to delete this question? If students have already answered this question in prior attempts, the system will automatically archive it instead of hard-deleting to preserve student records."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        isLoading={remove.isPending}
      />
    </div>
  );
}
