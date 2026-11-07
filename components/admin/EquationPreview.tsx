import { formatFormulaUnicode } from '@/lib/admin/chemFormat';
import { cn } from '@/lib/utils';

export interface EquationItem {
  formula: string;
  coefficient: number;
}

export interface EquationPreviewProps {
  reactants: EquationItem[];
  products: EquationItem[];
  arrow?: string;
  className?: string;
}

export function EquationPreview({
  reactants,
  products,
  arrow = '→',
  className,
}: EquationPreviewProps) {
  const formatSide = (items: EquationItem[]) => {
    if (items.length === 0) return '?';
    return items
      .map((item) => {
        const coef = item.coefficient > 1 ? `${item.coefficient} ` : '';
        const formula = formatFormulaUnicode(item.formula || '?');
        return `${coef}${formula}`;
      })
      .join(' + ');
  };

  const reactantsStr = formatSide(reactants);
  const productsStr = formatSide(products);

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5 text-center shadow-xs',
        className
      )}
      aria-live="polite"
    >
      <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
        Formatted Equation Preview
      </span>
      <p className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-foreground">
        <span className="text-primary">{reactantsStr}</span>{' '}
        <span className="text-amber-500 font-normal px-1">{arrow}</span>{' '}
        <span className="text-emerald-600 dark:text-emerald-400">{productsStr}</span>
      </p>
    </div>
  );
}
