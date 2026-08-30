import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/config'

/** GET /api/tutor/history → List all saved chat sessions */
export async function GET() {
  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/tutor/history`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await backendRes.json()
    return NextResponse.json(data, { status: backendRes.status })
  } catch (error: any) {
    console.error('Next.js History List Error:', error)
    return NextResponse.json(
      { detail: error.message || 'Failed to list chat sessions' },
      { status: 500 }
    )
  }
}

/** POST /api/tutor/history → Create a new chat session */
export async function POST(req: NextRequest) {
  try {
    let body = {}
    try { body = await req.json() } catch { /* empty body is fine */ }

    const backendRes = await fetch(`${BACKEND_URL}/api/tutor/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await backendRes.json()
    return NextResponse.json(data, { status: backendRes.status })
  } catch (error: any) {
    console.error('Next.js History Create Error:', error)
    return NextResponse.json(
      { detail: error.message || 'Failed to create chat session' },
      { status: 500 }
    )
  }
}
