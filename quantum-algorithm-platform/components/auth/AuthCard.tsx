'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Atom,
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Compass,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const SKY_GRADIENT =
  'linear-gradient(to bottom, #06070a 0%, #101c34 16%, #2c4372 36%, #8ca0c4 54%, #ede9e2 68%, #f3b878 84%, #e8863c 100%)'

function BackgroundField({ mouseRef }: { mouseRef: React.MutableRefObject<{ x: number; y: number }> }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const nodesRef = useRef<{ x: number; y: number }[]>([])
  const edgesRef = useRef<[number, number][]>([])
  const cometsRef = useRef<{ x: number; y: number; vx: number; vy: number }[]>([])
  const rafRef = useRef<number | null>(null)

  const spawnComet = (w: number, h: number, dpr: number) => {
    const edge = Math.floor(Math.random() * 4)
    let x = 0, y = 0
    if (edge === 0) { x = Math.random() * w; y = -20 }
    else if (edge === 1) { x = w + 20; y = Math.random() * h }
    else if (edge === 2) { x = Math.random() * w; y = h + 20 }
    else { x = -20; y = Math.random() * h }
    const speed = 0.12 + Math.random() * 0.2
    const angle = Math.random() * Math.PI * 2
    return {
      x: x * dpr,
      y: y * dpr,
      vx: Math.cos(angle) * speed * dpr,
      vy: Math.sin(angle) * speed * dpr,
    }
  }

  const setup = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'

    const spacing = 92
    const nodes: { x: number; y: number }[] = []
    let row = 0
    for (let y = -spacing; y < h + spacing; y += spacing * 0.87) {
      const offset = row % 2 === 0 ? 0 : spacing / 2
      for (let x = -spacing; x < w + spacing; x += spacing) {
        nodes.push({ x: (x + offset) * dpr, y: y * dpr })
      }
      row++
    }
    nodesRef.current = nodes

    const edges: [number, number][] = []
    const threshold = spacing * dpr * 1.05
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x
        const dy = nodes[i].y - nodes[j].y
        if (Math.sqrt(dx * dx + dy * dy) < threshold) edges.push([i, j])
      }
    }
    edgesRef.current = edges

    if (cometsRef.current.length === 0) {
      cometsRef.current = Array.from({ length: 7 }).map(() => spawnComet(w, h, dpr))
    }
  }

  useEffect(() => {
    setup()
    window.addEventListener('resize', setup)

    const loop = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const dpr = window.devicePixelRatio || 1
      const w = window.innerWidth
      const h = window.innerHeight

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      ctx.strokeStyle = 'rgba(167, 139, 250, 0.12)'
      ctx.lineWidth = 1 * dpr
      ctx.beginPath()
      for (const [i, j] of edgesRef.current) {
        const a = nodesRef.current[i]
        const b = nodesRef.current[j]
        if (a && b) {
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
        }
      }
      ctx.stroke()

      const mouse = mouseRef.current
      if (mouse.x > -1000) {
        const mouseRadius = 140 * dpr
        for (const n of nodesRef.current) {
          const dx = n.x - mouse.x
          const dy = n.y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < mouseRadius) {
            const alpha = (1 - dist / mouseRadius) * 0.45
            ctx.strokeStyle = `rgba(253, 224, 71, ${alpha})`
            ctx.lineWidth = 1.2 * dpr
            ctx.beginPath()
            ctx.moveTo(n.x, n.y)
            ctx.lineTo(mouse.x, mouse.y)
            ctx.stroke()
          }
        }
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
      for (const c of cometsRef.current) {
        c.x += c.vx
        c.y += c.vy
        if (c.x < -40 || c.x > canvas.width + 40 || c.y < -40 || c.y > canvas.height + 40) {
          Object.assign(c, spawnComet(w, h, dpr))
        }
        ctx.beginPath()
        ctx.arc(c.x, c.y, 1.4 * dpr, 0, Math.PI * 2)
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('resize', setup)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 block h-full w-full"
    />
  )
}

export function AuthCard({ defaultMode = 'signin', onAuthSuccess }: { defaultMode?: 'signin' | 'signup'; onAuthSuccess?: () => void }) {
  const router = useRouter()
  const { login, signup, loginWithOAuth, loginAsGuest, isConfigured } = useAuth()

  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const bgMouseRef = useRef({ x: -99999, y: -99999 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    bgMouseRef.current = {
      x: (e.clientX - rect.left) * dpr,
      y: (e.clientY - rect.top) * dpr,
    }
  }

  const handleMouseLeave = () => {
    bgMouseRef.current = { x: -99999, y: -99999 }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!email || !password) {
      setErrorMessage('Please provide both email and password.')
      return
    }

    if (mode === 'signup' && password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'signin') {
        const res = await login(email, password)
        if (res.success) {
          setSuccessMessage('Welcome back! Redirecting to Quantum Workspace...')
          setTimeout(() => {
            if (onAuthSuccess) onAuthSuccess()
            else router.push('/')
          }, 800)
        } else {
          setErrorMessage(res.error || 'Invalid email or password.')
        }
      } else {
        const res = await signup(email, password, name)
        if (res.success) {
          setSuccessMessage('Account created successfully! Redirecting...')
          setTimeout(() => {
            if (onAuthSuccess) onAuthSuccess()
            else router.push('/')
          }, 800)
        } else {
          setErrorMessage(res.error || 'Failed to create account.')
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleGuestDemo = () => {
    loginAsGuest(name || 'Arjun Mehta')
    setSuccessMessage('Access granted as Demo Student! Redirecting...')
    setTimeout(() => {
      if (onAuthSuccess) onAuthSuccess()
      else router.push('/')
    }, 600)
  }

  const handleOAuth = async (provider: 'google' | 'github') => {
    setLoading(true)
    setErrorMessage(null)
    const res = await loginWithOAuth(provider)
    if (!res.success) {
      setErrorMessage(res.error || `Failed to sign in with ${provider}`)
      setLoading(false)
    }
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ background: SKY_GRADIENT }}
      className="relative min-h-screen w-full select-none overflow-hidden flex flex-col items-center justify-center p-4 sm:p-6"
    >
      <BackgroundField mouseRef={bgMouseRef} />

      {/* Top Logo */}
      <div
        onClick={() => router.push('/landing')}
        className="absolute left-6 top-6 flex items-center gap-2 sm:left-10 sm:top-8 cursor-pointer z-20 group"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur group-hover:bg-white/20 transition-all">
          <Atom className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold text-white tracking-tight">
          QubitLab
        </span>
      </div>

      {/* Center Auth Card */}
      <div className="relative z-10 w-full max-w-md bg-[#0f172a]/80 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl text-white">
        {/* Glow Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#c96b2c] to-[#a78bfa] flex items-center justify-center shadow-lg shadow-[#c96b2c]/30 mb-3 animate-pulse">
            <Atom className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            {mode === 'signin' ? 'Welcome to QubitLab' : 'Create your Account'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xs leading-relaxed">
            {mode === 'signin'
              ? 'Sign in to access your interactive quantum circuits, AI tutor, and algorithm problemsets.'
              : 'Join the next-generation quantum computing playground.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white/10 p-1 rounded-xl mb-6 border border-white/10">
          <button
            type="button"
            onClick={() => {
              setMode('signin')
              setErrorMessage(null)
              setSuccessMessage(null)
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup')
              setErrorMessage(null)
              setSuccessMessage(null)
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error / Success Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Arjun Mehta"
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-10 py-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c96b2c] focus:bg-white/15 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@quantum.org"
                className="w-full bg-white/10 border border-white/15 rounded-xl px-10 py-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c96b2c] focus:bg-white/15 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/10 border border-white/15 rounded-xl px-10 py-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c96b2c] focus:bg-white/15 transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-[#c96b2c] to-[#e8863c] hover:from-[#b55c20] hover:to-[#d0752d] text-white font-bold text-xs shadow-lg shadow-[#c96b2c]/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{mode === 'signin' ? 'Sign In to QubitLab' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="w-full border-t border-white/15" />
          <span className="absolute bg-[#0f172a] px-3 text-[10px] uppercase tracking-wider text-slate-400 font-semibold font-mono">
            Or continue with
          </span>
        </div>

        {/* Social / OAuth */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-white font-semibold transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
              />
            </svg>
            <span>Google</span>
          </button>

          <button
            type="button"
            onClick={() => handleOAuth('github')}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-white font-semibold transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>GitHub</span>
          </button>
        </div>

        {/* Fast Guest / Demo Mode Button */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col items-center">
          <button
            type="button"
            onClick={handleGuestDemo}
            className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-amber-200/90 font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant Demo / Continue as Arjun Mehta</span>
          </button>
        </div>
      </div>

      {/* Back to landing */}
      <button
        onClick={() => router.push('/landing')}
        className="relative z-10 mt-6 text-xs text-white/70 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
      >
        ← Back to Overview
      </button>
    </div>
  )
}
