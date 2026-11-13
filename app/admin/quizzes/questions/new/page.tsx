'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/admin/PageHeader';
import { QuestionForm } from '@/components/admin/QuestionForm';

function NewQuestionContent() {
  const searchParams = useSearchParams();
  const chapterIdParam = searchParams.get('chapterId');
  const defaultChapterId = chapterIdParam ? Number(chapterIdParam) : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Question Builder"
        description="Craft a multiple choice chemistry question with LaTeX/subscript formulas, options, explanation, and live student preview."
      />

      <QuestionForm defaultChapterId={defaultChapterId} />
    </div>
  );
}

export default function NewQuestionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading question builder...</div>}>
      <NewQuestionContent />
    </Suspense>
  );
}

