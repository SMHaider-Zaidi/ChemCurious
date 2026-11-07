'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ErrorStateProps {
  error?: unknown;
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  error,
  title = 'Unable to load data',
  message: customMessage,
  onRetry,
  className,
}: ErrorStateProps) {
  const displayMessage =
    customMessage ||
    (error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : 'An unexpected system error occurred while loading this data.');

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center my-4',
        className
      )}
    >
      <div className="mb-3 rounded-full bg-destructive/10 p-3 text-destructive">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="font-serif text-lg font-semibold text-foreground">
        {title}
      </h3>
      <p className="mt-1.5 max-w-md text-sm text-muted-foreground">{displayMessage}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={onRetry}>
          <RotateCcw className="h-3.5 w-3.5" />
          Retry request
        </Button>
      )}
    </div>
  );
}
