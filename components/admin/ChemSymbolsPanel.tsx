'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { getActiveEditor } from './ChemRichEditor';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface SymbolGroup {
  name: string;
  items: { ch: string; title: string }[];
}

export const SYMBOL_GROUPS: SymbolGroup[] = [
  {
    name: 'Sub/Superscripts',
    items: [
      ...'₀₁₂₃₄₅₆₇₈₉'.split('').map((ch, i) => ({ ch, title: `Subscript ${i}` })),
      ...'⁰¹²³⁴⁵⁶⁷⁸⁹'.split('').map((ch, i) => ({ ch, title: `Superscript ${i}` })),
      { ch: '⁺', title: 'Superscript plus' },
      { ch: '⁻', title: 'Superscript minus' },
      { ch: '₊', title: 'Subscript plus' },
      { ch: '₋', title: 'Subscript minus' },
      { ch: 'ⁿ', title: 'Superscript n' },
    ],
  },
  {
    name: 'Arrows',
    items: [
      { ch: '→', title: 'Reaction arrow' },
      { ch: '⇌', title: 'Equilibrium (reversible)' },
      { ch: '⇄', title: 'Forward / reverse reaction' },
      { ch: '⟶', title: 'Long arrow right' },
      { ch: '⟵', title: 'Long arrow left' },
      { ch: '↑', title: 'Gas evolved' },
      { ch: '↓', title: 'Precipitate formed' },
      { ch: '↔', title: 'Resonance double arrow' },
      { ch: '⇒', title: 'Implies' },
    ],
  },
  {
    name: 'Ions',
    items: [
      'H⁺', 'OH⁻', 'Na⁺', 'K⁺', 'Cl⁻', 'NH₄⁺', 'NO₃⁻', 'SO₄²⁻', 'CO₃²⁻', 'PO₄³⁻',
      'Ca²⁺', 'Mg²⁺', 'Fe²⁺', 'Fe³⁺', 'Cu²⁺', 'Zn²⁺', 'Al³⁺', 'Ag⁺', 'Ba²⁺', 'Pb²⁺',
    ].map((ch) => ({ ch, title: `${ch} ion` })),
  },
  {
    name: 'States & Conditions',
    items: [
      { ch: '(s)', title: 'Solid state' },
      { ch: '(l)', title: 'Liquid state' },
      { ch: '(g)', title: 'Gas state' },
      { ch: '(aq)', title: 'Aqueous solution' },
      { ch: 'Δ', title: 'Delta (Heat applied)' },
      { ch: '°', title: 'Degree symbol' },
      { ch: '℃', title: 'Degrees Celsius' },
      { ch: 'heat', title: 'Heat condition' },
      { ch: 'catalyst', title: 'Catalyst' },
      { ch: 'conc.', title: 'Concentrated' },
      { ch: 'dil.', title: 'Dilute' },
    ],
  },
  {
    name: 'Greek',
    items: [
      'α', 'β', 'γ', 'δ', 'Δ', 'λ', 'μ', 'ν', 'π', 'σ', 'ρ', 'θ', 'φ', 'ω', 'Ω', 'η', 'κ', 'τ',
    ].map((ch) => ({ ch, title: `Greek letter ${ch}` })),
  },
  {
    name: 'Operators & Units',
    items: [
      '±', '×', '÷', '=', '≠', '≈', '≤', '≥', '∝', '√', '·', '°', '%', 'Å', 'µ',
      'mol', 'mL', 'L', 'g', 'kJ', 'J', 'atm', 'M', 'K', 'pH', 'pKa',
    ].map((ch) => ({ ch, title: ch })),
  },
  {
    name: 'Equation Templates',
    items: [
      { ch: 'A + B → C + D', title: 'Synthesis template' },
      { ch: 'A + B ⇌ C + D', title: 'Equilibrium template' },
      { ch: 'pH = −log[H⁺]', title: 'pH formula' },
      { ch: 'PV = nRT', title: 'Ideal gas law' },
      { ch: 'M = n/V', title: 'Molarity formula' },
      { ch: 'Kc = [C]^c[D]^d / [A]^a[B]^b', title: 'Equilibrium constant' },
      { ch: 'ΔG = ΔH − TΔS', title: 'Gibbs free energy' },
      { ch: 'Ag⁺(aq) + Cl⁻(aq) → AgCl(s)↓', title: 'Precipitation example' },
    ],
  },
];

export function ChemSymbolsPanel({
  defaultOpen = false,
  className,
}: {
  defaultOpen?: boolean;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeGroup, setActiveGroup] = useState<string>(SYMBOL_GROUPS[0]!.name);

  const selectedGroup =
    SYMBOL_GROUPS.find((g) => g.name === activeGroup) ?? SYMBOL_GROUPS[0]!;

  const handleInsert = (symbol: string) => {
    const editor = getActiveEditor();
    if (!editor || editor.isDestroyed) {
      toast.info('Click inside a question or option text field first, then click a symbol.');
      return;
    }
    editor.chain().focus().insertContent(symbol).run();
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card shadow-xs overflow-hidden',
        className
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors bg-muted/20"
      >
        <span className="flex items-center gap-2">
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          Chemistry Symbols & Formulas Palette
        </span>
        <span className="text-[11px] font-normal text-muted-foreground">
          {isOpen ? 'Click to hide' : 'Click to expand'}
        </span>
      </button>

      {isOpen && (
        <div className="p-3 space-y-3 border-t border-border">
          {/* Category Tabs */}
          <div
            className="flex flex-wrap gap-1.5"
            role="tablist"
            aria-label="Symbol Category Tabs"
          >
            {SYMBOL_GROUPS.map((group) => (
              <button
                key={group.name}
                type="button"
                role="tab"
                aria-selected={activeGroup === group.name}
                onClick={() => setActiveGroup(group.name)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium transition-colors border',
                  activeGroup === group.name
                    ? 'border-primary bg-primary text-primary-foreground font-semibold shadow-2xs'
                    : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {group.name}
              </button>
            ))}
          </div>

          {/* Symbol Buttons Grid */}
          <TooltipProvider delayDuration={100}>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
              {selectedGroup.items.map((item, idx) => (
                <Tooltip key={idx}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleInsert(item.ch)}
                      className="flex h-8 min-w-8 items-center justify-center rounded-md border border-border bg-background px-2 text-sm font-mono hover:border-primary hover:text-primary hover:bg-primary/5 active:scale-95 transition-all shadow-2xs"
                      aria-label={item.title}
                    >
                      {item.ch}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
