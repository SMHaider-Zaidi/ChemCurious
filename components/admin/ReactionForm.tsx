'use client';

import { useRouter } from 'next/navigation';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
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
import { EquationPreview } from './EquationPreview';
import { reactionInputSchema, type ReactionFormValues } from '@/lib/admin/schemas/reaction';
import { useMolecules, useReactionMutations } from '@/lib/admin/hooks';
import type { Reaction, ReactionInput, ContentStatus } from '@/lib/admin/types';

export interface ReactionFormProps {
  initial?: Reaction;
}

export function ReactionForm({ initial }: ReactionFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initial);

  const { data: moleculesData } = useMolecules({ pageSize: 100 });
  const molecules = moleculesData?.data || [];

  const { create, update } = useReactionMutations();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ReactionFormValues>({
    resolver: zodResolver(reactionInputSchema),
    defaultValues: initial
      ? {
          name: initial.name,
          category: initial.category,
          description: initial.description || '',
          conditions: initial.conditions || '',
          reactants: initial.reactants.map((r) => ({
            moleculeId: r.moleculeId,
            coefficient: r.coefficient,
          })),
          products: initial.products.map((p) => ({
            moleculeId: p.moleculeId,
            coefficient: p.coefficient,
          })),
          status: initial.status,
        }
      : {
          name: '',
          category: 'inorganic',
          description: '',
          conditions: '',
          reactants: [{ moleculeId: 0, coefficient: 1 }],
          products: [{ moleculeId: 0, coefficient: 1 }],
          status: 'draft',
        },
  });

  const reactantsArray = useFieldArray({ control, name: 'reactants' });
  const productsArray = useFieldArray({ control, name: 'products' });

  const watchedReactants = watch('reactants') || [];
  const watchedProducts = watch('products') || [];

  // Prepare live equation items
  const formulaFor = (id: number) => {
    const mol = molecules.find((m) => m.id === Number(id));
    return mol?.formula || '?';
  };

  const previewReactants = watchedReactants.map((r) => ({
    formula: formulaFor(r.moleculeId),
    coefficient: Number(r.coefficient) || 1,
  }));

  const previewProducts = watchedProducts.map((p) => ({
    formula: formulaFor(p.moleculeId),
    coefficient: Number(p.coefficient) || 1,
  }));

  const onSubmit = async (values: ReactionFormValues, asDraft = false) => {
    const payload: ReactionInput = {
      name: values.name,
      category: values.category as 'organic' | 'inorganic',
      description: values.description || '',
      conditions: values.conditions || '',
      reactants: values.reactants.map((r) => ({
        moleculeId: Number(r.moleculeId),
        coefficient: Number(r.coefficient),
      })),
      products: values.products.map((p) => ({
        moleculeId: Number(p.moleculeId),
        coefficient: Number(p.coefficient),
      })),
      status: asDraft ? 'draft' : (isEditing ? (values.status as ContentStatus || 'published') : 'published'),
    };

    if (isEditing && initial) {
      await update.mutateAsync({ id: initial.id, input: payload });
    } else {
      await create.mutateAsync(payload);
    }
    router.push('/admin/reactions');
  };

  const isPending = create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit((vals) => onSubmit(vals, false))} className="space-y-6">
      {/* Action Header */}
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
            {isPending ? 'Saving...' : isEditing ? 'Update Reaction' : 'Publish Reaction'}
          </Button>
        </div>
      </div>

      {/* Live Formatted Chemical Equation Preview */}
      <EquationPreview reactants={previewReactants} products={previewProducts} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Reactants Dynamic Rows */}
        <Card className="shadow-xs border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="font-serif text-base">Reactants (Left Side)</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => reactantsArray.append({ moleculeId: 0, coefficient: 1 })}
              className="h-8 gap-1 text-xs"
            >
              <Plus className="h-3.5 w-3.5" /> Add Reactant
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {reactantsArray.fields.map((field, idx) => {
              const rowError = errors.reactants?.[idx];
              return (
                <div key={field.id} className="flex items-start gap-2">
                  <div className="w-20 shrink-0">
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      placeholder="Coef"
                      {...register(`reactants.${idx}.coefficient`)}
                      className="h-8 text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Controller
                      name={`reactants.${idx}.moleculeId`}
                      control={control}
                      render={({ field: mField }) => (
                        <Select
                          value={mField.value ? String(mField.value) : ''}
                          onValueChange={(val) => mField.onChange(Number(val))}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select reactant molecule" />
                          </SelectTrigger>
                          <SelectContent>
                            {molecules.map((m) => (
                              <SelectItem key={m.id} value={String(m.id)}>
                                {m.name} ({m.formula})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {rowError?.moleculeId && (
                      <p className="text-[11px] text-destructive mt-1">
                        {rowError.moleculeId.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={reactantsArray.fields.length <= 1}
                    onClick={() => reactantsArray.remove(idx)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    aria-label={`Remove reactant ${idx + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
            {errors.reactants?.root && (
              <p className="text-xs text-destructive">{errors.reactants.root.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Products Dynamic Rows */}
        <Card className="shadow-xs border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="font-serif text-base">Products (Right Side)</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => productsArray.append({ moleculeId: 0, coefficient: 1 })}
              className="h-8 gap-1 text-xs"
            >
              <Plus className="h-3.5 w-3.5" /> Add Product
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {productsArray.fields.map((field, idx) => {
              const rowError = errors.products?.[idx];
              return (
                <div key={field.id} className="flex items-start gap-2">
                  <div className="w-20 shrink-0">
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      placeholder="Coef"
                      {...register(`products.${idx}.coefficient`)}
                      className="h-8 text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Controller
                      name={`products.${idx}.moleculeId`}
                      control={control}
                      render={({ field: mField }) => (
                        <Select
                          value={mField.value ? String(mField.value) : ''}
                          onValueChange={(val) => mField.onChange(Number(val))}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select product molecule" />
                          </SelectTrigger>
                          <SelectContent>
                            {molecules.map((m) => (
                              <SelectItem key={m.id} value={String(m.id)}>
                                {m.name} ({m.formula})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {rowError?.moleculeId && (
                      <p className="text-[11px] text-destructive mt-1">
                        {rowError.moleculeId.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={productsArray.fields.length <= 1}
                    onClick={() => productsArray.remove(idx)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    aria-label={`Remove product ${idx + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
            {errors.products?.root && (
              <p className="text-xs text-destructive">{errors.products.root.message}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reaction Metadata Card */}
      <Card className="shadow-xs border-border">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-base">Reaction Metadata & Context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="reactionName">Reaction Name</Label>
              <Input
                id="reactionName"
                placeholder="e.g. Haber Process (Ammonia Synthesis)"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inorganic">Inorganic Chemistry</SelectItem>
                      <SelectItem value="organic">Organic Chemistry</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="conditions">Reaction Conditions</Label>
            <Input
              id="conditions"
              placeholder="e.g. 450 °C, 200 atm, Finely divided Fe catalyst"
              {...register('conditions')}
            />
            {errors.conditions && (
              <p className="text-xs text-destructive">{errors.conditions.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Educational Description</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Explain the mechanism, thermodynamics, and industrial or biological importance..."
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* 3D Visualization Note */}
          <div className="rounded-lg border border-border bg-muted/20 p-3.5 text-xs text-muted-foreground flex items-center justify-between">
            <span>
              <strong>3D Reaction Simulator:</strong> Complex dynamic multi-molecule trajectory simulations are rendered on the student portal simulator (3Dmol engine).
            </span>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
