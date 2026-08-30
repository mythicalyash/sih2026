'use client'

import { useState, useEffect } from 'react'
import {
  Activity, Bell, BookOpen, BrainCircuit, ChevronRight, CircleHelp, Code2,
  Flame, Gauge, GitBranch, Home as HomeIcon, Layers3, LayoutDashboard, Menu, MessageCircle,
  Moon, Play, Plus, Search, Settings, Sparkles, Terminal, Trophy, X, Zap,
  PanelLeftClose, PanelLeftOpen, PanelLeft
} from 'lucide-react'
import { QuantumSimulatorWorkbench } from '@/components/simulator/QuantumSimulatorWorkbench'
import { ProblemsListView } from '@/components/problems/ProblemsListView'
import { ProblemDetailView } from '@/components/problems/ProblemDetailView'
import { ChallengeSolverView } from '@/components/problems/ChallengeSolverView'
import { LearnView } from '@/components/learning/LearnView'
import type { QuantumProblem, ProblemProgressState } from '@/types/quantum'
import { BACKEND_URL } from '@/config'

const navItems = [
  { label: 'Home', icon: HomeIcon },
  { label: 'Learn Quantum', icon: BookOpen },
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
    setCollapsed(true);
  };

  return <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
    <div className="sidebar-top">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="bg-transparent border-0 p-0 cursor-pointer text-left transition-opacity hover:opacity-80"
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

      {/* Sidebar Expand / Collapse Action Item */}
      <button
        className="nav-item mt-2 text-[#746e64] hover:text-[#211f1b] hover:bg-[#e4ded4] border border-[#ded7cb] rounded-md transition-all cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Expand sidebar (⌘\\)' : 'Collapse sidebar (⌘\\)'}
      >
        {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        <span>{collapsed ? 'Expand' : 'Collapse sidebar'}</span>
      </button>
    </nav>
    <div className="sidebar-bottom">
      <div className="eyebrow">Your progress</div>
      <div className="side-progress">
        <div className="progress-row">
          <span>Level 08</span>
          <span>2,840 / 3,200 XP</span>
        </div>
        <div className="progress-track">
          <span style={{ width: '88%' }} />
        </div>
      </div>
      <button className="nav-item" onClick={() => { setActive('Settings'); setCollapsed(true); }}>
        <Settings />
        <span>Settings</span>
      </button>
      <div className="profile cursor-pointer" onClick={() => { setActive('Settings'); setCollapsed(true); }}>
        <div className="avatar">AM</div>
        <div className="profile-copy">
          <strong>Arjun Mehta</strong>
          <span>Quantum explorer</span>
        </div>
        <ChevronRight />
      </div>
    </div>
  </aside>
}

function Topbar({
  active,
  setActive,
  collapsed,
  setCollapsed,
  learnSubTab,
  setLearnSubTab,
}: {
  active: string;
  setActive: (v: string) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  learnSubTab: 'courses' | 'problems';
  setLearnSubTab: (v: 'courses' | 'problems') => void;
}) {
  const isCoursesActive = active === 'Learn Quantum' && learnSubTab === 'courses';
  const isProblemsActive = active === 'Learn Quantum' && learnSubTab === 'problems';
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
              ? 'bg-white text-[#211f1b] border-[#c96b2c] shadow-2xs font-extrabold'
              : 'bg-transparent text-[#746e64] border-transparent hover:text-[#211f1b] hover:bg-[#e4ded4]/50'
          }`}
        >
          <BookOpen className={`w-3.5 h-3.5 ${isCoursesActive ? 'text-[#c96b2c]' : 'text-[#746e64]'}`} />
          <span>Courses</span>
        </button>

        <button
          onClick={() => {
            setActive('Learn Quantum');
            setLearnSubTab('problems');
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
            isProblemsActive
              ? 'bg-white text-[#211f1b] border-[#c96b2c] shadow-2xs font-extrabold'
              : 'bg-transparent text-[#746e64] border-transparent hover:text-[#211f1b] hover:bg-[#e4ded4]/50'
          }`}
        >
          <Trophy className={`w-3.5 h-3.5 ${isProblemsActive ? 'text-[#c96b2c]' : 'text-[#746e64]'}`} />
          <span>Problems & Challenges</span>
        </button>

        <button
          onClick={() => setActive('Quantum Simulation')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
            isSimulatorActive
              ? 'bg-white text-[#211f1b] border-[#0f62fe] shadow-2xs font-extrabold'
              : 'bg-transparent text-[#746e64] border-transparent hover:text-[#211f1b] hover:bg-[#e4ded4]/50'
          }`}
        >
          <GitBranch className={`w-3.5 h-3.5 ${isSimulatorActive ? 'text-[#0f62fe]' : 'text-[#746e64]'}`} />
          <span>Quantum Simulator</span>
        </button>

        <button
          onClick={() => setActive('AI Tutor')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
            isTutorActive
              ? 'bg-white text-[#211f1b] border-[#287854] shadow-2xs font-extrabold'
              : 'bg-transparent text-[#746e64] border-transparent hover:text-[#211f1b] hover:bg-[#e4ded4]/50'
          }`}
        >
          <BrainCircuit className={`w-3.5 h-3.5 ${isTutorActive ? 'text-[#287854]' : 'text-[#746e64]'}`} />
          <span>AI Quantum Tutor</span>
        </button>
      </div>

      <div className="top-actions flex items-center gap-3">
        <div className="search flex items-center gap-2 bg-[#fffdf9] border border-[#ded7cb] rounded-lg px-3 py-1.5 w-44 text-xs">
          <Search className="w-3.5 h-3.5 text-[#746e64]" />
          <input aria-label="Search" placeholder="Search workspace" className="bg-transparent border-0 outline-none w-full text-xs" />
        </div>
        <button className="icon-button relative p-1.5 text-[#746e64] hover:text-[#211f1b] rounded-lg transition-colors cursor-pointer" title="Notifications">
          <Bell className="w-4 h-4" />
          <i className="notification" />
        </button>
        <button
          className="avatar small cursor-pointer"
          onClick={() => {
            setActive('Settings');
            setCollapsed(true);
          }}
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

function Tutor() {
  const [messages, setMessages] = useState<Array<[string, string]>>([
    [
      'tutor',
      'You are exploring quantum circuits and algorithms. Ask any question about statevectors, superposition, entanglement, or circuit diagnostics!',
    ],
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userText = text.trim();
    setMessages((prev) => [...prev, ['user', userText]]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/tutor/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          circuit: {
            num_qubits: 2,
            gates: [
              { name: 'h', qubits: [0] },
              { name: 'cx', qubits: [0, 1] },
            ],
          },
          question: userText,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        let reply = data.explanation || 'State analyzed.';
        if (data.suggestions && data.suggestions.length > 0) {
          reply += '<br/><br/><strong>Suggestions:</strong><ul class="list-disc pl-4 mt-1">' + data.suggestions.map((s: string) => `<li>${s}</li>`).join('') + '</ul>';
        }
        setMessages((prev) => [...prev, ['tutor', reply]]);
      } else {
        setMessages((prev) => [...prev, ['tutor', 'Could not reach quantum tutor backend.']]);
      }
    } catch {
      setMessages((prev) => [...prev, ['tutor', 'Could not reach quantum tutor backend.']]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content tutor-page">
      <div className="tutor-header">
        <div>
          <div className="eyebrow accent-text">AI TUTOR · SOCRATIC MODE</div>
          <h1>Let&apos;s figure it out<span className="accent-dot">.</span></h1>
          <p className="subhead">Deterministic analysis &amp; quantum physics explanations.</p>
        </div>
        <div className="context-chip"><BrainCircuit /> Anchored to <strong>Superposition &amp; Entanglement</strong><X /></div>
      </div>
      <Card className="chat-card">
        <div className="chat-messages">
          {messages.map(([who, msg], i) => (
            <div className={`message ${who}`} key={i}>
              <div className="message-avatar">{who === 'tutor' ? <Sparkles /> : 'AM'}</div>
              <div className="message-copy" dangerouslySetInnerHTML={{ __html: msg }} />
            </div>
          ))}
          {loading && (
            <div className="message tutor">
              <div className="message-avatar"><Sparkles className="animate-spin" /></div>
              <div className="message-copy text-gray-400 font-mono text-xs">Analyzing circuit statevector...</div>
            </div>
          )}
        </div>
        <div className="prompt-chips">
          <button onClick={() => sendMessage('Explain this circuit')}>Explain this circuit</button>
          <button onClick={() => sendMessage('What is the Bell state (|00> + |11>)/sqrt(2)?')}>What is the Bell state?</button>
          <button onClick={() => sendMessage('Why does Hadamard create superposition?')}>Why Hadamard?</button>
          <button onClick={() => sendMessage('Check for unmeasured qubits or errors')}>Check for errors</button>
        </div>
        <div className="chat-input">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your tutor anything..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendMessage(input);
            }}
          />
          <button aria-label="Voice input"><Activity /></button>
          <button className="send" onClick={() => sendMessage(input)}><ChevronRight /></button>
        </div>
        <div className="chat-meta">
          <span>English <ChevronRight /></span>
          <small>AI tutor backed by Aer &amp; PennyLane quantum engines.</small>
        </div>
      </Card>
    </div>
  );
}

function Dashboard() { return <div className="page-content"><div className="welcome-row"><div><div className="eyebrow">YOUR OVERVIEW</div><h1>Progress, measured<span className="accent-dot">.</span></h1><p className="subhead">Small experiments compound into fluency.</p></div><button className="button secondary"><Plus /> Share progress</button></div><div className="metrics"><Card><div className="metric-label">COURSES COMPLETED</div><div className="metric-value">4 <span>/ 12</span></div><ProgressBar value={34} /><small>+1 this month</small></Card><Card><div className="metric-label">SIMULATIONS RUN</div><div className="metric-value">128 <span className="positive">+24%</span></div><div className="mini-spark"><i /><i /><i /><i /><i /><i /><i /></div><small>vs. last month</small></Card><Card><div className="metric-label">QUIZ ACCURACY</div><div className="metric-value">86<span>%</span></div><div className="accuracy-ring"><span>+8%</span></div><small>Top 12% of learners</small></Card></div><div className="dashboard-grid"><Card className="heatmap-card"><div className="card-head"><div><div className="eyebrow">PRACTICE ACTIVITY</div><h2>Consistency is a superpower</h2></div><span className="muted-label">Last 12 weeks</span></div><div className="heatmap">{Array.from({ length: 84 }, (_, i) => <i key={i} style={{ opacity: [0, .25, .45, .7, 1][(i * 7 + 3) % 5] }} />)}</div><div className="heat-legend"><span>Less</span>{[.2,.4,.6,.8,1].map(o => <i key={o} style={{ opacity: o }} />)}<span>More</span></div></Card><Card className="weak-card"><div className="eyebrow">TOPICS TO REVISIT</div><h2>Personalized focus</h2>{[['Phase estimation', 42],['Quantum Fourier transform', 58],['Measurement', 71],['Qubits', 89]].map(([label, val]) => <div className="topic-row" key={label as string}><div><span>{label as string}</span><b>{val}%</b></div><ProgressBar value={val as number} /></div>)}</Card></div></div> }

function Community() { return <div className="page-content"><div className="welcome-row"><div><div className="eyebrow">THE QUANTUM COMMONS</div><h1>Learn out loud<span className="accent-dot">.</span></h1><p className="subhead">Ideas are better when they have somewhere to go.</p></div><button className="button primary"><Plus /> New post</button></div><div className="tabs"><button className="tab active">Discussions</button><button className="tab">Blogs</button><button className="tab">Research papers</button></div><div className="community-grid">{[['How do you visualize phase kickback?', 'Maya Rao', '12 replies', '48', 'Quantum gates'],['A friendly introduction to Grover’s algorithm', 'Rohan Singh', '8 min read', '—', 'Algorithms'],['New paper: Error mitigation with shadows', 'Dr. Kavya Iyer', 'Research paper', '26', 'Research']].map(([title, author, meta, votes, tag]) => <Card className="post-card" key={title}><div className="post-tag">{tag}</div><h2>{title}</h2><p>Exploring the mental models and practical techniques that make quantum concepts click.</p><div className="post-footer"><div className="avatar tiny">{author.split(' ').map(n => n[0]).join('')}</div><span>{author}</span><span>·</span><span>{meta}</span><b>↑ {votes}</b></div></Card>)}</div></div> }

function SettingsView() { return <div className="page-content settings-page"><div className="eyebrow">WORKSPACE SETTINGS</div><h1>Make it yours<span className="accent-dot">.</span></h1><div className="settings-layout"><div className="settings-nav"><button className="selected">Profile</button><button>Appearance</button><button>Language</button><button>Editor</button><button>Notifications</button></div><Card className="settings-form"><div className="eyebrow">PROFILE</div><h2>Your public profile</h2><label>Display name<input defaultValue="Arjun Mehta" /></label><label>Bio<textarea defaultValue="Learning quantum algorithms one circuit at a time." /></label><div className="form-row"><label>Interface language<select defaultValue="English"><option>English</option><option>Hindi</option></select></label><label>Theme<select defaultValue="Dark"><option>Dark</option><option>Light</option></select></label></div><button className="button primary">Save changes</button></Card></div></div> }

export default function Page() {
  const [active, setActive] = useState('Learn Quantum');
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
    streakDays: 12,
    totalXp: 2840,
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
    setActive('Challenges');

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

  const handleProblemSolved = (problemId: string) => {
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
  };

  const handleSelectTab = (tab: string) => {
    if (tab !== 'Challenges') {
      setActiveProblem(null);
      setSelectedProblemDetail(null);
    }
    setActive(tab);
    setCollapsed(true);
  };

  let content: React.ReactNode;

  if (active === 'Home') {
    content = <Home setActive={handleSelectTab} />;
  } else if (active === 'Learn Quantum') {
    content = (
      <LearnView
        setActive={handleSelectTab}
        learnSubTab={learnSubTab}
        setLearnSubTab={setLearnSubTab}
        allProblems={allProblems}
        progress={progress}
        onProblemSolved={handleProblemSolved}
      />
    );
  } else if (active === 'Challenges') {
    if (activeProblem) {
      content = (
        <ChallengeSolverView
          problem={activeProblem}
          allProblems={allProblems}
          onSelectProblem={(p) => setActiveProblem(p)}
          onBackToCatalog={() => setActiveProblem(null)}
          onProblemSolved={handleProblemSolved}
          isSolved={progress.solvedProblemIds.includes(activeProblem.id)}
        />
      );
    } else if (selectedProblemDetail) {
      content = (
        <ProblemDetailView
          problem={selectedProblemDetail}
          isSolved={progress.solvedProblemIds.includes(selectedProblemDetail.id)}
          onBack={() => setSelectedProblemDetail(null)}
          onOpenInSimulator={handleOpenInSimulator}
        />
      );
    } else {
      content = (
        <ProblemsListView
          onSelectProblem={(p) => setSelectedProblemDetail(p)}
          onOpenInSimulator={handleOpenInSimulator}
          progress={progress}
        />
      );
    }
  } else if (active === 'Quantum Simulation') {
    content = (
      <QuantumSimulatorWorkbench
        onToggleSidebar={() => setCollapsed((prev) => !prev)}
        sidebarCollapsed={collapsed}
      />
    );
  } else if (active === 'AI Tutor') {
    content = <Tutor />;
  } else if (active === 'Dashboard') {
    content = <Dashboard />;
  } else if (active === 'Community') {
    content = <Community />;
  } else {
    content = <SettingsView />;
  }

  return (
    <div className="app-shell">
      <Sidebar
        active={active}
        setActive={handleSelectTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      <div className={active === 'Quantum Simulation' ? 'sim-shell' : 'main-shell'}>
        {active !== 'Quantum Simulation' && (
          <Topbar
            active={active}
            setActive={handleSelectTab}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            learnSubTab={learnSubTab}
            setLearnSubTab={setLearnSubTab}
          />
        )}
        {content}
      </div>
    </div>
  );
}
