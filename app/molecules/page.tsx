import { MolecularViewer } from "@/components/molecular-viewer";
import { Navigation } from "@/components/navigation";
import { Atom, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MoleculesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto max-w-7xl 2xl:max-w-[1550px] px-4 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Atom className="h-6 w-6 text-primary" />
              </div>
              <h1 className="font-serif text-3xl font-bold text-foreground tracking-tight">
                Explore Molecules in 3D
              </h1>
            </div>
            <p className="max-w-3xl text-sm sm:text-base text-muted-foreground">
              Interact directly with spatial molecular structures. Search any
              chemical name or formula, rotate conformers, inspect atomic bonds, and analyze 3D geometry.
            </p>
          </div>

          
        </div>

        <MolecularViewer />
      </main>
    </div>
  );
}
