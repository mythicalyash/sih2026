'use client'

import { useState, useEffect } from 'react'
import {
  Activity, Bell, BookOpen, BrainCircuit, ChevronRight, CircleHelp, Code2,
  Flame, Gauge, GitBranch, Home as HomeIcon, Layers3, LayoutDashboard, Menu, MessageCircle,
  Moon, Play, Plus, Search, Settings, Sparkles, Terminal, Trophy, X, Zap,
  PanelLeftClose, PanelLeftOpen, PanelLeft
} from 'lucide-react'

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
    if (label === 'Quantum Simulation') {
      setCollapsed(true);
    }
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
}

function Topbar({ active, setActive }: { active: string; setActive: (v: string) => void }) {
  return <header className="topbar"><div className="crumb"><span>Workspace</span><ChevronRight /><strong>{active}</strong></div><div className="top-actions"><div className="search"><Search /><input aria-label="Search" placeholder="Search workspace" /></div><div className="top-stat"><Flame /><strong>12</strong><span>day streak</span></div><div className="top-stat xp"><Zap /><strong>2,840</strong><span>XP</span></div><button className="icon-button"><Bell /><i className="notification" /></button><button className="avatar small" onClick={() => setActive('Settings')}>AM</button></div></header>
}

function ProgressBar({ value }: { value: number }) { return <div className="progress-track"><span style={{ width: `${value}%` }} /></div> }
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <section className={`card ${className}`}>{children}</section> }

function Home({ setActive }: { setActive: (v: string) => void }) {
  return <div className="page-content"><div className="welcome-row"><div><div className="eyebrow">Thursday, August 29, 2024</div><h1>Good morning, Arjun<span className="accent-dot">.</span></h1><p className="subhead">Your quantum journey is picking up momentum.</p></div><button className="button primary" onClick={() => setActive('Learn Quantum')}><Play /> Continue learning</button></div>
    <div className="hero-grid"><Card className="lecture-card"><div className="card-head"><div><div className="eyebrow accent-text">CURRENT COURSE</div><h2>Quantum foundations</h2></div><span className="status-badge">In progress</span></div><div className="lecture-body"><div className="lecture-art"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="core">|ψ⟩</div><span className="particle p1" /><span className="particle p2" /><span className="particle p3" /></div><div className="lecture-info"><div className="eyebrow">UP NEXT · MODULE 02</div><h3>Superposition & the Bloch sphere</h3><p>Understand how a qubit can be in multiple states at once.</p><div className="progress-row"><span>4 of 6 lessons</span><strong>68%</strong></div><ProgressBar value={68} /><button className="text-button" onClick={() => setActive('Learn Quantum')}>Continue lecture <ChevronRight /></button></div></div></Card>
    <Card className="simulation-card"><div className="card-head"><div><div className="eyebrow">LAST SIMULATION</div><h2>Bell state experiment</h2></div><button className="more">•••</button></div><div className="circuit-mini"><div className="ruler"><span>01</span><span>02</span><span>03</span><span>04</span></div><div className="wire"><label>q[0]</label><i /><b className="gate hadamard">H</b><i /><b className="gate cnot">⊕</b><i /><i /></div><div className="wire"><label>q[1]</label><i /><i /><b className="gate control">●</b><i /><i /></div><div className="wire classical"><label>c[0]</label><i /><i /><i /><i /><b>▣</b></div></div><div className="sim-footer"><div><span className="live-dot" /> Aer simulator <small>· 0.004s</small></div><button className="text-button" onClick={() => setActive('Quantum Simulation')}>Reopen <ChevronRight /></button></div></Card></div>
    <Card className="recommend-card"><div className="recommend-icon"><Sparkles /></div><div className="recommend-copy"><div className="eyebrow accent-text">RECOMMENDED BY YOUR AI TUTOR</div><h2>Strengthen your intuition for superposition</h2><p>You&apos;re getting the right answers, but your confidence dipped on the last quiz. Try this focused 5-minute drill.</p></div><button className="button secondary" onClick={() => setActive('AI Tutor')}>Start drill <ChevronRight /></button></Card>
    <div className="lower-grid"><Card className="streak-card"><div className="card-head"><div><div className="eyebrow">LEARNING STREAK</div><h2>12 days <span className="flame-word"><Flame /> on fire</span></h2></div><Trophy className="muted-icon" /></div><div className="week">{['M','T','W','T','F','S','S'].map((day, i) => <div key={`${day}${i}`} className={`day ${i < 5 ? 'done' : i === 5 ? 'today' : ''}`}><span>{day}</span><i>{i < 5 ? '✓' : ''}</i></div>)}</div><p className="small-copy">Keep going — 3 more days to beat your personal best.</p></Card><Card className="activity-card"><div className="card-head"><div><div className="eyebrow">RECENT ACTIVITY</div><h2>Your latest wins</h2></div><button className="text-button">View all <ChevronRight /></button></div><div className="activity-list">{activity.map(([type, title, date, xp, tone]) => <div className="activity-item" key={title}><div className={`activity-icon ${tone}`}><Activity /></div><div><strong>{title}</strong><span>{type} · {date}</span></div><b>{xp}</b></div>)}</div></Card></div>
  </div>
}

function Learn({ setActive }: { setActive: (v: string) => void }) { return <div className="page-content"><div className="welcome-row"><div><div className="eyebrow">LEARNING PATH</div><h1>Learn quantum<span className="accent-dot">.</span></h1><p className="subhead">Build intuition, then make it executable.</p></div><button className="button primary" onClick={() => setActive('Quantum Simulation')}><Terminal /> Open simulator</button></div><div className="tabs"><button className="tab active">Courses</button><button className="tab">Code practice</button><button className="tab">Problems</button><button className="tab">Quiz</button></div><Card className="roadmap"><div className="card-head"><div><div className="eyebrow">QUANTUM FOUNDATIONS</div><h2>Your skill tree</h2></div><span className="muted-label">18 / 42 lessons</span></div><div className="module-list">{modules.map((mod, i) => <button key={mod.title} className={`module-row ${mod.status}`} onClick={() => mod.status !== 'locked' && setActive('AI Tutor')}><div className={`module-node ${mod.tone}`}>{mod.status === 'complete' ? '✓' : mod.status === 'locked' ? '—' : `0${i + 1}`}</div><div className="module-copy"><strong>{mod.title}</strong><span>{mod.meta}</span></div><div className="module-progress">{mod.status === 'complete' ? <span className="complete-copy">Completed</span> : mod.status === 'active' ? <><ProgressBar value={42} /><small>42%</small></> : <span>{mod.status === 'locked' ? 'Locked' : 'Start'}</span>}</div><ChevronRight /></button>)}</div></Card></div> }

import { QuantumSimulatorWorkbench } from '@/components/simulator/QuantumSimulatorWorkbench'
import { BACKEND_URL } from '@/config'

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
  const [active, setActive] = useState('Home');
  const [collapsed, setCollapsed] = useState(false);

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

  const handleSelectTab = (tab: string) => {
    setActive(tab);
    if (tab === 'Quantum Simulation') {
      setCollapsed(true);
    }
  };

  const content =
    active === 'Home' ? (
      <Home setActive={handleSelectTab} />
    ) : active === 'Learn Quantum' ? (
      <Learn setActive={handleSelectTab} />
    ) : active === 'Quantum Simulation' ? (
      <QuantumSimulatorWorkbench
        onToggleSidebar={() => setCollapsed((prev) => !prev)}
        sidebarCollapsed={collapsed}
      />
    ) : active === 'AI Tutor' ? (
      <Tutor />
    ) : active === 'Dashboard' ? (
      <Dashboard />
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
      <div className="main-shell">
        {active !== 'Quantum Simulation' && <Topbar active={active} setActive={handleSelectTab} />}
        {content}
      </div>
    </div>
  );
}
