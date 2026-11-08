'use client';

import { use } from 'react';
import { PageHeader } from '@/components/admin/PageHeader';
import { MoleculeForm } from '@/components/admin/MoleculeForm';
import { ErrorState } from '@/components/admin/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { useMolecule } from '@/lib/admin/hooks';

export default function EditMoleculePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const moleculeId = Number(resolvedParams.id);

  const { data: molecule, isLoading, error, refetch } = useMolecule(moleculeId);

  if (error) {
    return <ErrorState error={error} onRetry={() => refetch()} />;
  }

  if (isLoading || !molecule) {
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
        title={`Edit Molecule: ${molecule.name} (${molecule.formula})`}
        description="Inspect and adjust spatial atom coordinates, bond orders, or category metadata."
      />
      <MoleculeForm initial={molecule} />
    </div>
  );
}
