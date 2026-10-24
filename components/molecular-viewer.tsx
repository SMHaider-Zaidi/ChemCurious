"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatChemicalFormula } from "@/lib/chemical-formula";
import { fetchMoleculeData, type MoleculeData } from "@/lib/pubchem";
import {
  Search,
  Loader2,
  RotateCcw,
  Play,
  Pause,
  Layers,
  Sparkles,
  Info,
  Maximize2,
  ExternalLink,
  AlertCircle,
  HelpCircle,
  FlaskConical,
} from "lucide-react";

type RenderStyle = "ball_and_stick" | "spacefill" | "stick" | "wireframe";

const POPULAR_SUGGESTIONS = [
  { label: "Caffeine", query: "caffeine" },
  { label: "Aspirin", query: "aspirin" },
  { label: "Water", query: "water" },
  { label: "Glucose", query: "glucose" },
  { label: "Sodium Chloride", query: "sodium chloride" },
  { label: "Ethanol", query: "ethanol" },
  { label: "Methane", query: "methane" },
  { label: "Calcium Carbonate", query: "calcium carbonate" },
];

export function MolecularViewer() {
  const [molecule, setMolecule] = useState<MoleculeData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // 3Dmol viewer state
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [renderStyle, setRenderStyle] = useState<RenderStyle>("ball_and_stick");
  const [showSurface, setShowSurface] = useState(false);
  const [selectedAtom, setSelectedAtom] = useState<{
    elem: string;
    serial?: number;
    x?: number;
    y?: number;
    z?: number;
  } | null>(null);

  // Dynamic metrics from 3Dmol model
  const [atomCount, setAtomCount] = useState<number>(0);
  const [bondCount, setBondCount] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const surfaceRef = useRef<any>(null);

  // Load 3Dmol.js script from CDN
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
    script.onerror = () => {
      console.error("Failed to load 3Dmol.js");
      setIsScriptLoaded(false);
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        script.remove();
      }
    };
  }, []);

  // Fetch molecule logic
  const handleFetch = useCallback(
    async (queryToFetch: string) => {
      const q = queryToFetch.trim();
      if (!q) return;

      setSearching(true);
      setSearchError(null);
      setSelectedAtom(null);

      try {
        const data = await fetchMoleculeData(q);
        setMolecule(data);
      } catch (err: any) {
        console.error("Failed to fetch molecule:", err);
        setSearchError(err.message || "Molecule not found. Please verify the chemical name or formula.");
      } finally {
        setSearching(false);
      }
    },
    []
  );

  // Initial load with default molecule
  useEffect(() => {
    handleFetch("caffeine");
  }, [handleFetch]);

  // Apply render styles to viewer
  const applyStyle = useCallback(
    (viewer: any, style: RenderStyle) => {
      if (!viewer) return;

      switch (style) {
        case "spacefill":
          viewer.setStyle(
            {},
            {
              sphere: { colorscheme: "Jmol", scale: 0.95 },
            }
          );
          break;
        case "stick":
          viewer.setStyle(
            {},
            {
              stick: { colorscheme: "Jmol", radius: 0.22 },
            }
          );
          break;
        case "wireframe":
          viewer.setStyle(
            {},
            {
              line: { colorscheme: "Jmol", linewidth: 2 },
            }
          );
          break;
        case "ball_and_stick":
        default:
          viewer.setStyle(
            {},
            {
              stick: { colorscheme: "Jmol", radius: 0.15 },
              sphere: { colorscheme: "Jmol", scale: 0.3 },
            }
          );
          break;
      }
      viewer.render();
    },
    []
  );

  // Setup / update 3Dmol viewport
  useEffect(() => {
    if (!isScriptLoaded || !containerRef.current || !molecule) return;

    const globalWindow = window as Window & { $3Dmol?: any };
    const $3Dmol = globalWindow.$3Dmol;
    if (!$3Dmol) return;

    // Reset container and create viewer if needed
    containerRef.current.innerHTML = "";
    const viewerDiv = document.createElement("div");
    viewerDiv.style.width = "100%";
    viewerDiv.style.height = "100%";
    viewerDiv.style.position = "relative";
    viewerDiv.style.background = "transparent";
    containerRef.current.appendChild(viewerDiv);

    const viewer = $3Dmol.createViewer(viewerDiv, {
      defaultcolors: $3Dmol.rasmolElementColors,
    });
    viewerRef.current = viewer;
    viewer.setBackgroundColor(0x000000, 0);

    let model: any = null;

    if (molecule.sdf) {
      model = viewer.addModel(molecule.sdf, "sdf");
    } else if (molecule.atoms?.length) {
      const formattedAtoms = molecule.atoms.map((atom, index) => {
        const adjacent: number[] = [];
        const orders: number[] = [];

        (molecule.bonds || []).forEach((bond) => {
          const from = bond.from !== undefined ? bond.from : bond.source;
          const to = bond.to !== undefined ? bond.to : bond.target;
          if (from === index && to !== undefined) {
            adjacent.push(to);
            orders.push(bond.order || 1);
          } else if (to === index && from !== undefined) {
            adjacent.push(from);
            orders.push(bond.order || 1);
          }
        });

        const x = atom.position ? atom.position[0] : atom.x || 0;
        const y = atom.position ? atom.position[1] : atom.y || 0;
        const z = atom.position ? atom.position[2] : atom.z || 0;

        return {
          elem: atom.element,
          x,
          y,
          z,
          bonds: adjacent,
          bondOrder: orders,
        };
      });

      model = viewer.addModel();
      model.addAtoms(formattedAtoms);
    }

    if (model) {
      // Dynamic atom & bond counting from 3Dmol model
      const atoms = model.selectedAtoms({}) || [];
      const computedAtomCount = atoms.length;
      let computedBondCount = 0;

      atoms.forEach((a: any) => {
        if (Array.isArray(a.bonds)) {
          computedBondCount += a.bonds.length;
        }
      });
      computedBondCount = Math.round(computedBondCount / 2);

      // Fallback to parsed bonds if model bonds array is empty
      if (computedBondCount === 0 && molecule.bonds?.length) {
        computedBondCount = molecule.bonds.length;
      }

      setAtomCount(computedAtomCount || molecule.atoms?.length || 0);
      setBondCount(computedBondCount);

      // Setup click listener for atom inspection
      model.setClickable({}, true, (clicked: any) => {
        if (clicked) {
          setSelectedAtom({
            elem: clicked.elem || clicked.element || "Unknown",
            serial: clicked.serial ?? clicked.index,
            x: Number(clicked.x?.toFixed(2) ?? 0),
            y: Number(clicked.y?.toFixed(2) ?? 0),
            z: Number(clicked.z?.toFixed(2) ?? 0),
          });
        }
      });

      applyStyle(viewer, renderStyle);

      if (showSurface) {
        try {
          surfaceRef.current = viewer.addSurface($3Dmol.SurfaceType.VDW, {
            opacity: 0.35,
            color: 0x0891b2,
          });
        } catch (e) {
          console.warn("Surface generation error:", e);
        }
      }

      viewer.zoomTo();
      viewer.render();
    }

    // Resize observer to ensure 3Dmol tracks container dimensions smoothly
    const resizeObserver = new ResizeObserver(() => {
      if (viewerRef.current) {
        viewerRef.current.resize();
        viewerRef.current.render();
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (surfaceRef.current && viewerRef.current) {
        try {
          viewerRef.current.removeSurface(surfaceRef.current);
        } catch {
          // ignore
        }
      }
      containerRef.current?.replaceChildren();
      viewerRef.current = null;
    };
  }, [isScriptLoaded, molecule, renderStyle, showSurface, applyStyle]);

  // Handle auto-rotation
  useEffect(() => {
    if (!autoRotate || !viewerRef.current) {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animate = () => {
      if (viewerRef.current) {
        viewerRef.current.rotate(0.6, "y");
        viewerRef.current.render();
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [autoRotate, molecule]);

  const handleResetCamera = () => {
    if (viewerRef.current) {
      viewerRef.current.zoomTo();
      viewerRef.current.render();
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      handleFetch(searchTerm);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Search & Preset Molecules Bar */}
      <Card className="border-border/80 shadow-sm bg-card/60 backdrop-blur-sm">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search chemical name or formula (e.g. Caffeine, NaCl, Aspirin, H2O, C6H12O6)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 text-sm bg-background border-border"
              />
            </div>
            <Button
              type="submit"
              disabled={searching || !searchTerm.trim()}
              className="h-10 px-6 font-medium gap-2 min-w-[120px]"
            >
              {searching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Resolving...
                </>
              ) : (
                <>
                  <FlaskConical className="h-4 w-4" />
                  Fetch 3D
                </>
              )}
            </Button>
          </form>

          {/* Preset Suggestion Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs font-semibold text-muted-foreground mr-1.5 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" /> Popular:
            </span>
            {POPULAR_SUGGESTIONS.map((item) => (
              <button
                key={item.query}
                type="button"
                onClick={() => {
                  setSearchTerm(item.query);
                  handleFetch(item.query);
                }}
                disabled={searching}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  molecule?.name.toLowerCase() === item.query.toLowerCase()
                    ? "bg-primary text-primary-foreground border-primary font-medium shadow-xs"
                    : "bg-muted/50 hover:bg-muted text-foreground border-border/70 hover:border-primary/50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Search Error Card with Troubleshooting Instructions */}
          {searchError && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex gap-3 animate-in fade-in-50 duration-200">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-destructive" />
              <div className="space-y-1.5 flex-1">
                <p className="font-semibold text-destructive">{searchError}</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Verify spelling or try standard IUPAC nomenclature (e.g. "sodium bicarbonate").</p>
                  <p>• You can also search by molecular formula (e.g. "H2O", "CH4", "NaCl", "C8H10N4O2").</p>
                  <p>• Avoid colloquial brand or household product names (e.g. "bleach", "baking powder").</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Expansive 3D Viewport Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Expanded 3D Canvas (occupies 3 cols on desktop) */}
        <div className="lg:col-span-3 flex flex-col">
          <Card className="flex-1 overflow-hidden border-border/80 shadow-md flex flex-col relative min-h-[580px] lg:min-h-[640px] bg-gradient-to-b from-muted/20 via-background to-muted/30">
            {/* Header Status Bar */}
            <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-border/60 bg-card/70 backdrop-blur-xs gap-2">
              <div className="flex items-center gap-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-sm capitalize text-foreground">
                  {molecule ? molecule.name : "Interactive Molecular Viewport"}
                </span>
                {molecule?.recordType && (
                  <Badge
                    variant={molecule.recordType === "3d" ? "default" : "secondary"}
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 ${
                      molecule.recordType === "3d"
                        ? "bg-emerald-600/90 hover:bg-emerald-600 text-white"
                        : "bg-amber-600/80 hover:bg-amber-600 text-white"
                    }`}
                  >
                    {molecule.recordType === "3d" ? "3D Conformer" : "2D Planar Fallback"}
                  </Badge>
                )}
              </div>

              {/* Viewport Control Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Auto Rotate Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoRotate(!autoRotate)}
                  className="h-8 text-xs gap-1.5 px-2.5"
                  title={autoRotate ? "Pause rotation" : "Resume auto-rotation"}
                >
                  {autoRotate ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  {autoRotate ? "Pause" : "Rotate"}
                </Button>

                {/* Reset Camera */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetCamera}
                  className="h-8 text-xs gap-1.5 px-2.5"
                  title="Reset view zoom and centering"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </Button>

                {/* Render Style Selector */}
                <div className="flex rounded-md border border-input p-0.5 bg-muted/40">
                  <button
                    type="button"
                    onClick={() => setRenderStyle("ball_and_stick")}
                    className={`px-2 py-1 text-[11px] font-medium rounded-sm transition-all ${
                      renderStyle === "ball_and_stick"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Ball & Stick
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenderStyle("spacefill")}
                    className={`px-2 py-1 text-[11px] font-medium rounded-sm transition-all ${
                      renderStyle === "spacefill"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Spacefill
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenderStyle("stick")}
                    className={`px-2 py-1 text-[11px] font-medium rounded-sm transition-all ${
                      renderStyle === "stick"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Stick
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenderStyle("wireframe")}
                    className={`px-2 py-1 text-[11px] font-medium rounded-sm transition-all ${
                      renderStyle === "wireframe"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Wireframe
                  </button>
                </div>

                {/* Surface Toggle */}
                <Button
                  variant={showSurface ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowSurface(!showSurface)}
                  className="h-8 text-xs gap-1.5 px-2.5"
                  title="Toggle transparent electron cloud surface"
                >
                  <Layers className="h-3.5 w-3.5" />
                  Surface
                </Button>
              </div>
            </div>

            {/* 3D Canvas Area */}
            <div className="relative flex-1 w-full h-full min-h-[500px]">
              {/* Loading Overlay */}
              {searching && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs transition-opacity duration-200">
                  <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-lg flex flex-col items-center max-w-sm text-center space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <div>
                      <h4 className="font-semibold text-sm">Querying PubChem Pipeline...</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Resolving CID identifier and retrieving 3D conformer coordinates
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Floating Top-Left Structural HUD Card */}
              {molecule && !searching && (
                <div className="absolute top-4 left-4 z-10 p-3.5 rounded-xl bg-card/90 dark:bg-card/95 border border-border/70 backdrop-blur-md shadow-md text-xs space-y-2 max-w-xs pointer-events-auto">
                  <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-1.5">
                    <div className="font-mono text-base font-bold text-foreground flex items-center gap-1.5">
                      <span>{formatChemicalFormula(molecule.formula)}</span>
                    </div>
                    {molecule.cid && (
                      <a
                        href={`https://pubchem.ncbi.nlm.nih.gov/compound/${molecule.cid}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-medium text-primary hover:underline flex items-center gap-0.5"
                        title="View record on NCBI PubChem"
                      >
                        CID #{molecule.cid}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-muted-foreground pt-0.5">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-foreground/70 block">
                        Geometry
                      </span>
                      <span className="font-medium text-foreground text-[11px]">
                        {molecule.geometry || "Determining..."}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-foreground/70 block">
                        Angles
                      </span>
                      <span className="font-medium text-foreground text-[11px]">
                        {molecule.bondAngles || "Conformer"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-foreground/70 block">
                        Atoms
                      </span>
                      <span className="font-semibold text-foreground text-[12px]">
                        🔵 {atomCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-foreground/70 block">
                        Bonds
                      </span>
                      <span className="font-semibold text-foreground text-[12px]">
                        🔗 {bondCount}
                      </span>
                    </div>
                    {molecule.molecularWeight && (
                      <div className="col-span-2 pt-1 border-t border-border/40">
                        <span className="text-[10px] uppercase font-semibold text-foreground/70 block">
                          Molecular Weight
                        </span>
                        <span className="font-mono font-medium text-foreground text-[11px]">
                          {molecule.molecularWeight} g/mol
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Floating Bottom Atom Inspector Tooltip */}
              {selectedAtom && (
                <div className="absolute bottom-4 left-4 z-10 px-3.5 py-2 rounded-lg bg-card/95 border border-primary/50 shadow-md backdrop-blur-md text-xs flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <div>
                    <span className="font-bold text-foreground">
                      Atom: {selectedAtom.elem}
                    </span>
                    {selectedAtom.serial !== undefined && (
                      <span className="text-muted-foreground ml-1">#{selectedAtom.serial}</span>
                    )}
                    <span className="text-muted-foreground ml-2 font-mono text-[11px]">
                      (x: {selectedAtom.x}, y: {selectedAtom.y}, z: {selectedAtom.z})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedAtom(null)}
                    className="ml-2 text-muted-foreground hover:text-foreground text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* 3Dmol WebGL Container */}
              <div
                ref={containerRef}
                className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing"
              />
            </div>
          </Card>
        </div>

        {/* Sidebar Info & Interaction Controls Card (occupies 1 col on desktop) */}
        <div className="space-y-4 flex flex-col">
          {/* Chemical Metadata Card */}
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-3 pt-5">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <CardTitle className="font-serif text-base">Compound Identity</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Structural intelligence verified via PubChem PUG REST database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground font-semibold block text-[11px]">Common Name:</span>
                <span className="font-medium text-foreground capitalize text-sm">
                  {molecule ? molecule.name : "—"}
                </span>
              </div>
              {molecule?.iupacName && molecule.iupacName !== molecule.name && (
                <div>
                  <span className="text-muted-foreground font-semibold block text-[11px]">IUPAC Name:</span>
                  <span className="font-mono text-muted-foreground/90 break-words text-[11px] bg-muted/40 p-1.5 rounded-sm block">
                    {molecule.iupacName}
                  </span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground font-semibold block text-[11px]">Formula:</span>
                <span className="font-mono font-bold text-foreground text-sm">
                  {molecule ? formatChemicalFormula(molecule.formula) : "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold block text-[11px]">Structure Type:</span>
                <span className="font-medium text-foreground">
                  {molecule?.recordType === "3d"
                    ? "Full 3D Experimental/Computed Conformer"
                    : "Planar 2D Molecular Projection"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Lab Interaction Controls */}
          <Card className="border-border/80 shadow-sm flex-1">
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                <CardTitle className="font-serif text-xs uppercase tracking-wider text-muted-foreground font-bold">
                  Lab Interaction Controls
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs text-muted-foreground pb-5">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-foreground min-w-[90px]">• Left Click + Drag:</span>
                <span>Orbit camera in 3D sphere</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-foreground min-w-[90px]">• Scroll Wheel:</span>
                <span>Precision focal distance zoom</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-foreground min-w-[90px]">• Right Click + Drag:</span>
                <span>Pan viewport laterally</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-foreground min-w-[90px]">• Click on Atom:</span>
                <span>Inspect atomic element & spatial coordinates</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-foreground min-w-[90px]">• Display Styles:</span>
                <span>Switch between Ball & Stick, Spacefill, Stick, and Wireframe</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
