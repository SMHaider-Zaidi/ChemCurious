'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { chapterInputSchema, type ChapterFormValues } from '@/lib/admin/schemas/chapter';
import { useChapterMutations } from '@/lib/admin/hooks';
import type { Chapter, ClassLevel, ContentStatus } from '@/lib/admin/types';

export interface ChapterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapter?: Chapter | null;
  defaultClassLevel?: ClassLevel;
}

export function ChapterDialog({
  open,
  onOpenChange,
  chapter,
  defaultClassLevel = 9,
}: ChapterDialogProps) {
  const { create, update } = useChapterMutations();
  const isEditing = Boolean(chapter);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ChapterFormValues>({
    resolver: zodResolver(chapterInputSchema),
    defaultValues: {
      classLevel: defaultClassLevel,
      title: '',
      status: 'draft',
    },
  });

  const selectedClass = watch('classLevel');
  const selectedStatus = watch('status');

  useEffect(() => {
    if (chapter) {
      reset({
        classLevel: chapter.classLevel,
        title: chapter.title,
        order: chapter.order,
        status: chapter.status,
      });
    } else {
      reset({
        classLevel: defaultClassLevel,
        title: '',
        status: 'draft',
      });
    }
  }, [chapter, defaultClassLevel, reset, open]);

  const onSubmit = async (values: ChapterFormValues) => {
    if (isEditing && chapter) {
      await update.mutateAsync({
        id: chapter.id,
        input: {
          classLevel: values.classLevel as ClassLevel,
          title: values.title,
          order: values.order,
          status: values.status as ContentStatus,
        },
      });
    } else {
      await create.mutateAsync({
        classLevel: values.classLevel as ClassLevel,
        title: values.title,
        order: values.order,
        status: values.status as ContentStatus,
      });
    }
    onOpenChange(false);
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {isEditing ? 'Edit Chapter' : 'Add New Chapter'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Class Level */}
            <div className="space-y-1.5">
              <Label htmlFor="classLevel">Class Level</Label>
              <Select
                value={String(selectedClass)}
                onValueChange={(val) => setValue('classLevel', Number(val) as ClassLevel)}
              >
                <SelectTrigger id="classLevel" className="w-full">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9">Class 9 (Matter & Basics)</SelectItem>
                  <SelectItem value="10">Class 10 (Reactions & Compounds)</SelectItem>
                  <SelectItem value="11">Class 11 (Atomic Structure & Bonding)</SelectItem>
                  <SelectItem value="12">Class 12 (Solutions & Kinetics)</SelectItem>
                </SelectContent>
              </Select>
              {errors.classLevel && (
                <p className="text-xs text-destructive">{errors.classLevel.message}</p>
              )}
            </div>

            {/* Chapter Title */}
            <div className="space-y-1.5">
              <Label htmlFor="chapterTitle">Chapter Title</Label>
              <Input
                id="chapterTitle"
                placeholder="e.g. Chemical Kinetics & Catalysis"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label htmlFor="status">Initial Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={(val) => setValue('status', val as ContentStatus)}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft (Hidden from students)</SelectItem>
                  <SelectItem value="published">Published (Visible to students)</SelectItem>
                  <SelectItem value="archived">Archived (Read-only)</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-xs text-destructive">{errors.status.message}</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending
                ? 'Saving...'
                : isEditing
                ? 'Update Chapter'
                : 'Create Chapter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
