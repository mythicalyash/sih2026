import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/config'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const backendRes = await fetch(`${BACKEND_URL}/api/tutor/quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await backendRes.json()
    return NextResponse.json(data, { status: backendRes.status })
  } catch (error: any) {
    console.error('Next.js API Tutor Quiz Error:', error)
    return NextResponse.json(
      { detail: error.message || 'Failed to connect to backend Quiz Generator service' },
      { status: 500 }
    )
  }
}
