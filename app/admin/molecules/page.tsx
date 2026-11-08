'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Atom } from 'lucide-react';
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
import { useMolecules, useMoleculeMutations, useAdminMe } from '@/lib/admin/hooks';
import type { Molecule, ContentStatus } from '@/lib/admin/types';

export default function AdminMoleculesPage() {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [moleculeToDelete, setMoleculeToDelete] = useState<Molecule | null>(null);

  const { data, isLoading, error, refetch } = useMolecules({
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    status: statusFilter !== 'all' ? (statusFilter as ContentStatus) : undefined,
  });

  const { data: me } = useAdminMe();
  const isAdmin = me?.role === 'admin';
  const { setStatus, remove } = useMoleculeMutations();

  const molecules = data?.data || [];

  const handleToggleStatus = (m: Molecule) => {
    const next: ContentStatus = m.status === 'published' ? 'draft' : 'published';
    setStatus.mutate({ id: m.id, status: next });
  };

  const handleDeleteClick = (m: Molecule) => {
    setMoleculeToDelete(m);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!moleculeToDelete) return;
    await remove.mutateAsync(moleculeToDelete.id);
    setDeleteConfirmOpen(false);
    setMoleculeToDelete(null);
  };

  const columns: Column<Molecule>[] = [
    {
      header: 'Molecule',
      accessorKey: 'name',
      sortable: true,
      cell: (m) => (
        <div>
          <Link
            href={`/admin/molecules/${m.id}`}
            className="font-serif font-bold text-sm text-foreground hover:text-primary transition-colors hover:underline"
          >
            {m.name}
          </Link>
          <p className="text-xs font-mono font-bold text-primary mt-0.5">
            {formatFormulaUnicode(m.formula)}
          </p>
        </div>
      ),
    },
    {
      header: 'Category',
      accessorKey: 'category',
      sortable: true,
      cell: (m) => (
        <span className="capitalize font-medium text-xs bg-muted px-2 py-0.5 rounded text-foreground">
          {m.category}
        </span>
      ),
    },
    {
      header: 'Atoms',
      accessorKey: 'atomCount',
      sortable: true,
      cell: (m) => <span className="font-mono text-xs">{m.atomCount}</span>,
    },
    {
      header: 'Bonds',
      accessorKey: 'bondCount',
      sortable: true,
      cell: (m) => <span className="font-mono text-xs">{m.bondCount}</span>,
    },
    {
      header: 'Origin',
      accessorKey: 'origin',
      sortable: true,
      cell: (m) => (
        <span className="text-[11px] font-mono text-muted-foreground uppercase">
          {m.origin}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (m) => <StatusBadge status={m.status} />,
    },
    {
      header: 'Actions',
      cell: (m) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Link href={`/admin/molecules/${m.id}`} aria-label="Edit molecule">
              <Edit2 className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleToggleStatus(m)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title={m.status === 'published' ? 'Unpublish (draft)' : 'Publish molecule'}
          >
            {m.status === 'published' ? (
              <XCircle className="h-4 w-4 text-amber-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            )}
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteClick(m)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              aria-label="Delete molecule"
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
        title="3D Molecular Catalog"
        description="Inspect and curate 3D molecular structures, atom cartesian coordinates, bond multiplicity, and PubChem integrations."
        actions={
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/admin/molecules/new">
              <Plus className="h-4 w-4" /> Add Molecule
            </Link>
          </Button>
        }
      />

      <DataTable
        data={molecules}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search molecule name, formula or category..."
        searchFilter={(item, q) =>
          item.name.toLowerCase().includes(q) ||
          item.formula.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        }
        filters={
          <>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 w-36 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="inorganic">Inorganic</SelectItem>
                <SelectItem value="organic">Organic</SelectItem>
                <SelectItem value="biomolecules">Biomolecules</SelectItem>
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
        emptyTitle="No molecules found"
        emptyDescription="Add molecules with 3D coordinate meshes or import them directly using PubChem."
        emptyAction={
          <Button asChild size="sm">
            <Link href="/admin/molecules/new">
              <Plus className="h-4 w-4 mr-1" /> Add Molecule
            </Link>
          </Button>
        }
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`Delete "${moleculeToDelete?.name}"?`}
        description="Deleting a molecule will permanently remove it from the 3D visualizer database. If this molecule is currently referenced in chemical reactions, the server will block deletion."
        confirmLabel="Delete Molecule"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        isLoading={remove.isPending}
      />
    </div>
  );
}
