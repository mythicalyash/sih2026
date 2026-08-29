'use client'

import { useState, useEffect } from 'react'
import {
  Activity, Bell, BookOpen, BrainCircuit, ChevronRight, CircleHelp, Code2,
  Flame, Gauge, GitBranch, Home as HomeIcon, Layers3, LayoutDashboard, Menu, MessageCircle,
  Moon, Play, Plus, Search, Settings, Sparkles, Terminal, Trophy, X, Zap,
  PanelLeftClose, PanelLeftOpen, PanelLeft, CheckCircle2, RotateCcw
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
            {label === 'Challenges' && <i className="nav-pip" style={{ background: '#c96b2c' }} />}
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
            <span>{totalXp.toLocaleString()} / 3,500 XP</span>
          </div>
          <div className="progress-track">
            <span style={{ width: `${Math.min(100, Math.round((totalXp / 3500) * 100))}%` }} />
          </div>
        </div>
        <button className="nav-item">
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
        <input placeholder="Search algorithms, concepts, gates, problems... (⌘K)" />
      </div>
      <div className="topbar-actions">
        <div className="streak-pill" title="12 day learning streak!">
          <Flame />
          <span>{streakDays}d streak</span>
        </div>
        <div className="token-pill">
          <Zap />
          <span>{totalXp.toLocaleString()} XP</span>
        </div>
        <button className="icon-button" aria-label="Dark mode">
          <Moon />
        </button>
        <button className="icon-button" aria-label="Notifications">
          <Bell />
        </button>
        <button className="button primary" onClick={() => setActive('Quantum Simulation')}>
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

  const getBlochProbs = () => {
    switch (blochState) {
      case '0': return { p0: 100, p1: 0, amp0: '1.000', amp1: '0.000', phase: '0°' };
      case '1': return { p0: 0, p1: 100, amp0: '0.000', amp1: '1.000', phase: '0°' };
      case '+': return { p0: 50, p1: 50, amp0: '0.707', amp1: '0.707', phase: '0°' };
      case '-': return { p0: 50, p1: 50, amp0: '0.707', amp1: '-0.707', phase: '180°' };
    }
  };

  const probs = getBlochProbs();

  const handleQuickSim = () => {
    setSimRunning(true);
    setTimeout(() => {
      setSimRunning(false);
      setSimRunCount(prev => prev + 1024);
    }, 600);
  };

  return (
    <div className="page-content">
      {/* Welcome Row with Dynamic CTAs */}
      <div className="welcome-row">
        <div>
          <div className="eyebrow">QUANTUM COMPUTING WORKSPACE</div>
          <h1>Good morning, Arjun<span className="accent-dot">.</span></h1>
          <p className="subhead">Your quantum learning journey is picking up momentum — 12 day streak active.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            className="button primary flex items-center gap-2 cursor-pointer"
            onClick={() => setActive('Quantum Simulation')}
          >
            <Play className="w-4 h-4 fill-current" /> Launch Simulator
          </button>
          <button
            className="button secondary flex items-center gap-2 cursor-pointer"
            onClick={() => setActive('Challenges')}
          >
            <Trophy className="w-4 h-4 text-[#c96b2c]" /> Challenges
          </button>
          <button
            className="button secondary flex items-center gap-2 cursor-pointer"
            onClick={() => setActive('AI Tutor')}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#c96b2c]" /> AI Tutor
          </button>
        </div>
      </div>

      {/* Hero 3-Column Feature Grid */}
      <div className="hero-grid">
        {/* Card 1: Interactive Learning Path */}
        <Card className="lecture-card">
          <div className="card-head">
            <div>
              <div className="eyebrow accent-text">CURRENT COURSE</div>
              <h2>Quantum foundations</h2>
            </div>
            <span className="status-badge">In progress</span>
          </div>
          <div className="lecture-body">
            <div className="lecture-art">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="core">|ψ⟩</div>
              <span className="particle p1" />
              <span className="particle p2" />
              <span className="particle p3" />
            </div>
            <div className="lecture-info">
              <div className="eyebrow">UP NEXT · MODULE 02</div>
              <h3>Superposition &amp; the Bloch sphere</h3>
              <p>Understand how a qubit can be in multiple states simultaneously and how the Hadamard gate rotates state vectors.</p>
            </div>
          </div>
          <div className="card-foot">
            <div className="meta-pair">
              <span>Progress</span>
              <strong>18 / 42 lessons</strong>
            </div>
            <button className="button primary" onClick={() => setActive('Learn Quantum')}>
              Continue learning <ChevronRight />
            </button>
          </div>
        </Card>

        {/* Card 2: Interactive Real-Time Bloch Sphere Playground */}
        <Card className="bloch-card">
          <div className="card-head">
            <div>
              <div className="eyebrow">INTERACTIVE PREVIEW</div>
              <h2>Bloch sphere</h2>
            </div>
            <div className="flex items-center gap-1.5">
              {(['0', '1', '+', '-'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setBlochState(st)}
                  className={`px-2 py-0.5 text-xs font-mono font-bold rounded transition-all cursor-pointer ${
                    blochState === st
                      ? 'bg-[#c96b2c] text-white shadow-xs'
                      : 'bg-[#f0ece4] text-[#746e64] hover:bg-[#e4ded4]'
                  }`}
                >
                  |{st}⟩
                </button>
              ))}
            </div>
          </div>
          <div className="bloch-content">
            <div className="bloch-sphere-visual">
              <div className="sphere-ring ring-x" />
              <div className="sphere-ring ring-y" />
              <div className="sphere-ring ring-z" />
              <div
                className={`state-vector transition-transform duration-500 ${
                  blochState === '0'
                    ? 'rotate-0'
                    : blochState === '1'
                    ? 'rotate-180'
                    : blochState === '+'
                    ? 'rotate-90'
                    : '-rotate-90'
                }`}
              >
                <div className="vector-arrow" />
              </div>
              <span className="pole north">|0⟩</span>
              <span className="pole south">|1⟩</span>
              <span className="pole plus">|+⟩</span>
              <span className="pole minus">|-⟩</span>
            </div>
            <div className="bloch-stats">
              <div className="prob-meter">
                <div className="flex justify-between text-xs font-mono font-bold text-[#211f1b] mb-1">
                  <span>P(|0⟩)</span>
                  <span>{probs.p0}%</span>
                </div>
                <div className="w-full bg-[#e4ded4] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#287854] h-full rounded-full transition-all duration-300"
                    style={{ width: `${probs.p0}%` }}
                  />
                </div>
              </div>
              <div className="prob-meter mt-2">
                <div className="flex justify-between text-xs font-mono font-bold text-[#211f1b] mb-1">
                  <span>P(|1⟩)</span>
                  <span>{probs.p1}%</span>
                </div>
                <div className="w-full bg-[#e4ded4] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#c96b2c] h-full rounded-full transition-all duration-300"
                    style={{ width: `${probs.p1}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-mono">
                <div className="bg-[#f7f4ee] p-1.5 rounded border border-[#e4ded4]">
                  <span className="text-[#746e64] text-[10px] block">α amp</span>
                  <span className="font-bold text-[#211f1b]">{probs.amp0}</span>
                </div>
                <div className="bg-[#f7f4ee] p-1.5 rounded border border-[#e4ded4]">
                  <span className="text-[#746e64] text-[10px] block">β amp</span>
                  <span className="font-bold text-[#211f1b]">{probs.amp1}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="card-foot">
            <span className="muted-label">Interactive statevector</span>
            <button className="button secondary" onClick={() => setActive('Quantum Simulation')}>
              Open in 3D Q-Sphere →
            </button>
          </div>
        </Card>

        {/* Card 3: Quick Circuit Runner */}
        <Card className="runner-card">
          <div className="card-head">
            <div>
              <div className="eyebrow">QUICK EXECUTION</div>
              <h2>Bell state circuit</h2>
            </div>
            <span className="badge-chip">Qiskit Aer</span>
          </div>
          <div className="runner-body">
            <div className="mini-circuit-preview">
              <div className="wire-preview">
                <span className="wire-label">q[0]</span>
                <span className="wire-line" />
                <span className="gate-pill gate-h">H</span>
                <span className="wire-line" />
                <span className="gate-pill gate-cx">●</span>
                <span className="wire-line" />
                <span className="gate-pill gate-m">◓</span>
              </div>
              <div className="wire-preview mt-2">
                <span className="wire-label">q[1]</span>
                <span className="wire-line" />
                <span className="gate-pill gate-empty" />
                <span className="wire-line" />
                <span className="gate-pill gate-cx">⊕</span>
                <span className="wire-line" />
                <span className="gate-pill gate-m">◓</span>
              </div>
            </div>
            <div className="mini-distribution mt-3">
              <div className="flex justify-between text-xs font-mono font-bold text-[#211f1b] mb-1">
                <span>|00⟩ (50.2%)</span>
                <span>|11⟩ (49.8%)</span>
              </div>
              <div className="flex gap-1 h-3 bg-[#e4ded4] rounded-full overflow-hidden p-0.5">
                <div className="bg-[#287854] h-full rounded-l-full" style={{ width: '50.2%' }} />
                <div className="bg-[#c96b2c] h-full rounded-r-full" style={{ width: '49.8%' }} />
              </div>
              <div className="flex justify-between text-[10px] text-[#746e64] mt-1 font-mono">
                <span>514 shots</span>
                <span>{simRunCount.toLocaleString()} total shots</span>
                <span>510 shots</span>
              </div>
            </div>
          </div>
          <div className="card-foot">
            <button
              className={`button ${simRunning ? 'secondary' : 'primary'} w-full justify-center`}
              onClick={handleQuickSim}
              disabled={simRunning}
            >
              {simRunning ? (
                <>Simulating Aer backend...</>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" /> Run simulation ({simRunCount} shots)
                </>
              )}
            </button>
          </div>
        </Card>
      </div>

      {/* Secondary Grid: Daily Quiz & Learning Modules & Activity */}
      <div className="main-grid">
        {/* Left 8-Col Area: Daily Interactive Challenge & Roadmap */}
        <div className="col-span-8 flex flex-col gap-5">
          {/* Daily Quantum Quiz Widget */}
          <Card className="daily-quiz-card bg-[#fffdfa] border border-[#e4ded4]">
            <div className="card-head">
              <div>
                <div className="eyebrow accent-text">DAILY QUANTUM CHALLENGE · DAY 12</div>
                <h2>What is the result of applying H gate twice (H · H) to state |0⟩?</h2>
              </div>
              <span className="badge-chip text-[#c96b2c] border-[#fed7aa] bg-[#fff4e6] font-bold font-mono">
                +50 XP
              </span>
            </div>
            <div className="p-4 pt-1">
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 0, label: 'A', text: '|1⟩ (Excited State)' },
                  { id: 1, label: 'B', text: '|0⟩ (Ground State)', correct: true },
                  { id: 2, label: 'C', text: '|+⟩ (Superposition)' },
                  { id: 3, label: 'D', text: 'Undefined (State collapses)' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      if (!quizSubmitted) {
                        setSelectedQuizAnswer(opt.id);
                      }
                    }}
                    className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center gap-2.5 ${
                      selectedQuizAnswer === opt.id
                        ? quizSubmitted
                          ? opt.correct
                            ? 'bg-[#eef8f2] border-[#287854] text-[#287854] font-bold ring-1 ring-[#287854]'
                            : 'bg-[#fef2f2] border-[#dc2626] text-[#dc2626] font-bold ring-1 ring-[#dc2626]'
                          : 'bg-[#fff4e6] border-[#c96b2c] text-[#c96b2c] font-bold shadow-xs'
                        : 'bg-[#faf8f5] border-[#e4ded4] text-[#211f1b] hover:border-[#c96b2c]/50'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-black/5 flex items-center justify-center font-bold text-[10px]">
                      {opt.label}
                    </span>
                    <span className="font-medium">{opt.text}</span>
                  </button>
                ))}
              </div>

              {quizSubmitted && (
                <div className="mt-3 p-3 rounded-lg bg-[#eef8f2] border border-[#bad8cb] text-xs text-[#287854] flex items-center justify-between">
                  <span className="font-semibold">
                    ✓ Correct! Because H is Hermitian and unitary, H · H = I (identity).
                  </span>
                  <strong className="font-mono font-bold">+50 XP awarded!</strong>
                </div>
              )}
            </div>
            <div className="card-foot">
              <span className="text-xs text-[#746e64]">Answer to keep your 12-day streak active.</span>
              <button
                className="button primary text-xs"
                onClick={() => setQuizSubmitted(true)}
                disabled={selectedQuizAnswer === null || quizSubmitted}
              >
                {quizSubmitted ? 'Completed' : 'Check answer'}
              </button>
            </div>
          </Card>

          {/* Learning Roadmap Modules */}
          <Card className="roadmap">
            <div className="card-head">
              <div>
                <div className="eyebrow">CURRICULUM ROADMAP</div>
                <h2>Quantum foundations path</h2>
              </div>
              <span className="muted-label">18 / 42 lessons</span>
            </div>
            <div className="module-list">
              {modules.map((m, i) => (
                <div key={m.title} className="module-item" onClick={() => setActive('Learn Quantum')}>
                  <span className={`status-dot ${m.status}`} />
                  <div className="module-copy">
                    <strong>
                      0{i + 1} {m.title}
                    </strong>
                    <span>{m.meta}</span>
                  </div>
                  <ChevronRight />
                </div>
              ))}
            </div>
            <div className="card-foot">
              <span className="muted-label">4 modules remaining</span>
              <button className="button secondary" onClick={() => setActive('Learn Quantum')}>
                View full syllabus →
              </button>
            </div>
          </Card>
        </div>

        {/* Right 4-Col Area: Activity Feed & Live Stats */}
        <div className="col-span-4 flex flex-col gap-5">
          {/* Quick Metrics */}
          <Card className="stats-card">
            <div className="card-head">
              <div className="eyebrow">YOUR STATS</div>
              <h2>Learning metrics</h2>
            </div>
            <div className="stat-grid">
              <div className="stat-box">
                <span className="stat-num">42</span>
                <span className="stat-label">Circuits simulated</span>
              </div>
              <div className="stat-box">
                <span className="stat-num">98.4%</span>
                <span className="stat-label">Aer vs PennyLane fidelity</span>
              </div>
              <div className="stat-box">
                <span className="stat-num">18</span>
                <span className="stat-label">Lessons completed</span>
              </div>
              <div className="stat-box">
                <span className="stat-num">5</span>
                <span className="stat-label">Algorithms mastered</span>
              </div>
            </div>
          </Card>

          {/* Activity Feed */}
          <Card className="activity-card">
            <div className="card-head">
              <div className="eyebrow">RECENT ACTIVITY</div>
              <h2>Timeline</h2>
            </div>
            <div className="activity-list">
              {activity.map(([action, detail, time, xp, tone], i) => (
                <div key={i} className="activity-item">
                  <span className={`timeline-dot ${tone}`} />
                  <div className="activity-copy">
                    <strong>{action}</strong>
                    <span>{detail}</span>
                    <small>{time}</small>
                  </div>
                  <span className="xp-tag">{xp}</span>
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
  return (
    <div className="page-content">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">AI QUANTUM MENTOR</div>
          <h1>AI Tutor<span className="accent-dot">.</span></h1>
          <p className="subhead">Context-aware Socratic mentor powered by Gemini 3.5 Flash-Lite.</p>
        </div>
      </div>
      <Card>
        <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
          <BrainCircuit className="w-12 h-12 text-[#c96b2c]" />
          <h2 className="text-lg font-bold text-[#211f1b]">Socratic Quantum Tutor Active</h2>
          <p className="text-xs text-[#5c5850] max-w-md">
            The AI tutor is deeply integrated into your <strong>Challenges</strong> and <strong>Interactive Lessons</strong>. Open any lesson or challenge to receive circuit-aware hints and mathematical breakdowns!
          </p>
        </div>
      </Card>
    </div>
  );
}

function Dashboard({ progress }: { progress?: ProblemProgressState }) {
  return (
    <div className="page-content">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">ANALYTICS &amp; METRICS</div>
          <h1>Dashboard<span className="accent-dot">.</span></h1>
          <p className="subhead">Track your quantum computing comprehension, simulation metrics, and problem-solving streak.</p>
        </div>
      </div>
      <div className="hero-grid">
        <Card className="stat-box p-6">
          <span className="text-3xl font-extrabold text-[#211f1b] font-mono">
            {progress?.totalXp?.toLocaleString() || '2,840'}
          </span>
          <span className="text-xs text-[#746e64] mt-1">Total XP Earned</span>
        </Card>
        <Card className="stat-box p-6">
          <span className="text-3xl font-extrabold text-[#287854] font-mono">
            {progress?.streakDays || 12} Days
          </span>
          <span className="text-xs text-[#746e64] mt-1">Active Learning Streak</span>
        </Card>
        <Card className="stat-box p-6">
          <span className="text-3xl font-extrabold text-[#c96b2c] font-mono">
            {progress?.solvedProblemIds?.length || 1} Solved
          </span>
          <span className="text-xs text-[#746e64] mt-1">Quantum Challenges Mastered</span>
        </Card>
      </div>
    </div>
  );
}

function Community() {
  return (
    <div className="page-content">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">GLOBAL COMMUNITY</div>
          <h1>Quantum Community<span className="accent-dot">.</span></h1>
          <p className="subhead">Discuss quantum algorithms, benchmark circuits, and collaborate with researchers.</p>
        </div>
      </div>
      <Card>
        <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
          <MessageCircle className="w-12 h-12 text-[#287854]" />
          <h2 className="text-lg font-bold text-[#211f1b]">Community Forum &amp; Circuit Sharing</h2>
          <p className="text-xs text-[#5c5850] max-w-md">
            Connect with students and researchers exploring Qiskit Aer, PennyLane, and Google Cirq simulation platforms.
          </p>
        </div>
      </Card>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="page-content">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">WORKSPACE SETTINGS</div>
          <h1>Settings<span className="accent-dot">.</span></h1>
          <p className="subhead">Manage backend simulators, Gemini API keys, and simulation precision.</p>
        </div>
      </div>
      <Card>
        <div className="p-6 flex flex-col gap-4">
          <h3 className="font-bold text-sm text-[#211f1b]">Quantum Simulator Preferences</h3>
          <div className="flex items-center justify-between py-2 border-b border-[#e4ded4] text-xs">
            <span>Default Engine</span>
            <span className="font-mono font-bold text-[#287854]">Qiskit Aer 0.14.0</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#e4ded4] text-xs">
            <span>AI Model</span>
            <span className="font-mono font-bold text-[#c96b2c]">Gemini 3.5 Flash-Lite</span>
          </div>
        </div>
      </Card>
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

    // Record as attempted
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
