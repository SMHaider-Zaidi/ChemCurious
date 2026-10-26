import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Atom, FlaskConical, Users, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

const FEATURE_CARDS = [
  {
    href: "/molecules",
    title: "3D Molecular Viewer",
    description:
      "Visualize and manipulate molecular structures in full 3D space. Rotate, zoom, examine atomic bonds, and inspect spatial geometries interactively.",
    badge: "Spatial Engine",
    icon: Atom,
    // Soft Light Blue (matching periodic table page)
    bgColor: "bg-blue-50/90 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800/60 hover:border-blue-400 dark:hover:border-blue-600",
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    accentColor: "text-blue-600 dark:text-blue-400",
  },
  {
    href: "/periodic-table",
    title: "Interactive Periodic Table",
    description:
      "Explore elemental properties, electron configurations, ionization energies, and periodic trends across all 118 known elements dynamically.",
    badge: "118 Elements",
    iconLetter: "H",
    // Soft Light Green (matching periodic table page)
    bgColor: "bg-emerald-50/90 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400 dark:hover:border-emerald-600",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    accentColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    href: "/reactions",
    title: "Reaction Simulator",
    description:
      "Simulate chemical reactions, balance stoichiometric equations, and observe atomic rearrangements and reaction kinetics in real-time.",
    badge: "Real-time Lab",
    icon: FlaskConical,
    // Soft Light Purple (matching periodic table page)
    bgColor: "bg-purple-50/90 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800/60 hover:border-purple-400 dark:hover:border-purple-600",
    iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    accentColor: "text-purple-600 dark:text-purple-400",
  },
  {
    href: "/quizzes",
    title: "Interactive Quizzes",
    description:
      "Test and solidify your chemical knowledge with chapter-based adaptive quizzes, real-time scoring, and comprehensive explanations.",
    badge: "Self Assessment",
    icon: Users,
    // Soft Light Amber (matching periodic table page)
    bgColor: "bg-amber-50/90 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800/60 hover:border-amber-400 dark:hover:border-amber-600",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    accentColor: "text-amber-600 dark:text-amber-400",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center space-y-5">
          <div>
            
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-black text-foreground tracking-tight leading-tight">
            Explore Chemistry in <span className="text-primary">3D Space</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Discover molecular structures, master the periodic table, and simulate chemical reactions in an
            intuitive, interactive environment designed for learners and educators everywhere.
          </p>
        </div>
      </section>

      {/* Features Grid: Balanced 4-Column Layout with Soft Pastel Theme */}
      <section className="py-16 px-4 bg-muted/20 border-y border-border/50 flex-1">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight">
              Four Core Pillars of Interactive Chemistry
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools designed to transform textbook concepts into spatial, memorable visual models.
            </p>
          </div>

          {/* Uniform 4-Column Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURE_CARDS.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <Link key={feature.href} href={feature.href} className="group block h-full">
                  <Card
                    className={`h-full flex flex-col justify-between transition-all duration-200 transform group-hover:-translate-y-1 group-hover:shadow-lg border ${feature.bgColor} ${feature.borderColor}`}
                  >
                    <CardHeader className="space-y-3 pb-3">
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs ${feature.iconBg}`}
                        >
                          {IconComponent ? (
                            <IconComponent className="h-6 w-6" />
                          ) : (
                            <span className="text-base font-black">{feature.iconLetter}</span>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                          {feature.badge}
                        </Badge>
                      </div>
                      <CardTitle className="font-serif text-lg text-foreground group-hover:text-primary transition-colors">
                        {feature.title}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm text-muted-foreground/90 leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div
                        className={`text-xs font-semibold flex items-center gap-1.5 transition-all group-hover:gap-2.5 ${feature.accentColor}`}
                      >
                        <span>Open Module</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tribute / Educational Mission Note */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-2xl text-center space-y-3">
          <h3 className="font-serif text-xl font-bold text-foreground">
            Built for Students, Educators &amp; Enthusiasts
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            ChemCurious bridges textbook theory with spatial exploration. Carrying forward a legacy of inspiring chemistry education.
          </p>
          <div className="pt-2">
            <Link
              href="/about"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              Read our story and dedication <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Professional Site-Wide Footer */}
      <Footer />
    </div>
  );
}