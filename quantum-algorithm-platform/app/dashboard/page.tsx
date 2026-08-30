'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { LearningDashboard } from '@/components/dashboard/LearningDashboard'

export default function DashboardPage() {
  const router = useRouter()

  const handleNavigate = (tab: string) => {
    if (tab === 'Learn Quantum') router.push('/learn')
    else if (tab === 'Problems') router.push('/problems')
    else if (tab === 'Quantum Simulation') router.push('/simulator')
    else if (tab === 'AI Tutor') router.push('/tutor')
    else if (tab === 'Community') router.push('/community')
    else if (tab === 'Settings') router.push('/settings')
    else router.push('/')
  }

  return (
    <AppShell>
      <LearningDashboard onNavigate={handleNavigate} />
    </AppShell>
  )
}
