import { Badge } from '@/components/ui/badge';
import type { ContentStatus, Role, AccountStatus, Difficulty } from '@/lib/admin/types';
import { cn } from '@/lib/utils';

export function StatusBadge({
  status,
  className,
}: {
  status: ContentStatus | 'active' | 'suspended';
  className?: string;
}) {
  switch (status) {
    case 'published':
    case 'active':
      return (
        <Badge
          variant="outline"
          className={cn(
            'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400 capitalize',
            className
          )}
        >
          {status}
        </Badge>
      );
    case 'draft':
      return (
        <Badge
          variant="outline"
          className={cn(
            'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400 capitalize',
            className
          )}
        >
          {status}
        </Badge>
      );
    case 'archived':
    case 'suspended':
      return (
        <Badge
          variant="outline"
          className={cn(
            'bg-rose-500/10 text-rose-600 border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-400 capitalize',
            className
          )}
        >
          {status}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={cn('capitalize', className)}>
          {status}
        </Badge>
      );
  }
}

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  switch (role) {
    case 'admin':
      return (
        <Badge
          variant="default"
          className={cn(
            'bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-[10px]',
            className
          )}
        >
          Admin
        </Badge>
      );
    case 'staff':
      return (
        <Badge
          variant="secondary"
          className={cn(
            'bg-secondary text-secondary-foreground font-semibold uppercase tracking-wider text-[10px]',
            className
          )}
        >
          Staff
        </Badge>
      );
    case 'student':
      return (
        <Badge
          variant="outline"
          className={cn(
            'border-border text-muted-foreground font-medium uppercase tracking-wider text-[10px]',
            className
          )}
        >
          Student
        </Badge>
      );
    default:
      return null;
  }
}

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: Difficulty;
  className?: string;
}) {
  switch (difficulty) {
    case 'easy':
      return (
        <Badge
          variant="outline"
          className={cn(
            'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400 uppercase text-[10px] font-bold',
            className
          )}
        >
          Easy
        </Badge>
      );
    case 'medium':
      return (
        <Badge
          variant="outline"
          className={cn(
            'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400 uppercase text-[10px] font-bold',
            className
          )}
        >
          Medium
        </Badge>
      );
    case 'hard':
      return (
        <Badge
          variant="outline"
          className={cn(
            'bg-rose-500/10 text-rose-600 border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-400 uppercase text-[10px] font-bold',
            className
          )}
        >
          Hard
        </Badge>
      );
  }
}
