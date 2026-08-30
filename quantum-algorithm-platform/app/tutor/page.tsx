'use client'

import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { AITutorView } from '@/components/tutor/AITutorView'

export default function TutorPage() {
  return (
    <AppShell>
      <AITutorView />
    </AppShell>
  )
}
