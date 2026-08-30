'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { LearnView } from '@/components/learning/LearnView'
import type { QuantumProblem, ProblemProgressState } from '@/types/quantum'
import { BACKEND_URL } from '@/config'

export default function LearnPage() {
  const router = useRouter()
  const [learnSubTab, setLearnSubTab] = useState<'courses' | 'problems'>('courses')
  const [allProblems, setAllProblems] = useState<QuantumProblem[]>([])
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

  const handleProblemSolved = (problemId: string) => {
    setProgress((prev) => {
      const nextSolved = prev.solvedProblemIds.includes(problemId)
        ? prev.solvedProblemIds
        : [...prev.solvedProblemIds, problemId]
      const nextXp = prev.solvedProblemIds.includes(problemId) ? prev.totalXp : prev.totalXp + 150
      const nextProg = { ...prev, solvedProblemIds: nextSolved, totalXp: nextXp }
      try {
        localStorage.setItem('qubit_lab_problem_progress', JSON.stringify(nextProg))
      } catch {}
      return nextProg
    })
  }

  const handleNavigate = (tab: string) => {
    if (tab === 'Home') router.push('/')
    else if (tab === 'Problems') router.push('/problems')
    else if (tab === 'Quantum Simulation') router.push('/simulator')
    else if (tab === 'AI Tutor') router.push('/tutor')
    else if (tab === 'Dashboard') router.push('/dashboard')
    else if (tab === 'Community') router.push('/community')
    else if (tab === 'Settings') router.push('/settings')
  }

  return (
    <AppShell>
      <LearnView
        setActive={handleNavigate}
        learnSubTab={learnSubTab}
        setLearnSubTab={setLearnSubTab}
        allProblems={allProblems}
        progress={progress}
        onProblemSolved={handleProblemSolved}
      />
    </AppShell>
  )
}
