"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Navigation } from "@/components/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  buildReactionEquation,
  formatChemicalFormula,
  formatSpeciesLabel,
} from "@/lib/chemical-formula";
import {
  FlaskConical,
  RotateCcw,
  Play,
  Loader2,
  ChevronLeft,
  Info,
  Search,
  X,
  Maximize2,
} from "lucide-react";
import Link from "next/link";

type MoleculeData = {
  atoms: Array<{ element: string; x: number; y: number; z: number }>;
  bonds: Array<{ source: number; target: number; order?: number }>;
  formula?: string;
};

type ReactionEntry = {
  molecule: string;
  coefficient: number;
  data?: MoleculeData | null;
};

type ReactionRecord = {
  id: number;
  name: string;
  category?: string;
  description: string;
  reactants: ReactionEntry[];
  products: ReactionEntry[];
};

// Helper for accurate Organic vs Inorganic classification
const isOrganicReaction = (r: ReactionRecord): boolean => {
  const cat = r.category?.toLowerCase().trim() || "";
  if (cat.includes("inorganic")) return false;
  if (cat.includes("organic")) return true;

  const entries = [...(r.reactants || []), ...(r.products || [])];
  return entries.some((entry) => {
    const formulas = [entry.molecule, entry.data?.formula].filter(Boolean).join(" ");
    const elements: string[] = formulas.match(/[A-Z][a-z]?/g) || [];
    return elements.includes("C") && elements.includes("H");
  });
};

function MoleculeViewer({
  data,
  name,
  autoRotate = true,
  minHeightClass = "min-h-[200px]",
}: {
  data: MoleculeData | null;
  name: string;
  autoRotate?: boolean;
  minHeightClass?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const globalWindow = window as Window & { $3Dmol?: any };
    if (globalWindow.$3Dmol) {
      setIsScriptLoaded(true);
      return;
    }

    const existingScript = document.querySelector('script[src*="3Dmol"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => setIsScriptLoaded(true));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/3Dmol/2.5.3/3Dmol-min.js";
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => setIsScriptLoaded(false);
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        script.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!isScriptLoaded || !containerRef.current || !data?.atoms?.length) return;

    const globalWindow = window as Window & { $3Dmol?: any };
    const $3Dmol = globalWindow.$3Dmol;
    if (!$3Dmol) return;

    containerRef.current.innerHTML = "";
    const viewerDiv = document.createElement("div");
    viewerDiv.style.width = "100%";
    viewerDiv.style.height = "100%";
    viewerDiv.style.background = "transparent";
    containerRef.current.appendChild(viewerDiv);

    const viewer = $3Dmol.createViewer(viewerDiv, {
      defaultcolors: $3Dmol.rasmolElementColors,
    });
    viewer.setBackgroundColor(0xffffff, 0);

    const formattedAtoms = data.atoms.map((atom, index) => {
      const adjacent: number[] = [];
      const orders: number[] = [];

      (data.bonds || []).forEach((bond) => {
        if (bond.source === index) {
          adjacent.push(bond.target);
          orders.push(bond.order || 1);
        } else if (bond.target === index) {
          adjacent.push(bond.source);
          orders.push(bond.order || 1);
        }
      });

      return {
        elem: atom.element,
        x: atom.x,
        y: atom.y,
        z: atom.z,
        bonds: adjacent,
        bondOrder: orders,
      };
    });

    const model = viewer.addModel();
    model.addAtoms(formattedAtoms);

    viewer.setStyle(
      {},
      {
        stick: { radius: 0.15, colorscheme: "Jmol" },
        sphere: { scale: 0.3, colorscheme: "Jmol" },
      }
    );

    viewer.zoomTo();
    viewer.render();

    let animationFrameId: number | undefined;
    if (autoRotate) {
      const animate = () => {
        viewer.rotate(0.5, "y");
        viewer.render();
        animationFrameId = requestAnimationFrame(animate);
      };
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId !== undefined) {
        cancelAnimationFrame(animationFrameId);
      }
      containerRef.current?.replaceChildren();
    };
  }, [autoRotate, data, isScriptLoaded]);

  if (!data?.atoms?.length) {
    return (
      <div
        className={`flex h-full ${minHeightClass} flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/25 p-4 text-center text-muted-foreground`}
      >
        <FlaskConical className="mb-2 h-7 w-7 animate-pulse text-muted-foreground/60" />
        <span className="text-xs font-medium">No 3D model available for {name}</span>
      </div>
    );
  }

  return (
    <div
      className={`relative h-full ${minHeightClass} w-full overflow-hidden rounded-lg border border-border/70 bg-transparent shadow-sm`}
    >
      {!isScriptLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        </div>
      )}
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

export default function ReactionSimulatorPage() {
  const [reactions, setReactions] = useState<ReactionRecord[]>([]);
  const [selectedReaction, setSelectedReaction] = useState<ReactionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"organic" | "inorganic">("organic");
  const [isReacting, setIsReacting] = useState(false);
  const [hasReacted, setHasReacted] = useState(false);
  const [expandedMolecule, setExpandedMolecule] = useState<ReactionEntry | null>(null);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function fetchReactions() {
      try {
        const response = await fetch("/api/reactions");
        const data = await response.json();
        if (data.reactions?.length) {
          const fetchedReactions: ReactionRecord[] = data.reactions;
          setReactions(fetchedReactions);

          const firstOrganic = fetchedReactions.find((r) => isOrganicReaction(r));
          const initialReaction = firstOrganic || fetchedReactions.find((r) => !isOrganicReaction(r));
          const initialTab = initialReaction && isOrganicReaction(initialReaction) ? "organic" : "inorganic";
          setActiveTab(initialTab);
          setSelectedReaction(initialReaction || null);
        }
      } catch (error) {
        console.error("Failed to fetch reactions", error);
      } finally {
        setLoading(false);
      }
    }

    fetchReactions();

    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  const categoryCounts = useMemo(() => {
    let organic = 0;
    let inorganic = 0;

    reactions.forEach((r) => {
      if (isOrganicReaction(r)) {
        organic++;
      } else {
        inorganic++;
      }
    });

    return { organic, inorganic };
  }, [reactions]);

  const filteredReactions = useMemo(() => {
    return reactions.filter((r) => {
      const isOrganic = isOrganicReaction(r);
      const matchesTab = activeTab === "organic" ? isOrganic : !isOrganic;

      if (!matchesTab) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();

      return (
        r.name?.toLowerCase().includes(q) ||
        r.reactants?.some((item) => item.molecule?.toLowerCase().includes(q)) ||
        r.products?.some((item) => item.molecule?.toLowerCase().includes(q)) ||
        r.category?.toLowerCase().includes(q)
      );
    });
  }, [reactions, activeTab, searchQuery]);

  const handleTabChange = (tab: "organic" | "inorganic") => {
    setActiveTab(tab);
    setSearchQuery("");
    setHasReacted(false);
    setIsReacting(false);

    // Auto-select first matching item for the new tab
    const firstMatching = reactions.find((r) =>
      tab === "organic" ? isOrganicReaction(r) : !isOrganicReaction(r)
    );

    setSelectedReaction(firstMatching || null);
  };

  const handleSimulate = () => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }

    setIsReacting(true);
    transitionTimerRef.current = setTimeout(() => {
      setIsReacting(false);
      setHasReacted(true);
    }, 1400);
  };

  const handleReset = () => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }
    setIsReacting(false);
    setHasReacted(false);
  };

  const handleReactionChange = (reaction: ReactionRecord) => {
    setSelectedReaction(reaction);
    setHasReacted(false);
    setIsReacting(false);
  };

  const stageMolecules = hasReacted ? selectedReaction?.products : selectedReaction?.reactants;

  const reactionEquation = selectedReaction ? buildReactionEquation(selectedReaction) : "";
  const sidebarEquation = (reaction: ReactionRecord) =>
    /(?:->|→|=)/.test(reaction.name)
      ? reaction.name
      : buildReactionEquation(reaction);

  const renderMoleculeCard = (entry: ReactionEntry, index: number, accent?: "primary" | "emerald") => (
    <button
      type="button"
      key={`${entry.molecule}-${index}`}
      onClick={() => setExpandedMolecule(entry)}
      className="group flex min-w-[200px] max-w-[260px] flex-1 cursor-pointer flex-col items-center gap-2 rounded-xl border bg-muted/10 p-3 text-left shadow-xs transition-all hover:border-primary/50 hover:bg-muted/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative h-[200px] w-full">
        <MoleculeViewer data={entry.data || null} name={entry.molecule} />
        <span className="pointer-events-none absolute right-2 top-2 rounded-md bg-background/80 p-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
          <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
        </span>
      </div>
      <div
        className={`text-center text-sm font-bold ${
          accent === "emerald" ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"
        }`}
      >
        {formatSpeciesLabel(entry.coefficient, entry.molecule, entry.data?.formula)}
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
        Click to expand 3D view
      </span>
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="mr-1 h-4 w-4" /> Back to Home
            </Button>
          </Link>
          <span className="text-muted-foreground">|</span>
          <div className="flex items-center gap-2 font-bold text-primary">
            <FlaskConical className="h-5 w-5" />
            <span>Reaction Simulator</span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          <div className="flex flex-col gap-4 lg:col-span-1">
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">Reactions</h3>
                <span className="text-xs font-semibold text-muted-foreground">
                  {filteredReactions.length} / {reactions.length}
                </span>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-center text-xs font-medium">
                <button
                  onClick={() => handleTabChange("organic")}
                  className={`rounded-md py-1.5 transition-all ${
                    activeTab === "organic"
                      ? "bg-background text-primary shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Organic ({categoryCounts.organic})
                </button>
                <button
                  onClick={() => handleTabChange("inorganic")}
                  className={`rounded-md py-1.5 transition-all ${
                    activeTab === "inorganic"
                      ? "bg-background text-primary shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Inorganic ({categoryCounts.inorganic})
                </button>
              </div>

              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab} reactions...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-8 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredReactions.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No {activeTab} reactions found {searchQuery ? `matching "${searchQuery}"` : ""}.
                </div>
              ) : (
                <div className="flex max-h-[500px] flex-col gap-2 overflow-y-auto pr-1">
                  {filteredReactions.map((reaction) => (
                    <button
                      key={reaction.id}
                      onClick={() => handleReactionChange(reaction)}
                      className={`w-full rounded-lg border px-3 py-2.5 text-left text-xs transition-all ${
                        selectedReaction?.id === reaction.id
                          ? "border-primary bg-primary text-primary-foreground font-medium"
                          : "border-border bg-background text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <div className="truncate font-medium leading-snug">
                        {formatChemicalFormula(sidebarEquation(reaction))}
                      </div>
                      {reaction.category && (
                        <div
                          className={`mt-1 text-[11px] ${
                            selectedReaction?.id === reaction.id
                              ? "text-primary-foreground/80"
                              : "text-muted-foreground"
                          }`}
                        >
                          {reaction.category}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-3">
            {selectedReaction ? (
              <>
                <Card className="border p-6 shadow-sm">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
                    <h2 className="font-serif text-2xl font-bold text-foreground">
                      {selectedReaction.name}
                    </h2>
                    {selectedReaction.category && (
                      <Badge variant="secondary" className="px-3 py-1 capitalize">
                        {selectedReaction.category}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedReaction.description}</p>
                </Card>

                <Card className="flex min-h-[500px] flex-col justify-between border p-6 shadow-sm">
                  <div className="mb-4 border-b pb-4 text-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Balanced equation
                    </p>
                    <p className="mt-2 font-serif text-xl font-bold leading-relaxed text-foreground sm:text-2xl">
                      {formatChemicalFormula(reactionEquation)}
                    </p>
                  </div>

                  {isReacting ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16">
                      <div className="relative flex items-center justify-center">
                        <div className="absolute h-16 w-16 animate-ping rounded-full bg-primary/20" />
                        <FlaskConical className="h-12 w-12 animate-bounce text-primary" />
                      </div>
                      <span className="animate-pulse text-lg font-semibold text-foreground">
                        Breaking bonds and synthesizing products...
                      </span>
                    </div>
                  ) : !hasReacted ? (
                    <div className="flex flex-1 flex-col justify-between gap-6">
                      <div className="text-center">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Reactants Stage
                        </span>
                        <h4 className="mt-1 text-base font-bold text-foreground">
                          Review each reactant before starting synthesis.
                        </h4>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-6 py-4">
                        {selectedReaction.reactants.map((reactant, index) =>
                          renderMoleculeCard(reactant, index, "primary")
                        )}
                      </div>

                      <div className="flex justify-center border-t pt-6">
                        <Button onClick={handleSimulate} size="lg" className="px-8 shadow-md">
                          <Play className="mr-2 h-4 w-4 fill-current" /> Simulate Reaction
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-col justify-between gap-6">
                      <div className="text-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                          Products Formed
                        </span>
                        <h4 className="mt-1 text-base font-bold text-foreground">
                          Synthesized product molecules in 3D geometry.
                        </h4>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-6 py-4">
                        {stageMolecules?.map((molecule, index) =>
                          renderMoleculeCard(molecule, index, "emerald")
                        )}
                      </div>

                      <div className="flex justify-center gap-4 border-t pt-6">
                        <Button
                          onClick={handleReset}
                          variant="outline"
                          size="lg"
                          className="px-8"
                        >
                          <RotateCcw className="mr-2 h-4 w-4" /> Reset Reaction
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>

                <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-800 shadow-sm">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <div>
                    <h5 className="mb-1 font-bold">Interactive Lab Guide</h5>
                    <p className="text-xs leading-relaxed text-blue-700/90">
                      Drag to rotate each molecule in 3D space, scroll to zoom, and click simulate to view the transformation from reactants to products.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                <FlaskConical className="mb-4 h-12 w-12 animate-pulse text-muted-foreground/60" />
                <h3 className="mb-1 text-lg font-bold">No Reaction Selected</h3>
                <p className="max-w-xs text-sm">
                  Choose a reaction from the sidebar to begin the interactive simulation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={expandedMolecule !== null} onOpenChange={(open) => !open && setExpandedMolecule(null)}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl" showCloseButton>
          {expandedMolecule && (
            <>
              <DialogHeader className="space-y-1 border-b px-6 py-4 text-left">
                <DialogTitle className="font-serif text-xl capitalize">
                  {expandedMolecule.molecule}
                </DialogTitle>
                <DialogDescription className="space-y-1">
                  <span className="block">
                    Formula:{" "}
                    <span className="font-semibold text-foreground">
                      {formatSpeciesLabel(
                        expandedMolecule.coefficient,
                        expandedMolecule.molecule,
                        expandedMolecule.data?.formula
                      )}
                    </span>
                  </span>
                  <span className="block">
                    Coefficient:{" "}
                    <span className="font-semibold text-foreground">{expandedMolecule.coefficient}</span>
                  </span>
                  <span className="block text-xs">Drag to rotate · scroll to zoom</span>
                </DialogDescription>
              </DialogHeader>
              <div className="h-[min(55vh,420px)] w-full bg-muted/20 p-4">
                <MoleculeViewer
                  data={expandedMolecule.data || null}
                  name={expandedMolecule.molecule}
                  autoRotate={false}
                  minHeightClass="min-h-[320px]"
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}