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
  { label: 'Challenges', icon: Trophy },
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

function Sidebar({
  active,
  setActive,
  collapsed,
  setCollapsed,
  streakDays = 12,
  totalXp = 2840,
}: {
  active: string;
  setActive: (v: string) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  streakDays?: number;
  totalXp?: number;
}) {
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
          className="bg-transparent border-0 p-0 cursor-pointer text-left transition-opacity hover:opacity-80 flex items-center justify-between w-full"
          title={collapsed ? 'Click to expand sidebar (⌘\\)' : 'Click to collapse sidebar (⌘\\)'}
        >
          <Brand />
          <div className="text-[#746e64] hover:text-[#211f1b] p-1">
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </div>
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
            {label === 'Challenges' && <i className="nav-pip" style={{ background: '#c96b2c' }} />}
            {label === 'AI Tutor' && <i className="nav-pip" />}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="eyebrow">Your progress</div>
        <div className="side-progress">
          <div className="progress-row">
            <span>Level 08</span>
            <span>{totalXp.toLocaleString()} / 3,500 XP</span>
          </div>
          <div className="progress-track">
            <span style={{ width: `${Math.min(100, Math.round((totalXp / 3500) * 100))}%` }} />
          </div>
        </div>
        <button className="nav-item" onClick={() => setActive('Settings')}>
          <Settings />
          <span>Settings</span>
        </button>
        <div className="profile">
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
  streakDays = 12,
  totalXp = 2840,
}: {
  active: string;
  setActive: (v: string) => void;
  streakDays?: number;
  totalXp?: number;
}) {
  return (
    <header className="topbar">
      <div className="search-wrap">
        <Search />
        <input placeholder="Search algorithms, concepts, gates... (⌘K)" />
      </div>
      <div className="topbar-actions">
        <button className="streak-badge" title={`${streakDays} Day Learning Streak`}>
          <Flame />
          <span>{streakDays}d streak</span>
        </button>
        <button className="pill-metric" title="Total XP Earned">
          <Trophy className="w-3.5 h-3.5 text-[#c96b2c]" />
          <span>{totalXp.toLocaleString()} XP</span>
        </button>
        <button className="icon-button" aria-label="Notifications"><Bell /></button>
        <button className="icon-button" aria-label="Help"><CircleHelp /></button>
        <button className="button primary sm" onClick={() => setActive('Quantum Simulation')}>
          <Plus /> New circuit
        </button>
      </div>
    </header>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ded7cb]/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#c96b2c] tracking-wider uppercase mb-0.5">
            <span>Level 08 Quantum Explorer</span>
            <span>·</span>
            <span className="bg-[#fff5eb] border border-[#c96b2c]/30 px-2 py-0.2 rounded-full text-[10px]">
              Active Session
            </span>
          </div>
          <h1 className="font-bold tracking-tight text-[#211f1b]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, letterSpacing: '-0.02em', fontSize: '42px', lineHeight: 1.1 }}>
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
            onClick={() => setActive('Challenges')}
          >
            <Trophy className="w-3.5 h-3.5 text-[#c96b2c]" /> Challenges
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

      {/* Main Interactive Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Active Subject & Progress */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <Card className="p-5 border-[#ded7cb] bg-[#fffdf9] shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#ded7cb]/80 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#c96b2c]">
                  IN PROGRESS · LESSON 03
                </span>
                <h2 className="text-xl font-extrabold text-[#211f1b] tracking-tight">
                  Single-Qubit Superposition & Hadamard Transform
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#eef8f2] text-[#287854] border border-[#bad8cb]">
                68% Complete
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              {/* Bloch Preset Selector */}
              <div className="md:col-span-6 flex flex-col gap-3">
                <span className="text-xs font-bold text-[#211f1b]">Explore Quantum Basis States:</span>
                <div className="grid grid-cols-2 gap-2">
                  {(['0', '1', '+', '-'] as const).map((key) => (
                    <button
                      key={key}
                      onClick={() => setBlochState(key)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        blochState === key
                          ? 'bg-[#fff5eb] border-[#c96b2c] shadow-2xs'
                          : 'bg-white border-[#ded7cb] hover:bg-[#f6f2ea]'
                      }`}
                    >
                      <div className="font-mono font-bold text-sm text-[#211f1b]">{blochDetails[key].label}</div>
                      <div className="text-[10px] text-[#746e64] truncate">{blochDetails[key].desc}</div>
                    </button>
                  ))}
                </div>
                <div className="p-3 bg-[#f8f5ee] border border-[#ded7cb] rounded-xl font-mono text-xs text-[#211f1b]">
                  {blochDetails[blochState].math}
                </div>
              </div>

              {/* Quick Simulator Output */}
              <div className="md:col-span-6 bg-white border border-[#ded7cb] rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs border-b border-[#ded7cb]/60 pb-2">
                  <span className="font-bold text-[#211f1b]">Measurement Distribution</span>
                  <span className="text-[11px] font-mono text-[#746e64]">{simRunCount} shots</span>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between font-mono text-xs font-bold">
                      <span>|0⟩</span>
                      <span className="text-[#287854]">{blochState === '0' ? '100%' : blochState === '1' ? '0%' : '50%'}</span>
                    </div>
                    <div className="w-full bg-[#ded7cb]/40 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#287854] h-full rounded-full transition-all duration-300"
                        style={{ width: blochState === '0' ? '100%' : blochState === '1' ? '0%' : '50%' }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between font-mono text-xs font-bold">
                      <span>|1⟩</span>
                      <span className="text-[#287854]">{blochState === '1' ? '100%' : blochState === '0' ? '0%' : '50%'}</span>
                    </div>
                    <div className="w-full bg-[#ded7cb]/40 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#287854] h-full rounded-full transition-all duration-300"
                        style={{ width: blochState === '1' ? '100%' : blochState === '0' ? '0%' : '50%' }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleQuickRun}
                  disabled={simRunning}
                  className="w-full py-2 bg-[#287854] hover:bg-[#1f6344] text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{simRunning ? 'Executing Shots...' : 'Sample 1,024 Shots'}</span>
                </button>
              </div>
            </div>
          </Card>

          {/* Quick Quantum Labs */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-[#211f1b]">Curated Quantum Experiments</h3>
              <button onClick={() => setActive('Learn Quantum')} className="text-xs font-bold text-[#c96b2c] hover:underline cursor-pointer">
                View all courses →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {quickLabs.map((lab) => (
                <div
                  key={lab.title}
                  onClick={() => setActive('Learn Quantum')}
                  className={`p-4 bg-white border border-[#ded7cb] rounded-xl shadow-2xs border-l-4 ${lab.color} hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between gap-2`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${lab.badge}`}>
                      {lab.category}
                    </span>
                    <span className="text-[10px] font-mono text-[#746e64]">{lab.qubits}</span>
                  </div>
                  <strong className="text-sm text-[#211f1b]">{lab.title}</strong>
                  <span className="font-mono text-xs font-bold text-[#c96b2c] bg-[#faf7f2] p-1.5 rounded-md border border-[#e4ded4]">
                    {lab.formula}
                  </span>
                  <p className="text-xs text-[#5c5850]">{lab.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Daily Problem & Hardware Backends */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Daily Quantum Concept Quiz */}
          <Card className="p-5 border-[#ded7cb] bg-[#fffdf9] shadow-2xs flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#ded7cb]/80 pb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#c96b2c]">
                DAILY CONCEPT QUIZ
              </span>
              <span className="text-xs font-mono font-bold text-[#287854]">+50 XP</span>
            </div>

            <p className="text-xs font-bold text-[#211f1b] leading-snug">
              Which quantum gate creates an equal superposition of |0⟩ and |1⟩ from ground state |0⟩?
            </p>

            <div className="flex flex-col gap-2 pt-1">
              {quizOptions.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedQuizAnswer(idx);
                    setQuizSubmitted(true);
                  }}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    quizSubmitted
                      ? opt.isCorrect
                        ? 'bg-[#eef8f2] border-[#bad8cb] text-[#287854] font-bold'
                        : selectedQuizAnswer === idx
                        ? 'bg-[#fef2f2] border-[#fecaca] text-[#dc2626]'
                        : 'bg-white border-[#ded7cb] text-[#746e64]'
                      : 'bg-white border-[#ded7cb] hover:bg-[#faf7f2] text-[#211f1b]'
                  }`}
                >
                  {opt.text}
                </button>
              ))}
            </div>

            {quizSubmitted && (
              <div className="p-2.5 rounded-lg bg-[#eef8f2] border border-[#bad8cb] text-[11px] text-[#287854] font-medium leading-relaxed">
                ✓ Correct! The Hadamard (H) gate performs a 180° rotation mapping |0⟩ to |+⟩ = (|0⟩ + |1⟩)/√2.
              </div>
            )}
          </Card>

          {/* Connected Quantum Hardware Backends */}
          <Card className="p-5 border-[#ded7cb] bg-[#fffdf9] shadow-2xs flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#ded7cb]/80 pb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#746e64]">
                HARDWARE & SIMULATORS
              </span>
              <span className="text-[10px] text-[#287854] font-bold">● Active</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {backends.map((b) => (
                <div key={b.name} className="flex items-center justify-between text-xs py-1 border-b border-black/5 last:border-0">
                  <div className="flex flex-col">
                    <strong className="text-[#211f1b] font-bold">{b.name}</strong>
                    <span className="text-[10px] text-[#746e64]">{b.qubits} · {b.latency}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    b.status === 'Online' ? 'bg-[#eef8f2] text-[#287854]' : 'bg-[#fff5eb] text-[#c96b2c]'
                  }`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Tutor() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'tutor'; text: string }>>([
    {
      role: 'tutor',
      text: 'Greetings Arjun. I am your Quantum AI Tutor powered by Gemini 3.5 Flash-Lite. Ask me about quantum gates, superposition, entanglement, or circuit algorithms.',
    },
  ]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (promptText?: string) => {
    const q = promptText || question;
    if (!q.trim() || loading) return;

    const newMsgs = [...messages, { role: 'user' as const, text: q }];
    setMessages(newMsgs);
    setQuestion('');
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/tutor/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages([...newMsgs, { role: 'tutor', text: data.explanation }]);
      } else {
        setMessages([
          ...newMsgs,
          { role: 'tutor', text: 'Unitary quantum gates manipulate statevectors on the complex Bloch sphere without loss of probability normalization.' },
        ]);
      }
    } catch (e) {
      setMessages([
        ...newMsgs,
        { role: 'tutor', text: 'Quantum algorithms leverage constructive and destructive interference of probability amplitudes.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content flex flex-col gap-4 py-6">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">SOCRATIC AI TUTOR</div>
          <h1>Ask Gemini Quantum<span className="accent-dot">.</span></h1>
          <p className="subhead">Physics-grounded explanations powered by Gemini 3.5 Flash-Lite.</p>
        </div>
      </div>

      <Card className="p-5 flex flex-col gap-4 min-h-[450px]">
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[380px] pr-2">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl text-xs leading-relaxed max-w-[85%] ${
                m.role === 'user'
                  ? 'bg-[#211f1b] text-white self-end'
                  : 'bg-[#faf7f2] border border-[#e4ded4] text-[#211f1b] self-start'
              }`}
            >
              <strong className="block text-[10px] uppercase font-bold text-[#c96b2c] mb-1">
                {m.role === 'user' ? 'You' : 'Gemini Quantum Tutor'}
              </strong>
              {m.text}
            </div>
          ))}
          {loading && (
            <div className="p-4 rounded-xl bg-[#faf7f2] border border-[#e4ded4] text-xs text-[#746e64] self-start animate-pulse">
              Computing quantum statevector evolution and reasoning...
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-[#e4ded4]">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about superposition, Grover's search, Bell states..."
            className="flex-1 text-xs px-4 py-2.5 rounded-xl border border-[#d8d2c6] bg-white text-[#211f1b] focus:outline-none focus:border-[#c96b2c]"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAsk();
            }}
          />
          <button
            onClick={() => handleAsk()}
            disabled={loading || !question.trim()}
            className="px-5 py-2.5 rounded-xl bg-[#c96b2c] hover:bg-[#b55e24] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            Ask AI
          </button>
        </div>
      </Card>
    </div>
  );
}

function Dashboard({ progress }: { progress?: ProblemProgressState }) {
  const totalXp = progress?.totalXp || 2840;
  const solvedCount = progress?.solvedProblemIds.length || 1;

  return (
    <div className="page-content flex flex-col gap-5 py-6">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">EXPLORER DASHBOARD</div>
          <h1>Your quantum stats<span className="accent-dot">.</span></h1>
          <p className="subhead">Track your algorithm mastery, streaks, and circuit benchmarks.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col gap-1">
          <span className="text-[10px] font-mono text-[#746e64] uppercase font-bold">Total XP</span>
          <strong className="text-2xl font-extrabold text-[#c96b2c]">{totalXp.toLocaleString()}</strong>
        </Card>
        <Card className="p-4 flex flex-col gap-1">
          <span className="text-[10px] font-mono text-[#746e64] uppercase font-bold">Solved Challenges</span>
          <strong className="text-2xl font-extrabold text-[#287854]">{solvedCount} / 6</strong>
        </Card>
        <Card className="p-4 flex flex-col gap-1">
          <span className="text-[10px] font-mono text-[#746e64] uppercase font-bold">Current Streak</span>
          <strong className="text-2xl font-extrabold text-[#211f1b]">12 Days</strong>
        </Card>
        <Card className="p-4 flex flex-col gap-1">
          <span className="text-[10px] font-mono text-[#746e64] uppercase font-bold">Skill Tree Rank</span>
          <strong className="text-2xl font-extrabold text-[#0284c7]">Level 08</strong>
        </Card>
      </div>

      <Card className="p-5 flex flex-col gap-3">
        <h3 className="font-extrabold text-sm text-[#211f1b]">Recent Activity Log</h3>
        <div className="flex flex-col gap-2">
          {activity.map(([action, detail, time, xp, tone], i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#faf7f2] border border-[#e4ded4] text-xs">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${tone === 'green' ? 'bg-[#287854]' : tone === 'orange' ? 'bg-[#c96b2c]' : 'bg-[#0284c7]'}`} />
                <div>
                  <strong className="text-[#211f1b]">{action}: </strong>
                  <span className="text-[#5c5850]">{detail}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 font-mono text-[#746e64]">
                <span>{time}</span>
                <strong className="text-[#287854]">{xp}</strong>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Community() {
  return (
    <div className="page-content flex flex-col gap-5 py-6">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">GLOBAL QUANTUM COMMUNITY</div>
          <h1>Community & discussions<span className="accent-dot">.</span></h1>
          <p className="subhead">Collaborate with fellow quantum software engineers and researchers.</p>
        </div>
      </div>

      <Card className="p-5 flex flex-col gap-3">
        <h3 className="font-extrabold text-sm text-[#211f1b]">Trending Discussions</h3>
        <div className="flex flex-col gap-3">
          <div className="p-3.5 bg-[#faf7f2] border border-[#e4ded4] rounded-xl flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <strong className="text-xs text-[#211f1b]">Optimizing CNOT Depth in NISQ Devices</strong>
              <span className="text-[11px] text-[#746e64]">Started by @arjun_m · 14 replies</span>
            </div>
            <span className="text-xs font-mono font-bold text-[#c96b2c]">24 upvotes</span>
          </div>
          <div className="p-3.5 bg-[#faf7f2] border border-[#e4ded4] rounded-xl flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <strong className="text-xs text-[#211f1b]">Grover Search vs Classical Unsorted Search Benchmark</strong>
              <span className="text-[11px] text-[#746e64]">Started by @priya_q · 28 replies</span>
            </div>
            <span className="text-xs font-mono font-bold text-[#c96b2c]">42 upvotes</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="page-content settings-page flex flex-col gap-5 py-6">
      <div className="eyebrow">WORKSPACE SETTINGS</div>
      <h1>Make it yours<span className="accent-dot">.</span></h1>
      <div className="settings-layout">
        <div className="settings-nav">
          <button className="selected">Profile</button>
          <button>Appearance</button>
          <button>Language</button>
          <button>Editor</button>
          <button>Notifications</button>
        </div>
        <Card className="settings-form">
          <div className="eyebrow">PROFILE</div>
          <h2>Your public profile</h2>
          <label>Display name<input defaultValue="Arjun Mehta" /></label>
          <label>Bio<textarea defaultValue="Learning quantum algorithms one circuit at a time." /></label>
          <div className="form-row">
            <label>Interface language<select defaultValue="English"><option>English</option><option>Hindi</option></select></label>
            <label>Theme<select defaultValue="Light"><option>Light</option><option>Dark</option></select></label>
          </div>
          <button className="button primary">Save changes</button>
        </Card>
      </div>
    </div>
  );
}

export default function PlatformApp() {
  const [active, setActive] = useState('Home');
  const [collapsed, setCollapsed] = useState(false);

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

  // Global Keyboard Shortcut for Sidebar (⌘\)
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
        console.error('Failed to load problems:', e);
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
  };

  const handleSelectTab = (tab: string) => {
    if (tab !== 'Challenges') {
      setActiveProblem(null);
      setSelectedProblemDetail(null);
    }
    setActive(tab);
    if (tab === 'Quantum Simulation') {
      setCollapsed(true);
    }
  };

  let content: React.ReactNode;

  if (active === 'Home') {
    content = <Home setActive={handleSelectTab} />;
  } else if (active === 'Learn Quantum') {
    content = (
      <LearnView
        setActive={handleSelectTab}
        onSelectChallenge={(cId) => {
          const found = allProblems.find((p) => p.id === cId);
          if (found) {
            setActiveProblem(found);
            setActive('Challenges');
          } else {
            setActive('Challenges');
          }
        }}
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
    content = <Dashboard progress={progress} />;
  } else if (active === 'Community') {
    content = <Community />;
  } else {
    content = <SettingsView />;
  }

  const isChallengeSolverMode = active === 'Challenges' && activeProblem !== null;

  return (
    <div className="app-shell">
      <Sidebar
        active={active}
        setActive={handleSelectTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        streakDays={progress.streakDays}
        totalXp={progress.totalXp}
      />
      <div className={active === 'Quantum Simulation' ? 'sim-shell' : 'main-shell'}>
        {active !== 'Quantum Simulation' && !isChallengeSolverMode && (
          <Topbar
            active={active}
            setActive={handleSelectTab}
            streakDays={progress.streakDays}
            totalXp={progress.totalXp}
          />
        )}
        {content}
      </div>
    </div>
  );
}
