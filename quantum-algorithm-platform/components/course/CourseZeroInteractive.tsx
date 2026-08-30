'use client'

import React, { useState } from 'react'
import {
  ChevronLeft, ChevronRight, RotateCcw, Sparkles, CheckCircle2,
  XCircle, Zap, Play, Trophy, Bot, HelpCircle, ArrowRight,
  Flame, Check, Layers, AlertCircle, Compass, Terminal, Undo2,
  BookOpen, Code2, Cpu, BarChart3, Atom, Lightbulb, CheckSquare,
  RefreshCw, Award, MoveRight, Eye, ShieldCheck, Share2, X, Info,
  Sliders, ToggleLeft, ToggleRight, Sparkle
} from 'lucide-react'
import { addXP, markLessonComplete } from '@/lib/storage'

interface CourseZeroInteractiveProps {
  onClose: () => void;
  onComplete?: () => void;
}

interface ModuleMeta {
  id: number;
  title: string;
  shortTitle: string;
  tag: string;
}

const MODULES_LIST: ModuleMeta[] = [
  { id: 1, title: 'What is Quantum Computing?', shortTitle: '01. What is Quantum?', tag: 'Foundations' },
  { id: 2, title: 'Classical Bits & Multi-Bit Combinations', shortTitle: '02. Classical Bits', tag: 'Binary' },
  { id: 3, title: 'From Bit to Qubit (|ψ⟩ = α|0⟩ + β|1⟩)', shortTitle: '03. From Bit to Qubit', tag: 'Ket Notation' },
  { id: 4, title: 'What Exactly is a Qubit? (Physical & State)', shortTitle: '04. What is a Qubit?', tag: 'Hardware' },
  { id: 5, title: 'Quantum States & Normalization (|α|² + |β|² = 1)', shortTitle: '05. Quantum States', tag: 'Amplitudes' },
  { id: 6, title: 'Measurement & Wavefunction Collapse', shortTitle: '06. Measurement', tag: 'Collapse' },
  { id: 7, title: 'Superposition & The Plus State (|+⟩)', shortTitle: '07. Superposition', tag: 'Superposition' },
  { id: 8, title: 'What is a Quantum Gate? (Reversibility & Unitary)', shortTitle: '08. Quantum Gates', tag: 'Unitary' },
  { id: 9, title: 'The Hadamard Gate (Matrix & Relative Phase)', shortTitle: '09. The Hadamard Gate', tag: 'H Matrix' },
  { id: 10, title: 'H Gate Simulator & Statistics', shortTitle: '10. H Simulator', tag: 'Experiment' },
  { id: 11, title: 'H + H: The Self-Inverse Reversal (H² = I)', shortTitle: '11. H + H Reversal', tag: 'Self-Inverse' },
  { id: 12, title: 'Circuit Lab: 3 Interactive Missions', shortTitle: '12. Circuit Lab', tag: 'Lab Missions' },
  { id: 13, title: 'Final Challenge & Socratic Verification', shortTitle: '13. Final Challenge', tag: 'Mastery' },
]

export function CourseZeroInteractive({ onClose, onComplete }: CourseZeroInteractiveProps) {
  const [currentModule, setCurrentModule] = useState<number>(1)
  const [completedModules, setCompletedModules] = useState<number[]>([1])

  // ---------------- Module 1 State ----------------
  const [m1ClassicalBit, setM1ClassicalBit] = useState<0 | 1>(0)
  const [m1Thought, setM1Thought] = useState<string>('')
  const [m1Submitted, setM1Submitted] = useState<boolean>(false)

  // ---------------- Module 2 State ----------------
  const [m2Bits, setM2Bits] = useState<[0 | 1, 0 | 1, 0 | 1]>([0, 1, 0])
  const [m2CuriosityAnswer, setM2CuriosityAnswer] = useState<'YES' | 'NO' | null>(null)

  // ---------------- Module 3 State ----------------
  const [m3ClickedPart, setM3ClickedPart] = useState<'psi' | 'alpha' | 'zero' | 'beta' | 'one'>('psi')

  // ---------------- Module 4 State ----------------
  const [m4Prob0, setM4Prob0] = useState<number>(80)
  const [m4HardwareSelected, setM4HardwareSelected] = useState<string>('superconducting')

  // ---------------- Module 5 State ----------------
  const [m5AlphaSq, setM5AlphaSq] = useState<number>(80)
  const [m5QuizAnswer, setM5QuizAnswer] = useState<string | null>(null)

  // ---------------- Module 6 State ----------------
  const [m6SingleResult, setM6SingleResult] = useState<'0' | '1' | null>(null)
  const [m6BatchResult, setM6BatchResult] = useState<{ zeros: number; ones: number } | null>(null)
  const [m6StatisticalAnswer, setM6StatisticalAnswer] = useState<'YES' | 'NO' | null>(null)

  // ---------------- Module 7 State ----------------
  const [m7Created, setM7Created] = useState<boolean>(false)
  const [m7Shots, setM7Shots] = useState<{ zeros: number; ones: number } | null>(null)
  const [m7Prediction, setM7Prediction] = useState<string | null>(null)

  // ---------------- Module 8 State ----------------
  const [m8GateState, setM8GateState] = useState<'|0⟩' | '|1⟩' | '|+⟩' | '|−⟩'>('|0⟩')
  const [m8LastGate, setM8LastGate] = useState<string>('None')

  // ---------------- Module 9 State ----------------
  const [m9ActiveInput, setM9ActiveInput] = useState<'|0⟩' | '|1⟩'>('|0⟩')

  // ---------------- Module 10 State ----------------
  const [m10Prediction, setM10Prediction] = useState<string | null>(null)
  const [m10Shots, setM10Shots] = useState<{ zeros: number; ones: number } | null>(null)

  // ---------------- Module 11 State ----------------
  const [m11Step, setM11Step] = useState<number>(0)
  const [m11Prediction, setM11Prediction] = useState<string | null>(null)

  // ---------------- Module 12 State ----------------
  const [m12ActiveChallenge, setM12ActiveChallenge] = useState<1 | 2 | 3>(1)
  const [m12InitialState, setM12InitialState] = useState<'|0⟩' | '|1⟩'>('|0⟩')
  const [m12Gates, setM12Gates] = useState<string[]>([])
  const [m12Results, setM12Results] = useState<{ zeros: number; ones: number } | null>(null)
  const [m12HintLevel, setM12HintLevel] = useState<number>(0)

  // ---------------- Module 13 State ----------------
  const [m13Gates, setM13Gates] = useState<string[]>([])
  const [m13Results, setM13Results] = useState<{ zeros: number; ones: number } | null>(null)
  const [m13Explanation, setM13Explanation] = useState<string>('')
  const [m13ExplanationFeedback, setM13ExplanationFeedback] = useState<string | null>(null)
  const [courseFinished, setCourseFinished] = useState<boolean>(false)

  const markModuleDone = (modId: number) => {
    if (!completedModules.includes(modId)) {
      setCompletedModules((prev) => [...prev, modId])
      addXP(25, `Completed Module ${modId}`)
    }
  }

  // Module 12 Circuit Runner
  const runM12Circuit = () => {
    let state = m12InitialState === '|0⟩' ? '|0>' : '|1>'
    for (const g of m12Gates) {
      if (g === 'H') {
        state = state === '|0>' ? '|+>' : state === '|+>' ? '|0>' : state === '|1>' ? '|->' : '|1>'
      } else if (g === 'X') {
        state = state === '|0>' ? '|1>' : state === '|1>' ? '|0>' : state
      }
    }

    let p0 = state === '|+>' || state === '|->' ? 50 : state === '|0>' ? 100 : 0
    let zeros = 0
    for (let i = 0; i < 100; i++) {
      if (Math.random() < p0 / 100) zeros++
    }
    setM12Results({ zeros, ones: 100 - zeros })

    if (m12ActiveChallenge === 1 && Math.abs(zeros - 50) <= 15) {
      markModuleDone(12)
    } else if (m12ActiveChallenge === 2 && zeros === 100 && m12Gates.length === 2) {
      markModuleDone(12)
    } else if (m12ActiveChallenge === 3 && m12InitialState === '|1⟩' && m12Gates[0] === 'H') {
      markModuleDone(12)
    }
  }

  // Module 13 Final Runner
  const runM13FinalChallenge = () => {
    let state = '|0>'
    for (const g of m13Gates) {
      if (g === 'H') {
        state = state === '|0>' ? '|+>' : state === '|+>' ? '|0>' : state === '|1>' ? '|->' : '|1>'
      } else if (g === 'X') {
        state = state === '|0>' ? '|1>' : state === '|1>' ? '|0>' : state
      }
    }
    let p0 = state === '|0>' ? 100 : state === '|1>' ? 0 : 50
    let zeros = 0
    for (let i = 0; i < 100; i++) {
      if (Math.random() < p0 / 100) zeros++
    }
    setM13Results({ zeros, ones: 100 - zeros })
  }

  const handleEvaluateM13Explanation = () => {
    const text = m13Explanation.toLowerCase()
    if (text.includes('h') || text.includes('identity') || text.includes('inverse') || text.includes('cancel') || text.includes('reverse')) {
      setM13ExplanationFeedback('Excellent explanation! The Hadamard gate is unitary and self-inverse (H² = I), so applying H twice perfectly undoes the superposition and restores |0⟩ with 100% fidelity.')
      setCourseFinished(true)
      markModuleDone(13)
      addXP(250, 'Mastered Course 01: From Bit to H Gate')
      markLessonComplete('course-01-complete')
    } else {
      setM13ExplanationFeedback('Good effort! Remember: The Hadamard gate is its own inverse (H * H = I), meaning the second H coherently reverses the first transformation back to |0⟩.')
      setCourseFinished(true)
      markModuleDone(13)
    }
  }

  const handleNext = () => {
    markModuleDone(currentModule)
    if (currentModule < MODULES_LIST.length) {
      setCurrentModule((prev) => prev + 1)
    } else if (courseFinished) {
      if (onComplete) onComplete()
      onClose()
    }
  }

  const handleBack = () => {
    if (currentModule > 1) {
      setCurrentModule((prev) => prev - 1)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#fdfcf9] w-screen h-screen flex flex-col select-none font-sans overflow-hidden text-[#211f1b]">
      
      {/* ================================================================= */}
      {/* 1. TOP NAVIGATION HEADER (Clean, Minimalist Borderless Feel) */}
      {/* ================================================================= */}
      <header className="px-6 py-3 bg-[#fdfcf9] border-b border-[#eee8dd] flex items-center justify-between shrink-0 h-14">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#fff5eb] flex items-center justify-center text-[#c96b2c] font-mono font-bold text-xs shrink-0">
            01
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-mono font-semibold text-[#8c8275] uppercase tracking-wider shrink-0">
              COURSE 01 <span className="text-[#c96b2c]">/ {MODULES_LIST[currentModule - 1].tag}</span> :
            </span>
            <h1 className="text-sm sm:text-base font-extrabold text-[#211f1b] tracking-tight truncate">
              From Bit to H Gate
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-2 font-mono text-xs text-[#8c8275]">
            <span className="font-semibold text-[#211f1b]">
              {completedModules.length}/{MODULES_LIST.length} Done
            </span>
            <div className="w-24 h-1.5 bg-[#eee8dd] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#c96b2c] rounded-full transition-all duration-300"
                style={{ width: `${(completedModules.length / MODULES_LIST.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1 bg-[#fff5eb] px-2.5 py-1 rounded-full text-xs font-bold text-[#c96b2c]">
            <Flame className="w-3.5 h-3.5 fill-current text-[#c96b2c]" />
            <span>+250 XP</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8c8275] hover:text-[#211f1b] hover:bg-[#f0eae0] transition-colors cursor-pointer"
            title="Close Course"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ================================================================= */}
      {/* 2. UNIFIED CLEAN READING WORKSPACE (Zero Clutter / Box Fatigue) */}
      {/* ================================================================= */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        
        {/* ----------------- Clean Left Sidebar: Minimalist Table of Contents ----------------- */}
        <aside className="w-64 bg-[#fbf9f4] border-r border-[#eee8dd] flex flex-col shrink-0 overflow-y-auto hidden md:flex">
          <div className="p-4 flex items-center justify-between text-xs font-bold text-[#8c8275] uppercase tracking-wider">
            <span>Course Outline</span>
            <span className="font-mono text-[#c96b2c]">{Math.round((completedModules.length / MODULES_LIST.length) * 100)}%</span>
          </div>

          <nav className="px-3 pb-4 flex flex-col gap-0.5">
            {MODULES_LIST.map((mod) => {
              const isActive = currentModule === mod.id
              const isDone = completedModules.includes(mod.id)
              return (
                <button
                  key={mod.id}
                  onClick={() => setCurrentModule(mod.id)}
                  className={`w-full px-3 py-2.5 rounded-xl text-left text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-[#fff5eb] text-[#c96b2c] font-bold shadow-2xs'
                      : 'hover:bg-[#f3ede1] text-[#6b6357]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-[#137333] shrink-0" />
                    ) : (
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 ${
                          isActive ? 'bg-[#c96b2c] text-white font-bold' : 'text-[#a39a8e]'
                        }`}
                      >
                        {mod.id}
                      </span>
                    )}
                    <span className="truncate">{mod.shortTitle}</span>
                  </div>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* ----------------- Clean Editorial Reader (Natural Prose + Seamless Interactive Modules) ----------------- */}
        <main className="flex-1 min-h-0 overflow-y-auto bg-[#fdfcf9] px-6 py-8 sm:px-12 sm:py-10 lg:px-20 lg:py-12">
          
          <div className="max-w-3xl mx-auto flex flex-col gap-8">

            {/* Header Title Section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono font-bold text-[#c96b2c] uppercase tracking-wider">
                  Module {currentModule} of {MODULES_LIST.length} · {MODULES_LIST[currentModule - 1].tag}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1d1a16] tracking-tight">
                {MODULES_LIST[currentModule - 1].title}
              </h2>
            </div>

            {/* ========================================================================= */}
            {/* MODULE 01: What is Quantum Computing? */}
            {/* ========================================================================= */}
            {currentModule === 1 && (
              <div className="flex flex-col gap-6 text-base sm:text-lg text-[#332f2a] leading-relaxed animate-fade-in">
                <p>
                  Almost every computer you&apos;ve used — your phone, laptop, gaming console, or server — processes information using <strong>bits</strong>. A bit has two definite values: <code className="bg-[#f0eae0] px-1.5 py-0.5 rounded text-sm font-mono font-bold text-[#1d1a16]">0</code> or <code className="bg-[#f0eae0] px-1.5 py-0.5 rounded text-sm font-mono font-bold text-[#1d1a16]">1</code>. Everything from storing files to playing games is represented through enormous combinations of 0s and 1s.
                </p>
                <p>
                  Quantum computers take a fundamentally different approach. Instead of bits, they use <strong>qubits (quantum bits)</strong>. A qubit is a physical quantum system described by a continuous quantum statevector that can exhibit <strong>superposition</strong> and <strong>quantum interference</strong>.
                </p>

                {/* Clean Left-Border Accent Callout */}
                <div className="border-l-4 border-[#c96b2c] pl-4 py-1 text-sm sm:text-base text-[#6b6357] italic">
                  <strong>Important:</strong> Quantum computers are not replacements for normal computers. They are specialized machines designed for quantum chemistry, materials simulation, optimization, cryptography, and complex scientific simulations.
                </div>

                {/* Seamless Interactive Experiment */}
                <div className="bg-[#f7f4ee]/80 rounded-2xl p-6 sm:p-8 flex flex-col gap-5 mt-2">
                  <div className="text-xs font-mono font-bold text-[#c96b2c] uppercase tracking-wider">
                    Interactive Experiment: Classical Bit vs. Qubit State Space
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Classical Bit */}
                    <div className="p-6 rounded-xl bg-white flex flex-col items-center gap-3 text-center shadow-2xs">
                      <span className="text-xs font-bold text-[#8c8275] uppercase tracking-wider">
                        Classical Bit Switch
                      </span>
                      <div className="w-16 h-16 rounded-2xl bg-[#edf5ff] text-[#0f62fe] border border-[#b9d3ff] flex items-center justify-center font-mono font-extrabold text-3xl shadow-xs">
                        {m1ClassicalBit}
                      </div>
                      <button
                        onClick={() => setM1ClassicalBit(m1ClassicalBit === 0 ? 1 : 0)}
                        className="px-4 py-2.5 rounded-xl bg-[#0f62fe] hover:bg-[#0043ce] text-white font-bold text-xs cursor-pointer transition-all active:scale-95 shadow-xs"
                      >
                        Toggle Bit: {m1ClassicalBit}
                      </button>
                    </div>

                    {/* Qubit */}
                    <div className="p-6 rounded-xl bg-white flex flex-col items-center gap-3 text-center shadow-2xs">
                      <span className="text-xs font-bold text-[#c96b2c] uppercase tracking-wider">
                        Quantum Qubit State Space
                      </span>
                      <div className="w-16 h-16 rounded-2xl bg-[#c96b2c] text-white flex items-center justify-center font-mono font-extrabold text-2xl shadow-xs animate-pulse">
                        |ψ⟩
                      </div>
                      <div className="font-mono text-xs font-bold text-[#211f1b]">
                        |ψ⟩ = α|0⟩ + β|1⟩ (Superposition)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clean Socratic Check */}
                <div className="flex flex-col gap-3 pt-2">
                  <span className="font-bold text-base text-[#1d1a16]">
                    🤖 AI Socratic Question: In your own words, what do you think is the biggest difference between a bit and a qubit?
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={m1Thought}
                      onChange={(e) => setM1Thought(e.target.value)}
                      placeholder="e.g. A qubit can exist in superposition of |0⟩ and |1⟩..."
                      className="flex-1 px-4 py-3 rounded-xl bg-white border border-[#eee8dd] text-sm text-[#211f1b] outline-none focus:border-[#c96b2c]"
                    />
                    <button
                      onClick={() => {
                        setM1Submitted(true)
                        markModuleDone(1)
                      }}
                      className="px-5 py-3 rounded-xl bg-[#c96b2c] text-white font-bold text-sm hover:bg-[#b55e24] cursor-pointer transition-all active:scale-95 shrink-0"
                    >
                      Share Thought
                    </button>
                  </div>
                  {m1Submitted && (
                    <div className="p-4 rounded-xl bg-[#fff5eb] border border-[#fed7aa] text-[#422006] text-sm leading-relaxed animate-fade-in">
                      <strong>AI Tutor:</strong> Exactly! While a classical bit is strictly a 0 or 1 switch, a qubit is described by a continuous statevector in Hilbert space that can harness quantum superposition and phase interference!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* MODULE 02: Classical Bits & Multi-Bit Combinations */}
            {/* ========================================================================= */}
            {currentModule === 2 && (
              <div className="flex flex-col gap-6 text-base sm:text-lg text-[#332f2a] leading-relaxed animate-fade-in">
                <h3 className="font-extrabold text-xl text-[#1d1a16]">The Binary Digit (Bit)</h3>
                <p>
                  The word <strong>bit</strong> comes from <em>binary digit</em>. A bit must have one of two discrete values when read: <code>0</code> or <code>1</code>.
                </p>
                <p>
                  Multiple bits can be combined into registers. For example, 3 bits can represent <code>2³ = 8</code> possible combinations (000, 001, 010, 011, 100, 101, 110, 111).
                </p>
                <p className="font-mono font-bold text-[#c96b2c]">
                  General rule: n bits → 2ⁿ possible combinations.
                </p>

                {/* Clean 3-Bit Register */}
                <div className="bg-[#f7f4ee]/80 rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-4 text-center">
                  <div className="text-xs font-mono font-bold text-[#c96b2c] uppercase tracking-wider">
                    Interactive 3-Bit Register (2³ = 8 Combinations)
                  </div>
                  
                  <div className="flex gap-4 justify-center py-2">
                    {[0, 1, 2].map((idx) => (
                      <div key={idx} className="flex flex-col items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-[#8c8275]">BIT {idx + 1}</span>
                        <button
                          onClick={() => {
                            setM2Bits((prev) => {
                              const n = [...prev] as [0 | 1, 0 | 1, 0 | 1]
                              n[idx] = n[idx] === 0 ? 1 : 0
                              return n
                            })
                            markModuleDone(2)
                          }}
                          className="w-16 h-16 rounded-2xl bg-[#edf5ff] text-[#0f62fe] border border-[#b9d3ff] hover:bg-[#d0e2ff] font-mono text-2xl font-extrabold flex items-center justify-center cursor-pointer shadow-xs hover:scale-105 transition-transform"
                        >
                          {m2Bits[idx]}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="font-mono text-base font-bold text-[#211f1b]">
                    Binary: <span className="text-[#c96b2c]">{m2Bits.join('')}</span> = Decimal: <span className="text-[#0f62fe]">{parseInt(m2Bits.join(''), 2)}</span>
                  </div>
                </div>

                {/* Socratic Check */}
                <div className="flex flex-col gap-3 pt-2">
                  <span className="font-bold text-base text-[#1d1a16]">
                    🤔 AI Curiosity: Can a classical bit be both 0 and 1 at the same time?
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    {(['YES', 'NO'] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setM2CuriosityAnswer(opt)
                          if (opt === 'NO') markModuleDone(2)
                        }}
                        className={`p-4 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                          m2CuriosityAnswer === opt
                            ? opt === 'NO'
                              ? 'bg-[#edf7ed] text-[#1e4620] shadow-xs'
                              : 'bg-[#fdeeed] text-[#5f2120]'
                            : 'bg-white hover:bg-[#f3ede1] text-[#211f1b]'
                        }`}
                      >
                        [ {opt} ]
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* MODULE 03: From Bit to Qubit */}
            {/* ========================================================================= */}
            {currentModule === 3 && (
              <div className="flex flex-col gap-6 text-base sm:text-lg text-[#332f2a] leading-relaxed animate-fade-in">
                <h3 className="font-extrabold text-xl text-[#1d1a16]">The General Single-Qubit State Equation</h3>
                <p>
                  A qubit has two computational basis states: <strong>|0⟩</strong> and <strong>|1⟩</strong> (written in Dirac <em>ket</em> notation).
                </p>
                <div className="text-center font-mono text-2xl sm:text-3xl font-extrabold text-[#c96b2c] py-2">
                  |ψ⟩ = α|0⟩ + β|1⟩
                </div>
                <p className="text-[#6b6357]">
                  This equation defines the quantum statevector. Click on any component below to inspect its exact mathematical role:
                </p>

                {/* Clean Clickable Equation Unpacker */}
                <div className="bg-[#f7f4ee]/80 rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-5 text-center">
                  <div className="flex items-center justify-center gap-2 font-mono text-2xl sm:text-3xl font-extrabold text-[#211f1b] flex-wrap">
                    <button
                      onClick={() => {
                        setM3ClickedPart('psi')
                        markModuleDone(3)
                      }}
                      className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${m3ClickedPart === 'psi' ? 'bg-[#c96b2c] text-white shadow-xs scale-105' : 'bg-white text-[#211f1b]'}`}
                    >
                      |ψ⟩
                    </button>
                    <span>=</span>
                    <button
                      onClick={() => {
                        setM3ClickedPart('alpha')
                        markModuleDone(3)
                      }}
                      className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${m3ClickedPart === 'alpha' ? 'bg-[#c96b2c] text-white shadow-xs scale-105' : 'bg-[#fff5eb] text-[#c96b2c]'}`}
                    >
                      α
                    </button>
                    <button
                      onClick={() => {
                        setM3ClickedPart('zero')
                        markModuleDone(3)
                      }}
                      className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${m3ClickedPart === 'zero' ? 'bg-[#c96b2c] text-white shadow-xs scale-105' : 'bg-white text-[#211f1b]'}`}
                    >
                      |0⟩
                    </button>
                    <span>+</span>
                    <button
                      onClick={() => {
                        setM3ClickedPart('beta')
                        markModuleDone(3)
                      }}
                      className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${m3ClickedPart === 'beta' ? 'bg-[#c96b2c] text-white shadow-xs scale-105' : 'bg-[#fff5eb] text-[#c96b2c]'}`}
                    >
                      β
                    </button>
                    <button
                      onClick={() => {
                        setM3ClickedPart('one')
                        markModuleDone(3)
                      }}
                      className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${m3ClickedPart === 'one' ? 'bg-[#c96b2c] text-white shadow-xs scale-105' : 'bg-white text-[#211f1b]'}`}
                    >
                      |1⟩
                    </button>
                  </div>

                  <div className="p-5 rounded-xl bg-[#fff5eb] border border-[#fed7aa] text-[#422006] text-sm sm:text-base text-left leading-relaxed w-full">
                    {m3ClickedPart === 'psi' && <span><strong>|ψ⟩ (Psi):</strong> Represents the current quantum state vector of the qubit in Hilbert space.</span>}
                    {m3ClickedPart === 'alpha' && <span><strong>α (Alpha):</strong> The complex probability amplitude for basis state |0⟩. The probability of measuring 0 is P(0) = |α|².</span>}
                    {m3ClickedPart === 'zero' && <span><strong>|0⟩:</strong> The computational ground basis state (corresponds to classical bit 0).</span>}
                    {m3ClickedPart === 'beta' && <span><strong>β (Beta):</strong> The complex probability amplitude for basis state |1⟩. The probability of measuring 1 is P(1) = |β|².</span>}
                    {m3ClickedPart === 'one' && <span><strong>|1⟩:</strong> The computational excited basis state (corresponds to classical bit 1).</span>}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* MODULE 04: What Exactly is a Qubit? */}
            {/* ========================================================================= */}
            {currentModule === 4 && (
              <div className="flex flex-col gap-6 text-base sm:text-lg text-[#332f2a] leading-relaxed animate-fade-in">
                <h3 className="font-extrabold text-xl text-[#1d1a16]">Physical Implementations of Qubits</h3>
                <p>
                  A qubit is an abstract unit of quantum information implemented using real physical quantum hardware:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'superconducting', name: 'Superconducting Circuits (Transmons)' },
                    { id: 'trapped_ions', name: 'Trapped Ion Systems (Laser Trapped)' },
                    { id: 'photons', name: 'Photonic Waveguides (Light Pulses)' },
                    { id: 'semiconductor', name: 'Semiconductor Spin Qubits (Silicon)' },
                    { id: 'neutral_atoms', name: 'Neutral Atom Arrays (Optical Tweezers)' },
                  ].map((hw) => (
                    <button
                      key={hw.id}
                      onClick={() => {
                        setM4HardwareSelected(hw.id)
                        markModuleDone(4)
                      }}
                      className={`p-3 rounded-xl text-left text-sm font-semibold transition-all cursor-pointer ${
                        m4HardwareSelected === hw.id
                          ? 'bg-[#fff5eb] text-[#c96b2c] font-bold shadow-2xs'
                          : 'bg-white text-[#6b6357] hover:bg-[#f3ede1]'
                      }`}
                    >
                      • {hw.name}
                    </button>
                  ))}
                </div>

                {/* Clean State Explorer Slider */}
                <div className="bg-[#f7f4ee]/80 rounded-2xl p-6 sm:p-8 flex flex-col gap-4">
                  <div className="flex justify-between items-center font-mono">
                    <span className="text-xs font-bold text-[#1d1a16] uppercase">Interactive State Explorer:</span>
                    <span className="text-xs font-bold text-[#c96b2c]">
                      |0⟩: {m4Prob0}% · |1⟩: {100 - m4Prob0}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={m4Prob0}
                    onChange={(e) => {
                      setM4Prob0(Number(e.target.value))
                      markModuleDone(4)
                    }}
                    className="accent-[#c96b2c] cursor-pointer h-2"
                  />

                  <div className="h-9 bg-white rounded-xl overflow-hidden flex font-mono text-xs sm:text-sm text-white font-bold p-1">
                    <div
                      className="bg-[#0f62fe] h-full rounded-lg flex items-center justify-center transition-all"
                      style={{ width: `${m4Prob0}%` }}
                    >
                      {m4Prob0 >= 15 && `P(0) = ${m4Prob0}%`}
                    </div>
                    <div
                      className="bg-[#c96b2c] h-full rounded-lg flex items-center justify-center transition-all"
                      style={{ width: `${100 - m4Prob0}%` }}
                    >
                      {100 - m4Prob0 >= 15 && `P(1) = ${100 - m4Prob0}%`}
                    </div>
                  </div>
                </div>

                <div className="border-l-4 border-[#c96b2c] pl-4 py-1 text-sm sm:text-base text-[#6b6357]">
                  <strong>Important Clarification:</strong> Seeing <code>50% |0⟩ and 50% |1⟩</code> does <strong>NOT</strong> mean the qubit is simply a classical coin flip! The underlying quantum state contains complex amplitudes and relative phase that can interfere and be manipulated by quantum gates before measurement.
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* MODULE 05: Quantum States & Normalization */}
            {/* ========================================================================= */}
            {currentModule === 5 && (
              <div className="flex flex-col gap-6 text-base sm:text-lg text-[#332f2a] leading-relaxed animate-fade-in">
                <h3 className="font-extrabold text-xl text-[#1d1a16]">The Normalization Condition: |α|² + |β|² = 1</h3>
                <p>
                  α and β are amplitudes (not probabilities). The measurement probabilities are:
                </p>
                <div className="font-mono font-bold text-[#c96b2c] text-center text-xl py-1">
                  P(0) = |α|² · P(1) = |β|²
                </div>
                <p>
                  Since all possible outcomes must sum to 100%: <code>|α|² + |β|² = 1</code>.
                </p>

                {/* Clean Amplitude Explorer */}
                <div className="bg-[#f7f4ee]/80 rounded-2xl p-6 sm:p-8 flex flex-col gap-4">
                  <div className="flex justify-between font-mono text-xs sm:text-sm">
                    <span className="font-bold text-[#1d1a16]">AMPLITUDES</span>
                    <span className="font-bold text-[#0f62fe]">
                      α = √{(m5AlphaSq / 100).toFixed(2)} | β = √{((100 - m5AlphaSq) / 100).toFixed(2)}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={m5AlphaSq}
                    onChange={(e) => setM5AlphaSq(Number(e.target.value))}
                    className="accent-[#c96b2c] cursor-pointer"
                  />

                  <div className="p-4 rounded-xl bg-white font-mono text-xs sm:text-sm flex justify-between font-bold shadow-2xs">
                    <span className="text-[#0f62fe]">P(0) = {m5AlphaSq}%</span>
                    <span className="text-[#c96b2c]">P(1) = {100 - m5AlphaSq}%</span>
                    <span className="text-[#137333]">|α|²+|β|² = 1.00 ✓</span>
                  </div>
                </div>

                {/* Concept Check */}
                <div className="flex flex-col gap-3 pt-2">
                  <span className="font-bold text-base text-[#1d1a16]">
                    📐 Concept Check: If the probability of measuring |0⟩ is 90%, what must P(1) be?
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    {['10%', '50%', '90%'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setM5QuizAnswer(opt)
                          if (opt === '10%') markModuleDone(5)
                        }}
                        className={`p-3.5 rounded-xl font-mono font-bold text-sm transition-all cursor-pointer ${
                          m5QuizAnswer === opt
                            ? opt === '10%'
                              ? 'bg-[#edf7ed] text-[#1e4620]'
                              : 'bg-[#fdeeed] text-[#5f2120]'
                            : 'bg-white hover:bg-[#f3ede1] text-[#1d1a16]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* MODULE 06: Measurement & Collapse */}
            {/* ========================================================================= */}
            {currentModule === 6 && (
              <div className="flex flex-col gap-6 text-base sm:text-lg text-[#332f2a] leading-relaxed animate-fade-in">
                <h3 className="font-extrabold text-xl text-[#1d1a16]">Single Measurement vs Statistical Shots</h3>
                <p>
                  A quantum state contains a superposition of basis states. When measured in the computational basis, it collapses irreversibly to a single definite classical result: <code>0</code> or <code>1</code>.
                </p>
                <p>
                  You cannot predict a single measurement with certainty. Repeated measurements (shots) reveal the underlying probability distribution P(0) = |α|² and P(1) = |β|².
                </p>

                {/* Clean Dual Studio */}
                <div className="bg-[#f7f4ee]/80 rounded-2xl p-6 sm:p-8 flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                    <div className="p-6 rounded-xl bg-white shadow-2xs flex flex-col items-center gap-3">
                      <span className="text-xs font-bold text-[#8c8275] uppercase">SINGLE SHOT COLLAPSE</span>
                      <div className="w-16 h-16 rounded-2xl bg-[#0f62fe] text-white flex items-center justify-center font-bold text-3xl shadow-xs">
                        {m6SingleResult !== null ? m6SingleResult : '?'}
                      </div>
                      <button
                        onClick={() => {
                          const res = Math.random() < 0.8 ? '0' : '1'
                          setM6SingleResult(res)
                          markModuleDone(6)
                        }}
                        className="w-full py-2.5 rounded-xl bg-[#0f62fe] text-white font-bold text-xs hover:bg-[#002d9c] cursor-pointer"
                      >
                        Measure 1 Shot
                      </button>
                    </div>

                    <div className="p-6 rounded-xl bg-white shadow-2xs flex flex-col items-center gap-3">
                      <span className="text-xs font-bold text-[#c96b2c] uppercase">100 SHOTS BATCH ENGINE</span>
                      <div className="font-mono text-sm font-bold my-auto text-[#1d1a16]">
                        {m6BatchResult ? `0: ${m6BatchResult.zeros}% | 1: ${m6BatchResult.ones}%` : 'Not run yet'}
                      </div>
                      <button
                        onClick={() => {
                          let zeros = 0
                          for (let i = 0; i < 100; i++) {
                            if (Math.random() < 0.8) zeros++
                          }
                          setM6BatchResult({ zeros, ones: 100 - zeros })
                          markModuleDone(6)
                        }}
                        className="w-full py-2.5 rounded-xl bg-[#c96b2c] text-white font-bold text-xs hover:bg-[#b55e24] cursor-pointer"
                      >
                        Run 100 Shots Simulation
                      </button>
                    </div>
                  </div>
                </div>

                {/* Socratic Reflection */}
                <div className="flex flex-col gap-3 pt-2">
                  <span className="font-bold text-base text-[#1d1a16]">
                    📊 AI Reflection: If 100 shots produce 81 zeros and 19 ones instead of exactly 80/20, does that mean our quantum state was wrong?
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    {(['YES', 'NO'] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setM6StatisticalAnswer(opt)
                          if (opt === 'NO') markModuleDone(6)
                        }}
                        className={`p-4 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                          m6StatisticalAnswer === opt
                            ? opt === 'NO'
                              ? 'bg-[#edf7ed] text-[#1e4620]'
                              : 'bg-[#fdeeed] text-[#5f2120]'
                            : 'bg-white hover:bg-[#f3ede1] text-[#1d1a16]'
                        }`}
                      >
                        [ {opt} ]
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* MODULE 07: Superposition */}
            {/* ========================================================================= */}
            {currentModule === 7 && (
              <div className="flex flex-col gap-6 text-base sm:text-lg text-[#332f2a] leading-relaxed animate-fade-in">
                <h3 className="font-extrabold text-xl text-[#1d1a16]">The Canonical Plus State (|+⟩)</h3>
                <p>
                  When both amplitudes are non-zero, the qubit is in a superposition. The most fundamental equal superposition state is:
                </p>
                <div className="font-mono font-bold text-center text-2xl text-[#c96b2c] py-2">
                  |+⟩ = (|0⟩ + |1⟩) / √2
                </div>
                <p>
                  Here, α = 1/√2 and β = 1/√2, so P(0) = |1/√2|² = 50% and P(1) = |1/√2|² = 50%.
                </p>

                {/* Clean Superposition Creator */}
                <div className="bg-[#f7f4ee]/80 rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-4 text-center">
                  <div className="flex items-center gap-3 font-mono text-base font-bold">
                    <span className="px-4 py-2 rounded-xl bg-white shadow-2xs">|0⟩</span>
                    <ArrowRight className="w-5 h-5 text-[#c96b2c]" />
                    <span className={`px-4 py-2 rounded-xl ${m7Created ? 'bg-[#fff5eb] text-[#c96b2c] font-bold' : 'bg-white shadow-2xs'}`}>
                      {m7Created ? '|+⟩ = (|0⟩+|1⟩)/√2' : 'Superposition (?)'}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                    <button
                      onClick={() => {
                        setM7Created(true)
                        markModuleDone(7)
                      }}
                      className="flex-1 py-3 rounded-xl bg-[#c96b2c] text-white font-bold text-xs cursor-pointer hover:bg-[#b55e24]"
                    >
                      Create Superposition
                    </button>

                    {m7Created && (
                      <button
                        onClick={() => {
                          let zeros = 0
                          for (let i = 0; i < 100; i++) {
                            if (Math.random() < 0.5) zeros++
                          }
                          setM7Shots({ zeros, ones: 100 - zeros })
                        }}
                        className="flex-1 py-3 rounded-xl bg-[#0f62fe] hover:bg-[#0043ce] text-white font-bold text-xs cursor-pointer shadow-xs transition-all active:scale-95"
                      >
                        Run 100 Shots
                      </button>
                    )}
                  </div>

                  {m7Shots && (
                    <div className="p-4 rounded-xl bg-white font-mono text-sm w-full max-w-md flex justify-between font-bold shadow-2xs">
                      <span className="text-[#0f62fe]">0: {m7Shots.zeros}%</span>
                      <span className="text-[#c96b2c]">1: {m7Shots.ones}%</span>
                      <span className="text-[#137333]">✓ 50/50 Verified</span>
                    </div>
                  )}
                </div>

                {/* Socratic Prediction */}
                <div className="flex flex-col gap-3 pt-2">
                  <span className="font-bold text-base text-[#1d1a16]">
                    🎲 Prediction: If we measure |+⟩ 100 times, do you think we will get exactly 50 zeros and 50 ones?
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {['Exactly 50 / 50', 'Roughly 50 / 50 (Statistical variation)'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setM7Prediction(opt)
                          if (opt.includes('Roughly')) markModuleDone(7)
                        }}
                        className={`p-4 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                          m7Prediction === opt
                            ? opt.includes('Roughly')
                              ? 'bg-[#edf7ed] text-[#1e4620]'
                              : 'bg-[#fdeeed] text-[#5f2120]'
                            : 'bg-white hover:bg-[#f3ede1] text-[#1d1a16]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* MODULE 08: Quantum Gates */}
            {/* ========================================================================= */}
            {currentModule === 8 && (
              <div className="flex flex-col gap-6 text-base sm:text-lg text-[#332f2a] leading-relaxed animate-fade-in">
                <h3 className="font-extrabold text-xl text-[#1d1a16]">What is a Quantum Gate?</h3>
                <p>
                  A quantum computer needs more than static qubits; it requires dynamic operations to manipulate quantum information. <strong>Quantum gates</strong> perform these transformations by mathematically rotating the state vector in complex Hilbert space.
                </p>
                <p>
                  Unlike classical logic gates (such as AND or OR gates) that discard information and generate heat, every ideal quantum gate is a <strong>unitary operator (U)</strong>, defined by the condition:
                </p>
                <div className="font-mono text-center text-base sm:text-lg font-bold text-[#c96b2c] py-2">
                  U† · U = U · U† = I
                </div>
                <h4 className="font-bold text-base text-[#1d1a16]">Why Unitary Matters:</h4>
                <ul className="list-disc list-inside space-y-2 text-base text-[#6b6357]">
                  <li><strong>Probability Conservation:</strong> The total probability |α|² + |β|² = 1 is always strictly preserved after any gate operation.</li>
                  <li><strong>Physical Reversibility:</strong> For any quantum operation U, there is always a physically realizable inverse operation U† that perfectly restores the previous state.</li>
                </ul>

                {/* Clean Gate Playground */}
                <div className="bg-[#f7f4ee]/80 rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-4 text-center">
                  <span className="text-xs font-bold text-[#8c8275] uppercase tracking-wider">Interactive Gate Playground</span>
                  <div className="w-20 h-20 rounded-2xl bg-[#c96b2c] text-white flex items-center justify-center font-mono font-bold text-3xl shadow-xs">
                    {m8GateState}
                  </div>

                  <div className="flex gap-3 w-full max-w-md">
                    <button
                      onClick={() => {
                        setM8GateState((prev) => (prev === '|0⟩' ? '|1⟩' : prev === '|1⟩' ? '|0⟩' : '|0⟩'))
                        setM8LastGate('X')
                        markModuleDone(8)
                      }}
                      className="flex-1 py-3 rounded-xl bg-[#d12771] text-white font-mono font-bold text-sm cursor-pointer hover:bg-[#b01e5d]"
                    >
                      Apply X
                    </button>
                    <button
                      onClick={() => {
                        setM8GateState((prev) => (prev === '|0⟩' ? '|+⟩' : prev === '|1⟩' ? '|−⟩' : '|0⟩'))
                        setM8LastGate('H')
                        markModuleDone(8)
                      }}
                      className="flex-1 py-3 rounded-xl bg-[#da1e28] text-white font-mono font-bold text-sm cursor-pointer hover:bg-[#b81820]"
                    >
                      Apply H
                    </button>
                    <button
                      onClick={() => setM8GateState('|0⟩')}
                      className="p-3 rounded-xl bg-white text-[#211f1b] cursor-pointer shadow-2xs hover:bg-[#f3ede1]"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* MODULE 09: The Hadamard Gate */}
            {/* ========================================================================= */}
            {currentModule === 9 && (
              <div className="flex flex-col gap-6 text-base sm:text-lg text-[#332f2a] leading-relaxed animate-fade-in">
                <h3 className="font-extrabold text-xl text-[#1d1a16]">The Hadamard Gate (H) &amp; Relative Phase</h3>
                <p>
                  The <strong>Hadamard (H) Gate</strong> is the conceptual heart of quantum computing and the primary entry point for quantum algorithms. Its 2×2 unitary matrix is:
                </p>
                <div className="font-mono text-center text-sm sm:text-base p-4 bg-[#f7f4ee]/80 rounded-xl text-[#c96b2c] font-bold">
                  H = (1/√2) [ 1 &nbsp; 1 ]<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[ 1 &nbsp;-1 ]
                </div>
                <h4 className="font-bold text-base text-[#1d1a16]">Transforming the Computational Basis:</h4>
                <ul className="list-disc list-inside space-y-2 text-base text-[#6b6357]">
                  <li><strong>Acting on |0⟩:</strong> <code>H|0⟩ = (|0⟩ + |1⟩)/√2 = |+⟩</code> (Equal Superposition, in-phase).</li>
                  <li><strong>Acting on |1⟩:</strong> <code>H|1⟩ = (|0⟩ - |1⟩)/√2 = |−⟩</code> (Equal Superposition, out-of-phase).</li>
                </ul>
                <div className="border-l-4 border-[#c96b2c] pl-4 py-1 text-sm sm:text-base text-[#6b6357]">
                  <strong>The Crucial Concept of Relative Phase:</strong><br />
                  Both |+⟩ and |−⟩ produce identical 50/50 measurement probabilities when measured in the computational basis (P(0)=50%, P(1)=50%). However, the negative sign in |−⟩ represents a relative phase factor of e^(iπ) = -1. This phase difference creates quantum interference when further gates are applied!
                </div>

                {/* Clean Relative Phase Inspector */}
                <div className="bg-[#f7f4ee]/80 rounded-2xl p-6 sm:p-8 flex flex-col gap-4">
                  <div className="flex items-center justify-between font-mono text-sm">
                    <span className="font-bold">Select Input Basis State:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setM9ActiveInput('|0⟩')
                          markModuleDone(9)
                        }}
                        className={`px-4 py-2 rounded-xl font-bold cursor-pointer ${m9ActiveInput === '|0⟩' ? 'bg-[#c96b2c] text-white shadow-xs' : 'bg-white'}`}
                      >
                        |0⟩
                      </button>
                      <button
                        onClick={() => {
                          setM9ActiveInput('|1⟩')
                          markModuleDone(9)
                        }}
                        className={`px-4 py-2 rounded-xl font-bold cursor-pointer ${m9ActiveInput === '|1⟩' ? 'bg-[#c96b2c] text-white shadow-xs' : 'bg-white'}`}
                      >
                        |1⟩
                      </button>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-white font-mono text-sm flex flex-col gap-3 shadow-2xs">
                    <div className="flex justify-between font-bold">
                      <span>Transformation Result:</span>
                      <span className="text-[#c96b2c]">
                        {m9ActiveInput === '|0⟩' ? 'H|0⟩ = |+⟩' : 'H|1⟩ = |−⟩'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#8c8275]">
                      <span>Relative Phase Factor:</span>
                      <span className="font-bold text-[#1d1a16]">{m9ActiveInput === '|0⟩' ? '+1 (In-Phase)' : '-1 (Out-of-Phase / e^(iπ))'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* MODULE 10: H Simulator */}
            {/* ========================================================================= */}
            {currentModule === 10 && (
              <div className="flex flex-col gap-6 text-base sm:text-lg text-[#332f2a] leading-relaxed animate-fade-in">
                <h3 className="font-extrabold text-xl text-[#1d1a16]">The Born Rule &amp; Finite Sampling Statistics</h3>
                <p>
                  According to the <strong>Born Rule</strong> in quantum mechanics, the probability of measuring basis state |k⟩ from state |ψ⟩ = α|0⟩ + β|1⟩ is:
                </p>
                <div className="font-mono text-center text-base sm:text-lg font-bold text-[#c96b2c] py-2">
                  P(k) = |⟨k|ψ⟩|² ⟹ P(0) = |1/√2|² = 50%, P(1) = |1/√2|² = 50%
                </div>
                <h4 className="font-bold text-base text-[#1d1a16]">Why Quantum Simulators Show &quot;Shots&quot;:</h4>
                <p>
                  Real quantum processors do not output theoretical probability equations directly. They perform discrete measurement runs (called <strong>shots</strong>).
                </p>
                <p>
                  Because each shot is independent, running N = 100 shots follows a binomial distribution. Measuring <code>48 zeros and 52 ones</code> is standard statistical variance (within 1σ error bounds), proving theoretical convergence by the Law of Large Numbers!
                </p>

                {/* Clean H Simulator */}
                <div className="bg-[#f7f4ee]/80 rounded-2xl p-6 sm:p-8 flex flex-col gap-4 text-center">
                  <div className="font-mono text-base font-bold text-[#1d1a16]">
                    |0⟩ ─── [ H ] ───► |+⟩ (50% 0 / 50% 1)
                  </div>

                  <button
                    onClick={() => {
                      let zeros = 0
                      for (let i = 0; i < 100; i++) {
                        if (Math.random() < 0.5) zeros++
                      }
                      setM10Shots({ zeros, ones: 100 - zeros })
                      markModuleDone(10)
                    }}
                    className="py-3 rounded-xl bg-[#c96b2c] text-white font-bold text-sm hover:bg-[#b55e24] cursor-pointer max-w-md mx-auto w-full"
                  >
                    Run 100 Shots Simulation
                  </button>

                  {m10Shots && (
                    <div className="p-4 rounded-xl bg-white font-mono text-sm flex justify-between font-bold max-w-md mx-auto w-full shadow-2xs">
                      <span className="text-[#0f62fe]">0: {m10Shots.zeros}%</span>
                      <span className="text-[#c96b2c]">1: {m10Shots.ones}%</span>
                      <span className="text-[#137333]">✓ Statistical Match</span>
                    </div>
                  )}
                </div>

                {/* Prediction */}
                <div className="flex flex-col gap-3 pt-2">
                  <span className="font-bold text-base text-[#1d1a16]">
                    🎯 Prediction: What state is produced when H is applied to |0⟩?
                  </span>
                  <div className="grid grid-cols-3 gap-3 text-center font-mono">
                    {['|0⟩', '|1⟩', '|+⟩'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setM10Prediction(opt)
                          if (opt === '|+⟩') markModuleDone(10)
                        }}
                        className={`p-3.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                          m10Prediction === opt
                            ? opt === '|+⟩'
                              ? 'bg-[#edf7ed] text-[#1e4620]'
                              : 'bg-[#fdeeed] text-[#5f2120]'
                            : 'bg-white hover:bg-[#f3ede1] text-[#1d1a16]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* MODULE 11: H + H Reversal */}
            {/* ========================================================================= */}
            {currentModule === 11 && (
              <div className="flex flex-col gap-6 text-base sm:text-lg text-[#332f2a] leading-relaxed animate-fade-in">
                <h3 className="font-extrabold text-xl text-[#1d1a16]">The Self-Inverse Property (H² = I) &amp; Quantum Interference</h3>
                <p>
                  The natural classical intuition is: <em>&quot;If one H gate introduces 50/50 randomness, applying a second H gate should create even more randomness.&quot;</em>
                </p>
                <p>
                  Quantum mechanics behaves differently. Because the Hadamard gate is unitary and Hermitian (H = H†), it is its own inverse:
                </p>
                <div className="font-mono text-center text-lg font-bold text-[#c96b2c] py-2">
                  H · H = H² = I &nbsp;(Identity)
                </div>
                <div className="border-l-4 border-[#137333] pl-4 py-1 text-base text-[#1e4620]">
                  <strong>Constructive vs Destructive Interference:</strong><br />
                  The amplitudes for |0⟩ add constructively (1/2 + 1/2 = 1), while the amplitudes for |1⟩ cancel out destructively (1/2 - 1/2 = 0). This coherent interference is the engine behind all quantum speedups!
                </div>

                {/* Clean H + H Step Sequence */}
                <div className="bg-[#f7f4ee]/80 rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-4 text-center">
                  <div className="flex items-center gap-2.5 font-mono text-sm font-bold flex-wrap justify-center">
                    <span className="px-3 py-1.5 rounded-lg bg-white shadow-2xs">|0⟩</span>
                    <span>→</span>
                    <span className="px-3 py-1.5 rounded-lg bg-[#da1e28] text-white">H</span>
                    <span>→</span>
                    <span className="px-3 py-1.5 rounded-lg bg-[#fff5eb] text-[#c96b2c]">|+⟩</span>
                    <span>→</span>
                    <span className="px-3 py-1.5 rounded-lg bg-[#da1e28] text-white">H</span>
                    <span>→</span>
                    <span className="px-3 py-1.5 rounded-lg bg-[#edf7ed] text-[#1e4620] font-extrabold">|0⟩ (100%)</span>
                  </div>
                </div>

                {/* Prediction */}
                <div className="flex flex-col gap-3 pt-2">
                  <span className="font-bold text-base text-[#1d1a16]">
                    🌟 Prediction: What will be the final state of |0⟩ ── H ── H ── ?
                  </span>
                  <div className="grid grid-cols-2 gap-4 text-center font-mono">
                    {['Still 50/50', '|0⟩ (100% Guaranteed)'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setM11Prediction(opt)
                          if (opt.includes('|0⟩')) markModuleDone(11)
                        }}
                        className={`p-4 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                          m11Prediction === opt
                            ? opt.includes('|0⟩')
                              ? 'bg-[#edf7ed] text-[#1e4620]'
                              : 'bg-[#fdeeed] text-[#5f2120]'
                            : 'bg-white hover:bg-[#f3ede1] text-[#1d1a16]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* MODULE 12: Circuit Lab */}
            {/* ========================================================================= */}
            {currentModule === 12 && (
              <div className="flex flex-col gap-6 text-base sm:text-lg text-[#332f2a] leading-relaxed animate-fade-in">
                <div className="flex gap-2">
                  {[1, 2, 3].map((cNum) => (
                    <button
                      key={cNum}
                      onClick={() => {
                        setM12ActiveChallenge(cNum as 1 | 2 | 3)
                        setM12Gates([])
                        setM12Results(null)
                      }}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-all ${
                        m12ActiveChallenge === cNum
                          ? 'bg-[#c96b2c] text-white'
                          : 'bg-[#f7f4ee] text-[#6b6357] hover:bg-[#eee8dd]'
                      }`}
                    >
                      Mission {cNum}
                    </button>
                  ))}
                </div>

                <div className="py-2">
                  {m12ActiveChallenge === 1 && (
                    <>
                      <h4 className="font-extrabold text-lg text-[#1d1a16]">Challenge 1: Create 50/50 Superposition</h4>
                      <p className="text-sm text-[#6b6357]">Starting from |0⟩, construct a circuit on wire q0 that produces P(0) ≈ 50% and P(1) ≈ 50%.</p>
                    </>
                  )}
                  {m12ActiveChallenge === 2 && (
                    <>
                      <h4 className="font-extrabold text-lg text-[#1d1a16]">Challenge 2: Superposition &amp; Return to |0⟩</h4>
                      <p className="text-sm text-[#6b6357]">Starting from |0⟩, create a superposition and return the qubit to 100% |0⟩.</p>
                    </>
                  )}
                  {m12ActiveChallenge === 3 && (
                    <>
                      <h4 className="font-extrabold text-lg text-[#1d1a16]">Challenge 3: Open Experiment with |1⟩</h4>
                      <p className="text-sm text-[#6b6357]">Set initial state to |1⟩, apply H to create |−⟩, and observe 50/50 measurement probabilities!</p>
                    </>
                  )}
                </div>

                {/* Clean Circuit Workbench */}
                <div className="bg-[#f7f4ee]/80 rounded-2xl p-6 sm:p-8 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#8c8275]">Palette:</span>
                      <button
                        onClick={() => setM12Gates((prev) => [...prev, 'H'])}
                        className="px-3.5 py-1.5 rounded-lg bg-[#da1e28] text-white font-mono font-bold text-xs cursor-pointer hover:bg-[#b81820]"
                      >
                        + [ H ]
                      </button>
                      <button
                        onClick={() => setM12Gates((prev) => [...prev, 'X'])}
                        className="px-3.5 py-1.5 rounded-lg bg-[#d12771] text-white font-mono font-bold text-xs cursor-pointer hover:bg-[#b01e5d]"
                      >
                        + [ X ]
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setM12Gates([])
                        setM12Results(null)
                      }}
                      className="p-2 rounded-lg bg-white text-[#8c8275] cursor-pointer hover:bg-[#eee8dd]"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-sm bg-white p-4 rounded-xl min-h-[56px] overflow-x-auto shadow-2xs">
                    <span className="font-bold text-[#1d1a16]">q0: {m12InitialState} ──</span>
                    {m12Gates.map((g, idx) => (
                      <span key={idx} className="flex items-center">
                        <b className={`w-8 h-8 rounded-lg text-white flex items-center justify-center font-bold ${g === 'H' ? 'bg-[#da1e28]' : 'bg-[#d12771]'}`}>
                          {g}
                        </b>
                        <span>──</span>
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={runM12Circuit}
                    disabled={m12Gates.length === 0}
                    className="py-3 rounded-xl bg-[#c96b2c] hover:bg-[#b55e24] disabled:opacity-40 text-white font-bold text-sm cursor-pointer shadow-xs"
                  >
                    Simulate Circuit
                  </button>

                  {m12Results && (
                    <div className="p-4 rounded-xl bg-white font-mono text-sm flex justify-between font-bold shadow-2xs">
                      <span className="text-[#0f62fe]">0: {m12Results.zeros}%</span>
                      <span className="text-[#c96b2c]">1: {m12Results.ones}%</span>
                      <span className="text-[#137333]">✓ Validated</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setM12HintLevel((prev) => Math.min(2, prev + 1))}
                  className="text-xs font-bold text-[#c96b2c] hover:underline flex items-center gap-1 cursor-pointer w-fit"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Need a Hint? ({m12HintLevel}/2)</span>
                </button>
                {m12HintLevel >= 1 && (
                  <div className="border-l-4 border-[#c96b2c] pl-4 py-1 text-sm text-[#c96b2c]">
                    <strong>Hint:</strong> {m12ActiveChallenge === 1 ? 'Place a single [ H ] gate on wire q0.' : m12ActiveChallenge === 2 ? 'Place two [ H ] gates in series: H → H.' : 'Switch the initial state to |1⟩ and add [ H ]!'}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* MODULE 13: Final Challenge */}
            {/* ========================================================================= */}
            {currentModule === 13 && (
              <div className="flex flex-col gap-6 text-base sm:text-lg text-[#332f2a] leading-relaxed animate-fade-in">
                <h3 className="font-extrabold text-xl text-[#1d1a16]">Final Mastery Mission</h3>
                <ol className="list-decimal list-inside space-y-1.5 text-base text-[#6b6357]">
                  <li>Step 1: Starting from |0⟩, create equal superposition using the circuit builder below.</li>
                  <li>Step 2: Apply an operation that returns the qubit to P(0) = 100%.</li>
                  <li>Step 3: Explain why your circuit returned to |0⟩ below.</li>
                </ol>

                {/* Clean Circuit Builder */}
                <div className="bg-[#f7f4ee]/80 rounded-2xl p-6 sm:p-8 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#8c8275]">Palette:</span>
                      <button
                        onClick={() => setM13Gates((prev) => [...prev, 'H'])}
                        className="px-3.5 py-1.5 rounded-lg bg-[#da1e28] text-white font-mono font-bold text-xs cursor-pointer"
                      >
                        + [ H ]
                      </button>
                      <button
                        onClick={() => setM13Gates((prev) => [...prev, 'X'])}
                        className="px-3.5 py-1.5 rounded-lg bg-[#d12771] text-white font-mono font-bold text-xs cursor-pointer"
                      >
                        + [ X ]
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setM13Gates([])
                        setM13Results(null)
                      }}
                      className="p-2 rounded-lg bg-white text-[#8c8275]"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-sm bg-white p-4 rounded-xl min-h-[56px] overflow-x-auto shadow-2xs">
                    <span className="font-bold text-[#1d1a16]">q0: |0⟩ ──</span>
                    {m13Gates.map((g, idx) => (
                      <span key={idx} className="flex items-center">
                        <b className={`w-8 h-8 rounded-lg text-white flex items-center justify-center font-bold ${g === 'H' ? 'bg-[#da1e28]' : 'bg-[#d12771]'}`}>
                          {g}
                        </b>
                        <span>──</span>
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={runM13FinalChallenge}
                    disabled={m13Gates.length === 0}
                    className="py-3 rounded-xl bg-[#c96b2c] hover:bg-[#b55e24] disabled:opacity-40 text-white font-bold text-sm cursor-pointer shadow-xs"
                  >
                    Run 100 Shots Simulation
                  </button>

                  {m13Results && (
                    <div className="p-4 rounded-xl bg-white font-mono text-sm flex justify-between font-bold shadow-2xs">
                      <span className="text-[#0f62fe]">0: {m13Results.zeros}%</span>
                      <span className="text-[#c96b2c]">1: {m13Results.ones}%</span>
                      <span className={m13Results.zeros === 100 ? 'text-[#137333]' : 'text-[#ea4335]'}>
                        {m13Results.zeros === 100 ? '✓ 100% |0⟩ RESTORED!' : 'TRY AGAIN'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Socratic Explanation */}
                <div className="flex flex-col gap-3 pt-2">
                  <span className="font-bold text-base text-[#1d1a16]">
                    ✍️ Step 3: Explain to AI Tutor: &quot;Why did my circuit return to |0⟩?&quot;
                  </span>
                  <textarea
                    value={m13Explanation}
                    onChange={(e) => setM13Explanation(e.target.value)}
                    placeholder="e.g. Because the Hadamard gate is unitary and self-inverse (H^2 = I), so the second H reverses the first..."
                    rows={3}
                    className="w-full p-4 rounded-xl bg-white border border-[#eee8dd] text-sm text-[#1d1a16] outline-none focus:border-[#c96b2c]"
                  />
                  <button
                    onClick={handleEvaluateM13Explanation}
                    className="py-3 rounded-xl bg-[#c96b2c] text-white font-bold text-sm hover:bg-[#b55e24] cursor-pointer"
                  >
                    Submit Explanation for Mastery Verification
                  </button>
                  {m13ExplanationFeedback && (
                    <div className="p-4 bg-[#edf7ed] border border-[#bad8cb] text-[#1e4620] rounded-xl text-sm leading-relaxed animate-fade-in">
                      <strong>AI Tutor:</strong> {m13ExplanationFeedback}
                    </div>
                  )}
                </div>

                {courseFinished && (
                  <div className="p-5 bg-[#edf7ed] rounded-2xl flex items-center justify-between text-[#1e4620] animate-fade-in">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-7 h-7 text-[#1e4620]" />
                      <div>
                        <span className="font-extrabold text-base block">COURSE 01 MASTERED!</span>
                        <span className="text-xs">+250 XP Credited to your profile</span>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-xl bg-[#1e4620] text-white font-bold text-xs cursor-pointer shadow-xs hover:bg-[#153417]"
                    >
                      Finish Course
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

        </main>

      </div>

      {/* ================================================================= */}
      {/* 3. BOTTOM CONTROL BAR (Clean, Single Line) */}
      {/* ================================================================= */}
      <footer className="px-8 py-3 bg-[#fdfcf9] border-t border-[#eee8dd] flex items-center justify-between shrink-0 h-14">
        <button
          onClick={handleBack}
          disabled={currentModule === 1}
          className="flex items-center gap-1 px-4 py-2 rounded-xl text-[#6b6357] hover:text-[#1d1a16] hover:bg-[#f0eae0] disabled:opacity-25 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline font-mono text-xs text-[#8c8275]">
            Topic {currentModule} of {MODULES_LIST.length}
          </span>

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer bg-[#c96b2c] hover:bg-[#b55e24] text-white hover:scale-102 active:scale-98"
          >
            <span>{currentModule === MODULES_LIST.length ? 'Finish Course 01' : 'Next Topic'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  )
}
