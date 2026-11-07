'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { Atom, Bond } from '@/lib/admin/types';
import type { JSONMolecule } from '@/components/json-molecule-renderer';

// Dynamically import the existing JSONMoleculeRenderer with SSR disabled
const DynamicMoleculeRenderer = dynamic(
  () =>
    import('@/components/json-molecule-renderer').then((mod) => mod.JSONMoleculeRenderer),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-80 rounded-xl border border-border bg-card p-4 space-y-3">
        <Skeleton className="h-12 w-full max-w-sm" />
        <Skeleton className="h-48 w-full max-w-sm" />
      </div>
    ),
  }
);

export interface MoleculeViewer3DProps {
  name: string;
  formula: string;
  atoms: Atom[];
  bonds: Bond[];
  description?: string;
  category?: string;
  height?: number;
  autoRotate?: boolean;
}

export function MoleculeViewer3D({
  name,
  formula,
  atoms,
  bonds,
  description,
  category = 'basic',
  height = 360,
  autoRotate = false,
}: MoleculeViewer3DProps) {
  if (!atoms || atoms.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
        No atomic coordinates available to render 3D model.
      </div>
    );
  }

  // Convert atoms and bonds from admin format to JSONMolecule format
  const jsonMolecule: JSONMolecule = {
    molecule: name || 'Molecule Preview',
    formula: formula || '',
    description: description || '',
    category,
    atoms: atoms.map((atom) => ({
      element: atom.element || 'C',
      position: [Number(atom.x) || 0, Number(atom.y) || 0, Number(atom.z) || 0],
    })),
    bonds: bonds.map((bond) => ({
      from: Number(bond.source) || 0,
      to: Number(bond.target) || 0,
      type: bond.order === 3 ? 'triple' : bond.order === 2 ? 'double' : 'single',
    })),
  };

  return (
    <div className="w-full">
      <DynamicMoleculeRenderer
        molecule={jsonMolecule}
        height={height}
        showControls={true}
        autoRotate={autoRotate}
      />
    </div>
  );
}
