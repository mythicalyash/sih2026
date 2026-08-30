'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Flame, Award, BookOpen, Cpu, Target, CheckCircle2, ChevronRight,
  Sparkles, TrendingUp, Calendar, ArrowUpRight, ShieldCheck, Zap,
  Compass, BarChart3, HelpCircle, RefreshCw, UserCheck, Play, ArrowRight
} from 'lucide-react'
import { BACKEND_URL } from '@/config'

interface RadarPoint {
  concept: string
  score: number // 0-100
  category: string
}

interface KPICard {
  id: string
  title: string
  value: string
  subtitle: string
  footer: string
  tone: string
  icon: string
}

interface HeatmapDay {
  date: string
  iso_date: string
  count: number
  level: number
}

interface FocusArea {
  concept: string
  accuracy: string
  recommended_problem_id: string
  recommended_problem_title: string
}

interface UserProfile {
  name: string
  email: string
  role: string
  level: number
  level_title: string
  xp: number
  max_xp: number
  weekly_xp: number
  streak_days: number
  last_active_date: string
}

interface RecentActivityItem {
  id: string
  label: string
  detail: string
  time: string
  xp: string
  tone: string
}

interface DashboardMetrics {
  user_profile: UserProfile
  kpis: KPICard[]
  heatmap: HeatmapDay[][]
  total_events_6m: number
  current_streak_days: number
  radar_data: RadarPoint[]
  focus_area: FocusArea
  recent_activity: RecentActivityItem[]
}

const DEFAULT_METRICS: DashboardMetrics = {
  user_profile: {
    name: 'Quantum Learner',
    email: 'learner@qubitlab.io',
    role: 'Quantum Research Track',
    level: 1,
    level_title: 'Quantum Novice',
    xp: 0,
    max_xp: 1000,
    weekly_xp: 0,
    streak_days: 0,
    last_active_date: 'Today',
  },
  kpis: [
    {
      id: 'roadmap_progress',
      title: 'ROADMAP PROGRESS',
      value: '0/44',
      subtitle: '0% Completed',
      footer: '0 of 44 core modules completed',
      tone: 'orange',
      icon: 'book-open',
    },
    {
      id: 'courses_completed',
      title: 'COURSES COMPLETED',
      value: '0/5',
      subtitle: '0 Finished',
      footer: 'Foundational Quantum Tracks',
      tone: 'blue',
      icon: 'award',
    },
    {
      id: 'simulations_run',
      title: 'SIMULATIONS RUN',
      value: '0',
      subtitle: '+0% this week',
      footer: 'Aer / PennyLane local statevectors',
      tone: 'neutral',
      icon: 'cpu',
    },
    {
      id: 'quiz_accuracy',
      title: 'QUIZ ACCURACY',
      value: '0.0%',
      subtitle: 'New Learner',
      footer: 'Across foundational assessments',
      tone: 'green',
      icon: 'target',
    },
    {
      id: 'problems_solved',
      title: 'PROBLEMS SOLVED',
      value: '0/32',
      subtitle: '0 Verified',
      footer: 'Qiskit & PennyLane challenge bank',
      tone: 'orange',
      icon: 'award',
    },
  ],
  heatmap: [],
  total_events_6m: 0,
  current_streak_days: 0,
  radar_data: [
    { concept: 'Phase Kickback', score: 0, category: 'Gates & Oracles' },
    { concept: 'Quantum Superposition', score: 0, category: 'Foundations' },
    { concept: 'Entanglement & Bell States', score: 0, category: 'Foundations' },
    { concept: 'Quantum Gates & Circuits', score: 0, category: 'Circuits' },
    { concept: 'Quantum Algorithms', score: 0, category: 'Algorithms' },
    { concept: 'Measurement & Protocols', score: 0, category: 'Protocols' },
  ],
  focus_area: {
    concept: 'Quantum Superposition',
    accuracy: '0%',
    recommended_problem_id: 'superposition',
    recommended_problem_title: 'Superposition Challenge',
  },
  recent_activity: [],
}

export function LearningDashboard({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [metrics, setMetrics] = useState<DashboardMetrics>(DEFAULT_METRICS)
  const [loading, setLoading] = useState(false)
  const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number } | null>(null)
  const [activeConceptIndex, setActiveConceptIndex] = useState<number | null>(null)

  const fetchMetrics = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/dashboard/metrics`)
      if (res.ok) {
        const data: DashboardMetrics = await res.json()
        setMetrics(data)
      }
    } catch (e) {
      console.warn('Could not fetch live dashboard metrics from backend, using current state:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  const radarData = metrics.radar_data.length > 0 ? metrics.radar_data : DEFAULT_METRICS.radar_data

  // Calculate radar chart coordinates
  const radarCoords = useMemo(() => {
    const size = 300
    const center = size / 2
    const radius = 100
    const total = radarData.length
    const angleStep = (Math.PI * 2) / total

    // Polygon points for value
    const points = radarData.map((item, idx) => {
      const angle = idx * angleStep - Math.PI / 2
      const r = (item.score / 100) * radius
      const x = center + r * Math.cos(angle)
      const y = center + r * Math.sin(angle)
      return { x, y, angle, ...item }
    })

    const polygonPath = points.map(p => `${p.x},${p.y}`).join(' ')

    // Grid concentric polygon rings (25%, 50%, 75%, 100%)
    const rings = [0.25, 0.5, 0.75, 1.0].map(ratio => {
      const ringPoints = Array.from({ length: total }, (_, idx) => {
        const angle = idx * angleStep - Math.PI / 2
        const r = ratio * radius
        return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`
      }).join(' ')
      return { ratio, path: ringPoints }
    })

    // Axis lines
    const axes = radarData.map((item, idx) => {
      const angle = idx * angleStep - Math.PI / 2
      const x = center + radius * Math.cos(angle)
      const y = center + radius * Math.sin(angle)
      const labelX = center + (radius + 28) * Math.cos(angle)
      const labelY = center + (radius + 18) * Math.sin(angle)
      return { x, y, labelX, labelY, item, angle }
    })

    return { size, center, radius, points, polygonPath, rings, axes }
  }, [radarData])

  const profile = metrics.user_profile
  const xpPct = Math.min(100, Math.round((profile.xp / Math.max(1, profile.max_xp)) * 100))

  return (
    <div className="page-content animate-fadeIn" style={{ maxWidth: 1200, padding: '32px 40px' }}>
      {/* ── Page Title Header ───────────────────────────────────────── */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="text-[10px] font-bold text-[#c96b2c] uppercase tracking-wider mb-1">
            ANALYTICS &amp; METRICS
          </div>
          <h1
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontWeight: 400,
              fontSize: '36px',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              color: '#211f1b',
              margin: 0,
            }}
          >
            Learning Dashboard &amp; Analytics<span style={{ color: '#c96b2c' }}>.</span>
          </h1>
          <p className="text-[13px] text-[#746e64] mt-1.5">
            Track your algorithmic progress, daily practice consistency, and quantum concept mastery.
          </p>
        </div>

        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#ded7cb] bg-[#fffdf9] text-xs font-semibold text-[#746e64] hover:text-[#211f1b] hover:bg-[#f0ece4] transition-all cursor-pointer shadow-2xs"
          title="Refresh dashboard metrics"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#c96b2c]' : ''}`} />
          <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* ── Top Hero User Profile Card ──────────────────────────────── */}
      <div className="mb-6 rounded-2xl border border-[#ded7cb] bg-[#fffdf9] p-6 shadow-xs relative overflow-hidden">
        {/* Subtle background decorative element */}
        <div
          className="absolute top-0 right-0 w-80 h-full opacity-5 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 100% 0%, #c96b2c 0%, transparent 70%)',
          }}
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* User Info Left */}
          <div className="flex items-center gap-4">
            {/* Avatar with Flame Badge */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-[#f0ece4] border-2 border-[#ded7cb] flex items-center justify-center overflow-hidden shadow-2xs">
                <div className="w-full h-full bg-gradient-to-br from-[#e8decb] to-[#d6c7b0] flex items-center justify-center text-[#211f1b] font-bold text-xl">
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </div>
              </div>
              <div
                className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#c96b2c] text-white flex items-center justify-center shadow-xs border-2 border-[#fffdf9]"
                title={`${profile.streak_days}-day Practice Streak!`}
              >
                <Flame className="w-3.5 h-3.5 fill-current" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-[#211f1b] tracking-tight">{profile.name}</h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#f0ece4] text-[#211f1b] border border-[#ded7cb]">
                  Lvl {profile.level}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fff0e6] text-[#c96b2c] border border-[#c96b2c]/30">
                  {profile.level_title}
                </span>
              </div>
              <p className="text-xs text-[#746e64] font-medium">
                {profile.role}
              </p>
              <p className="text-[11.5px] text-[#938c80] font-mono mt-0.5">
                {profile.email}
              </p>
            </div>
          </div>

          {/* Level Progress Right */}
          <div className="lg:w-80 flex flex-col justify-center">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-[#746e64]">Level {profile.level} Progress</span>
              <span className="font-bold text-[#211f1b]">
                {profile.xp} / {profile.max_xp} XP <span className="text-[#c96b2c]">({xpPct}%)</span>
              </span>
            </div>

            {/* Custom Warm Gradient Progress Bar */}
            <div className="h-2.5 w-full rounded-full bg-[#f0ece4] overflow-hidden border border-[#ded7cb]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${xpPct}%`,
                  background: 'linear-gradient(90deg, #c96b2c 0%, #d97706 60%, #4f806d 100%)',
                }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#746e64] mt-1.5">
              <span>{Math.max(0, profile.max_xp - profile.xp)} XP until Level {profile.level + 1}</span>
              <span className="font-semibold text-[#4f806d] flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +{profile.weekly_xp} XP this week
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 KPI Metric Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.kpis.map((kpi) => {
          const IconComponent =
            kpi.icon === 'book-open' ? BookOpen :
            kpi.icon === 'cpu' ? Cpu :
            kpi.icon === 'target' ? Target : Award

          return (
            <div
              key={kpi.id}
              className="p-4 rounded-xl border border-[#ded7cb] bg-[#fffdf9] hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#746e64]">
                    {kpi.title}
                  </span>
                  <div className="w-6 h-6 rounded-md bg-[#f0ece4] text-[#746e64] flex items-center justify-center">
                    <IconComponent className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold text-[#211f1b]">{kpi.value}</div>
                  <span
                    className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${
                      kpi.tone === 'green'
                        ? 'bg-[#edf7ed] text-[#4f806d] border-[#4f806d]/30'
                        : kpi.tone === 'neutral'
                        ? 'bg-[#f0ece4] text-[#211f1b] border-[#ded7cb]'
                        : 'bg-[#fff5eb] text-[#c96b2c] border-[#c96b2c]/30'
                    }`}
                  >
                    {kpi.subtitle}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#ded7cb]/60 text-[11px] text-[#746e64]">
                {kpi.footer}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Middle Split Section: Heatmap (Left) & Radar Mastery (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Left Column (7 cols): Practice Activity Heatmap */}
        <div className="lg:col-span-7 rounded-2xl border border-[#ded7cb] bg-[#fffdf9] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-[#211f1b]">
                Daily Practice &amp; Simulation Activity
              </h3>
              {/* Legend */}
              <div className="flex items-center gap-1 text-[10px] text-[#746e64]">
                <span>Less</span>
                <span className="w-2.5 h-2.5 rounded-xs bg-[#f0ece4] border border-[#ded7cb]" />
                <span className="w-2.5 h-2.5 rounded-xs bg-[#e8c09a]" />
                <span className="w-2.5 h-2.5 rounded-xs bg-[#d97706]" />
                <span className="w-2.5 h-2.5 rounded-xs bg-[#c96b2c]" />
                <span className="w-2.5 h-2.5 rounded-xs bg-[#1e293b]" />
                <span>More</span>
              </div>
            </div>

            <p className="text-xs text-[#746e64] mb-4">
              {metrics.total_events_6m} quantum events logged in the last 6 months
            </p>

            {/* Heatmap Grid Container with Overflow Scroll */}
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-1 min-w-[500px]">
                {metrics.heatmap.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1">
                    {week.map((cell, dIdx) => {
                      const levelColors = [
                        'bg-[#f0ece4] border border-[#ded7cb]', // 0
                        'bg-[#eed6be] hover:bg-[#e2c1a1]',       // 1
                        'bg-[#e29d62] hover:bg-[#d48c4e]',       // 2
                        'bg-[#c96b2c] hover:bg-[#b55b20]',       // 3
                        'bg-[#1b2d50] hover:bg-[#13223f]',       // 4
                      ]

                      return (
                        <div
                          key={dIdx}
                          onMouseEnter={() => setHoveredCell({ date: cell.date, count: cell.count })}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`w-3.5 h-3.5 rounded-xs cursor-pointer transition-transform hover:scale-125 ${levelColors[cell.level]}`}
                          title={`${cell.date}: ${cell.count} events`}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Tooltip & Context Info */}
            <div className="h-6 mt-2 text-xs text-[#746e64] flex items-center">
              {hoveredCell ? (
                <span className="font-semibold text-[#211f1b]">
                  📅 {hoveredCell.date}: <strong>{hoveredCell.count} quantum activities</strong> recorded
                </span>
              ) : (
                <span className="italic text-[#938c80]">
                  Hover over any day square to inspect logged activity.
                </span>
              )}
            </div>
          </div>

          {/* Bottom Streak Callout in Heatmap */}
          <div className="pt-4 border-t border-[#ded7cb]/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#211f1b]">
              <span>Current Streak:</span>
              <span className="text-[#c96b2c] flex items-center gap-0.5">
                {profile.streak_days} Days <Flame className="w-3.5 h-3.5 fill-current" />
              </span>
            </div>
            <button
              className="font-bold text-[#211f1b] hover:text-[#c96b2c] flex items-center gap-1 transition-colors cursor-pointer"
              onClick={() => onNavigate?.('Quantum Simulation')}
            >
              Launch Simulator <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column (5 cols): 6-Axis Concept Mastery Radar */}
        <div className="lg:col-span-5 rounded-2xl border border-[#ded7cb] bg-[#fffdf9] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-[#211f1b]">Quantum Concept Mastery</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0ece4] text-[#746e64] border border-[#ded7cb]">
                AI Diagnosed
              </span>
            </div>
            <p className="text-xs text-[#746e64] mb-3">
              Accuracy breakdown across algorithms and gate mechanics
            </p>

            {/* Radar Chart SVG */}
            <div className="flex items-center justify-center my-1">
              <svg
                width={radarCoords.size}
                height={radarCoords.size}
                className="overflow-visible select-none"
              >
                {/* Concentric Grid Rings */}
                {radarCoords.rings.map((ring, idx) => (
                  <polygon
                    key={idx}
                    points={ring.path}
                    fill="none"
                    stroke="#ded7cb"
                    strokeWidth={idx === 3 ? '1.5' : '1'}
                    strokeDasharray={idx === 3 ? 'none' : '3 3'}
                  />
                ))}

                {/* Radial Axis Lines */}
                {radarCoords.axes.map((axis, idx) => (
                  <line
                    key={idx}
                    x1={radarCoords.center}
                    y1={radarCoords.center}
                    x2={axis.x}
                    y2={axis.y}
                    stroke="#ded7cb"
                    strokeWidth="1"
                  />
                ))}

                {/* Filled Radar Area */}
                <polygon
                  points={radarCoords.polygonPath}
                  fill="#c96b2c"
                  fillOpacity="0.22"
                  stroke="#c96b2c"
                  strokeWidth="2"
                  className="transition-all duration-300"
                />

                {/* Data Points */}
                {radarCoords.points.map((pt, idx) => {
                  const isHovered = activeConceptIndex === idx

                  return (
                    <g key={idx} className="cursor-pointer">
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 6 : 4}
                        fill="#c96b2c"
                        stroke="#fffdf9"
                        strokeWidth="2"
                        className="transition-all duration-200"
                        onMouseEnter={() => setActiveConceptIndex(idx)}
                        onMouseLeave={() => setActiveConceptIndex(null)}
                      />
                    </g>
                  )
                })}

                {/* Axis Labels */}
                {radarCoords.axes.map((axis, idx) => {
                  const isHovered = activeConceptIndex === idx
                  // Short label abbreviation
                  const shortName = axis.item.concept.split(' ')[0]

                  return (
                    <text
                      key={idx}
                      x={axis.labelX}
                      y={axis.labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className={`text-[10px] font-bold transition-all cursor-pointer ${
                        isHovered ? 'fill-[#c96b2c] text-[11px]' : 'fill-[#746e64]'
                      }`}
                      onMouseEnter={() => setActiveConceptIndex(idx)}
                      onMouseLeave={() => setActiveConceptIndex(null)}
                    >
                      {shortName}
                    </text>
                  )
                })}
              </svg>
            </div>
          </div>

          {/* Bottom Callout: Lowest Concept Focus Area */}
          <div className="mt-2 p-3 rounded-xl bg-[#fff5eb] border border-[#c96b2c]/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#c96b2c] text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#211f1b]">
                  Focus area: <span className="text-[#c96b2c]">{metrics.focus_area.concept}</span>
                </div>
                <div className="text-[11px] text-[#746e64]">
                  ({metrics.focus_area.accuracy} accuracy)
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate?.('Problems')}
              className="px-3 py-1 rounded-lg bg-[#211f1b] text-white text-xs font-bold hover:bg-[#38332d] transition-colors cursor-pointer flex items-center gap-1"
            >
              Practice <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Recent Activity Stream ──────────────────────────────────── */}
      {metrics.recent_activity.length > 0 && (
        <div className="rounded-2xl border border-[#ded7cb] bg-[#fffdf9] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#211f1b]">Recent Practice Log</h3>
            <span className="text-xs font-semibold text-[#746e64]">
              Last {metrics.recent_activity.length} actions
            </span>
          </div>

          <div className="divide-y divide-[#ded7cb]/50">
            {metrics.recent_activity.map((act) => (
              <div key={act.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      act.tone === 'green' ? 'bg-[#4f806d]' :
                      act.tone === 'orange' ? 'bg-[#c96b2c]' :
                      act.tone === 'blue' ? 'bg-[#0f62fe]' : 'bg-[#938c80]'
                    }`}
                  />
                  <div>
                    <span className="font-bold text-[#211f1b]">{act.label}</span>
                    <span className="text-[#746e64] ml-2 font-medium">{act.detail}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-[#938c80]">{act.time}</span>
                  <span className="font-bold text-[#4f806d] bg-[#edf7ed] px-2 py-0.5 rounded-full border border-[#4f806d]/20 text-[10.5px]">
                    {act.xp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
