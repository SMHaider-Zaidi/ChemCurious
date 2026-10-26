import Link from "next/link";
import Image from "next/image";
import { Atom, Heart, BookOpen, Sparkles, ExternalLink, Mail, Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/80 bg-card/60 backdrop-blur-xs text-foreground mt-auto">
      <div className="container mx-auto max-w-7xl px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
              <Image
                src="/ChemCurious_logo.svg"
                alt="ChemCurious"
                width={150}
                height={40}
                className="h-9 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              An interactive spatial learning environment designed to help students, educators, and science
              enthusiasts visualize molecular structures, explore elemental trends, and model chemical reactions in 3D.
            </p>
          </div>

          {/* Core Tools */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-sm tracking-wide text-foreground">Core Modules</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/molecules" className="hover:text-primary transition-colors">
                  3D Molecules Viewer
                </Link>
              </li>
              <li>
                <Link href="/periodic-table" className="hover:text-primary transition-colors">
                  Interactive Periodic Table
                </Link>
              </li>
              <li>
                <Link href="/reactions" className="hover:text-primary transition-colors">
                  Reaction Simulator
                </Link>
              </li>
              <li>
                <Link href="/quizzes" className="hover:text-primary transition-colors">
                  Adaptive Quizzes
                </Link>
              </li>
            </ul>
          </div>

          {/* Study & Topics */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-sm tracking-wide text-foreground">Chemistry Topics</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/molecules" className="hover:text-primary transition-colors">
                  VSEPR Spatial Geometry
                </Link>
              </li>
              <li>
                <Link href="/periodic-table" className="hover:text-primary transition-colors">
                  Periodic Trends & Orbitals
                </Link>
              </li>
              <li>
                <Link href="/reactions" className="hover:text-primary transition-colors">
                  Chemical Equations & Kinetics
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-primary transition-colors">
                  Progress Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform & Dedication */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-sm tracking-wide text-foreground">Community & Tribute</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors flex items-center gap-1">
                  About Us &amp; Tribute
                </Link>
              </li>
              <li>
                <Link href="/auth" className="hover:text-primary transition-colors">
                  Student Sign In
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary transition-colors flex items-center gap-1"
                >
                  <Github className="h-3.5 w-3.5" /> Open Platform
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:underline">
              Legacy
            </Link>
            <span>•</span>
            <Link href="/molecules" className="hover:underline">
              3D Library
            </Link>
            <span>•</span>
            <Link href="/periodic-table" className="hover:underline">
              Periodic Elements
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
