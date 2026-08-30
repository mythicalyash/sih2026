'use client'

import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { QuantumSimulatorWorkbench } from '@/components/simulator/QuantumSimulatorWorkbench'

export default function SimulatorPage() {
  return (
    <AppShell isSimulator={true}>
      <QuantumSimulatorWorkbench />
    </AppShell>
  )
}
