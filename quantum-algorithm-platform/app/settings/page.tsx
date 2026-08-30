'use client'

import React, { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { LogOut, User as UserIcon, Shield, CheckCircle2 } from 'lucide-react'

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [displayName, setDisplayName] = useState(user?.name || 'Arjun Mehta')
  const [bio, setBio] = useState('Learning quantum algorithms one circuit at a time.')
  const [saved, setSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSignOut = async () => {
    await logout()
    router.push('/landing')
  }

  return (
    <AppShell>
      <div className="page-content settings-page">
        <div className="eyebrow">WORKSPACE SETTINGS</div>
        <h1>
          Make it yours<span className="accent-dot">.</span>
        </h1>

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

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <label>
                Display name
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </label>

              <label>
                Email
                <input
                  type="text"
                  readOnly
                  disabled
                  value={user?.email || 'arjun.mehta@quantum.org'}
                  className="opacity-70 bg-gray-100"
                />
              </label>

              <label>
                Bio
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </label>

              <div className="form-row">
                <label>
                  Interface language
                  <select defaultValue="English">
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Spanish</option>
                    <option>French</option>
                  </select>
                </label>
                <label>
                  Theme
                  <select defaultValue="Light">
                    <option>Light</option>
                    <option>Dark</option>
                    <option>System</option>
                  </select>
                </label>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button type="submit" className="button primary cursor-pointer">
                  {saved ? '✓ Saved!' : 'Save changes'}
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg border border-red-200 font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
