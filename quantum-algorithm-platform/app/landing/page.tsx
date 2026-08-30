'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import LandingPage from '@/QubitLabLanding'

export default function LandingPageRoute() {
  const router = useRouter()

  const handleGetStarted = () => {
    router.push('/auth')
  }

  return <LandingPage onGetStarted={handleGetStarted} />
}
