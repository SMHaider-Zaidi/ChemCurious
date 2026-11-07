import Link from 'next/link';
import { Trophy, Medal, Award } from 'lucide-react';
import type { LeaderboardEntry } from '@/lib/admin/types';
import { cn } from '@/lib/utils';

export function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length < 3) return null;

  const first = entries[0]!;
  const second = entries[1]!;
  const third = entries[2]!;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="font-serif text-lg font-bold text-foreground text-center mb-6">
        Top Performers Podium
      </h3>

      <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end max-w-2xl mx-auto pt-6 pb-2">
        {/* 2nd Place (Silver) */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-2 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-100 shadow-md">
            <Medal className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <Link
            href={`/admin/students/${second.userId}`}
            className="font-serif font-bold text-xs sm:text-sm text-foreground hover:text-primary transition-colors truncate max-w-full"
          >
            {second.name}
          </Link>
          <span className="text-[10px] text-muted-foreground truncate max-w-full px-1">
            {second.institution}
          </span>
          <span className="mt-1 font-mono text-xs sm:text-sm font-bold text-foreground">
            {second.points} pts
          </span>
          <div className="w-full mt-3 h-24 sm:h-28 rounded-t-lg bg-gradient-to-t from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center border-t border-x border-slate-300 dark:border-slate-600">
            <span className="font-serif text-2xl sm:text-3xl font-black text-slate-500">2</span>
          </div>
        </div>

        {/* 1st Place (Gold) */}
        <div className="flex flex-col items-center text-center -mt-4">
          <div className="mb-2 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-amber-400 text-amber-950 shadow-lg ring-4 ring-amber-400/20">
            <Trophy className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <Link
            href={`/admin/students/${first.userId}`}
            className="font-serif font-bold text-sm sm:text-base text-foreground hover:text-primary transition-colors truncate max-w-full"
          >
            {first.name}
          </Link>
          <span className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-full px-1">
            {first.institution}
          </span>
          <span className="mt-1 font-mono text-sm sm:text-base font-black text-amber-600 dark:text-amber-400">
            {first.points} pts
          </span>
          <div className="w-full mt-3 h-32 sm:h-36 rounded-t-lg bg-gradient-to-t from-amber-200 to-amber-100 dark:from-amber-950/60 dark:to-amber-900/50 flex items-center justify-center border-t border-x border-amber-300 dark:border-amber-700 shadow-sm">
            <span className="font-serif text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400">1</span>
          </div>
        </div>

        {/* 3rd Place (Bronze) */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-2 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-amber-700/30 text-amber-800 dark:text-amber-300 shadow-md">
            <Award className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <Link
            href={`/admin/students/${third.userId}`}
            className="font-serif font-bold text-xs sm:text-sm text-foreground hover:text-primary transition-colors truncate max-w-full"
          >
            {third.name}
          </Link>
          <span className="text-[10px] text-muted-foreground truncate max-w-full px-1">
            {third.institution}
          </span>
          <span className="mt-1 font-mono text-xs sm:text-sm font-bold text-foreground">
            {third.points} pts
          </span>
          <div className="w-full mt-3 h-16 sm:h-20 rounded-t-lg bg-gradient-to-t from-amber-100 to-amber-50 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center border-t border-x border-amber-200 dark:border-slate-600">
            <span className="font-serif text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-500">3</span>
          </div>
        </div>
      </div>
    </div>
  );
}
