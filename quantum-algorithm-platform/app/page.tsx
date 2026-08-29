'use client'

import { useState, useEffect } from 'react'
import {
  Activity, Bell, BookOpen, BrainCircuit, ChevronRight, CircleHelp, Code2,
  Flame, Gauge, GitBranch, Home as HomeIcon, Layers3, LayoutDashboard, Menu, MessageCircle,
  Moon, Play, Plus, Search, Settings, Sparkles, Terminal, Trophy, X, Zap,
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
  streakDays,
  totalXp,
}: {
  active: string;
  setActive: (v: string) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  streakDays: number;
  totalXp: number;
}) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-top">
        <Brand />
        <button className="icon-button" aria-label="Collapse sidebar" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight /> : <Menu />}
        </button>
      </div>
      <div className="eyebrow">Workspace</div>
      <nav className="nav-list">
        {navItems.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className={`nav-item ${active === label ? 'active' : ''}`}
            onClick={() => setActive(label)}
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
  streakDays,
  totalXp,
}: {
  active: string;
  setActive: (v: string) => void;
  streakDays: number;
  totalXp: number;
}) {
  return (
    <header className="topbar">
      <div className="crumb">
        <span>Workspace</span>
        <ChevronRight />
        <strong>{active}</strong>
      </div>
      <div className="top-actions">
        <div className="search">
          <Search />
          <input aria-label="Search" placeholder="Search workspace" />
        </div>
        <div className="top-stat">
          <Flame />
          <strong>{streakDays}</strong>
          <span>day streak</span>
        </div>
        <div className="top-stat xp">
          <Zap />
          <strong>{totalXp.toLocaleString()}</strong>
          <span>XP</span>
        </div>
        <button className="icon-button">
          <Bell />
          <i className="notification" />
        </button>
        <button className="avatar small" onClick={() => setActive('Settings')}>AM</button>
      </div>
    </header>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="progress-track">
      <span style={{ width: `${value}%` }} />
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

function Home({ setActive }: { setActive: (v: string) => void }) {
  return (
    <div className="page-content">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">QUANTUM COMPUTING WORKSPACE</div>
          <h1>Good morning, Arjun<span className="accent-dot">.</span></h1>
          <p className="subhead">Your quantum learning journey is picking up momentum.</p>
        </div>
        <div className="flex gap-2">
          <button className="button primary" onClick={() => setActive('Challenges')}>
            <Trophy /> Start Challenge
          </button>
          <button className="button secondary" onClick={() => setActive('Quantum Simulation')}>
            <Terminal /> Simulator
          </button>
        </div>
      </div>

      <div className="hero-grid">
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
              <p>Understand how a qubit can be in multiple states simultaneously.</p>
              <div className="progress-row">
                <span>4 of 6 lessons</span>
                <strong>68%</strong>
              </div>
              <ProgressBar value={68} />
              <button className="text-button" onClick={() => setActive('Challenges')}>
                Solve challenges <ChevronRight />
              </button>
            </div>
          </div>
        </Card>

        <Card className="simulation-card">
          <div className="card-head">
            <div>
              <div className="eyebrow">FEATURED EXPERIMENT</div>
              <h2>Bell state entanglement</h2>
            </div>
            <button className="more">•••</button>
          </div>
          <div className="circuit-mini">
            <div className="ruler">
              <span>01</span>
              <span>02</span>
              <span>03</span>
              <span>04</span>
            </div>
            <div className="wire">
              <label>q[0]</label>
              <i />
              <b className="gate hadamard">H</b>
              <i />
              <b className="gate cnot">⊕</b>
              <i />
              <i />
            </div>
            <div className="wire">
              <label>q[1]</label>
              <i />
              <i />
              <b className="gate control">●</b>
              <i />
              <i />
            </div>
            <div className="wire classical">
              <label>c[0]</label>
              <i />
              <i />
              <i />
              <i />
              <b>▣</b>
            </div>
          </div>
          <div className="sim-footer">
            <div>
              <span className="live-dot" /> Aer &amp; PennyLane <small>· 0.004s</small>
            </div>
            <button className="text-button" onClick={() => setActive('Quantum Simulation')}>
              Launch in Lab <ChevronRight />
            </button>
          </div>
        </Card>
      </div>

      <Card className="recommend-card">
        <div className="recommend-icon">
          <Sparkles />
        </div>
        <div className="recommend-copy">
          <div className="eyebrow accent-text">RECOMMENDED CHALLENGE</div>
          <h2>Build a Bell State with Socratic Guidance</h2>
          <p>
            Entangle two qubits and observe the simultaneous probability distribution (|00⟩ and |11⟩) with live Bloch sphere decomposition.
          </p>
        </div>
        <button className="button secondary" onClick={() => setActive('Challenges')}>
          Take challenge <ChevronRight />
        </button>
      </Card>

      <div className="lower-grid">
        <Card className="streak-card">
          <div className="card-head">
            <div>
              <div className="eyebrow">LEARNING STREAK</div>
              <h2>12 days <span className="flame-word"><Flame /> on fire</span></h2>
            </div>
            <Trophy className="muted-icon" />
          </div>
          <div className="week">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <div key={`${day}${i}`} className={`day ${i < 5 ? 'done' : i === 5 ? 'today' : ''}`}>
                <span>{day}</span>
                <i>{i < 5 ? '✓' : ''}</i>
              </div>
            ))}
          </div>
          <p className="small-copy">Keep going — 3 more days to beat your personal best.</p>
        </Card>
        <Card className="activity-card">
          <div className="card-head">
            <div>
              <div className="eyebrow">RECENT ACTIVITY</div>
              <h2>Your latest wins</h2>
            </div>
            <button className="text-button">View all <ChevronRight /></button>
          </div>
          <div className="activity-list">
            {activity.map(([type, title, date, xp, tone]) => (
              <div className="activity-item" key={title}>
                <div className={`activity-icon ${tone}`}>
                  <Activity />
                </div>
                <div>
                  <strong>{title}</strong>
                  <span>{type} · {date}</span>
                </div>
                <b>{xp}</b>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Learn({ setActive }: { setActive: (v: string) => void }) {
  return (
    <div className="page-content">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">LEARNING PATH</div>
          <h1>Learn quantum<span className="accent-dot">.</span></h1>
          <p className="subhead">Build intuition, then make it executable.</p>
        </div>
        <button className="button primary" onClick={() => setActive('Challenges')}>
          <Trophy /> Open Challenges
        </button>
      </div>
      <div className="tabs">
        <button className="tab active">Courses</button>
        <button className="tab" onClick={() => setActive('Challenges')}>Challenges</button>
        <button className="tab" onClick={() => setActive('Quantum Simulation')}>Simulation</button>
        <button className="tab" onClick={() => setActive('AI Tutor')}>AI Tutor</button>
      </div>
      <Card className="roadmap">
        <div className="card-head">
          <div>
            <div className="eyebrow">QUANTUM FOUNDATIONS</div>
            <h2>Your skill tree</h2>
          </div>
          <span className="muted-label">18 / 42 lessons</span>
        </div>
        <div className="module-list">
          {modules.map((mod, i) => (
            <button
              key={mod.title}
              className={`module-row ${mod.status}`}
              onClick={() => mod.status !== 'locked' && setActive('Challenges')}
            >
              <div className={`module-node ${mod.tone}`}>
                {mod.status === 'complete' ? '✓' : mod.status === 'locked' ? '—' : `0${i + 1}`}
              </div>
              <div className="module-copy">
                <strong>{mod.title}</strong>
                <span>{mod.meta}</span>
              </div>
              <div className="module-progress">
                {mod.status === 'complete' ? (
                  <span className="complete-copy">Completed</span>
                ) : mod.status === 'active' ? (
                  <>
                    <ProgressBar value={42} />
                    <small>42%</small>
                  </>
                ) : (
                  <span>{mod.status === 'locked' ? 'Locked' : 'Start'}</span>
                )}
              </div>
              <ChevronRight />
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Tutor() {
  const [messages, setMessages] = useState<Array<[string, string]>>([
    [
      'tutor',
      'Hello Arjun! I am your Quantum AI Socratic Tutor. Ask me any question about statevectors, superposition, Bell entanglement, or circuit diagnostics!',
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
        if (data.issues && data.issues.length > 0) {
          reply += `\n\nFindings: ${data.issues.map((i: any) => `[${i.type}] ${i.message}`).join('\n')}`;
        }
        setMessages((prev) => [...prev, ['tutor', reply]]);
      } else {
        setMessages((prev) => [
          ...prev,
          [
            'tutor',
            'I analyzed your query: in quantum mechanics, superposition is created using Hadamard (H) gates and entanglement is mediated by two-qubit CNOT gates.',
          ],
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        [
          'tutor',
          'I am currently connected to the local quantum simulation engine. Feel free to ask about Bell states, Grover search, or QFT.',
        ],
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content tutor-page">
      <div className="welcome-row">
        <div>
          <div className="eyebrow accent-text">SOCRATIC AI TUTOR</div>
          <h1>Ask, explore, understand<span className="accent-dot">.</span></h1>
          <p className="subhead">
            Your tutor asks guiding questions rather than just handing you answers.
          </p>
        </div>
      </div>
      <Card className="tutor-chat-card">
        <div className="chat-stream">
          {messages.map(([role, text], i) => (
            <div key={i} className={`chat-bubble ${role}`}>
              {role === 'tutor' && (
                <div className="avatar-chip">
                  <BrainCircuit />
                </div>
              )}
              <div className="bubble-text">{text}</div>
            </div>
          ))}
          {loading && (
            <div className="chat-bubble tutor">
              <div className="avatar-chip">
                <BrainCircuit />
              </div>
              <div className="bubble-text typing">Thinking through quantum mechanics...</div>
            </div>
          )}
        </div>
        <div className="prompt-chips">
          <button onClick={() => sendMessage('Explain the Bell state (|00> + |11>)/sqrt(2)')}>
            What is the Bell state?
          </button>
          <button onClick={() => sendMessage('Why does Hadamard create superposition?')}>
            Why Hadamard?
          </button>
          <button onClick={() => sendMessage('How does quantum teleportation work?')}>
            Quantum Teleportation
          </button>
          <button onClick={() => sendMessage('Check for unmeasured qubits or errors')}>
            Check for errors
          </button>
        </div>
        <div className="chat-input">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your tutor anything about quantum computing..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendMessage(input);
            }}
          />
          <button aria-label="Voice input">
            <Activity />
          </button>
          <button className="send" onClick={() => sendMessage(input)}>
            <ChevronRight />
          </button>
        </div>
        <div className="chat-meta">
          <span>Qubit.lab Tutor <ChevronRight /></span>
          <small>Backed by Qiskit Aer, PennyLane, Cirq &amp; qsim quantum engines.</small>
        </div>
      </Card>
    </div>
  );
}

function Dashboard({ progress }: { progress: ProblemProgressState }) {
  const solvedCount = progress.solvedProblemIds.length;
  const mastery = Math.round((solvedCount / 6) * 100);

  return (
    <div className="page-content">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">YOUR OVERVIEW</div>
          <h1>Progress, measured<span className="accent-dot">.</span></h1>
          <p className="subhead">Small experiments compound into quantum fluency.</p>
        </div>
        <button className="button secondary">
          <Plus /> Share progress
        </button>
      </div>
      <div className="metrics">
        <Card>
          <div className="metric-label">CHALLENGES SOLVED</div>
          <div className="metric-value">
            {solvedCount} <span>/ 6</span>
          </div>
          <ProgressBar value={mastery} />
          <small>{mastery}% concepts mastered</small>
        </Card>
        <Card>
          <div className="metric-label">SIMULATIONS RUN</div>
          <div className="metric-value">
            128 <span className="positive">+24%</span>
          </div>
          <div className="mini-spark">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <small>vs. last month</small>
        </Card>
        <Card>
          <div className="metric-label">TOTAL XP EARNED</div>
          <div className="metric-value">
            {progress.totalXp} <span>XP</span>
          </div>
          <div className="accuracy-ring">
            <span>+{progress.streakDays}d</span>
          </div>
          <small>Streak: {progress.streakDays} days active</small>
        </Card>
      </div>
      <div className="dashboard-grid">
        <Card className="heatmap-card">
          <div className="card-head">
            <div>
              <div className="eyebrow">PRACTICE ACTIVITY</div>
              <h2>Consistency is a superpower</h2>
            </div>
            <span className="muted-label">Last 12 weeks</span>
          </div>
          <div className="heatmap">
            {Array.from({ length: 84 }, (_, i) => (
              <i key={i} style={{ opacity: [0, 0.25, 0.45, 0.7, 1][(i * 7 + 3) % 5] }} />
            ))}
          </div>
          <div className="heat-legend">
            <span>Less</span>
            {[0.2, 0.4, 0.6, 0.8, 1].map((o) => (
              <i key={o} style={{ opacity: o }} />
            ))}
            <span>More</span>
          </div>
        </Card>
        <Card className="weak-card">
          <div className="eyebrow">TOPIC MASTERY</div>
          <h2>Concept Breakdown</h2>
          {[
            ['Superposition', progress.solvedProblemIds.includes('superposition') ? 100 : 40],
            ['Quantum Gates', progress.solvedProblemIds.includes('flip_qubit') ? 100 : 30],
            ['Entanglement', progress.solvedProblemIds.includes('bell_state') ? 100 : 50],
            ['Measurement', progress.solvedProblemIds.includes('quantum_coin') ? 100 : 25],
          ].map(([label, val]) => (
            <div className="topic-row" key={label as string}>
              <div>
                <span>{label as string}</span>
                <b>{val}%</b>
              </div>
              <ProgressBar value={val as number} />
            </div>
          ))}
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
          <div className="eyebrow">THE QUANTUM COMMONS</div>
          <h1>Learn out loud<span className="accent-dot">.</span></h1>
          <p className="subhead">Ideas are better when they have somewhere to go.</p>
        </div>
        <button className="button primary">
          <Plus /> New post
        </button>
      </div>
      <div className="tabs">
        <button className="tab active">Discussions</button>
        <button className="tab">Blogs</button>
        <button className="tab">Research papers</button>
      </div>
      <div className="community-grid">
        {[
          ['How do you visualize phase kickback in Grover search?', 'Maya Rao', '12 replies', '48', 'Quantum gates'],
          ['A friendly introduction to Bell states and entanglement', 'Rohan Singh', '8 min read', '34', 'Algorithms'],
          ['Cross-backend verification: comparing Aer, Cirq and PennyLane', 'Dr. Kavya Iyer', 'Research note', '62', 'Research'],
        ].map(([title, author, meta, votes, tag]) => (
          <Card className="post-card" key={title}>
            <div className="post-tag">{tag}</div>
            <h2>{title}</h2>
            <p>Exploring the mental models and practical techniques that make quantum concepts click.</p>
            <div className="post-footer">
              <div className="avatar tiny">{author.split(' ').map((n) => n[0]).join('')}</div>
              <span>{author}</span>
              <span>·</span>
              <span>{meta}</span>
              <b>↑ {votes}</b>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="page-content settings-page">
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
          <label>
            Display name
            <input defaultValue="Arjun Mehta" />
          </label>
          <label>
            Bio
            <textarea defaultValue="Learning quantum algorithms and circuits one gate at a time." />
          </label>
          <div className="form-row">
            <label>
              Interface language
              <select defaultValue="English">
                <option>English</option>
                <option>Hindi</option>
              </select>
            </label>
            <label>
              Theme
              <select defaultValue="Dark">
                <option>Dark</option>
                <option>Light</option>
              </select>
            </label>
          </div>
          <button className="button primary">Save changes</button>
        </Card>
      </div>
    </div>
  );
}

export default function Page() {
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

  let content: React.ReactNode;

  if (active === 'Home') {
    content = <Home setActive={setActive} />;
  } else if (active === 'Learn Quantum') {
    content = (
      <LearnView
        setActive={setActive}
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
      <QuantumSimulatorWorkbench />
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
        setActive={(v) => {
          if (v !== 'Challenges') {
            setActiveProblem(null);
            setSelectedProblemDetail(null);
          }
          setActive(v);
        }}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        streakDays={progress.streakDays}
        totalXp={progress.totalXp}
      />
      <div className="main-shell">
        {active !== 'Quantum Simulation' && !isChallengeSolverMode && (
          <Topbar
            active={active}
            setActive={setActive}
            streakDays={progress.streakDays}
            totalXp={progress.totalXp}
          />
        )}
        {content}
      </div>
    </div>
  );
}
