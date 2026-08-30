'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { ChallengeSolverView } from '@/components/problems/ChallengeSolverView'
import type { QuantumProblem, ProblemProgressState } from '@/types/quantum'
import { BACKEND_URL } from '@/config'
import { Loader2 } from 'lucide-react'

export default function ProblemSolverPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const problemId = resolvedParams.id
  const router = useRouter()

  const [allProblems, setAllProblems] = useState<QuantumProblem[]>([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<ProblemProgressState>({
    solvedProblemIds: ['superposition'],
    attemptedProblemIds: ['superposition', 'bell_state'],
    streakDays: 14,
    totalXp: 3450,
  })

  useEffect(() => {
    fetch(`${BACKEND_URL}/problems`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: QuantumProblem[]) => {
        setAllProblems(data)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })

    try {
      const saved = localStorage.getItem('qubit_lab_problem_progress')
      if (saved) setProgress(JSON.parse(saved))
    } catch {}
  }, [])

  const currentProblem = allProblems.find((p) => p.id === problemId) || allProblems[0]

  const handleProblemSolved = (solvedId: string, nextProblemId?: string | null) => {
    setProgress((prev) => {
      const nextSolved = prev.solvedProblemIds.includes(solvedId)
        ? prev.solvedProblemIds
        : [...prev.solvedProblemIds, solvedId]
      const nextXp = prev.solvedProblemIds.includes(solvedId) ? prev.totalXp : prev.totalXp + 150
      const nextProg = { ...prev, solvedProblemIds: nextSolved, totalXp: nextXp }
      try {
        localStorage.setItem('qubit_lab_problem_progress', JSON.stringify(nextProg))
      } catch {}
      return nextProg
    })

    if (nextProblemId) {
      router.push(`/problems/${nextProblemId}`)
    }
  }

  return (
    <AppShell isSimulator={true}>
      {loading ? (
        <div className="flex h-screen w-full items-center justify-center gap-2 text-xs text-[#746e64]">
          <Loader2 className="h-5 w-5 animate-spin text-[#c96b2c]" />
          <span>Loading Quantum Challenge...</span>
        </div>
      ) : currentProblem ? (
        <ChallengeSolverView
          problem={currentProblem}
          allProblems={allProblems}
          onSelectProblem={(p) => router.push(`/problems/${p.id}`)}
          onBackToCatalog={() => router.push('/problems')}
          onProblemSolved={handleProblemSolved}
          isSolved={progress.solvedProblemIds.includes(currentProblem.id)}
        />
      ) : (
        <div className="p-8 text-center">
          <p className="text-sm text-[#746e64]">Problem not found.</p>
          <button
            onClick={() => router.push('/problems')}
            className="mt-4 rounded-lg bg-[#c96b2c] px-4 py-2 text-xs font-bold text-white"
          >
            Back to Problemset
          </button>
        </div>
      )}
    </AppShell>
  )
}
