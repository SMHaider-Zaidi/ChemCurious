"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Award, BookOpen, CalendarDays, Loader2, Mail, TrendingUp, Trophy } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Attempt = {
  id: number
  quizId: number
  chapterName: string
  score: number
  totalQuestions: number
  percentage: number | string
  createdAt: string
}

type StudentRank = {
  enabled: boolean
  currentRank: number | null
  totalStudents: number
  points: number
  bestPercentage: number
  attemptsCount: number
  chaptersAttempted: number
}

function percentageClass(value: number) {
  if (value >= 70) return "border-green-200 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-200"
  if (value >= 50) return "border-yellow-200 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-200"
  return "border-red-200 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200"
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [rank, setRank] = useState<StudentRank | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading || !user) return
    fetch("/api/quizzes/attempts")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load quiz history")
        return response.json()
      })
      .then((data) => {
        setAttempts(data.attempts || [])
        if (data.rank) {
          setRank(data.rank)
        }
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [authLoading, user])

  if (authLoading || (user && loading)) {
    return (
      <>
        <Navigation />
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    )
  }

  if (!user) {
    return (
      <>
        <Navigation />
        <main className="container mx-auto px-4 py-16">
          <Card className="mx-auto max-w-md text-center">
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-5 text-sm text-muted-foreground">Sign in to view your quiz history and performance.</p>
              <Link href="/auth">
                <Button>Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </>
    )
  }

  const average = attempts.length
    ? Math.round(attempts.reduce((sum, attempt) => sum + Number(attempt.percentage), 0) / attempts.length)
    : 0

  const highest = attempts.reduce<Attempt | null>(
    (best, attempt) => (!best || Number(attempt.percentage) > Number(best.percentage) ? attempt : best),
    null
  )

  const showRank = Boolean(rank && rank.enabled)

  return (
    <>
      <Navigation />
      <main className="container mx-auto space-y-8 px-4 py-8">
        <header>
          <p className="text-sm font-medium text-primary">Welcome back, {user.name}</p>
          <h1 className="font-serif text-3xl font-bold">Student Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Review your chemistry quiz performance and keep building momentum.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          {/* Profile Summary */}
          <Card className="shadow-xs border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Profile Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-lg font-semibold">{user.name}</p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
              </div>

              {/* Overall Class Rank Badge when enabled */}
              {showRank && (
                <div className="border-t pt-4">
                  <div className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-amber-100/40 dark:border-amber-900/60 dark:from-amber-950/30 dark:to-background p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        Overall Class Standing
                      </span>
                      <Badge
                        variant="outline"
                        className="border-amber-300 bg-amber-100/80 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 text-[11px] font-mono font-medium"
                      >
                        {rank?.points ?? 0} Pts
                      </Badge>
                    </div>

                    {rank?.currentRank !== null ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-amber-900 dark:text-amber-200 tracking-tight">
                          Rank #{rank?.currentRank}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          among {rank?.totalStudents} {rank?.totalStudents === 1 ? "student" : "students"}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Unranked. Take a quiz to receive your ranking!
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-2xl font-bold">{attempts.length}</p>
                <p className="text-sm text-muted-foreground">Total quizzes completed</p>
              </div>
            </CardContent>
          </Card>

          {/* Metric Cards Grid */}
          <div className={`grid gap-4 sm:gap-6 ${showRank ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"}`}>
            {showRank && (
              <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent shadow-xs">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Overall Rank</CardTitle>
                </CardHeader>
                <CardContent>
                  <Trophy className="mb-3 h-5 w-5 text-amber-500" />
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                    {rank?.currentRank !== null ? `#${rank?.currentRank}` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {rank?.currentRank !== null
                      ? `Cohort of ${rank?.totalStudents} students`
                      : "Take a quiz to enter rank"}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Quizzes Attempted</CardTitle>
              </CardHeader>
              <CardContent>
                <BookOpen className="mb-3 h-5 w-5 text-primary" />
                <p className="text-3xl font-bold">{attempts.length}</p>
              </CardContent>
            </Card>

            <Card className="shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Percentage Score</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendingUp className="mb-3 h-5 w-5 text-emerald-600" />
                <p className="text-3xl font-bold">{average}%</p>
              </CardContent>
            </Card>

            <Card className="shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Highest Scoring Chapter</CardTitle>
              </CardHeader>
              <CardContent>
                <Award className="mb-3 h-5 w-5 text-amber-600" />
                <p className="truncate font-semibold">{highest?.chapterName || "No attempts yet"}</p>
                <p className="text-sm text-muted-foreground">
                  {highest ? `${Math.round(Number(highest.percentage))}%` : "Start a quiz"}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Quiz History */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle>Quiz History</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="py-8 text-center text-sm text-destructive">{error}</p>
            ) : attempts.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-muted-foreground">No completed quizzes yet.</p>
                <Link href="/quizzes">
                  <Button className="mt-4">Take Your First Quiz</Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b text-muted-foreground">
                    <tr>
                      <th className="pb-3 pr-4 font-medium">Chapter Name</th>
                      <th className="pb-3 pr-4 font-medium">Score</th>
                      <th className="pb-3 pr-4 font-medium">Percentage</th>
                      <th className="pb-3 pr-4 font-medium">Date Completed</th>
                      <th className="pb-3 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((attempt) => {
                      const percentage = Number(attempt.percentage)
                      return (
                        <tr key={attempt.id} className="border-b last:border-0">
                          <td className="py-4 pr-4 font-medium">{attempt.chapterName}</td>
                          <td className="py-4 pr-4">
                            {attempt.score} / {attempt.totalQuestions}
                          </td>
                          <td className="py-4 pr-4">
                            <Badge variant="outline" className={percentageClass(percentage)}>
                              {Math.round(percentage)}%
                            </Badge>
                          </td>
                          <td className="py-4 pr-4 text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="h-4 w-4" />
                              {new Date(attempt.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <Link href={`/quizzes/${attempt.quizId}`}>
                              <Button variant="outline" size="sm">
                                Retake Quiz
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  )
}
