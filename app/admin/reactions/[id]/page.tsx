'use client';

import { use } from 'react';
import { PageHeader } from '@/components/admin/PageHeader';
import { ReactionForm } from '@/components/admin/ReactionForm';
import { ErrorState } from '@/components/admin/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { useReaction } from '@/lib/admin/hooks';

export default function EditReactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const reactionId = Number(resolvedParams.id);

  const { data: reaction, isLoading, error, refetch } = useReaction(reactionId);

  if (error) {
    return <ErrorState error={error} onRetry={() => refetch()} />;
  }

  if (isLoading || !reaction) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit Reaction: ${reaction.name}`}
        description="Update chemical equation, reactant/product stoichiometric ratios, and descriptive notes."
      />
      <ReactionForm initial={reaction} />
    </div>
  );
}
