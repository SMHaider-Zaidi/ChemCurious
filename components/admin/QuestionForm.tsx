'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Save,
  ArrowLeft,
  ImagePlus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChemRichEditor } from './ChemRichEditor';
import { ChemSymbolsPanel } from './ChemSymbolsPanel';
import { QuestionPreview } from './QuestionPreview';
import { questionInputSchema, type QuestionFormValues } from '@/lib/admin/schemas/question';
import { useChapters, useQuestionMutations } from '@/lib/admin/hooks';
import { uploadsApi } from '@/lib/admin/api/uploads';
import type { Question, QuestionInput, ClassLevel, OptionKey, Difficulty, ContentStatus } from '@/lib/admin/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface QuestionFormProps {
  initial?: Question;
  defaultChapterId?: number;
}

export function QuestionForm({ initial, defaultChapterId }: QuestionFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initial);

  const { data: chaptersData } = useChapters();
  const chapters = chaptersData?.data || [];

  const { create, update } = useQuestionMutations();

  // Find initial class level from default or initial question
  const initialChapter = chapters.find(
    (c) => c.id === (initial?.chapterId ?? defaultChapterId)
  );
  const [selectedClass, setSelectedClass] = useState<ClassLevel>(
    initial?.classLevel ?? initialChapter?.classLevel ?? 9
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuestionFormValues>({
    resolver: zodResolver(questionInputSchema),
    defaultValues: initial
      ? {
          chapterId: initial.chapterId,
          text: initial.text,
          options: initial.options,
          correct: initial.correct,
          explanation: initial.explanation,
          difficulty: initial.difficulty,
          topic: initial.topic,
          marks: initial.marks,
          status: initial.status,
          questionImageUrl: initial.questionImageUrl,
        }
      : {
          chapterId: defaultChapterId ?? 0,
          text: '',
          options: { A: '', B: '', C: '', D: '' },
          correct: 'A',
          explanation: '',
          difficulty: 'easy',
          topic: '',
          marks: 1,
          status: 'draft',
          questionImageUrl: null,
        },
  });

  const formValues = watch();

  // Filter chapters by selected class
  const availableChapters = useMemo(() => {
    return chapters.filter((c) => c.classLevel === selectedClass);
  }, [chapters, selectedClass]);

  // If chapterId not in current class chapters, auto-select first
  useEffect(() => {
    if (availableChapters.length > 0 && !isEditing) {
      const match = availableChapters.find((c) => c.id === formValues.chapterId);
      if (!match) {
        setValue('chapterId', availableChapters[0]!.id);
      }
    }
  }, [availableChapters, formValues.chapterId, isEditing, setValue]);

  const handleImageUpload = async (file: File) => {
    try {
      const res = await uploadsApi.upload(file);
      setValue('questionImageUrl', res.url);
      toast.success('Diagram attached to question');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Image upload failed');
    }
  };

  const onSubmit = async (values: QuestionFormValues, asDraft = false) => {
    const payload: QuestionInput = {
      chapterId: values.chapterId,
      text: values.text,
      options: values.options,
      correct: values.correct as OptionKey,
      explanation: values.explanation || '',
      difficulty: values.difficulty as Difficulty,
      topic: values.topic || '',
      marks: values.marks,
      status: asDraft ? 'draft' : (values.status as ContentStatus),
      questionImageUrl: values.questionImageUrl || null,
    };

    if (isEditing && initial) {
      await update.mutateAsync({ id: initial.id, input: payload });
    } else {
      await create.mutateAsync(payload);
    }
    router.push(`/admin/quizzes/chapters/${payload.chapterId}`);
  };

  const isPending = create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit((vals) => onSubmit(vals, false))} className="space-y-6">
      {/* Top action buttons bar */}
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
            {isPending ? 'Saving...' : isEditing ? 'Update Question' : 'Publish Question'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Metadata Selector Card: Class, Chapter, Topic, Difficulty, Marks */}
          <Card className="shadow-xs border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base">Curriculum Context & Metadata</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Class Selection */}
              <div className="space-y-1.5">
                <Label htmlFor="classSelect">Grade Level</Label>
                <Select
                  value={String(selectedClass)}
                  onValueChange={(val) => setSelectedClass(Number(val) as ClassLevel)}
                >
                  <SelectTrigger id="classSelect">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9">Class 9</SelectItem>
                    <SelectItem value="10">Class 10</SelectItem>
                    <SelectItem value="11">Class 11</SelectItem>
                    <SelectItem value="12">Class 12</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dependent Chapter Selection */}
              <div className="space-y-1.5">
                <Label htmlFor="chapterId">Chapter</Label>
                <Controller
                  name="chapterId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <SelectTrigger id="chapterId">
                        <SelectValue placeholder="Select chapter" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableChapters.map((ch) => (
                          <SelectItem key={ch.id} value={String(ch.id)}>
                            {ch.order}. {ch.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.chapterId && (
                  <p className="text-xs text-destructive">{errors.chapterId.message}</p>
                )}
              </div>

              {/* Topic */}
              <div className="space-y-1.5">
                <Label htmlFor="topic">Topic / Sub-Concept</Label>
                <Input
                  id="topic"
                  placeholder="e.g. Redox titration, Gibbs energy..."
                  {...register('topic')}
                />
                {errors.topic && (
                  <p className="text-xs text-destructive">{errors.topic.message}</p>
                )}
              </div>

              {/* Difficulty & Marks */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Controller
                    name="difficulty"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="difficulty">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="marks">Marks</Label>
                  <Input
                    id="marks"
                    type="number"
                    min={1}
                    max={20}
                    {...register('marks')}
                  />
                  {errors.marks && (
                    <p className="text-xs text-destructive">{errors.marks.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chemistry Symbols Panel (Default open for Question editing) */}
          <ChemSymbolsPanel defaultOpen={true} />

          {/* Question Text Editor Card */}
          <Card className="shadow-xs border-border">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="font-serif text-base">Question Statement</CardTitle>
              <span className="text-[11px] text-muted-foreground">HTML sanitized on save</span>
            </CardHeader>
            <CardContent className="space-y-3">
              <Controller
                name="text"
                control={control}
                render={({ field }) => (
                  <ChemRichEditor
                    value={field.value}
                    onChange={(html) => field.onChange(html)}
                    placeholder="Type the question statement with chemistry symbols, subscripts, and formulas..."
                    minHeight={140}
                  />
                )}
              />
              {errors.text && (
                <p className="text-xs text-destructive">{errors.text.message}</p>
              )}

              {/* Optional Diagram Attachment */}
              <div className="pt-2">
                {formValues.questionImageUrl ? (
                  <div className="flex items-center justify-between rounded-lg border border-border p-2 bg-muted/20">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={formValues.questionImageUrl}
                        alt="Attached Diagram"
                        className="h-10 w-10 rounded object-cover"
                      />
                      <span className="text-xs text-muted-foreground truncate">
                        Diagram image attached
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setValue('questionImageUrl', null)}
                      className="text-destructive h-8 px-2 text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                    </Button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors p-1">
                    <ImagePlus className="h-4 w-4 text-primary" />
                    <span>Attach question diagram/figure (optional)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Options A-D Card with Radio for Correct Selection */}
          <Card className="shadow-xs border-border">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="font-serif text-base">Answer Options (A – D)</CardTitle>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Pick the radio button of the correct answer
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                name="correct"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={(val) => field.onChange(val as OptionKey)}
                    className="space-y-4"
                  >
                    {(['A', 'B', 'C', 'D'] as OptionKey[]).map((key) => {
                      const isCorrect = field.value === key;
                      const fieldError = errors.options?.[key];

                      return (
                        <div
                          key={key}
                          className={cn(
                            'rounded-xl border p-3 transition-colors',
                            isCorrect
                              ? 'border-emerald-500 bg-emerald-500/5'
                              : 'border-border bg-card'
                          )}
                        >
                          <div className="flex items-center justify-between pb-2 mb-1 border-b border-border/50">
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value={key} id={`correct-${key}`} />
                              <Label
                                htmlFor={`correct-${key}`}
                                className="font-bold text-xs cursor-pointer"
                              >
                                Option {key}
                              </Label>
                            </div>
                            {isCorrect && (
                              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                Correct Answer
                              </span>
                            )}
                          </div>

                          <Controller
                            name={`options.${key}`}
                            control={control}
                            render={({ field: optField }) => (
                              <ChemRichEditor
                                value={optField.value}
                                onChange={(html) => optField.onChange(html)}
                                placeholder={`Enter text for Option ${key}...`}
                                compact={true}
                                minHeight={70}
                              />
                            )}
                          />
                          {fieldError && (
                            <p className="text-xs text-destructive mt-1">
                              {fieldError.message}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </RadioGroup>
                )}
              />
              {errors.correct && (
                <p className="text-xs text-destructive">{errors.correct.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Explanation Card */}
          <Card className="shadow-xs border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base">Answer Explanation (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="explanation"
                control={control}
                render={({ field }) => (
                  <ChemRichEditor
                    value={field.value}
                    onChange={(html) => field.onChange(html)}
                    placeholder="Provide a step-by-step scientific rationale to explain why this answer is correct..."
                    minHeight={100}
                    compact={true}
                  />
                )}
              />
              {errors.explanation && (
                <p className="text-xs text-destructive mt-1">
                  {errors.explanation.message}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Student-Style Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-bold text-foreground">Live Card Preview</h3>
            <span className="text-xs text-muted-foreground">Synchronized in real-time</span>
          </div>

          <QuestionPreview
            text={formValues.text}
            options={formValues.options}
            correct={formValues.correct}
            explanation={formValues.explanation}
            difficulty={formValues.difficulty}
            topic={formValues.topic}
            marks={formValues.marks}
            questionImageUrl={formValues.questionImageUrl}
          />
        </div>
      </div>
    </form>
  );
}
