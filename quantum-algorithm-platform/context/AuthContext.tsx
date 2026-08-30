'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  getSupabaseClient,
  isSupabaseConfigured,
  signInWithEmail,
  signUpWithEmail,
  signInWithOAuth,
  signOutUser,
} from '@/lib/supabaseClient'

export interface UserProfile {
  id: string
  email: string
  name: string
  avatarUrl?: string
  isGuest?: boolean
}

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  isConfigured: boolean
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>
  signup: (email: string, pass: string, name?: string) => Promise<{ success: boolean; error?: string }>
  loginWithOAuth: (provider: 'google' | 'github') => Promise<{ success: boolean; error?: string }>
  loginAsGuest: (guestName?: string) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const DEFAULT_GUEST: UserProfile = {
  id: 'guest-arjun-01',
  email: 'arjun.mehta@quantum.org',
  name: 'Arjun Mehta',
  isGuest: true,
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const configured = isSupabaseConfigured()

  useEffect(() => {
    // 1. Check local storage for persistent guest or cached user
    const cachedUser = typeof window !== 'undefined' ? localStorage.getItem('qubitlab_user') : null
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser))
      } catch (e) {
        console.error('Failed to parse cached user', e)
      }
    }

    // 2. Check Supabase session if configured
    const supabase = getSupabaseClient()
    if (supabase) {
      supabase.auth
        .getSession()
        .then(({ data: { session } }) => {
          if (session?.user) {
            const u: UserProfile = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Quantum Explorer',
              avatarUrl: session.user.user_metadata?.avatar_url,
              isGuest: false,
            }
            setUser(u)
            localStorage.setItem('qubitlab_user', JSON.stringify(u))
          }
          setLoading(false)
        })
        .catch((err) => {
          console.warn('Supabase getSession error:', err)
          setLoading(false)
        })

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const u: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Quantum Explorer',
            avatarUrl: session.user.user_metadata?.avatar_url,
            isGuest: false,
          }
          setUser(u)
          localStorage.setItem('qubitlab_user', JSON.stringify(u))
        } else if (!cachedUser) {
          setUser(null)
          localStorage.removeItem('qubitlab_user')
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    } else {
      // Default to guest if no custom cached user
      if (!cachedUser) {
        setUser(DEFAULT_GUEST)
        localStorage.setItem('qubitlab_user', JSON.stringify(DEFAULT_GUEST))
      }
      setLoading(false)
    }
  }, [])

  const login = async (email: string, pass: string) => {
    setLoading(true)
    const res = await signInWithEmail(email, pass)
    setLoading(false)
    if (res.error) {
      return { success: false, error: res.error.message }
    }
    if (res.user) {
      const u: UserProfile = {
        id: res.user.id,
        email: res.user.email || email,
        name: res.user.user_metadata?.full_name || email.split('@')[0],
        isGuest: false,
      }
      setUser(u)
      localStorage.setItem('qubitlab_user', JSON.stringify(u))
      return { success: true }
    }
    return { success: false, error: 'Sign in failed' }
  }

  const signup = async (email: string, pass: string, name?: string) => {
    setLoading(true)
    const res = await signUpWithEmail(email, pass, name)
    setLoading(false)
    if (res.error) {
      return { success: false, error: res.error.message }
    }
    if (res.user) {
      const u: UserProfile = {
        id: res.user.id,
        email: res.user.email || email,
        name: name || email.split('@')[0],
        isGuest: false,
      }
      setUser(u)
      localStorage.setItem('qubitlab_user', JSON.stringify(u))
      return { success: true }
    }
    return { success: false, error: 'Sign up failed' }
  }

  const loginWithOAuth = async (provider: 'google' | 'github') => {
    const res = await signInWithOAuth(provider)
    if (res.error) {
      return { success: false, error: res.error.message }
    }
    return { success: true }
  }

  const loginAsGuest = (guestName = 'Arjun Mehta') => {
    const guestUser: UserProfile = {
      id: `guest-${Date.now()}`,
      email: `${guestName.toLowerCase().replace(/\s+/g, '.')}@quantum.org`,
      name: guestName,
      isGuest: true,
    }
    setUser(guestUser)
    localStorage.setItem('qubitlab_user', JSON.stringify(guestUser))
  }

  const logout = async () => {
    await signOutUser()
    setUser(null)
    localStorage.removeItem('qubitlab_user')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isConfigured: configured,
        login,
        signup,
        loginWithOAuth,
        loginAsGuest,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
