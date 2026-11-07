'use client';

import { useEffect, useState, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

export const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'em',
    'u',
    's',
    'sub',
    'sup',
    'ul',
    'ol',
    'li',
    'a',
    'img',
    'h2',
    'h3',
    'span',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'width', 'height', 'style'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
};

/**
 * Sanitizes HTML using DOMPurify, enforcing strict tags and attributes,
 * and restricting style attributes to text-align only.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  if (typeof window === 'undefined') {
    // Basic server-side sanitization fallback before mount
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  const clean = DOMPurify.sanitize(html, SANITIZE_CONFIG);
  // Restrict inline styles to text-align only
  return clean.replace(/style="([^"]*)"/g, (_, style: string) => {
    const align = style.match(/text-align:\s*(left|center|right)/i)?.[0];
    return align ? `style="${align}"` : '';
  });
}

/**
 * Renders sanitized HTML safely with post-mount hydration protection
 * to avoid any SSR/client hydration differences.
 */
export function SafeHtml({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sanitized = useMemo(() => {
    return mounted ? sanitizeHtml(html) : '';
  }, [html, mounted]);

  if (!mounted) {
    // Show plain text or placeholder during SSR to guarantee no mismatch
    return <span className={cn('rich-html', className)}>{html.replace(/<[^>]*>/g, ' ')}</span>;
  }

  return (
    <div
      className={cn('rich-html prose prose-sm max-w-none dark:prose-invert', className)}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
