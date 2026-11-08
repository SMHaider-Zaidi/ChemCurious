'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
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
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { ErrorState } from '@/components/admin/ErrorState';
import { formatFormulaUnicode } from '@/lib/admin/chemFormat';
import { useReactions, useReactionMutations, useAdminMe } from '@/lib/admin/hooks';
import type { Reaction, ContentStatus } from '@/lib/admin/types';

export default function AdminReactionsPage() {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reactionToDelete, setReactionToDelete] = useState<Reaction | null>(null);

  const { data, isLoading, error, refetch } = useReactions({
    category: categoryFilter !== 'all' ? (categoryFilter as 'organic' | 'inorganic') : undefined,
    status: statusFilter !== 'all' ? (statusFilter as ContentStatus) : undefined,
  });

  const { data: me } = useAdminMe();
  const isAdmin = me?.role === 'admin';
  const { setStatus, remove } = useReactionMutations();

  const reactions = data?.data || [];

  const handleToggleStatus = (r: Reaction) => {
    const next: ContentStatus = r.status === 'published' ? 'draft' : 'published';
    setStatus.mutate({ id: r.id, status: next });
  };

  const handleDeleteClick = (r: Reaction) => {
    setReactionToDelete(r);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!reactionToDelete) return;
    await remove.mutateAsync(reactionToDelete.id);
    setDeleteConfirmOpen(false);
    setReactionToDelete(null);
  };

  const columns: Column<Reaction>[] = [
    {
      header: 'Reaction Name',
      accessorKey: 'name',
      sortable: true,
      cell: (r) => (
        <div>
          <Link
            href={`/admin/reactions/${r.id}`}
            className="font-serif font-bold text-sm text-foreground hover:text-primary transition-colors hover:underline"
          >
            {r.name}
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {r.reactants?.map((x) => `${x.coefficient > 1 ? x.coefficient : ''}${formatFormulaUnicode(x.molecule || '') || `Mol #${x.moleculeId}`}`).join(' + ') || '—'}{' '}
            →{' '}
            {r.products?.map((x) => `${x.coefficient > 1 ? x.coefficient : ''}${formatFormulaUnicode(x.molecule || '') || `Mol #${x.moleculeId}`}`).join(' + ') || '—'}
          </p>
        </div>
      ),
    },
    {
      header: 'Category',
      accessorKey: 'category',
      sortable: true,
      cell: (r) => (
        <span className="capitalize font-medium text-xs bg-muted px-2 py-0.5 rounded text-foreground">
          {r.category}
        </span>
      ),
    },
    {
      header: 'Reactants',
      accessorKey: 'reactantCount',
      sortable: true,
      cell: (r) => <span className="font-mono text-xs">{r.reactantCount}</span>,
    },
    {
      header: 'Products',
      accessorKey: 'productCount',
      sortable: true,
      cell: (r) => <span className="font-mono text-xs">{r.productCount}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      header: 'Actions',
      cell: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Link href={`/admin/reactions/${r.id}`} aria-label="Edit reaction">
              <Edit2 className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleToggleStatus(r)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title={r.status === 'published' ? 'Unpublish (draft)' : 'Publish reaction'}
          >
            {r.status === 'published' ? (
              <XCircle className="h-4 w-4 text-amber-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            )}
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteClick(r)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              aria-label="Delete reaction"
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
      <PageHeader
        title="Chemical Reactions Catalog"
        description="Manage reaction equations, stoichiometric reactant/product coefficients, and simulated laboratory conditions."
        actions={
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/admin/reactions/new">
              <Plus className="h-4 w-4" /> Add Reaction
            </Link>
          </Button>
        }
      />

      <DataTable
        data={reactions}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search reaction name, molecules or conditions..."
        searchFilter={(item, q) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.conditions.toLowerCase().includes(q)
        }
        filters={
          <>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 w-36 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="inorganic">Inorganic</SelectItem>
                <SelectItem value="organic">Organic</SelectItem>
              </SelectContent>
            </Select>

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
          </>
        }
        emptyTitle="No reactions found"
        emptyDescription="Create your first reaction to link molecules together with stoichiometric balancing."
        emptyAction={
          <Button asChild size="sm">
            <Link href="/admin/reactions/new">
              <Plus className="h-4 w-4 mr-1" /> Add Reaction
            </Link>
          </Button>
        }
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`Delete "${reactionToDelete?.name}"?`}
        description="Are you sure you want to permanently remove this chemical reaction?"
        confirmLabel="Delete Reaction"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        isLoading={remove.isPending}
      />
    </div>
  );
}
