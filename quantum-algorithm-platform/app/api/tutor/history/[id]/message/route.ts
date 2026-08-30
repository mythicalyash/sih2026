import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/config'

type Params = { params: Promise<{ id: string }> }

/** POST /api/tutor/history/[id]/message → Save a message to a session */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const backendRes = await fetch(`${BACKEND_URL}/api/tutor/history/${id}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await backendRes.json()
    return NextResponse.json(data, { status: backendRes.status })
  } catch (error: any) {
    console.error('Next.js History Message Error:', error)
    return NextResponse.json(
      { detail: error.message || 'Failed to save message' },
      { status: 500 }
    )
  }
}
