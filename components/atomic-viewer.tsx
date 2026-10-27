"use client"

import { useEffect, useMemo, useState } from "react"
import { Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AtomicViewerProps {
  elementName: string
  symbol: string
  atomicNumber: number
  electronConfiguration: string
}

const nobleGasShells: Record<string, number[]> = {
  He: [2],
  Ne: [2, 8],
  Ar: [2, 8, 8],
  Kr: [2, 8, 18, 8],
  Xe: [2, 8, 18, 18, 8],
  Rn: [2, 8, 18, 32, 18, 8],
  Og: [2, 8, 18, 32, 32, 18, 8],
}

const superscriptDigits: Record<string, string> = {
  "⁰": "0",
  "¹": "1",
  "²": "2",
  "³": "3",
  "⁴": "4",
  "⁵": "5",
  "⁶": "6",
  "⁷": "7",
  "⁸": "8",
  "⁹": "9",
}

function getShellCounts(atomicNumber: number, electronConfiguration: string) {
  const shellCounts: number[] = []
  const core = electronConfiguration.match(/\[([A-Z][a-z]?)\]/)?.[1]
  const coreShells = core ? nobleGasShells[core] : undefined

  if (coreShells) {
    coreShells.forEach((count, index) => {
      shellCounts[index] = count
    })
  }

  const subshells = electronConfiguration.matchAll(/(\d+)[spdf]([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g)
  for (const [, shellNumber, superscriptCount] of subshells) {
    const count = Number(
      [...superscriptCount].map((digit) => superscriptDigits[digit]).join("")
    )
    const index = Number(shellNumber) - 1
    shellCounts[index] = (shellCounts[index] ?? 0) + count
  }

  if (shellCounts.reduce((total, count) => total + count, 0) === atomicNumber) {
    return shellCounts.filter((count) => count > 0)
  }

  let remaining = atomicNumber
  return Array.from({ length: 7 }, (_, index) => {
    const capacity = 2 * (index + 1) ** 2
    const count = Math.min(remaining, capacity)
    remaining -= count
    return count
  }).filter((count) => count > 0)
}

export function AtomicViewer({
  elementName,
  symbol,
  atomicNumber,
  electronConfiguration,
}: AtomicViewerProps) {
  const [elapsed, setElapsed] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const shells = useMemo(
    () => getShellCounts(atomicNumber, electronConfiguration),
    [atomicNumber, electronConfiguration]
  )

  useEffect(() => {
    if (isPaused) return

    let animationFrame = 0
    let lastUpdate = 0
    const animate = (timestamp: number) => {
      if (timestamp - lastUpdate >= 1000 / 30) {
        setElapsed(timestamp)
        lastUpdate = timestamp
      }
      animationFrame = requestAnimationFrame(animate)
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [isPaused])

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div className="relative mx-auto aspect-square w-full max-w-[320px]">
        <svg
          viewBox="0 0 300 300"
          role="img"
          aria-label={`${elementName} (${symbol}) atomic structure with ${atomicNumber} electrons`}
          className="h-full w-full overflow-visible"
        >
          <defs>
            <radialGradient id="nucleusGlow">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.95" />
              <stop offset="55%" stopColor="#fb923c" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
            </radialGradient>
            <filter id="electronGlow" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {shells.map((electronCount, shellIndex) => {
            const radius = 30 + shellIndex * (102 / Math.max(shells.length - 1, 1))
            const speed = 0.0003 + shellIndex * 0.00008
            const direction = shellIndex % 2 === 0 ? 1 : -1
            const rotation = elapsed * speed * direction * (180 / Math.PI)

            return (
              <g key={`shell-${shellIndex}`}>
                <circle
                  cx="150"
                  cy="150"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity="0.18"
                  strokeWidth="1"
                />
                <g transform={`rotate(${rotation} 150 150)`}>
                  {Array.from({ length: electronCount }, (_, electronIndex) => {
                    const angle = (electronIndex / electronCount) * Math.PI * 2
                    const x = 150 + Math.cos(angle) * radius
                    const y = 150 + Math.sin(angle) * radius

                    return (
                      <circle
                        key={`electron-${shellIndex}-${electronIndex}`}
                        cx={x}
                        cy={y}
                        r="3.5"
                        fill="#22d3ee"
                        filter="url(#electronGlow)"
                      />
                    )
                  })}
                </g>
              </g>
            )
          })}

          <circle cx="150" cy="150" r="27" fill="url(#nucleusGlow)" />
          <circle cx="150" cy="150" r="15" fill="#f97316" fillOpacity="0.95" />
          <circle cx="145" cy="145" r="3" fill="#fff7ed" />
          <circle cx="155" cy="146" r="3" fill="#fed7aa" />
          <circle cx="149" cy="155" r="3" fill="#fff7ed" />
          <circle cx="157" cy="155" r="3" fill="#fed7aa" />
        </svg>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Electron shells
        </p>
        <p className="mt-1 text-3xl font-bold tracking-tight">{shells.join(" • ")}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsPaused((paused) => !paused)}
        aria-label={isPaused ? "Resume electron animation" : "Pause electron animation"}
      >
        {isPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
        {isPaused ? "Resume animation" : "Pause animation"}
      </Button>
    </div>
  )
}
