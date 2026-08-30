import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/config'

type Params = { params: Promise<{ id: string }> }

/** GET /api/tutor/history/[id] → Get session detail with messages */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const backendRes = await fetch(`${BACKEND_URL}/api/tutor/history/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await backendRes.json()
    return NextResponse.json(data, { status: backendRes.status })
  } catch (error: any) {
    console.error('Next.js History Detail Error:', error)
    return NextResponse.json(
      { detail: error.message || 'Failed to fetch session' },
      { status: 500 }
    )
  }
}

/** DELETE /api/tutor/history/[id] → Delete a session */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const backendRes = await fetch(`${BACKEND_URL}/api/tutor/history/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await backendRes.json()
    return NextResponse.json(data, { status: backendRes.status })
  } catch (error: any) {
    console.error('Next.js History Delete Error:', error)
    return NextResponse.json(
      { detail: error.message || 'Failed to delete session' },
      { status: 500 }
    )
  }
}

/** PATCH /api/tutor/history/[id] → Update session title */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const backendRes = await fetch(`${BACKEND_URL}/api/tutor/history/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await backendRes.json()
    return NextResponse.json(data, { status: backendRes.status })
  } catch (error: any) {
    console.error('Next.js History Patch Error:', error)
    return NextResponse.json(
      { detail: error.message || 'Failed to update session' },
      { status: 500 }
    )
  }
}
