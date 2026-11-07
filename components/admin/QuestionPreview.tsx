'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DifficultyBadge } from './StatusBadge';
import { SafeHtml } from './SafeHtml';
import { CheckCircle2, HelpCircle } from 'lucide-react';
import type { OptionKey, Difficulty } from '@/lib/admin/types';
import { cn } from '@/lib/utils';

export interface QuestionPreviewProps {
  text: string;
  options: Record<OptionKey, string>;
  correct?: OptionKey;
  explanation?: string;
  difficulty?: Difficulty;
  topic?: string;
  marks?: number;
  questionImageUrl?: string | null;
  className?: string;
}

export function QuestionPreview({
  text,
  options,
  correct = 'A',
  explanation,
  difficulty = 'easy',
  topic,
  marks = 1,
  questionImageUrl,
  className,
}: QuestionPreviewProps) {
  const optionKeys: OptionKey[] = ['A', 'B', 'C', 'D'];

  return (
    <Card className={cn('border-border shadow-sm rounded-xl overflow-hidden', className)}>
      <CardHeader className="p-5 pb-3 border-b border-border/50 bg-muted/20">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Student Quiz Preview
            </span>
            {topic && (
              <Badge variant="secondary" className="text-xs font-normal">
                {topic}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <DifficultyBadge difficulty={difficulty} />
            <span className="text-xs font-semibold text-muted-foreground">
              {marks} {marks === 1 ? 'Mark' : 'Marks'}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Question Text */}
        <div className="text-base sm:text-lg font-serif font-bold text-foreground">
          {text ? (
            <SafeHtml html={text} />
          ) : (
            <span className="text-muted-foreground italic font-sans font-normal text-sm">
              Question text will appear here...
            </span>
          )}
        </div>

        {/* Optional Question Image */}
        {questionImageUrl && (
          <div className="my-3 rounded-lg border border-border p-2 bg-muted/10 max-w-md">
            <img
              src={questionImageUrl}
              alt="Question Diagram"
              className="max-h-56 w-auto rounded object-contain mx-auto"
            />
          </div>
        )}

        {/* Options List */}
        <div className="space-y-2.5">
          {optionKeys.map((key) => {
            const isCorrect = correct === key;
            const optionContent = options[key] || '';

            return (
              <div
                key={key}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                  isCorrect
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 shadow-2xs'
                    : 'border-border bg-card text-foreground'
                )}
              >
                <div
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    isCorrect
                      ? 'bg-emerald-600 text-white'
                      : 'border border-border bg-muted/60 text-muted-foreground'
                  )}
                >
                  {key}
                </div>
                <div className="flex-1 min-w-0 text-sm pt-0.5">
                  {optionContent ? (
                    <SafeHtml html={optionContent} />
                  ) : (
                    <span className="text-muted-foreground/60 italic">Option {key}...</span>
                  )}
                </div>
                {isCorrect && (
                  <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                    <CheckCircle2 className="h-4 w-4" /> Correct Answer
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Explanation Section */}
        {explanation && (
          <div className="rounded-lg border border-border/80 bg-muted/40 p-3.5 space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <HelpCircle className="h-4 w-4 text-primary" />
              <span>Explanation:</span>
            </div>
            <SafeHtml html={explanation} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
