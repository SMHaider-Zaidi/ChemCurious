'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  FileQuestion,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { ChapterDialog } from '@/components/admin/ChapterDialog';
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
import { useChapters, useChapterMutations, useAdminMe } from '@/lib/admin/hooks';
import type { Chapter, ClassLevel, ContentStatus } from '@/lib/admin/types';

export default function AdminQuizzesPage() {
  const [selectedClass, setSelectedClass] = useState<ClassLevel>(9);
  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<Chapter | null>(null);

  const { data, isLoading, error, refetch } = useChapters({ classLevel: selectedClass });
  const { data: me } = useAdminMe();
  const { setStatus, reorder, remove } = useChapterMutations();

  const chapters = data?.data || [];
  const isAdmin = me?.role === 'admin';

  const handleOpenCreate = () => {
    setEditingChapter(null);
    setChapterModalOpen(true);
  };

  const handleOpenEdit = (ch: Chapter) => {
    setEditingChapter(ch);
    setChapterModalOpen(true);
  };

  const handleToggleStatus = (ch: Chapter) => {
    const nextStatus: ContentStatus = ch.status === 'published' ? 'draft' : 'published';
    setStatus.mutate({ id: ch.id, status: nextStatus });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === chapters.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...chapters];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved!);

    const orderedIds = reordered.map((c) => c.id);
    reorder.mutate({ classLevel: selectedClass, orderedIds });
  };

  const handleDeleteClick = (ch: Chapter) => {
    setChapterToDelete(ch);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!chapterToDelete) return;
    await remove.mutateAsync(chapterToDelete.id);
    setDeleteConfirmOpen(false);
    setChapterToDelete(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quiz & Curriculum Management"
        description="Organize chemistry chapters across grade levels 9 through 12, balance questions, and control publication readiness."
        actions={
          <Button onClick={handleOpenCreate} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Chapter
          </Button>
        }
      />

      {/* Class Level Selector Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap border-b border-border/80 pb-4">
        <Tabs
          value={String(selectedClass)}
          onValueChange={(val) => setSelectedClass(Number(val) as ClassLevel)}
        >
          <TabsList className="bg-muted p-1">
            <TabsTrigger value="9" className="text-xs sm:text-sm font-medium">
              Class 9
            </TabsTrigger>
            <TabsTrigger value="10" className="text-xs sm:text-sm font-medium">
              Class 10
            </TabsTrigger>
            <TabsTrigger value="11" className="text-xs sm:text-sm font-medium">
              Class 11
            </TabsTrigger>
            <TabsTrigger value="12" className="text-xs sm:text-sm font-medium">
              Class 12
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <span className="text-xs text-muted-foreground font-mono">
          Showing Class {selectedClass} curriculum
        </span>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : chapters.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center bg-card/40 space-y-3">
          <p className="font-serif text-lg font-semibold text-foreground">
            No chapters found for Class {selectedClass}
          </p>
          <p className="text-xs text-muted-foreground">
            Get started by adding the first chapter to this grade level.
          </p>
          <Button onClick={handleOpenCreate} size="sm" variant="default" className="mt-2">
            <Plus className="h-4 w-4 mr-1" /> Create Chapter
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-16 text-center text-xs">Order</TableHead>
                  <TableHead className="text-xs">Chapter Title</TableHead>
                  <TableHead className="w-28 text-center text-xs">Questions</TableHead>
                  <TableHead className="w-32 text-center text-xs">Published</TableHead>
                  <TableHead className="w-28 text-center text-xs">Status</TableHead>
                  <TableHead className="w-36 text-center text-xs">Reorder</TableHead>
                  <TableHead className="w-36 text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chapters.map((ch, idx) => (
                  <TableRow key={ch.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-center font-bold text-xs text-muted-foreground">
                      {ch.order}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/quizzes/chapters/${ch.id}`}
                        className="font-serif font-semibold text-foreground hover:text-primary transition-colors hover:underline flex items-center gap-1.5"
                      >
                        {ch.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs">
                      {ch.questionCount}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs text-emerald-600 font-semibold">
                      {ch.publishedQuestionCount}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={ch.status} />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={idx === 0 || reorder.isPending}
                          onClick={() => handleMove(idx, 'up')}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          aria-label={`Move ${ch.title} up`}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={idx === chapters.length - 1 || reorder.isPending}
                          onClick={() => handleMove(idx, 'down')}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          aria-label={`Move ${ch.title} down`}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-primary"
                        >
                          <Link href={`/admin/quizzes/chapters/${ch.id}`}>
                            <Eye className="h-3.5 w-3.5 mr-1" /> Questions
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(ch)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title={ch.status === 'published' ? 'Unpublish (draft)' : 'Publish chapter'}
                        >
                          {ch.status === 'published' ? (
                            <XCircle className="h-4 w-4 text-amber-600" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(ch)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          aria-label="Edit chapter"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(ch)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            aria-label="Delete chapter"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Chapter Edit/Create Modal */}
      <ChapterDialog
        open={chapterModalOpen}
        onOpenChange={setChapterModalOpen}
        chapter={editingChapter}
        defaultClassLevel={selectedClass}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`Delete "${chapterToDelete?.title}"?`}
        description="Deleting a chapter permanently removes it. If questions or student attempts exist, the server will prevent deletion to preserve student history."
        confirmLabel="Delete Chapter"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        isLoading={remove.isPending}
      />
    </div>
  );
}
