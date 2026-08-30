'use client'

import { useState, useEffect } from 'react'
import {
  Activity, Bell, BookOpen, BrainCircuit, ChevronRight, CircleHelp, Code2,
  Flame, Gauge, GitBranch, Home as HomeIcon, Layers3, LayoutDashboard, Menu, MessageCircle,
  Moon, Play, Plus, Search, Settings, Sparkles, Terminal, Trophy, X, Zap
} from 'lucide-react'
import { LearnView } from '@/components/learning/LearnView'
import { LearningDashboard } from '@/components/dashboard/LearningDashboard'
import { ProblemsListView } from '@/components/problems/ProblemsListView'
import { ProblemDetailView } from '@/components/problems/ProblemDetailView'
import { ChallengeSolverView } from '@/components/problems/ChallengeSolverView'
import { AITutorView } from '@/components/tutor/AITutorView'
import type { QuantumProblem, ProblemProgressState } from '@/types/quantum'

const navItems = [
  { label: 'Home', icon: HomeIcon },
  { label: 'Learn Quantum', icon: BookOpen },
  { label: 'Problems', icon: Trophy },
  { label: 'Quantum Simulation', icon: GitBranch },
  { label: 'AI Tutor', icon: BrainCircuit },
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Community', icon: MessageCircle },
]

const modules = [
  { title: 'Qubits & measurement', meta: '4 lessons', status: 'complete', tone: 'blue' },
  { title: 'Superposition', meta: '6 lessons', status: 'active', tone: 'orange' },
  { title: 'Quantum gates', meta: '8 lessons', status: 'open', tone: 'blue' },
  { title: 'Entanglement', meta: '5 lessons', status: 'locked', tone: 'muted' },
  { title: "Grover's algorithm", meta: '7 lessons', status: 'locked', tone: 'muted' },
]

const activity = [
  ['Completed lesson', 'The Bloch sphere', 'Today, 10:42 AM', '+120 XP', 'blue'],
  ['Ran simulation', 'Bell state experiment', 'Yesterday, 4:18 PM', '+80 XP', 'orange'],
  ['Solved problem', 'Hadamard transform', 'Yesterday, 11:03 AM', '+150 XP', 'green'],
]

function Brand() {
  return <div className="brand"><div className="brand-mark"><span /><span /><span /><span /></div><span>Qubit<span className="brand-dot">.</span>lab</span></div>
}

function Sidebar({ active, setActive, collapsed, setCollapsed }: { active: string; setActive: (v: string) => void; collapsed: boolean; setCollapsed: (v: boolean) => void }) {
  const handleNavClick = (label: string) => {
    setActive(label);
    if (label === 'Quantum Simulation') {
      setCollapsed(true);
    }
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-top">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="bg-transparent border-0 p-0 cursor-pointer text-left transition-opacity hover:opacity-80 flex items-center justify-center"
          title={collapsed ? 'Click to expand sidebar (⌘\\)' : 'Click to collapse sidebar (⌘\\)'}
        >
          <Brand />
        </button>
      </div>

      <div className="eyebrow">Workspace</div>
      
      <nav className="nav-list">
        {navItems.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className={`nav-item ${active === label ? 'active' : ''}`}
            onClick={() => handleNavClick(label)}
            title={collapsed ? label : undefined}
          >
            <Icon />
            <span>{label}</span>
            {label === 'AI Tutor' && <i className="nav-pip" />}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button
          className={`nav-item ${active === 'Settings' ? 'active' : ''}`}
          onClick={() => handleNavClick('Settings')}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings />
          <span>Settings</span>
        </button>

        <div
          className="profile cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => handleNavClick('Settings')}
          title={collapsed ? 'Arjun Mehta • Quantum explorer' : undefined}
        >
          <div className="avatar">AM</div>
          <div className="profile-copy">
            <strong>Arjun Mehta</strong>
            <span>Quantum explorer</span>
          </div>
          <ChevronRight />
        </div>
      </div>
    </aside>
  );
}

function Topbar({
  active,
  setActive,
  learnSubTab,
  setLearnSubTab,
}: {
  active: string;
  setActive: (v: string) => void;
  learnSubTab: 'courses' | 'problems';
  setLearnSubTab: (v: 'courses' | 'problems') => void;
}) {
  const isCoursesActive = active === 'Learn Quantum' && learnSubTab === 'courses';
  const isProblemsActive = (active === 'Learn Quantum' && learnSubTab === 'problems') || active === 'Problems';
  const isSimulatorActive = active === 'Quantum Simulation';
  const isTutorActive = active === 'AI Tutor';

  return (
    <header className="topbar flex items-center justify-between px-6 py-2 border-b border-[#ded7cb] bg-[#f7f4ee]">
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => {
            setActive('Learn Quantum');
            setLearnSubTab('courses');
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
            isCoursesActive
              ? 'bg-white text-[#211f1b] border-[#ded7cb] shadow-xs font-extrabold'
              : 'bg-transparent text-[#746e64] border-transparent hover:text-[#211f1b] hover:bg-[#e4ded4]/50'
          }`}
        >
          <BookOpen className={`w-3.5 h-3.5 ${isCoursesActive ? 'text-[#c96b2c]' : 'text-[#746e64]'}`} />
          <span>Courses</span>
        </button>

        <button
          onClick={() => {
            setActive('Problems');
            setLearnSubTab('problems');
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
            isProblemsActive
              ? 'bg-white text-[#211f1b] border-[#ded7cb] shadow-xs font-extrabold'
              : 'bg-transparent text-[#746e64] border-transparent hover:text-[#211f1b] hover:bg-[#e4ded4]/50'
          }`}
        >
          <Trophy className={`w-3.5 h-3.5 ${isProblemsActive ? 'text-[#c96b2c]' : 'text-[#746e64]'}`} />
          <span>Problems &amp; Challenges</span>
        </button>

        <button
          onClick={() => setActive('Quantum Simulation')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
            isSimulatorActive
              ? 'bg-white text-[#211f1b] border-[#ded7cb] shadow-xs font-extrabold'
              : 'bg-transparent text-[#746e64] border-transparent hover:text-[#211f1b] hover:bg-[#e4ded4]/50'
          }`}
        >
          <GitBranch className={`w-3.5 h-3.5 ${isSimulatorActive ? 'text-[#c96b2c]' : 'text-[#746e64]'}`} />
          <span>Quantum Simulator</span>
        </button>

        <button
          onClick={() => setActive('AI Tutor')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
            isTutorActive
              ? 'bg-white text-[#211f1b] border-[#ded7cb] shadow-xs font-extrabold'
              : 'bg-transparent text-[#746e64] border-transparent hover:text-[#211f1b] hover:bg-[#e4ded4]/50'
          }`}
        >
          <BrainCircuit className={`w-3.5 h-3.5 ${isTutorActive ? 'text-[#c96b2c]' : 'text-[#746e64]'}`} />
          <span>AI Quantum Tutor</span>
        </button>
      </div>

      <div className="top-actions flex items-center gap-3">
        <div className="search flex items-center gap-2 bg-[#fffdf9] border border-[#ded7cb] rounded-lg px-3 py-1.5 w-44 text-xs">
          <Search className="w-3.5 h-3.5 text-[#746e64]" />
          <input aria-label="Search" placeholder="Search workspace" className="bg-transparent border-0 outline-none w-full text-xs text-[#211f1b]" />
        </div>
        <button className="icon-button relative p-1.5 text-[#746e64] hover:text-[#211f1b] rounded-lg transition-colors cursor-pointer" title="Notifications">
          <Bell className="w-4 h-4" />
          <i className="notification" />
        </button>
        <button
          className="avatar small cursor-pointer"
          onClick={() => setActive('Settings')}
          title="Arjun Mehta"
        >
          AM
        </button>
      </div>
    </header>
  );
}

function ProgressBar({ value }: { value: number }) { return <div className="progress-track"><span style={{ width: `${value}%` }} /></div> }
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <section className={`card ${className}`}>{children}</section> }

function Home({ setActive }: { setActive: (v: string) => void }) {
  const [blochState, setBlochState] = useState<'0' | '1' | '+' | '-'>('+');
  const [simRunning, setSimRunning] = useState(false);
  const [simRunCount, setSimRunCount] = useState(1024);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const blochDetails = {
    '0': { label: '|0⟩', desc: 'Ground state (North pole)', math: '|ψ⟩ = 1|0⟩ + 0|1⟩', rot: 'rotate(0deg)' },
    '1': { label: '|1⟩', desc: 'Excited state (South pole)', math: '|ψ⟩ = 0|0⟩ + 1|1⟩', rot: 'rotate(180deg)' },
    '+': { label: '|+⟩', desc: 'Equal superposition (X-axis)', math: '|ψ⟩ = (|0⟩ + |1⟩)/√2', rot: 'rotate(45deg)' },
    '-': { label: '|-⟩', desc: 'Phase superposition (-X axis)', math: '|ψ⟩ = (|0⟩ - |1⟩)/√2', rot: 'rotate(-45deg)' },
  };

  const handleQuickRun = () => {
    setSimRunning(true);
    setTimeout(() => {
      setSimRunning(false);
      setSimRunCount((prev) => prev + 1024);
    }, 300);
  };

  const quizOptions = [
    { text: 'Pauli-X Gate', isCorrect: false },
    { text: 'Hadamard (H) Gate', isCorrect: true },
    { text: 'Phase (S) Gate', isCorrect: false },
    { text: 'Pauli-Z Gate', isCorrect: false },
  ];

  const quickLabs = [
    {
      title: 'Bell State Generator',
      qubits: '2 Qubits',
      category: 'Entanglement',
      formula: '|Φ⁺⟩ = (|00⟩ + |11⟩)/√2',
      desc: 'Create maximally entangled Einstein-Podolsky-Rosen (EPR) pairs.',
      color: 'border-l-[#c96b2c]',
      badge: 'bg-[#fff5eb] text-[#c96b2c]',
    },
    {
      title: "Grover's Search Oracle",
      qubits: '2 Qubits',
      category: 'Search Algorithm',
      formula: 'O(√N) Speedup',
      desc: 'Amplify the probability amplitude of target search states.',
      color: 'border-l-[#0f62fe]',
      badge: 'bg-[#edf5ff] text-[#0f62fe]',
    },
    {
      title: 'Quantum Fourier Transform',
      qubits: '3 Qubits',
      category: 'Phase Subroutine',
      formula: 'F_N = (1/√N) ∑ ω^(jk)',
      desc: 'The mathematical backbone for Shor’s and Phase Estimation.',
      color: 'border-l-[#007d79]',
      badge: 'bg-[#e6f6f6] text-[#007d79]',
    },
    {
      title: 'True Quantum RNG',
      qubits: '1 Qubit',
      category: 'Superposition',
      formula: 'P(0) = 50%, P(1) = 50%',
      desc: 'Generate truly non-deterministic random bits via measurement.',
      color: 'border-l-[#d12771]',
      badge: 'bg-[#fdf0f6] text-[#d12771]',
    },
  ];

  const backends = [
    { name: 'IBM Quantum Eagle', qubits: '127 Qubits', status: 'Online', latency: '99.85% fidelity', queue: '14 jobs' },
    { name: 'PennyLane Lightning', qubits: 'Statevector Sim', status: 'Online', latency: '0.002s latency', queue: '0 jobs' },
    { name: 'Google Cirq Engine', qubits: 'Density Matrix', status: 'Online', latency: '0.003s latency', queue: '0 jobs' },
    { name: 'IonQ Forte', qubits: '32 Qubits Trapped-Ion', status: 'Calibrating', latency: 'T₂ = 10s coherence', queue: 'Paused' },
  ];

  return (
    <div className="page-content flex flex-col gap-5 py-6">
      {/* 1. Top Header & Quick Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ded7cb]/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#c96b2c] tracking-wider uppercase mb-0.5">
            <span>Thursday, August 29, 2024</span>
            <span>·</span>
            <span className="bg-[#fff5eb] border border-[#c96b2c]/30 px-2 py-0.2 rounded-full text-[10px]">
              Level 08 Quantum Explorer
            </span>
          </div>
          <h1 className="font-bold tracking-tight text-[#211f1b]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, letterSpacing: '-0.02em', fontSize: '56px', lineHeight: 1.05 }}>
            Good morning, Arjun<span className="text-[#c96b2c]">.</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="button primary px-3.5 py-2 text-xs shadow-xs hover:scale-[1.02] transition-transform cursor-pointer"
            onClick={() => setActive('Learn Quantum')}
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Continue learning
          </button>
          <button
            className="button bg-[#fffdf9] border border-[#ded7cb] text-[#211f1b] hover:bg-[#eee9df] px-3.5 py-2 text-xs transition-colors cursor-pointer"
            onClick={() => setActive('Quantum Simulation')}
          >
            <Terminal className="w-3.5 h-3.5 text-[#c96b2c]" /> Simulator
          </button>
          <button
            className="button bg-[#282522] border border-[#423d38] text-white hover:bg-[#38332d] px-3.5 py-2 text-xs transition-colors cursor-pointer"
            onClick={() => setActive('AI Tutor')}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#c96b2c]" /> AI Tutor
          </button>
        </div>
      </div>


      {/* 3. Horizontal Course Track & Last Experiment (2 Horizontal Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: My Courses — placeholder, will be wired to Learn page */}
        <div className="bg-[#fffdf9] border border-[#ded7cb] rounded-lg p-4 lg:col-span-7 flex flex-col shadow-xs min-h-[380px]">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#ded7cb]/60 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#c96b2c] uppercase tracking-wider">MY COURSES</span>
            </div>
            <button
              className="text-xs font-bold text-[#c96b2c] hover:underline flex items-center gap-1 cursor-pointer"
              onClick={() => setActive('Learn Quantum')}
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Placeholder — courses from Learn will be listed here */}
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-6">
            <div className="w-12 h-12 rounded-xl bg-[#fff5eb] border border-[#c96b2c]/30 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[#c96b2c]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#211f1b]">Course list coming soon</p>
              <p className="text-[11px] text-[#746e64] mt-1 max-w-[260px]">
                Your enrolled courses from <strong>Learn Quantum</strong> will appear here — progress, current module, and quick-resume.
              </p>
            </div>
            <button
              onClick={() => setActive('Learn Quantum')}
              className="mt-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#c96b2c] text-white hover:opacity-90 transition-opacity cursor-pointer"
            >
              Browse Courses →
            </button>
          </div>
        </div>

        {/* Horizontal Mini-Sim Card (5 cols) */}
        <div className="bg-[#fffdf9] border border-[#ded7cb] rounded-lg p-4 lg:col-span-5 flex flex-col justify-between shadow-xs min-h-[380px]">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-[#ded7cb]/60 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#746e64] uppercase tracking-wider">RECENT CIRCUIT</span>
                <span className="text-xs font-bold text-[#211f1b]">Bell State Experiment</span>
              </div>
              <button
                onClick={handleQuickRun}
                disabled={simRunning}
                className="text-[10.5px] px-2 py-0.5 rounded bg-[#fff5eb] border border-[#c96b2c] text-[#c96b2c] font-semibold hover:bg-[#c96b2c] hover:text-white transition-all cursor-pointer flex items-center gap-1"
              >
                <Zap className={`w-3 h-3 ${simRunning ? 'animate-spin text-amber-500' : ''}`} />
                {simRunning ? 'Running...' : 'Quick Run'}
              </button>
            </div>

            {/* Mini Circuit */}
            <div className="bg-[#f7f4ee] p-2 rounded border border-[#ded7cb] font-mono text-[11px] mb-2">
              <div className="flex items-center h-6 relative">
                <label className="w-7 text-[10px] text-[#746e64] font-bold">q[0]</label>
                <i className="flex-1 h-[1px] bg-[#c8c1b4]" />
                <b className="w-4 h-4 rounded bg-[#da1e28] text-white text-[9px] flex items-center justify-center mx-1.5">H</b>
                <i className="flex-1 h-[1px] bg-[#c8c1b4]" />
                <b className="w-3.5 h-3.5 rounded-full bg-[#0f62fe] text-white text-[8px] flex items-center justify-center mx-1.5">●</b>
                <i className="flex-1 h-[1px] bg-[#c8c1b4]" />
              </div>
              <div className="flex items-center h-6 relative">
                <label className="w-7 text-[10px] text-[#746e64] font-bold">q[1]</label>
                <i className="flex-1 h-[1px] bg-[#c8c1b4]" />
                <span className="w-4 mx-1.5" />
                <i className="flex-1 h-[1px] bg-[#c8c1b4]" />
                <b className="w-4 h-4 rounded-full bg-[#0f62fe] text-white text-[10px] flex items-center justify-center mx-1.5 font-bold">⊕</b>
                <i className="flex-1 h-[1px] bg-[#c8c1b4]" />
              </div>
            </div>

            {/* Live horizontal probability bar */}
            <div className="flex items-center gap-2 text-[10.5px] font-mono">
              <span className="font-bold">|00⟩ 50%</span>
              <div className="flex-1 h-3 bg-[#f0ece4] rounded overflow-hidden flex">
                <div className="h-full bg-[#0f62fe]" style={{ width: '50%' }} />
                <div className="h-full bg-[#c96b2c]" style={{ width: '50%' }} />
              </div>
              <span className="font-bold">|11⟩ 50%</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#ded7cb]/60 flex items-center justify-between text-xs text-[#746e64]">
            <span className="text-[11px]">Aer Simulator · {simRunCount} shots</span>
            <button
              className="text-xs font-bold text-[#c96b2c] hover:underline flex items-center gap-1 cursor-pointer"
              onClick={() => setActive('Quantum Simulation')}
            >
              Open Workbench <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>


      {/* 5. Horizontal Pair: Daily Challenge (50%) & AI Tutor Insight (50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Challenge Box */}
        <div className="bg-[#fffdf9] border border-[#ded7cb] rounded-lg p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#ded7cb]/60 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#c96b2c] uppercase tracking-wider">DAILY CHALLENGE</span>
                <span className="bg-[#fff5eb] border border-[#c96b2c]/30 text-[#c96b2c] text-[9.5px] px-1.5 py-0.2 rounded-full font-bold">
                  +50 XP
                </span>
              </div>
              {quizSubmitted && (
                <button
                  onClick={() => {
                    setSelectedQuizAnswer(null);
                    setQuizSubmitted(false);
                  }}
                  className="text-[10px] px-2 py-0.5 rounded border border-[#ded7cb] text-[#746e64] hover:bg-[#eee9df] cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            <h3 className="text-xs sm:text-sm font-bold text-[#211f1b] mb-2.5">
              Which gate transforms state |0⟩ into equal superposition (|0⟩ + |1⟩)/√2?
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {quizOptions.map((opt, idx) => {
                const isSelected = selectedQuizAnswer === idx;
                const showFeedback = quizSubmitted;
                return (
                  <button
                    key={opt.text}
                    onClick={() => {
                      if (!quizSubmitted) {
                        setSelectedQuizAnswer(idx);
                        setQuizSubmitted(true);
                        try {
                          fetch(`${BACKEND_URL}/dashboard/log-event`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              event_type: 'quiz_submitted',
                              metadata: {
                                lesson_id: 'hadamard-superposition-quiz',
                                is_correct: opt.isCorrect,
                                topic: 'Quantum Superposition',
                              },
                              xp: opt.isCorrect ? 30 : 5,
                            }),
                          }).catch(() => {});
                        } catch (e) {}
                      }
                    }}
                    disabled={quizSubmitted}
                    className={`p-2.5 rounded border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                      showFeedback && opt.isCorrect
                        ? 'bg-[#edf7ed] border-[#4f806d] text-[#1e4620] font-bold'
                        : showFeedback && isSelected && !opt.isCorrect
                        ? 'bg-[#fdeeed] border-[#d32f2f] text-[#5f2120]'
                        : isSelected
                        ? 'bg-[#fff5eb] border-[#c96b2c] text-[#c96b2c]'
                        : 'bg-[#f7f4ee] border-[#ded7cb] text-[#211f1b] hover:bg-[#eee9df]'
                    }`}
                  >
                    <span className="truncate">{opt.text}</span>
                    {showFeedback && opt.isCorrect && <span className="text-[#4f806d] font-bold ml-1">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {quizSubmitted && (
            <div className="mt-2.5 p-2 rounded bg-[#f7f4ee] border border-[#ded7cb] text-[11px] text-[#211f1b]">
              <strong className="text-[#c96b2c]">Explanation:</strong> Hadamard (H) rotates statevector by π radians around the (X+Z)/√2 diagonal axis, mapping |0⟩ → |+⟩.
            </div>
          )}
        </div>

        {/* AI Tutor Insight Box */}
        <div className="bg-[#182434] border border-[#2d4260] rounded-lg p-4 flex flex-col justify-between text-white shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#2d4260] mb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#f59e0b] animate-pulse" />
                <span className="text-[10px] font-bold text-[#f59e0b] uppercase tracking-wider">AI TUTOR INSIGHT</span>
              </div>
              <span className="text-[10px] text-gray-300 font-mono">Socratic Mode</span>
            </div>

            <h3 className="text-sm font-bold text-white mb-1">
              Strengthen intuition for Phase Kickback & Interference
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              You mastered Hadamard superposition! Next, explore how controlled gates kick phases back into the control qubit to power quantum search algorithms.
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#2d4260] flex items-center justify-between">
            <span className="text-[11px] text-gray-400">Estimated drill time: 5 mins</span>
            <button
              className="button bg-[#c96b2c] hover:bg-[#b05a20] text-white border-0 px-3 py-1.5 font-bold text-xs rounded shadow-sm cursor-pointer transition-transform active:scale-95 flex items-center gap-1"
              onClick={() => setActive('AI Tutor')}
            >
              Start 5-min drill <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>


    
    </div>
  );
}

function Learn({
  setActive,
  learnSubTab,
  setLearnSubTab,
  allProblems,
  progress,
  onProblemSolved,
}: {
  setActive: (v: string) => void;
  learnSubTab: 'courses' | 'problems';
  setLearnSubTab: (v: 'courses' | 'problems') => void;
  allProblems: QuantumProblem[];
  progress: ProblemProgressState;
  onProblemSolved: (problemId: string) => void;
}) {
  return (
    <LearnView
      setActive={setActive}
      learnSubTab={learnSubTab}
      setLearnSubTab={setLearnSubTab}
      allProblems={allProblems}
      progress={progress}
      onProblemSolved={onProblemSolved}
    />
  );
}

import { QuantumSimulatorWorkbench } from '@/components/simulator/QuantumSimulatorWorkbench'
import { BACKEND_URL } from '@/config'

function Dashboard({ setActive }: { setActive: (v: string) => void }) {
  return <LearningDashboard onNavigate={setActive} />
}

function Community() { return <div className="page-content"><div className="welcome-row"><div><div className="eyebrow">THE QUANTUM COMMONS</div><h1>Learn out loud<span className="accent-dot">.</span></h1><p className="subhead">Ideas are better when they have somewhere to go.</p></div><button className="button primary"><Plus /> New post</button></div><div className="tabs"><button className="tab active">Discussions</button><button className="tab">Blogs</button><button className="tab">Research papers</button></div><div className="community-grid">{[['How do you visualize phase kickback?', 'Maya Rao', '12 replies', '48', 'Quantum gates'],['A friendly introduction to Grover’s algorithm', 'Rohan Singh', '8 min read', '—', 'Algorithms'],['New paper: Error mitigation with shadows', 'Dr. Kavya Iyer', 'Research paper', '26', 'Research']].map(([title, author, meta, votes, tag]) => <Card className="post-card" key={title}><div className="post-tag">{tag}</div><h2>{title}</h2><p>Exploring the mental models and practical techniques that make quantum concepts click.</p><div className="post-footer"><div className="avatar tiny">{author.split(' ').map(n => n[0]).join('')}</div><span>{author}</span><span>·</span><span>{meta}</span><b>↑ {votes}</b></div></Card>)}</div></div> }

function SettingsView() { return <div className="page-content settings-page"><div className="eyebrow">WORKSPACE SETTINGS</div><h1>Make it yours<span className="accent-dot">.</span></h1><div className="settings-layout"><div className="settings-nav"><button className="selected">Profile</button><button>Appearance</button><button>Language</button><button>Editor</button><button>Notifications</button></div><Card className="settings-form"><div className="eyebrow">PROFILE</div><h2>Your public profile</h2><label>Display name<input defaultValue="Arjun Mehta" /></label><label>Bio<textarea defaultValue="Learning quantum algorithms one circuit at a time." /></label><div className="form-row"><label>Interface language<select defaultValue="English"><option>English</option><option>Hindi</option></select></label><label>Theme<select defaultValue="Dark"><option>Dark</option><option>Light</option></select></label></div><button className="button primary">Save changes</button></Card></div></div> }

export default function Page() {
  const [active, setActive] = useState('Home');
  const [collapsed, setCollapsed] = useState(false);
  const [learnSubTab, setLearnSubTab] = useState<'courses' | 'problems'>('courses');

  // Problem State
  const [allProblems, setAllProblems] = useState<QuantumProblem[]>([]);
  const [activeProblem, setActiveProblem] = useState<QuantumProblem | null>(null);
  const [selectedProblemDetail, setSelectedProblemDetail] = useState<QuantumProblem | null>(null);

  // Problem Progress State (localStorage backed)
  const [progress, setProgress] = useState<ProblemProgressState>({
    solvedProblemIds: ['superposition'],
    attemptedProblemIds: ['superposition', 'bell_state'],
    streakDays: 14,
    totalXp: 3450,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch problems list on mount
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/problems`);
        if (res.ok) {
          const data = await res.json();
          setAllProblems(data);
        }
      } catch (e) {
        console.warn('Backend API offline or unreachable, using fallback problem data:', e);
      }
    };
    fetchProblems();
  }, []);

  // Load progress from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('qubit_lab_problem_progress');
      if (saved) {
        setProgress(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load progress from localStorage:', e);
    }
  }, []);

  const handleOpenInSimulator = (problem: QuantumProblem) => {
    setActiveProblem(problem);
    setSelectedProblemDetail(null);
    setActive('Problems');

    setProgress((prev) => {
      const nextAttempted = prev.attemptedProblemIds.includes(problem.id)
        ? prev.attemptedProblemIds
        : [...prev.attemptedProblemIds, problem.id];
      const nextProg = { ...prev, attemptedProblemIds: nextAttempted };
      try {
        localStorage.setItem('qubit_lab_problem_progress', JSON.stringify(nextProg));
      } catch (e) {}
      return nextProg;
    });
  };

  const handleProblemSolved = (problemId: string, nextProblemId?: string | null) => {
    setProgress((prev) => {
      const nextSolved = prev.solvedProblemIds.includes(problemId)
        ? prev.solvedProblemIds
        : [...prev.solvedProblemIds, problemId];
      const nextXp = prev.solvedProblemIds.includes(problemId) ? prev.totalXp : prev.totalXp + 150;
      const nextProg = { ...prev, solvedProblemIds: nextSolved, totalXp: nextXp };
      try {
        localStorage.setItem('qubit_lab_problem_progress', JSON.stringify(nextProg));
      } catch (e) {}
      return nextProg;
    });

    if (nextProblemId && allProblems.length > 0) {
      const nextProb = allProblems.find((p) => p.id === nextProblemId);
      if (nextProb) {
        setActiveProblem(nextProb);
      }
    }
  };

  const handleSelectTab = (tab: string) => {
    if (tab !== 'Problems') {
      setActiveProblem(null);
      setSelectedProblemDetail(null);
    }
    setActive(tab);
    if (tab === 'Quantum Simulation' || tab === 'Problems') {
      setCollapsed(true);
    }
  };

  const content =
    active === 'Home' ? (
      <Home setActive={handleSelectTab} />
    ) : active === 'Learn Quantum' ? (
      <Learn
        setActive={handleSelectTab}
        learnSubTab={learnSubTab}
        setLearnSubTab={setLearnSubTab}
        allProblems={allProblems}
        progress={progress}
        onProblemSolved={handleProblemSolved}
      />
    ) : active === 'Problems' ? (
      activeProblem ? (
        <ChallengeSolverView
          problem={activeProblem}
          allProblems={allProblems}
          onSelectProblem={(p) => setActiveProblem(p)}
          onBackToCatalog={() => setActiveProblem(null)}
          onProblemSolved={handleProblemSolved}
          isSolved={progress.solvedProblemIds.includes(activeProblem.id)}
        />
      ) : selectedProblemDetail ? (
        <ProblemDetailView
          problem={selectedProblemDetail}
          isSolved={progress.solvedProblemIds.includes(selectedProblemDetail.id)}
          onBack={() => setSelectedProblemDetail(null)}
          onOpenInSimulator={handleOpenInSimulator}
        />
      ) : (
        <ProblemsListView
          onSelectProblem={(p) => setSelectedProblemDetail(p)}
          onOpenInSimulator={handleOpenInSimulator}
          progress={progress}
        />
      )
    ) : active === 'Quantum Simulation' ? (
      <QuantumSimulatorWorkbench
        onToggleSidebar={() => setCollapsed((prev) => !prev)}
        sidebarCollapsed={collapsed}
      />
    ) : active === 'AI Tutor' ? (
      <AITutorView />
    ) : active === 'Dashboard' ? (
      <Dashboard setActive={handleSelectTab} />
    ) : active === 'Community' ? (
      <Community />
    ) : (
      <SettingsView />
    );

  return (
    <div className="app-shell">
      <Sidebar
        active={active}
        setActive={handleSelectTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      <div className={active === 'Quantum Simulation' || (active === 'Problems' && activeProblem !== null) ? 'sim-shell' : 'main-shell'}>
        {active !== 'Quantum Simulation' && !(active === 'Problems' && activeProblem !== null) && (
          <Topbar
            active={active}
            setActive={handleSelectTab}
            learnSubTab={learnSubTab}
            setLearnSubTab={setLearnSubTab}
          />
        )}
        {content}
      </div>
    </div>
  );
}
