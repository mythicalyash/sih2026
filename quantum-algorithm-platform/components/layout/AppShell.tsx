'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Activity,
  Bell,
  BookOpen,
  BrainCircuit,
  ChevronRight,
  Code2,
  Flame,
  Gauge,
  GitBranch,
  Home as HomeIcon,
  Layers3,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Play,
  Plus,
  Search,
  Settings,
  Sparkles,
  Terminal,
  Trophy,
  User as UserIcon,
  X,
  Zap,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export const navItems = [
  { label: 'Home', href: '/', icon: HomeIcon },
  { label: 'Learn Quantum', href: '/learn', icon: BookOpen },
  { label: 'Problems', href: '/problems', icon: Trophy },
  { label: 'Quantum Simulation', href: '/simulator', icon: GitBranch },
  { label: 'AI Tutor', href: '/tutor', icon: BrainCircuit },
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Community', href: '/community', icon: MessageCircle },
]

function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark">
        <span />
        <span />
        <span />
        <span />
      </div>
      <span>
        Qubit<span className="brand-dot">.</span>lab
      </span>
    </div>
  )
}

function Sidebar({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const pathname = usePathname()
  const { user } = useAuth()

  const displayName = user?.name || 'Arjun Mehta'
  const initials =
    displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'AM'

  const isNavActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

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
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = isNavActive(href)
          return (
            <Link
              key={label}
              href={href}
              className={`nav-item ${active ? 'active' : ''}`}
              title={collapsed ? label : undefined}
            >
              <Icon />
              <span>{label}</span>
              {label === 'AI Tutor' && <i className="nav-pip" />}
            </Link>
          )
        })}
      </nav>

      <div className="sidebar-bottom">
        <Link
          href="/settings"
          className={`nav-item ${pathname === '/settings' ? 'active' : ''}`}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings />
          <span>Settings</span>
        </Link>

        <Link
          href="/settings"
          className="profile cursor-pointer hover:opacity-90 transition-opacity text-inherit no-underline"
          title={collapsed ? `${displayName} • Quantum explorer` : undefined}
        >
          <div className="avatar">{initials}</div>
          <div className="profile-copy">
            <strong>{displayName}</strong>
            <span>{user?.isGuest ? 'Demo Student' : 'Quantum Explorer'}</span>
          </div>
          <ChevronRight />
        </Link>
      </div>
    </aside>
  )
}

function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement | null>(null)

  const displayName = user?.name || 'Arjun Mehta'
  const initials =
    displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'AM'

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isCoursesActive = pathname === '/learn'
  const isProblemsActive = pathname.startsWith('/problems')
  const isSimulatorActive = pathname === '/simulator'
  const isTutorActive = pathname === '/tutor'

  const handleSignOut = async () => {
    await logout()
    setProfileOpen(false)
    router.push('/landing')
  }

  // Only show the top pill navigation bar on /learn and related learning pages
  const showLearnPillNav = pathname === '/learn' || pathname.startsWith('/learn')

  return (
    <header className="topbar flex items-center justify-between px-6 py-2 border-b border-[#ded7cb] bg-[#f7f4ee]">
      {showLearnPillNav ? (
        <div className="flex items-center gap-1.5">
          <Link
            href="/learn"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border no-underline ${
              isCoursesActive
                ? 'bg-white text-[#211f1b] border-[#ded7cb] shadow-xs font-extrabold'
                : 'bg-transparent text-[#746e64] border-transparent hover:text-[#211f1b] hover:bg-[#e4ded4]/50'
            }`}
          >
            <BookOpen className={`w-3.5 h-3.5 ${isCoursesActive ? 'text-[#c96b2c]' : 'text-[#746e64]'}`} />
            <span>Courses</span>
          </Link>

          <Link
            href="/problems"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border no-underline ${
              isProblemsActive
                ? 'bg-white text-[#211f1b] border-[#ded7cb] shadow-xs font-extrabold'
                : 'bg-transparent text-[#746e64] border-transparent hover:text-[#211f1b] hover:bg-[#e4ded4]/50'
            }`}
          >
            <Trophy className={`w-3.5 h-3.5 ${isProblemsActive ? 'text-[#c96b2c]' : 'text-[#746e64]'}`} />
            <span>Problems &amp; Challenges</span>
          </Link>

          <Link
            href="/simulator"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border no-underline ${
              isSimulatorActive
                ? 'bg-white text-[#211f1b] border-[#ded7cb] shadow-xs font-extrabold'
                : 'bg-transparent text-[#746e64] border-transparent hover:text-[#211f1b] hover:bg-[#e4ded4]/50'
            }`}
          >
            <GitBranch className={`w-3.5 h-3.5 ${isSimulatorActive ? 'text-[#c96b2c]' : 'text-[#746e64]'}`} />
            <span>Quantum Simulator</span>
          </Link>

          <Link
            href="/tutor"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border no-underline ${
              isTutorActive
                ? 'bg-white text-[#211f1b] border-[#ded7cb] shadow-xs font-extrabold'
                : 'bg-transparent text-[#746e64] border-transparent hover:text-[#211f1b] hover:bg-[#e4ded4]/50'
            }`}
          >
            <BrainCircuit className={`w-3.5 h-3.5 ${isTutorActive ? 'text-[#c96b2c]' : 'text-[#746e64]'}`} />
            <span>AI Quantum Tutor</span>
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#746e64] uppercase tracking-wider font-mono">
            {pathname === '/'
              ? 'Workspace Dashboard'
              : pathname.replace('/', '').replace(/-/g, ' ').toUpperCase()}
          </span>
        </div>
      )}

      <div className="top-actions flex items-center gap-3 relative">
        <div className="search flex items-center gap-2 bg-[#fffdf9] border border-[#ded7cb] rounded-lg px-3 py-1.5 w-44 text-xs">
          <Search className="w-3.5 h-3.5 text-[#746e64]" />
          <input
            aria-label="Search"
            placeholder="Search workspace"
            className="bg-transparent border-0 outline-none w-full text-xs text-[#211f1b]"
          />
        </div>
        <button
          className="icon-button relative p-1.5 text-[#746e64] hover:text-[#211f1b] rounded-lg transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <i className="notification" />
        </button>

        {/* Profile Avatar & Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            className="avatar small cursor-pointer hover:ring-2 hover:ring-[#c96b2c]/50 transition-all font-bold"
            onClick={() => setProfileOpen(!profileOpen)}
            title={displayName}
          >
            {initials}
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-[#fffdfa] border border-[#ded7cb] shadow-xl p-3 z-50 flex flex-col gap-2 text-xs animate-fadeIn">
              <div className="pb-2 border-b border-[#ded7cb]">
                <div className="font-bold text-sm text-[#211f1b]">{displayName}</div>
                <div className="text-[11px] text-[#746e64] truncate">
                  {user?.email || 'arjun.mehta@quantum.org'}
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span
                    className={`text-[9.5px] px-2 py-0.5 rounded-full font-semibold font-mono ${
                      user?.isGuest
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}
                  >
                    {user?.isGuest ? 'Guest Mode' : 'Supabase Auth'}
                  </span>
                </div>
              </div>

              <Link
                href="/settings"
                onClick={() => setProfileOpen(false)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#211f1b] hover:bg-[#f0ece4] transition-colors flex items-center gap-2 cursor-pointer font-medium no-underline"
              >
                <Settings className="w-3.5 h-3.5 text-[#746e64]" />
                <span>Account Settings</span>
              </Link>

              <Link
                href="/auth"
                onClick={() => setProfileOpen(false)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#211f1b] hover:bg-[#f0ece4] transition-colors flex items-center gap-2 cursor-pointer font-medium no-underline"
              >
                <UserIcon className="w-3.5 h-3.5 text-[#746e64]" />
                <span>Sign In / Switch Account</span>
              </Link>

              <div className="pt-1 border-t border-[#ded7cb]">
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export function AppShell({
  children,
  isSimulator = false,
}: {
  children: React.ReactNode
  isSimulator?: boolean
}) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault()
        setCollapsed((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={isSimulator ? 'sim-shell' : 'main-shell'}>
        <Topbar />
        {children}
      </div>
    </div>
  )
}
