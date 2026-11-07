'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function AdminThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    let preferredDark = false;

    try {
      const stored = localStorage.getItem('admin-theme');
      if (stored === 'dark') {
        preferredDark = true;
      } else if (stored === 'light') {
        preferredDark = false;
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        preferredDark = true;
      }
    } catch {
      // storage unavailable
    }

    setIsDark(preferredDark);

    if (preferredDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // CRITICAL: Cleanup on unmount ensures dark mode never leaks to student pages
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);

    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    try {
      localStorage.setItem('admin-theme', nextDark ? 'dark' : 'light');
    } catch {
      // ignore
    }
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Toggle theme">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-500 transition-transform" />
            ) : (
              <Moon className="h-4 w-4 transition-transform" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isDark ? 'Light theme' : 'Dark theme'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
