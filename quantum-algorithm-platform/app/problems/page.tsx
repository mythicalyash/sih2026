'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { ProblemsListView } from '@/components/problems/ProblemsListView'
import { ProblemDetailView } from '@/components/problems/ProblemDetailView'
import type { QuantumProblem, ProblemProgressState } from '@/types/quantum'
import { BACKEND_URL } from '@/config'

export default function ProblemsPage() {
  const router = useRouter()
  const [allProblems, setAllProblems] = useState<QuantumProblem[]>([])
  const [selectedProblemDetail, setSelectedProblemDetail] = useState<QuantumProblem | null>(null)
  const [progress, setProgress] = useState<ProblemProgressState>({
    solvedProblemIds: ['superposition'],
    attemptedProblemIds: ['superposition', 'bell_state'],
    streakDays: 14,
    totalXp: 3450,
  })

  useEffect(() => {
    fetch(`${BACKEND_URL}/problems`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setAllProblems(data))
      .catch(() => {})

    try {
      const saved = localStorage.getItem('qubit_lab_problem_progress')
      if (saved) setProgress(JSON.parse(saved))
    } catch {}
  }, [])

  const handleOpenInSimulator = (problem: QuantumProblem) => {
    router.push(`/problems/${problem.id}`)
  }

  return (
    <AppShell>
      {selectedProblemDetail ? (
        <ProblemDetailView
          problem={selectedProblemDetail}
          isSolved={progress.solvedProblemIds.includes(selectedProblemDetail.id)}
          onBack={() => setSelectedProblemDetail(null)}
          onOpenInSimulator={handleOpenInSimulator}
        />
      ) : (
        <ProblemsListView
          onSelectProblem={(p) => setSelectedProblemDetail(p)}
          onOpenInSimulator={handleOpenInSimulator}
          progress={progress}
        />
      )}
    </AppShell>
  )
}
