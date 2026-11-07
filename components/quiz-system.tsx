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
import { useAuth } from "@/contexts/auth-context"

interface Question {
  id: string
  type: "multiple-choice"
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  difficulty: "easy" | "medium" | "hard"
  topic: string
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
  showResult,
  isCorrect,
}: {
  question: Question
  selectedAnswer: number | null
  onAnswerSelect: (answer: number) => void
  showResult: boolean
  isCorrect: boolean | null
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
          disabled={showResult}
        >
          {question.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem value={index.toString()} id={`option-${index}`} />
              <Label
                htmlFor={`option-${index}`}
                className={`flex-1 cursor-pointer p-2 rounded transition-colors ${
                  showResult && index === question.correctAnswer
                    ? "bg-green-100 text-green-800 border border-green-300 dark:bg-green-950 dark:text-green-200"
                    : showResult && index === selectedAnswer && index !== question.correctAnswer
                      ? "bg-red-100 text-red-800 border border-red-300 dark:bg-red-950 dark:text-red-200"
                      : ""
                }`}
                dangerouslySetInnerHTML={{ __html: option }}
              />
            </div>
          ))}
        </RadioGroup>

        {showResult && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">{isCorrect ? "Correct!" : "Incorrect"}</span>
            </div>
            <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: question.explanation }} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function QuizViewer({ chapter, onBack }: { chapter: Chapter; onBack: () => void }) {
  const router = useRouter()
  const { user } = useAuth()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<{ [key: string]: number }>({})
  const [showResults, setShowResults] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [score, setScore] = useState(0)
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
  const progress = ((currentIndex + 1) / questions.length) * 100

  const handleCheckAnswer = () => {
    if (showResults || answers[currentQuestion.id] === undefined) return

    if (answers[currentQuestion.id] === currentQuestion.correctAnswer) {
      setScore((currentScore) => currentScore + 1)
    }
    setShowResults(true)
  }

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setShowResults(false)
    } else {
      setSubmitting(true)
      setSubmitError(null)

      try {
        const optionKeys = ["A", "B", "C", "D"];
        const answerRecords = questions.map((q) => {
          const selectedIdx = answers[q.id];
          const hasSelected = selectedIdx !== undefined && selectedIdx !== null;
          return {
            questionId: Number(q.id),
            selectedOption: hasSelected ? (optionKeys[selectedIdx] || null) : null,
            isCorrect: hasSelected ? selectedIdx === q.correctAnswer : false,
          };
        });

        const response = await fetch("/api/quizzes/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user?.id,
            quizId: chapter.id,
            chapterId: chapter.id,
            chapterName: chapter.title,
            score,
            totalQuestions: questions.length,
            answers: answerRecords,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to submit quiz")
        }

        setQuizCompleted(true)
        router.push("/dashboard")
      } catch (error) {
        console.error("Failed to submit quiz:", error)
        setSubmitError("Quiz submission failed. Please try again.")
      } finally {
        setSubmitting(false)
      }
    }
  }

  const percentage = Math.round((score / questions.length) * 100)
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
            {questions.filter((q) => answers[q.id] === q.correctAnswer).length} out of {questions.length} correct
          </p>
          <div className="flex justify-center gap-4 mt-6">
            <Button onClick={onBack} variant="outline">Back to Quizzes</Button>
            <Button onClick={() => { setCurrentIndex(0); setAnswers({}); setScore(0); setShowResults(false); setQuizCompleted(false); setSubmitError(null); }}>
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
        showResult={showResults}
        isCorrect={showResults && answers[currentQuestion.id] === currentQuestion.correctAnswer}
      />

      <div className="flex justify-end">
        <div className="flex gap-2">
          {!showResults && (
            <Button
              onClick={handleCheckAnswer}
              variant="secondary"
              disabled={answers[currentQuestion.id] === undefined}
            >
              Check Answer
            </Button>
          )}
          {showResults && (
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