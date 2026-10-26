"use client";

import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Award, BookOpen, GraduationCap, Users } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Top Navigation */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="mr-1 h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>

        {/* Header Badge */}
        <div className="text-center mb-8">
          <Badge variant="outline" className="px-4 py-1 mb-3 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 font-medium">
            Dedicated in Loving Memory • Open Interactive Learning Platform
          </Badge>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Dedicated in Loving Memory
          </h1>
          <p className="mt-2 text-muted-foreground text-sm max-w-lg mx-auto">
            Honoring the life, passion, and teaching legacy of a master educator.
          </p>
        </div>

        {/* Main Dedicated Hero Section */}
        <Card className="border p-8 md:p-10 shadow-sm relative overflow-hidden bg-gradient-to-b from-card to-muted/20">
          <div className="flex flex-col items-center text-center space-y-4">
            
            {/* SIR FAYYAZ PHOTO */}
            <div className="relative mb-2">
              <div className="h-32 w-32 md:h-36 md:w-36 rounded-full border-4 border-emerald-500/20 shadow-md overflow-hidden bg-muted">
                <img 
                  src="/sirFayyaz.jpeg" 
                  alt="Late Sir Fayyaz" 
                  className="h-full w-full object-cover object-center"
                />
              </div>
            </div>

            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
              Late Sir Fayyaz
            </h2>

            <p className="text-emerald-600 font-medium text-sm tracking-wide uppercase">
              Master Chemistry Lecturer &amp; Mentor
            </p>

            <div className="w-16 h-1 bg-emerald-500/40 rounded-full my-2" />

            <p className="text-muted-foreground leading-relaxed text-sm md:text-base max-w-2xl">
              ChemCurious was crafted as a dedicated tribute to 
              <strong className="text-foreground"> Sir Fayyaz</strong>, who devoted years of his life 
              to nurturing generations of chemistry students with academic distinction as well as serving as an esteemed lecturer at Aga Khan Higher Secondary School.
            </p>

            <p className="text-muted-foreground leading-relaxed text-sm md:text-base max-w-2xl">
              His unwavering passion for explaining complex chemical structures and reactions with clarity and warmth inspired us to build a digital platform where students can visualize, explore, and master chemistry seamlessly.
            </p>
          </div>
        </Card>

        {/* Legacy Highlights */}
        <div className="grid gap-4 md:grid-cols-3 mt-8">
          <Card className="p-5 border text-center flex flex-col items-center space-y-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h3 className="font-bold text-sm text-foreground">Aga Khan Higher Secondary School</h3>
            <p className="text-xs text-muted-foreground">
              Lecturer in Chemistry for many years, shaping academic excellence.
            </p>
          </Card>

          <Card className="p-5 border text-center flex flex-col items-center space-y-2">
            <Award className="h-6 w-6 text-primary" />
            <h3 className="font-bold text-sm text-foreground">Lifelong Mentorship</h3>
            <p className="text-xs text-muted-foreground">
              A guiding pillar who spent decades mentoring students toward university success and scientific discovery.
            </p>
          </Card>

          <Card className="p-5 border text-center flex flex-col items-center space-y-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h3 className="font-bold text-sm text-foreground">Interactive Learning</h3>
            <p className="text-xs text-muted-foreground">
              Carrying forward his mission to make chemistry intuitive, visual, and accessible.
            </p>
          </Card>
        </div>

        {/* Note to Students & Learners */}
        <div className="mt-8 rounded-xl border border-border/80 bg-card p-6 shadow-xs text-center">
          <div className="flex justify-center items-center gap-2 font-bold text-foreground text-base mb-1">
            <Users className="h-4 w-4 text-emerald-600" />
            <span>Empowering Chemistry Learners Everywhere</span>
          </div>
          <p className="text-xs text-muted-foreground max-w-xl mx-auto leading-relaxed">
            This platform is open and accessible to students, educators, and chemistry enthusiasts worldwide. Use these 3D tools to explore molecular geometry, balance reactions, and carry forward Sir Fayyaz’s passion for visual learning.
          </p>
        </div>
      </main>
    </div>
  );
}