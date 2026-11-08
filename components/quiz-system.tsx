"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, RotateCcw, Trophy, Target, Lock, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface Question {
  id: string
  type: "multiple-choice"
  question: string
  options: string[]
  difficulty: "easy" | "medium" | "hard"
  topic: string
}

interface CheckResult {
  isCorrect: boolean
  correctAnswer: number
  explanation: string
}

interface Chapter {
  id: number
  chapter_number: number
  title: string
  class_level?: number | string
  class?: number | string
  question_count: number
}

function QuestionCard({
  question,
  selectedAnswer,
  onAnswerSelect,
  result,
}: {
  question: Question
  selectedAnswer: number | null
  onAnswerSelect: (answer: number) => void
  result: CheckResult | null
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs uppercase">
            {question.difficulty}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {question.topic}
          </Badge>
        </div>
        <CardTitle 
          className="font-serif text-lg mt-2" 
          dangerouslySetInnerHTML={{ __html: question.question }} 
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fixed: Returns "" instead of undefined when selectedAnswer is null */}
        <RadioGroup
          value={selectedAnswer !== null && selectedAnswer !== undefined ? selectedAnswer.toString() : ""}
          onValueChange={(val) => onAnswerSelect(Number(val))}
          disabled={!!result}
        >
          {question.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem value={index.toString()} id={`option-${index}`} />
              <Label
                htmlFor={`option-${index}`}
                className={`flex-1 cursor-pointer p-2 rounded transition-colors ${
                  result && index === result.correctAnswer
                    ? "bg-green-100 text-green-800 border border-green-300 dark:bg-green-950 dark:text-green-200"
                    : result && index === selectedAnswer && index !== result.correctAnswer
                      ? "bg-red-100 text-red-800 border border-red-300 dark:bg-red-950 dark:text-red-200"
                      : ""
                }`}
                dangerouslySetInnerHTML={{ __html: option }}
              />
            </div>
          ))}
        </RadioGroup>

        {result && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {result.isCorrect ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">{result.isCorrect ? "Correct!" : "Incorrect"}</span>
            </div>
            <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: result.explanation }} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function QuizViewer({ chapter, onBack }: { chapter: Chapter; onBack: () => void }) {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<{ [key: string]: number }>({})
  const [checkResults, setCheckResults] = useState<{ [key: string]: CheckResult }>({})
  const [checking, setChecking] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [finalResult, setFinalResult] = useState<{ score: number; totalQuestions: number; percentage: number } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await fetch(`/api/quizzes?chapter_id=${chapter.id}`)
        const data = await res.json()
        setQuestions(data.questions || [])
      } catch (err) {
        console.error("Failed to load questions:", err)
      } finally {
        setLoading(false)
      }
    }
    loadQuestions()
  }, [chapter.id])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12 space-y-4 max-w-xl mx-auto">
        <h3 className="text-xl font-bold">No questions available yet.</h3>
        <Button onClick={onBack}>Back to Chapters</Button>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const currentResult = checkResults[currentQuestion.id] ?? null
  const progress = ((currentIndex + 1) / questions.length) * 100

  const handleCheckAnswer = async () => {
    const selected = answers[currentQuestion.id]
    if (currentResult || checking || selected === undefined || selected === null) return

    setChecking(true)
    setSubmitError(null)

    try {
      const optionKeys = ["A", "B", "C", "D"]
      const response = await fetch("/api/quizzes/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: Number(currentQuestion.id),
          selectedOption: optionKeys[selected],
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to check answer")
      }

      const data = await response.json()
      setCheckResults((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          isCorrect: Boolean(data.isCorrect),
          correctAnswer: Number(data.correctAnswer ?? 0),
          explanation: String(data.explanation ?? ""),
        },
      }))
    } catch (error) {
      console.error("Failed to check answer:", error)
      setSubmitError("Could not check answer. Please try again.")
    } finally {
      setChecking(false)
    }
  }

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const optionKeys = ["A", "B", "C", "D"]
      const answerRecords = questions.map((q) => {
        const selectedIdx = answers[q.id]
        const hasSelected = selectedIdx !== undefined && selectedIdx !== null
        return {
          questionId: Number(q.id),
          selectedOption: hasSelected ? optionKeys[selectedIdx] ?? null : null,
        }
      })

      const response = await fetch("/api/quizzes/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: chapter.id,
          chapterId: chapter.id,
          chapterName: chapter.title,
          answers: answerRecords,
        }),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok || !data) {
        throw new Error("Failed to submit quiz")
      }

      setFinalResult({
        score: Number(data.score ?? 0),
        totalQuestions: Number(data.totalQuestions ?? questions.length),
        percentage: Number(data.percentage ?? 0),
      })
      setQuizCompleted(true)
      router.push("/dashboard")
    } catch (error) {
      console.error("Failed to submit quiz:", error)
      setSubmitError("Quiz submission failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const correctCount = finalResult?.score ?? questions.filter((q) => checkResults[q.id]?.isCorrect).length
  const percentage = finalResult?.percentage ?? Math.round((correctCount / questions.length) * 100)
  const passed = percentage >= 70

  if (quizCompleted) {
    return (
      <Card className="max-w-xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {passed ? <Trophy className="h-16 w-16 text-yellow-500" /> : <Target className="h-16 w-16 text-blue-500" />}
          </div>
          <CardTitle className="text-2xl font-serif">{passed ? "Congratulations!" : "Keep Practicing!"}</CardTitle>
          <CardDescription>You scored {percentage}% on Chapter {chapter.chapter_number}: {chapter.title}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="text-3xl font-bold">{percentage}%</div>
          <p className="text-sm text-muted-foreground">
            {correctCount} out of {finalResult?.totalQuestions ?? questions.length} correct
          </p>
          <div className="flex justify-center gap-4 mt-6">
            <Button onClick={onBack} variant="outline">Back to Quizzes</Button>
            <Button onClick={() => { setCurrentIndex(0); setAnswers({}); setCheckResults({}); setQuizCompleted(false); setFinalResult(null); setSubmitError(null); }}>
              <RotateCcw className="h-4 w-4 mr-2" /> Retake Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>Back to Quizzes</Button>
        <span className="text-sm text-muted-foreground">Question {currentIndex + 1} of {questions.length}</span>
      </div>

      <div>
        <h1 className="text-2xl font-serif font-bold mb-2">Chapter {chapter.chapter_number}: {chapter.title}</h1>
        <Progress value={progress} className="h-2" />
      </div>

      <QuestionCard
        question={currentQuestion}
        selectedAnswer={answers[currentQuestion.id] ?? null}
        onAnswerSelect={(ans) => setAnswers({ ...answers, [currentQuestion.id]: ans })}
        result={currentResult}
      />

      <div className="flex justify-end">
        <div className="flex gap-2">
          {!currentResult && (
            <Button
              onClick={handleCheckAnswer}
              variant="secondary"
              disabled={answers[currentQuestion.id] === undefined || checking}
            >
              {checking ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Check Answer
            </Button>
          )}
          {currentResult && (
            <Button onClick={handleNext} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {currentIndex === questions.length - 1 ? "Submit Quiz" : "Next"}
            </Button>
          )}
        </div>
      </div>
      {submitError && <p className="text-right text-sm text-destructive">{submitError}</p>}
    </div>
  )
}

export function QuizSystem({ initialChapterId }: { initialChapterId?: number } = {}) {
  const [selectedClass, setSelectedClass] = useState<string>("9")
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function fetchChapters() {
      setLoading(true)
      try {
        const res = await fetch(`/api/quizzes`)
        const data = await res.json()
        const fetchedChapters = data.chapters || []
        setChapters(fetchedChapters)
        if (initialChapterId) {
          const initialChapter = fetchedChapters.find((chapter: Chapter) => chapter.id === initialChapterId)
          if (initialChapter) setSelectedChapter(initialChapter)
        }
      } catch (err) {
        console.error("Failed to load chapters:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchChapters()
  }, [initialChapterId])

  if (selectedChapter) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <QuizViewer chapter={selectedChapter} onBack={() => setSelectedChapter(null)} />
      </div>
    )
  }

  // Flexibly check class level against string or number
  const filteredChapters = chapters.filter((c) => {
    const rawClass = c.class_level ?? c.class
    return String(rawClass) === String(selectedClass)
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold mb-1">Chemistry Quizzes</h2>
        <p className="text-muted-foreground">Select your class level and topic to practice</p>
      </div>

      <Tabs defaultValue="9" value={selectedClass} onValueChange={setSelectedClass}>
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="9">Class 9</TabsTrigger>
          <TabsTrigger value="10">Class 10</TabsTrigger>
          <TabsTrigger value="11">Class 11</TabsTrigger>
          <TabsTrigger value="12">Class 12</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredChapters.length === 0 ? (
        <Card className="p-8 text-center border-dashed max-w-2xl mx-auto">
          <Lock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold text-lg">Class {selectedClass} Content Coming Soon</h3>
          <p className="text-sm text-muted-foreground mt-1">
            We are currently adding chapters and questions for Class {selectedClass}. Check back soon!
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChapters.map((ch) => {
            const count = Number(ch.question_count) || 0
            const hasQuestions = count > 0

            return (
              <Card
                key={ch.id}
                className={`transition-all ${
                  hasQuestions
                    ? "hover:shadow-lg cursor-pointer border-primary/20"
                    : "opacity-60 cursor-not-allowed bg-muted/30"
                }`}
                onClick={() => hasQuestions && setSelectedChapter(ch)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={hasQuestions ? "default" : "secondary"}>
                      Chapter {ch.chapter_number}
                    </Badge>
                    {hasQuestions ? (
                      <span className="text-xs text-muted-foreground">{count} questions</span>
                    ) : (
                      <Badge variant="outline" className="text-xs border-amber-500 text-amber-600 dark:text-amber-400">
                        Coming Soon 🚀
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="font-serif text-lg">{ch.title}</CardTitle>
                  <CardDescription>
                    {hasQuestions
                      ? `Test your understanding of Chapter ${ch.chapter_number}.`
                      : "Questions for this chapter are currently being processed."}
                  </CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
