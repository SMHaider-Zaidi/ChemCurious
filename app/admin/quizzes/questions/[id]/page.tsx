'use client';

import { use } from 'react';
import { PageHeader } from '@/components/admin/PageHeader';
import { QuestionForm } from '@/components/admin/QuestionForm';
import { ErrorState } from '@/components/admin/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuestion } from '@/lib/admin/hooks';

export default function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const questionId = Number(resolvedParams.id);

  const { data: question, isLoading, error, refetch } = useQuestion(questionId);

  if (error) {
    return <ErrorState error={error} onRetry={() => refetch()} />;
  }

  if (isLoading || !question) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit Question #${question.id}`}
        description={`Modify statement, choices, or explanation in chapter "${question.chapterTitle}"`}
      />

      <QuestionForm initial={question} />
    </div>
  );
}
