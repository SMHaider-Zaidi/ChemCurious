'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Save,
  ArrowLeft,
  Download,
  Loader2,
  Atom as AtomIcon,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AtomBondGrid } from './AtomBondGrid';
import { MoleculeViewer3D } from './MoleculeViewer3D';
import { moleculeInputSchema, type MoleculeFormValues } from '@/lib/admin/schemas/molecule';
import { useMoleculeMutations } from '@/lib/admin/hooks';
import { moleculesApi } from '@/lib/admin/api/molecules';
import type { Molecule, MoleculeInput, Atom, Bond, ContentStatus } from '@/lib/admin/types';
import { toast } from 'sonner';

export interface MoleculeFormProps {
  initial?: Molecule;
}

export function MoleculeForm({ initial }: MoleculeFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initial);

  const [pubchemQuery, setPubchemQuery] = useState('');
  const [pubchemLoading, setPubchemLoading] = useState(false);
  const [pubchemError, setPubchemError] = useState<string | null>(null);

  const { create, update } = useMoleculeMutations();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MoleculeFormValues>({
    resolver: zodResolver(moleculeInputSchema),
    defaultValues: initial
      ? {
          name: initial.name,
          formula: initial.formula,
          category: initial.category,
          description: initial.description || '',
          atoms: initial.atoms,
          bonds: initial.bonds,
          status: initial.status,
        }
      : {
          name: '',
          formula: '',
          category: 'basic',
          description: '',
          atoms: [
            { element: 'O', x: 0, y: 0, z: 0 },
            { element: 'H', x: 0.76, y: 0.59, z: 0 },
            { element: 'H', x: -0.76, y: 0.59, z: 0 },
          ],
          bonds: [
            { source: 0, target: 1, order: 1 },
            { source: 0, target: 2, order: 1 },
          ],
          status: 'draft',
        },
  });

  const formValues = watch();

  const handlePubChemImport = async () => {
    if (!pubchemQuery.trim()) return;
    setPubchemLoading(true);
    setPubchemError(null);

    try {
      const res = await moleculesApi.fetchPubChem(pubchemQuery.trim());
      setValue('name', res.name);
      setValue('formula', res.formula);
      if (res.description) setValue('description', res.description);
      setValue('atoms', res.atoms);
      setValue('bonds', res.bonds);
      toast.success(`Successfully imported 3D coordinates for ${res.name} from PubChem`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'PubChem fetch failed';
      setPubchemError(msg);
      toast.error(msg);
    } finally {
      setPubchemLoading(false);
    }
  };

  const onSubmit = async (values: MoleculeFormValues, asDraft = false) => {
    const payload: MoleculeInput = {
      name: values.name,
      formula: values.formula,
      category: values.category,
      description: values.description || '',
      atoms: values.atoms,
      bonds: values.bonds,
      status: asDraft ? 'draft' : (values.status as ContentStatus),
    };

    if (isEditing && initial) {
      await update.mutateAsync({ id: initial.id, input: payload });
    } else {
      await create.mutateAsync(payload);
    }
    router.push('/admin/molecules');
  };

  const isPending = create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit((vals) => onSubmit(vals, false))} className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1.5 -ml-2 text-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleSubmit((vals) => onSubmit(vals, true))}
          >
            Save as Draft
          </Button>
          <Button type="submit" size="sm" disabled={isPending} className="gap-1.5">
            <Save className="h-4 w-4" />
            {isPending ? 'Saving...' : isEditing ? 'Update Molecule' : 'Save Molecule'}
          </Button>
        </div>
      </div>

      {/* PubChem Auto-Fetch Box */}
      <Card className="border-border shadow-xs bg-muted/20">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Import from PubChem Chemical Database
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Enter compound name or PubChem CID (e.g. ethanol, 702, benzene)..."
              value={pubchemQuery}
              onChange={(e) => setPubchemQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handlePubChemImport();
                }
              }}
              className="text-xs h-9 bg-background"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={pubchemLoading || !pubchemQuery.trim()}
              onClick={handlePubChemImport}
              className="gap-1.5 shrink-0"
            >
              {pubchemLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Fetching...
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" /> Fetch 3D Structure
                </>
              )}
            </Button>
          </div>
          {pubchemError && (
            <p className="text-xs text-destructive mt-1">{pubchemError}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Details and Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="shadow-xs border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base">Molecule Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="molName">Molecule Name</Label>
                  <Input
                    id="molName"
                    placeholder="e.g. Sodium Chloride"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="molFormula">Chemical Formula</Label>
                  <Input
                    id="molFormula"
                    placeholder="e.g. NaCl or H2SO4"
                    className="font-mono font-bold"
                    {...register('formula')}
                  />
                  {errors.formula && (
                    <p className="text-xs text-destructive">{errors.formula.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="molCategory">Category</Label>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="molCategory">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="inorganic">Inorganic</SelectItem>
                          <SelectItem value="organic">Organic</SelectItem>
                          <SelectItem value="biomolecules">Biomolecules</SelectItem>
                          <SelectItem value="coordination">Coordination Complexes</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="molStatus">Content Status</Label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="molStatus">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="molDescription">Educational Description</Label>
                <Textarea
                  id="molDescription"
                  rows={3}
                  placeholder="Describe molecular geometry, hybridization, polarity, and real-world significance..."
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-xs text-destructive">{errors.description.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Structured Coordinates Grid */}
          <Card className="shadow-xs border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base">
                Ball & Stick 3D Geometric Mesh Definition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="atoms"
                control={control}
                render={({ field: atomField }) => (
                  <Controller
                    name="bonds"
                    control={control}
                    render={({ field: bondField }) => (
                      <AtomBondGrid
                        atoms={atomField.value}
                        bonds={bondField.value}
                        onAtomsChange={(newAtoms) => atomField.onChange(newAtoms)}
                        onBondsChange={(newBonds) => bondField.onChange(newBonds)}
                      />
                    )}
                  />
                )}
              />
              {errors.atoms && (
                <p className="text-xs text-destructive mt-2">{errors.atoms.message}</p>
              )}
              {errors.bonds && (
                <p className="text-xs text-destructive mt-2">{errors.bonds.message}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Interactive 3D Ball & Stick Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-bold text-foreground flex items-center gap-2">
              <AtomIcon className="h-4 w-4 text-primary" /> Interactive 3D Visualizer
            </h3>
            <span className="text-xs text-muted-foreground">Drag to rotate · Scroll to zoom</span>
          </div>

          <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
            <MoleculeViewer3D
              name={formValues.name}
              formula={formValues.formula}
              category={formValues.category}
              description={formValues.description}
              atoms={formValues.atoms}
              bonds={formValues.bonds}
              height={380}
              autoRotate={false}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
