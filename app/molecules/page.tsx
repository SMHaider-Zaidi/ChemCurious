import { MolecularViewer } from "@/components/molecular-viewer"
import { Navigation } from "@/components/navigation"
import { Atom } from "lucide-react"

export default function MoleculesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex items-center gap-2">
          <Atom className="h-6 w-6 text-primary" />
          <h1 className="font-serif text-3xl font-bold text-foreground">Explore Molecules in 3D</h1>
        </div>
        <p className="mb-8 max-w-2xl text-lg text-muted-foreground">
          Visualize and interact with molecular structures. Rotate, zoom, and examine atomic bonds to understand
          chemical compounds better.
        </p>

        <MolecularViewer />
      </main>
    </div>
  )
}
