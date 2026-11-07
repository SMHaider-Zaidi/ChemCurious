'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ELEMENTS, isElement } from '@/lib/admin/schemas/molecule';
import type { Atom, Bond } from '@/lib/admin/types';

export interface AtomBondGridProps {
  atoms: Atom[];
  bonds: Bond[];
  onAtomsChange: (atoms: Atom[]) => void;
  onBondsChange: (bonds: Bond[]) => void;
  readOnly?: boolean;
}

export function AtomBondGrid({
  atoms,
  bonds,
  onAtomsChange,
  onBondsChange,
  readOnly = false,
}: AtomBondGridProps) {
  // Atom operations
  const handleAddAtom = () => {
    onAtomsChange([...atoms, { element: 'C', x: 0, y: 0, z: 0 }]);
  };

  const handleUpdateAtom = (index: number, patch: Partial<Atom>) => {
    const updated = atoms.map((atom, i) => (i === index ? { ...atom, ...patch } : atom));
    onAtomsChange(updated);
  };

  const handleRemoveAtom = (index: number) => {
    // Remove the atom
    const nextAtoms = atoms.filter((_, i) => i !== index);

    // Adjust bonds referencing indices >= index or remove bonds referencing this atom
    const nextBonds = bonds
      .filter((b) => b.source !== index && b.target !== index)
      .map((b) => ({
        ...b,
        source: b.source > index ? b.source - 1 : b.source,
        target: b.target > index ? b.target - 1 : b.target,
      }));

    onAtomsChange(nextAtoms);
    onBondsChange(nextBonds);
  };

  // Bond operations
  const handleAddBond = () => {
    if (atoms.length < 2) return;
    onBondsChange([...bonds, { source: 0, target: 1, order: 1 }]);
  };

  const handleUpdateBond = (index: number, patch: Partial<Bond>) => {
    const updated = bonds.map((bond, i) => (i === index ? { ...bond, ...patch } : bond));
    onBondsChange(updated);
  };

  const handleRemoveBond = (index: number) => {
    onBondsChange(bonds.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Atoms Table */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-foreground">
              Atoms Coordinate Grid ({atoms.length})
            </h4>
            <p className="text-xs text-muted-foreground">
              Cartesian coordinates in Angstroms (Å)
            </p>
          </div>
          {!readOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddAtom}
              className="h-8 gap-1 text-xs"
            >
              <Plus className="h-3.5 w-3.5" /> Add Atom
            </Button>
          )}
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-12 text-xs">#</TableHead>
                <TableHead className="w-28 text-xs">Element</TableHead>
                <TableHead className="text-xs">X (Å)</TableHead>
                <TableHead className="text-xs">Y (Å)</TableHead>
                <TableHead className="text-xs">Z (Å)</TableHead>
                {!readOnly && <TableHead className="w-12 text-xs"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {atoms.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={readOnly ? 5 : 6}
                    className="text-center py-4 text-xs text-muted-foreground"
                  >
                    No atoms defined yet. Click "Add Atom" to create your molecule.
                  </TableCell>
                </TableRow>
              ) : (
                atoms.map((atom, idx) => {
                  const elementValid = isElement(atom.element);
                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {idx}
                      </TableCell>
                      <TableCell>
                        <Input
                          value={atom.element}
                          disabled={readOnly}
                          onChange={(e) =>
                            handleUpdateAtom(idx, { element: e.target.value.trim() })
                          }
                          className={`h-7 w-20 font-bold uppercase text-xs ${
                            !elementValid ? 'border-destructive text-destructive' : ''
                          }`}
                          maxLength={3}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          disabled={readOnly}
                          value={isNaN(atom.x) ? '' : atom.x}
                          onChange={(e) =>
                            handleUpdateAtom(idx, { x: parseFloat(e.target.value) || 0 })
                          }
                          className="h-7 w-24 font-mono text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          disabled={readOnly}
                          value={isNaN(atom.y) ? '' : atom.y}
                          onChange={(e) =>
                            handleUpdateAtom(idx, { y: parseFloat(e.target.value) || 0 })
                          }
                          className="h-7 w-24 font-mono text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          disabled={readOnly}
                          value={isNaN(atom.z) ? '' : atom.z}
                          onChange={(e) =>
                            handleUpdateAtom(idx, { z: parseFloat(e.target.value) || 0 })
                          }
                          className="h-7 w-24 font-mono text-xs"
                        />
                      </TableCell>
                      {!readOnly && (
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveAtom(idx)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            aria-label={`Remove atom ${idx}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Bonds Table */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-foreground">
              Chemical Bonds ({bonds.length})
            </h4>
            <p className="text-xs text-muted-foreground">
              Pairs of 0-based atom indices and bond multiplicity
            </p>
          </div>
          {!readOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={atoms.length < 2}
              onClick={handleAddBond}
              className="h-8 gap-1 text-xs"
            >
              <Plus className="h-3.5 w-3.5" /> Add Bond
            </Button>
          )}
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-12 text-xs">#</TableHead>
                <TableHead className="text-xs">Atom A (Source)</TableHead>
                <TableHead className="text-xs">Atom B (Target)</TableHead>
                <TableHead className="w-32 text-xs">Bond Order</TableHead>
                {!readOnly && <TableHead className="w-12 text-xs"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {bonds.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={readOnly ? 4 : 5}
                    className="text-center py-4 text-xs text-muted-foreground"
                  >
                    No bonds defined.
                  </TableCell>
                </TableRow>
              ) : (
                bonds.map((bond, idx) => {
                  const sourceValid = bond.source >= 0 && bond.source < atoms.length;
                  const targetValid = bond.target >= 0 && bond.target < atoms.length;
                  const notSelf = bond.source !== bond.target;

                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={String(bond.source)}
                          disabled={readOnly}
                          onValueChange={(val) =>
                            handleUpdateBond(idx, { source: Number(val) })
                          }
                        >
                          <SelectTrigger
                            className={`h-7 w-36 text-xs ${
                              !sourceValid ? 'border-destructive text-destructive' : ''
                            }`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {atoms.map((a, aIdx) => (
                              <SelectItem key={aIdx} value={String(aIdx)}>
                                [{aIdx}] {a.element}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={String(bond.target)}
                          disabled={readOnly}
                          onValueChange={(val) =>
                            handleUpdateBond(idx, { target: Number(val) })
                          }
                        >
                          <SelectTrigger
                            className={`h-7 w-36 text-xs ${
                              !targetValid || !notSelf
                                ? 'border-destructive text-destructive'
                                : ''
                            }`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {atoms.map((a, aIdx) => (
                              <SelectItem key={aIdx} value={String(aIdx)}>
                                [{aIdx}] {a.element}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={String(bond.order)}
                          disabled={readOnly}
                          onValueChange={(val) =>
                            handleUpdateBond(idx, {
                              order: Number(val) as 1 | 2 | 3,
                            })
                          }
                        >
                          <SelectTrigger className="h-7 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 (Single)</SelectItem>
                            <SelectItem value="2">2 (Double)</SelectItem>
                            <SelectItem value="3">3 (Triple)</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      {!readOnly && (
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveBond(idx)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            aria-label={`Remove bond ${idx + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
