import { PeriodicTable } from "@/components/periodic-table"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Atom, Beaker, Zap, Thermometer } from "lucide-react"

export default function PeriodicTablePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-4 font-serif text-3xl font-bold text-foreground">Explore the Elements</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Discover the properties, uses, and history of chemical elements. Click on any element to learn more about
            its characteristics and role in chemistry.
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:border-blue-800 dark:from-blue-950 dark:to-blue-900">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Atom className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <CardTitle className="font-serif text-sm">118 Elements</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Complete periodic table with all known elements</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:border-green-800 dark:from-green-950 dark:to-green-900">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Beaker className="h-5 w-5 text-green-600 dark:text-green-400" />
                <CardTitle className="font-serif text-sm">Element Groups</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Color-coded by chemical properties and behavior</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 dark:border-purple-800 dark:from-purple-950 dark:to-purple-900">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <CardTitle className="font-serif text-sm">Properties</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Atomic mass, electron configuration, and more</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:border-orange-800 dark:from-orange-950 dark:to-orange-900">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Thermometer className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <CardTitle className="font-serif text-sm">States</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Solid, liquid, gas, and synthetic elements</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="font-serif">Element Categories</CardTitle>
            <CardDescription>Understanding the color-coded groups in the periodic table</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded bg-red-500"></div>
                <span className="text-sm">Alkali Metals</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded bg-orange-500"></div>
                <span className="text-sm">Alkaline Earth</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded bg-yellow-500"></div>
                <span className="text-sm">Transition Metals</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded bg-green-500"></div>
                <span className="text-sm">Metalloids</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded bg-blue-500"></div>
                <span className="text-sm">Nonmetals</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded bg-purple-500"></div>
                <span className="text-sm">Noble Gases</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <PeriodicTable />

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="font-serif">Did You Know?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="mb-2 font-semibold">Periodic Law</h4>
                <p className="text-sm text-muted-foreground">
                  The periodic table is organized by atomic number, and elements with similar properties appear at
                  regular intervals.
                </p>
              </div>
              <div>
                <h4 className="mb-2 font-semibold">New Elements</h4>
                <p className="text-sm text-muted-foreground">
                  Scientists continue to discover new superheavy elements, with the most recent additions being elements
                  113-118.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
