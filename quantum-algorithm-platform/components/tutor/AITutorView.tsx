'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  BrainCircuit, Sparkles, Send, RefreshCw, X, ChevronRight, Activity,
  Zap, Copy, Check, Info, Lightbulb, BookOpen, AlertTriangle,
  MessageSquare, HelpCircle, Volume2, Mic, MicOff, ArrowRight, RotateCcw,
  Sparkle, Compass, Trophy, CheckCircle2, ChevronDown, ChevronUp, Layers,
  Smile, GraduationCap, FileText, CheckCircle, Target, Award, PlayCircle,
  History, Plus, Trash2, PanelLeftClose, PanelLeftOpen, FlaskConical
} from 'lucide-react'
import katex from 'katex'
import { BACKEND_URL } from '@/config'

export interface AITutorViewProps {
  initialQuestion?: string
}

interface QuizQuestionItem {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

interface ChatMessage {
  id: string
  sender: 'tutor' | 'user'
  text: string
  timestamp: string
  followUpQuestion?: string
  suggestions?: string[]
  conceptTag?: string
  keyTakeaways?: string[]
  isError?: boolean
}

interface SessionSummary {
  id: string
  title: string
  created_at: string
  updated_at: string
  message_count: number
}

const STARTER_TOPIC_CHIPS = [
  { label: 'How does Superposition work?', prompt: 'Explain how quantum superposition works with an intuitive physical model.' },
  { label: 'How does Entanglement work?', prompt: 'How does Entanglement create instant correlation in a Bell state?' },
  { label: 'What is a Hadamard gate?', prompt: 'What physical and mathematical transformation does the Hadamard (H) gate perform?' },
  { label: 'Explain Quantum Teleportation', prompt: 'Explain the Quantum Teleportation protocol step-by-step.' },
  { label: 'Why is measurement irreversible?', prompt: 'Why does projective quantum measurement collapse the statevector irreversibly?' },
]

const PRACTICE_TOPICS = [
  'Superposition',
  'Entanglement',
  'Quantum Gates',
  'Teleportation',
  'Qubits',
  "Grover's Search",
  'Measurement',
]

function renderLatexMarkdownToHTML(text: string): string {
  if (!text) return ''
  let html = text

  // 1. Code blocks
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => {
    const cleanCode = code.replace(/^(python|qasm|bash|json)\n/, '')
    return `<pre class="my-2 p-3 bg-[#182434] text-gray-100 rounded-lg font-mono text-[11px] overflow-x-auto border border-[#2d4260]">${cleanCode}</pre>`
  })

  // 2. Display Math $$...$$
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try {
      const rendered = katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })
      return `<div class="my-2.5 py-1 px-3 bg-[#fdfcf9] border border-[#ded7cb] rounded-lg overflow-x-auto text-center">${rendered}</div>`
    } catch {
      return `<div class="font-mono text-xs my-2 text-center text-[#c96b2c]">${math}</div>`
    }
  })

  // 3. Inline Math $...$
  html = html.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false })
    } catch {
      return `<span class="font-mono text-xs text-[#c96b2c]">${math}</span>`
    }
  })

  // 4. Headings
  html = html.replace(/^### (.*$)/gim, '<h4 class="font-bold text-[#c96b2c] text-xs uppercase tracking-wider mt-3 mb-1 font-mono">$1</h4>')
  html = html.replace(/^## (.*$)/gim, '<h3 class="font-bold text-[#211f1b] text-sm mt-3 mb-1 font-sans">$1</h3>')
  html = html.replace(/^# (.*$)/gim, '<h2 class="font-bold text-[#211f1b] text-base mt-3 mb-1 font-sans">$1</h2>')

  // 5. Dirac notation formatting (|0⟩, |1⟩, |+⟩, |-⟩, |Φ⁺⟩, etc.)
  html = html.replace(/\|([01\+\-\Phi\Psi\psi\alpha\beta\gamma\delta\u0391-\u03C9\u221E\s\^_\+\-]+)⟩/g, '<span class="inline-flex items-center px-1.5 py-0.5 rounded bg-[#fff5eb] border border-[#f3d0bb] text-[#c96b2c] font-mono text-[11px] font-bold mx-0.5">|$1⟩</span>')

  // 6. Bold & Italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[#211f1b]">$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')

  // 7. Bullet lists
  html = html.replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc my-0.5 text-[#211f1b]">$1</li>')
  html = html.replace(/^- (.*$)/gim, '<li class="ml-4 list-disc my-0.5 text-[#211f1b]">$1</li>')

  // 8. Line breaks
  html = html.replace(/\n/g, '<br/>')

  return html
}

export function AITutorView({ initialQuestion }: AITutorViewProps) {
  // ── Chat State ──────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'tutor',
      text: 'Welcome to the **Quantum Computing AI Tutor**! Ask any question to get direct, clear explanations in plain English, with intuitive physical analogies, key takeaways, and clean math notation when needed.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        'How does Superposition work?',
        'How does Entanglement work?',
        'What is a Hadamard gate?',
        'Explain Quantum Teleportation',
      ],
      conceptTag: 'Quantum Fundamentals',
      keyTakeaways: [
        'Qubits inhabit continuous linear combinations of |0⟩ and |1⟩.',
        'Unitary operations evolve quantum state vectors reversibly.',
        'Measurement collapses superpositions into classical basis states.',
      ],
    },
  ])

  const [input, setInput] = useState<string>(initialQuestion || '')
  const [loading, setLoading] = useState<boolean>(false)
  const [aiStatus, setAiStatus] = useState<{ active: boolean; model: string }>({
    active: true,
    model: 'gemini-3.5-flash',
  })
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isListening, setIsListening] = useState<boolean>(false)
  const [expandedTakeaways, setExpandedTakeaways] = useState<Record<string, boolean>>({
    'msg-welcome': true,
  })

  // ── Quiz State ──────────────────────────────────────────────
  const [selectedQuizTopic, setSelectedQuizTopic] = useState<string>('Superposition')
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionItem[]>([
    {
      question: 'What is the state of a qubit after applying a Hadamard gate to ground state |0⟩?',
      options: ['|1⟩', '(|0⟩ + |1⟩)/√2 (|+⟩ state)', '(|0⟩ - |1⟩)/√2', '|0⟩'],
      correctIndex: 1,
      explanation: 'The Hadamard gate rotates |0⟩ by 90° into an equal superposition state |+⟩ = (|0⟩ + |1⟩)/√2.',
    },
    {
      question: "According to Born's Rule, if a state is |ψ⟩ = (1/2)|0⟩ + (√3/2)|1⟩, what is P(|1⟩)?",
      options: ['50%', '75% ((√3/2)² = 3/4)', '25%', '100%'],
      correctIndex: 1,
      explanation: 'Measurement probability is the square of amplitude: |√3/2|² = 3/4 = 75%.',
    },
    {
      question: 'What happens when you apply two Hadamard gates consecutively (H · H|0⟩)?',
      options: ['State is destroyed', 'Returns to ground state |0⟩ (H · H = I)', 'Creates state |1⟩', 'Mixed noise'],
      correctIndex: 1,
      explanation: 'Hadamard is self-inverse (H = H⁻¹), so H · H = Identity matrix, creating constructive interference on |0⟩.',
    },
  ])
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [isQuizLoading, setIsQuizLoading] = useState<boolean>(false)
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false)
  const [quizScore, setQuizScore] = useState<number>(0)
  const [quizError, setQuizError] = useState<string | null>(null)

  // ── Panel / Drawer State ────────────────────────────────────
  const [isQuizDrawerOpen, setIsQuizDrawerOpen] = useState<boolean>(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false)

  // ── Session History State ───────────────────────────────────
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(false)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Check Gemini Status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/gemini/status`)
        if (res.ok) {
          const data = await res.json()
          setAiStatus({
            active: data.active ?? true,
            model: data.model || 'gemini-3.5-flash',
          })
        }
      } catch {
        setAiStatus({ active: false, model: 'Deterministic Engine' })
      }
    }
    checkStatus()
  }, [])

  // ── Session Management ──────────────────────────────────────

  // Fetch sessions list
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/tutor/history')
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions || [])
      }
    } catch (e) {
      console.error('Failed to fetch sessions:', e)
    }
  }, [])

  // Create a new session
  const createNewSession = useCallback(async () => {
    try {
      const res = await fetch('/api/tutor/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' }),
      })
      if (res.ok) {
        const data = await res.json()
        setActiveSessionId(data.id)
        return data.id
      }
    } catch (e) {
      console.error('Failed to create session:', e)
    }
    return null
  }, [])

  // Save a message to the active session (fire-and-forget)
  const persistMessage = useCallback(async (sessionId: string, role: string, content: string, conceptTag: string = '') => {
    try {
      await fetch(`/api/tutor/history/${sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, content, concept_tag: conceptTag }),
      })
    } catch (e) {
      console.error('Failed to persist message:', e)
    }
  }, [])

  // Update session title from first user message
  const updateSessionTitle = useCallback(async (sessionId: string, firstMsg: string) => {
    const title = firstMsg.slice(0, 60) + (firstMsg.length > 60 ? '…' : '')
    try {
      await fetch(`/api/tutor/history/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
    } catch (e) {
      console.error('Failed to update session title:', e)
    }
  }, [])

  // Load a past session's messages into the chat
  const loadSession = useCallback(async (sessionId: string) => {
    setIsLoadingSessions(true)
    try {
      const res = await fetch(`/api/tutor/history/${sessionId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.messages && data.messages.length > 0) {
          const loadedMessages: ChatMessage[] = data.messages.map((m: any, idx: number) => ({
            id: `loaded-${sessionId}-${idx}`,
            sender: m.role === 'user' ? 'user' : 'tutor',
            text: m.content,
            timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            conceptTag: m.concept_tag || undefined,
          }))
          setMessages(loadedMessages)
        } else {
          // Empty session
          setMessages([{
            id: 'msg-welcome',
            sender: 'tutor',
            text: 'Welcome to the **Quantum Computing AI Tutor**! Ask any question to get direct, clear explanations.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestions: ['How does Superposition work?', 'How does Entanglement work?', 'What is a Hadamard gate?'],
            conceptTag: 'Quantum Fundamentals',
          }])
        }
        setActiveSessionId(sessionId)
      }
    } catch (e) {
      console.error('Failed to load session:', e)
    } finally {
      setIsLoadingSessions(false)
      setIsHistoryOpen(false)
    }
  }, [])

  // Delete a session
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await fetch(`/api/tutor/history/${sessionId}`, { method: 'DELETE' })
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      if (activeSessionId === sessionId) {
        setActiveSessionId(null)
        handleNewChat()
      }
    } catch (e) {
      console.error('Failed to delete session:', e)
    }
  }, [activeSessionId])

  // Initialize: create a session on mount + load history
  useEffect(() => {
    const init = async () => {
      await fetchSessions()
      await createNewSession()
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Start a brand new chat
  const handleNewChat = useCallback(async () => {
    setMessages([{
      id: 'msg-welcome',
      sender: 'tutor',
      text: 'Welcome to the **Quantum Computing AI Tutor**! Ask any question to get direct, clear explanations in plain English, with intuitive physical analogies, key takeaways, and clean math notation when needed.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: ['How does Superposition work?', 'How does Entanglement work?', 'What is a Hadamard gate?', 'Explain Quantum Teleportation'],
      conceptTag: 'Quantum Fundamentals',
      keyTakeaways: [
        'Qubits inhabit continuous linear combinations of |0⟩ and |1⟩.',
        'Unitary operations evolve quantum state vectors reversibly.',
        'Measurement collapses superpositions into classical basis states.',
      ],
    }])
    setExpandedTakeaways({ 'msg-welcome': true })
    setInput('')
    const newId = await createNewSession()
    if (newId) {
      await fetchSessions()
    }
  }, [createNewSession, fetchSessions])

  // Track if first user message was sent (for title update)
  const isFirstUserMessage = useRef(true)

  // ── Send Message Handler ────────────────────────────────────

  const handleSendMessage = useCallback(async (textToSend?: string, mode: 'socratic' | 'eli5' | 'mathematical' = 'socratic') => {
    const questionText = (textToSend || input).trim()
    if (!questionText || loading) return

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: questionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    // Persist user message
    if (activeSessionId) {
      persistMessage(activeSessionId, 'user', questionText)
      // Update title on first user message
      if (isFirstUserMessage.current) {
        isFirstUserMessage.current = false
        updateSessionTitle(activeSessionId, questionText)
      }
    }

    try {
      const history = messages.slice(-4).map((m) => ({
        sender: m.sender,
        text: m.text,
      }))

      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: questionText,
          conversation_history: history,
          mode: mode,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const newMsgId = `msg-${Date.now()}-tutor`
        const tutorReply: ChatMessage = {
          id: newMsgId,
          sender: 'tutor',
          text: data.reply || 'Quantum states evolve under unitary transformations in complex Hilbert space.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          followUpQuestion: data.follow_up_question,
          suggestions: data.suggestions || [],
          conceptTag: data.concept_tag || 'Quantum Concept',
          keyTakeaways: data.key_takeaways || [],
        }
        setMessages((prev) => [...prev, tutorReply])
        if (data.key_takeaways && data.key_takeaways.length > 0) {
          setExpandedTakeaways((prev) => ({ ...prev, [newMsgId]: true }))
        }
        if (data.concept_tag) {
          setSelectedQuizTopic(data.concept_tag)
        }

        // Persist tutor reply
        if (activeSessionId) {
          persistMessage(activeSessionId, 'tutor', tutorReply.text, tutorReply.conceptTag || '')
        }
      } else {
        const errJson = await res.json().catch(() => null)
        const errMsg = errJson?.detail || `Server returned HTTP ${res.status}`
        throw new Error(errMsg)
      }
    } catch (err: any) {
      const errorReply: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        sender: 'tutor',
        text: `⚠️ **Gemini API Live Error:** ${err.message || 'Failed to communicate with live Gemini API service. Please verify server connection and API key.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        conceptTag: 'API Error',
        isError: true,
      }
      setMessages((prev) => [...prev, errorReply])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [input, loading, messages, activeSessionId, persistMessage, updateSessionTitle])

  // ── Quiz Handlers ───────────────────────────────────────────

  const handleGenerateQuiz = async (topicToQuiz: string) => {
    setIsQuizLoading(true)
    setQuizCompleted(false)
    setQuizAnswers({})
    setCurrentQuestionIdx(0)
    setSelectedQuizTopic(topicToQuiz)
    setQuizError(null)

    const latestTutor = messages.filter((m) => m.sender === 'tutor' && !m.isError).slice(-1)[0]
    const context = latestTutor ? latestTutor.text.slice(0, 300) : ''

    try {
      const res = await fetch(`${BACKEND_URL}/api/tutor/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicToQuiz,
          context: context,
          num_questions: 3,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.quiz && data.quiz.length > 0) {
          setQuizQuestions(data.quiz)
        } else {
          throw new Error('Gemini did not return any quiz questions.')
        }
      } else {
        const errJson = await res.json().catch(() => null)
        throw new Error(errJson?.detail || `Quiz generator returned HTTP ${res.status}`)
      }
    } catch (e: any) {
      console.error('Quiz generation error:', e)
      setQuizError(e.message || 'Failed to generate quiz from Gemini.')
    } finally {
      setIsQuizLoading(false)
    }
  }

  const handleAnswerOption = (optionIdx: number) => {
    if (quizAnswers[currentQuestionIdx] !== undefined) return

    const newAnswers = { ...quizAnswers, [currentQuestionIdx]: optionIdx }
    setQuizAnswers(newAnswers)

    const currentQ = quizQuestions[currentQuestionIdx]
    if (optionIdx === currentQ.correctIndex) {
      setQuizScore((prev) => prev + 1)
    }
  }

  const handleNextQuizQuestion = () => {
    if (currentQuestionIdx < quizQuestions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1)
    } else {
      setQuizCompleted(true)
    }
  }

  // Speech-to-Text Voice Input
  const handleToggleVoice = () => {
    if (isListening) {
      setIsListening(false)
      return
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRec) {
      setInput('Explain how quantum entanglement creates instant correlation in a Bell state.')
      return
    }

    try {
      const rec = new SpeechRec()
      rec.lang = 'en-US'
      rec.continuous = false
      rec.interimResults = false

      rec.onstart = () => setIsListening(true)
      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript
        setIsListening(false)
        handleSendMessage(transcript)
      }
      rec.onerror = () => setIsListening(false)
      rec.start()
    } catch {
      setIsListening(false)
    }
  }

  // Copy Message to Clipboard
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleTakeaway = (id: string) => {
    setExpandedTakeaways((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const activeQuestion = quizQuestions[currentQuestionIdx]
  const currentSelectedAnswer = quizAnswers[currentQuestionIdx]
  const isCurrentAnswered = currentSelectedAnswer !== undefined

  // ── RENDER ──────────────────────────────────────────────────

  return (
    <div className="page-content flex flex-col gap-4 py-6 max-w-[1360px] mx-auto min-h-[88vh] relative">
      {/* 1. Header Banner & Topic Suggestions */}
      <div className="flex flex-col gap-3 pb-3 border-b border-[#ded7cb]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#c96b2c] tracking-wider uppercase mb-1">
              <BrainCircuit className="w-4 h-4 text-[#c96b2c]" />
              <span>SIH QUANTUM COMPUTING AI TUTOR</span>
            </div>
            <h1
              className="font-bold tracking-tight text-[#211f1b]"
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 800,
                fontSize: '32px',
                lineHeight: 1.1,
              }}
            >
              Quantum Computing AI Tutor<span className="text-[#c96b2c]">.</span>
            </h1>
            <p className="text-xs text-[#746e64] mt-0.5 font-sans">
              Direct, plain-English answers with intuitive physical analogies, LaTeX formulas, and interactive practice quizzes.
            </p>
          </div>

          {/* Right Side: Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {/* History Toggle */}
            <button
              onClick={() => { setIsHistoryOpen(!isHistoryOpen); fetchSessions() }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                isHistoryOpen
                  ? 'bg-[#211f1b] border-[#211f1b] text-white'
                  : 'bg-[#fffdf9] border-[#ded7cb] text-[#211f1b] hover:border-[#c96b2c]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
            </button>

            {/* New Chat */}
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#ded7cb] bg-[#fffdf9] text-[#211f1b] text-xs font-semibold hover:border-[#c96b2c] transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Chat</span>
            </button>

            {/* Quiz Toggle */}
            <button
              onClick={() => setIsQuizDrawerOpen(!isQuizDrawerOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                isQuizDrawerOpen
                  ? 'bg-[#c96b2c] border-[#c96b2c] text-white'
                  : 'bg-[#fff5eb] border-[#f3d0bb] text-[#c96b2c] hover:bg-[#ffe8d4]'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Practice Quiz</span>
            </button>

            {/* Gemini Status */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-2xs ${
                aiStatus.active
                  ? 'bg-[#edf7ed] border-[#4f806d] text-[#1e4620]'
                  : 'bg-[#fff5eb] border-[#c96b2c] text-[#c96b2c]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{aiStatus.active ? `${aiStatus.model} Active` : 'Deterministic Engine'}</span>
            </div>
          </div>
        </div>

        {/* Quick Topic Starter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 no-scrollbar">
          <span className="text-[10px] font-mono font-bold text-[#746e64] uppercase tracking-wider shrink-0 mr-1">
            Try asking:
          </span>
          {STARTER_TOPIC_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              disabled={loading}
              onClick={() => handleSendMessage(chip.prompt)}
              className="px-3 py-1.5 rounded-xl bg-[#fffdf9] hover:bg-[#f4eee4] hover:border-[#c96b2c] border border-[#ded7cb] text-[#211f1b] text-xs font-medium shrink-0 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main Chat Area — Full Width */}
      <div className="flex-1 flex flex-col">
        <div className="bg-[#fffdf9] border border-[#ded7cb] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col h-[660px] relative">
          <div className="flex items-center justify-between pb-3 border-b border-[#ded7cb]/60">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#c96b2c]" />
              <span className="text-xs font-bold text-[#211f1b] font-mono uppercase">
                Quantum Tutor Conversation
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#746e64]">
              {messages.length} message(s)
            </span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto pr-2 py-3 space-y-5 font-sans">
            {messages.map((msg) => {
              const isTutor = msg.sender === 'tutor'
              const isTakeawayOpen = expandedTakeaways[msg.id] ?? false

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-1.5 ${isTutor ? 'items-start' : 'items-end'}`}
                >
                  {/* Meta Header */}
                  <div className="flex items-center gap-2 px-1 text-[10px] font-mono text-[#746e64]">
                    <span className="font-bold text-[#211f1b]">
                      {isTutor ? 'Qubit.lab AI Tutor' : 'You'}
                    </span>
                    <span>·</span>
                    <span>{msg.timestamp}</span>
                    {msg.conceptTag && (
                      <span className="px-1.5 py-0.2 rounded bg-[#f4eee4] text-[#c96b2c] font-bold">
                        {msg.conceptTag}
                      </span>
                    )}
                  </div>

                  {/* Bubble Container */}
                  <div
                    className={`p-4 rounded-2xl max-w-[94%] text-xs leading-relaxed flex flex-col gap-3 ${
                      isTutor
                        ? 'bg-[#fcfbf9] border border-[#ded7cb] text-[#211f1b] rounded-tl-xs shadow-2xs'
                        : 'bg-[#211f1b] text-white rounded-tr-xs shadow-xs'
                    }`}
                  >
                    {/* HTML formatted text with KaTeX support */}
                    <div
                      className="prose prose-xs max-w-none break-words"
                      dangerouslySetInnerHTML={{
                        __html: renderLatexMarkdownToHTML(msg.text),
                      }}
                    />

                    {/* Key Takeaways Collapsible Card */}
                    {isTutor && msg.keyTakeaways && msg.keyTakeaways.length > 0 && (
                      <div className="rounded-xl border border-[#ded7cb] bg-[#fffdf9] overflow-hidden">
                        <button
                          onClick={() => toggleTakeaway(msg.id)}
                          className="w-full px-3 py-2 flex items-center justify-between text-[11px] font-bold text-[#211f1b] hover:bg-[#f4eee4] transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 text-[#c96b2c]">
                            <FileText className="w-3.5 h-3.5" />
                            <span>Key Takeaways</span>
                          </div>
                          {isTakeawayOpen ? (
                            <ChevronUp className="w-3.5 h-3.5 text-[#746e64]" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-[#746e64]" />
                          )}
                        </button>

                        {isTakeawayOpen && (
                          <ul className="px-4 pb-3 pt-1 text-[11px] text-[#746e64] space-y-1 list-disc list-inside border-t border-[#ded7cb]/60 bg-[#fdfcf9]">
                            {msg.keyTakeaways.map((point, pIdx) => (
                              <li key={pIdx} className="leading-snug">
                                <span className="text-[#211f1b] font-medium">{point}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {/* Tutor Actions Toolbar */}
                    {isTutor && (
                      <div className="pt-2 border-t border-[#ded7cb]/60 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Quiz on this topic */}
                          <button
                            disabled={isQuizLoading}
                            onClick={() => {
                              handleGenerateQuiz(msg.conceptTag || 'Superposition')
                              setIsQuizDrawerOpen(true)
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#fff5eb] hover:bg-[#ffe8d4] text-[#c96b2c] border border-[#f3d0bb] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            title="Generate practice quiz on this topic in the Quiz panel"
                          >
                            <Trophy className="w-3.5 h-3.5" />
                            <span>Practice Quiz</span>
                          </button>

                          {/* ELI5 mode */}
                          <button
                            disabled={loading}
                            onClick={() => handleSendMessage(`Explain this like I'm 5 with simple everyday analogies: ${msg.text.slice(0, 150)}`, 'eli5')}
                            className="px-2 py-1 rounded-lg bg-[#f4eee4] hover:bg-[#eadecc] text-[#211f1b] text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Re-explain with simple analogies"
                          >
                            <Smile className="w-3 h-3 text-[#c96b2c]" />
                            <span>ELI5 Mode</span>
                          </button>

                          {/* Dirac mode */}
                          <button
                            disabled={loading}
                            onClick={() => handleSendMessage(`Re-explain this using rigorous mathematical Dirac bra-ket notation and matrix forms: ${msg.text.slice(0, 150)}`, 'mathematical')}
                            className="px-2 py-1 rounded-lg bg-[#f4eee4] hover:bg-[#eadecc] text-[#211f1b] text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Upgrade with formal Dirac math"
                          >
                            <GraduationCap className="w-3 h-3 text-[#c96b2c]" />
                            <span>Dirac Math</span>
                          </button>
                        </div>

                        {/* Copy Action */}
                        <button
                          onClick={() => handleCopy(msg.text, msg.id)}
                          className="text-[10px] font-mono text-[#746e64] hover:text-[#211f1b] flex items-center gap-1 cursor-pointer transition-colors"
                          title="Copy answer"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-[#4f806d]" />
                              <span className="text-[#4f806d]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Next Exploration Suggestions */}
                    {isTutor && msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="pt-1 flex flex-col gap-1.5">
                        <div className="text-[10px] font-mono font-bold text-[#746e64] uppercase">
                          Explore next:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestions.map((sug, idx) => (
                            <button
                              key={idx}
                              disabled={loading}
                              onClick={() => handleSendMessage(sug)}
                              className="px-2.5 py-1 rounded-lg bg-[#f4eee4] hover:bg-[#eadecc] hover:text-[#211f1b] text-[#c96b2c] font-medium text-[11px] transition-all cursor-pointer disabled:opacity-50 text-left"
                            >
                              {sug} →
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex items-start gap-2 text-xs text-[#746e64] font-mono p-2 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#c96b2c] mt-0.5" />
                <span>AI Tutor is reasoning &amp; composing response...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <div className="pt-3 border-t border-[#ded7cb]/60 bg-[#fffdf9]">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex items-center gap-2"
            >
              <div className="flex-1 relative flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  disabled={loading}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask any quantum computing question (e.g. 'How does Teleportation work?')..."
                  className="w-full pl-4 pr-10 py-3 rounded-xl border border-[#ded7cb] bg-[#fcfbf9] text-xs text-[#211f1b] outline-none focus:border-[#c96b2c] focus:ring-1 focus:ring-[#c96b2c] transition-all font-sans disabled:opacity-50"
                />

                {/* Voice Button */}
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`absolute right-2 p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isListening ? 'text-[#da1e28] animate-pulse' : 'text-[#746e64] hover:text-[#c96b2c]'
                  }`}
                  title="Speak question"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-5 py-3 rounded-xl bg-[#c96b2c] hover:bg-[#b05a20] text-white text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <span>Ask</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 3. History Sidebar Overlay (Left) */}
      {isHistoryOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40 backdrop-blur-[2px]"
            onClick={() => setIsHistoryOpen(false)}
            style={{ transition: 'opacity 200ms ease' }}
          />

          {/* Sidebar Panel */}
          <div
            className="fixed left-0 top-0 h-full w-[340px] max-w-[85vw] bg-[#fffdf9] border-r border-[#ded7cb] shadow-xl z-50 flex flex-col"
            style={{
              animation: 'slideInLeft 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#ded7cb]">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#c96b2c]" />
                <span className="text-sm font-bold text-[#211f1b] font-mono uppercase tracking-wider">
                  Chat History
                </span>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#f4eee4] transition-colors cursor-pointer text-[#746e64] hover:text-[#211f1b]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* New Chat Button */}
            <div className="px-4 py-3">
              <button
                onClick={() => { handleNewChat(); setIsHistoryOpen(false) }}
                className="w-full py-2.5 rounded-xl bg-[#211f1b] hover:bg-[#383531] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Start New Chat</span>
              </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#746e64] font-mono">
                  No saved conversations yet.
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group p-3.5 rounded-xl border cursor-pointer transition-all ${
                      activeSessionId === session.id
                        ? 'bg-[#fff5eb] border-[#c96b2c] shadow-xs'
                        : 'bg-[#fcfbf9] border-[#ded7cb] hover:border-[#c96b2c]/50 hover:shadow-2xs'
                    }`}
                    onClick={() => loadSession(session.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#211f1b] truncate">
                          {session.title}
                        </p>
                        <p className="text-[10px] text-[#746e64] font-mono mt-1">
                          {session.message_count} messages · {new Date(session.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSession(session.id)
                        }}
                        className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[#fff0f0] hover:text-[#da1e28] text-[#746e64] transition-all cursor-pointer"
                        title="Delete this conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* 4. Quiz Drawer Overlay (Right) */}
      {isQuizDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40 backdrop-blur-[2px]"
            onClick={() => setIsQuizDrawerOpen(false)}
            style={{ transition: 'opacity 200ms ease' }}
          />

          {/* Drawer Panel */}
          <div
            className="fixed right-0 top-0 h-full w-[420px] max-w-[90vw] bg-[#fffdf9] border-l border-[#ded7cb] shadow-xl z-50 flex flex-col"
            style={{
              animation: 'slideInRight 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#ded7cb]">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#c96b2c]" />
                <span className="text-sm font-bold text-[#211f1b] font-mono uppercase tracking-wider">
                  AI Practice &amp; Quiz Deck
                </span>
              </div>
              <button
                onClick={() => setIsQuizDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#f4eee4] transition-colors cursor-pointer text-[#746e64] hover:text-[#211f1b]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quiz Content Scroll Area */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              {/* Topic Selector */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-mono font-bold text-[#746e64] uppercase">
                  Select Quiz Topic:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRACTICE_TOPICS.map((topic, idx) => (
                    <button
                      key={idx}
                      disabled={isQuizLoading}
                      onClick={() => handleGenerateQuiz(topic)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        selectedQuizTopic === topic
                          ? 'bg-[#c96b2c] text-white shadow-2xs'
                          : 'bg-[#f4eee4] hover:bg-[#eadecc] text-[#211f1b] border border-[#ded7cb]'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={() => handleGenerateQuiz(selectedQuizTopic)}
                disabled={isQuizLoading}
                className="w-full py-2.5 rounded-xl bg-[#211f1b] hover:bg-[#383531] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isQuizLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#c96b2c]" />
                    <span>Generating 3 Questions with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#c96b2c]" />
                    <span>Generate New Practice Quiz</span>
                  </>
                )}
              </button>

              {/* Quiz Generation Error Banner */}
              {quizError && (
                <div className="p-3.5 rounded-xl bg-[#fff0f0] border border-[#ffccd0] text-[#da1e28] text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>Gemini Quiz Error:</strong> {quizError}
                  </div>
                </div>
              )}

              {/* Active Quiz Card */}
              {!quizCompleted && activeQuestion && (
                <div className="p-4 rounded-xl bg-[#fcfbf9] border border-[#ded7cb] flex flex-col gap-4 flex-1">
                  {/* Stepper Progress */}
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-[#c96b2c]">
                      Question {currentQuestionIdx + 1} of {quizQuestions.length}
                    </span>
                    <div className="flex gap-1">
                      {quizQuestions.map((_, dotIdx) => (
                        <span
                          key={dotIdx}
                          className={`w-2 h-2 rounded-full ${
                            dotIdx === currentQuestionIdx
                              ? 'bg-[#c96b2c]'
                              : dotIdx < currentQuestionIdx
                              ? 'bg-[#4f806d]'
                              : 'bg-[#ded7cb]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <h3 className="text-xs font-bold text-[#211f1b] leading-relaxed">
                    {activeQuestion.question}
                  </h3>

                  {/* Option Pills (A, B, C, D) */}
                  <div className="flex flex-col gap-2">
                    {activeQuestion.options.map((opt, optIdx) => {
                      const isSelected = currentSelectedAnswer === optIdx
                      const isCorrect = optIdx === activeQuestion.correctIndex

                      let btnStyle = 'bg-[#fffdf9] border-[#ded7cb] text-[#211f1b] hover:border-[#c96b2c]'
                      if (isCurrentAnswered) {
                        if (isCorrect) {
                          btnStyle = 'bg-[#edf7ed] border-[#4f806d] text-[#1e4620] ring-1 ring-[#4f806d] font-bold'
                        } else if (isSelected && !isCorrect) {
                          btnStyle = 'bg-[#fff0f0] border-[#ffccd0] text-[#da1e28]'
                        } else {
                          btnStyle = 'bg-[#fffdf9] border-[#ded7cb] opacity-50'
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={isCurrentAnswered}
                          onClick={() => handleAnswerOption(optIdx)}
                          className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between gap-2 shadow-2xs ${btnStyle}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>
                          {isCurrentAnswered && isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-[#4f806d] shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Pedagogical Explanation Reveal */}
                  {isCurrentAnswered && (
                    <div
                      className={`p-3.5 rounded-xl text-xs border leading-relaxed flex flex-col gap-1 ${
                        currentSelectedAnswer === activeQuestion.correctIndex
                          ? 'bg-[#edf7ed] border-[#4f806d] text-[#1e4620]'
                          : 'bg-[#fff5eb] border-[#f3d0bb] text-[#8a3800]'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        {currentSelectedAnswer === activeQuestion.correctIndex ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-[#4f806d]" />
                            <span>Correct!</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-[#c96b2c]" />
                            <span>Explanation:</span>
                          </>
                        )}
                      </div>
                      <p className="mt-0.5">{activeQuestion.explanation}</p>
                    </div>
                  )}

                  {/* Next Question / Finish Button */}
                  {isCurrentAnswered && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handleNextQuizQuestion}
                        className="px-5 py-2.5 rounded-xl bg-[#c96b2c] hover:bg-[#b05a20] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <span>
                          {currentQuestionIdx < quizQuestions.length - 1
                            ? 'Next Question'
                            : 'Complete Quiz & View Score'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Quiz Completion & Score Card */}
              {quizCompleted && (
                <div className="p-5 rounded-xl bg-[#fcfbf9] border border-[#ded7cb] flex flex-col items-center justify-center text-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-[#edf7ed] border border-[#4f806d] text-[#4f806d] flex items-center justify-center">
                    <Award className="w-6 h-6" />
                  </div>

                  <div>
                    <div className="text-[10px] font-mono font-bold text-[#c96b2c] uppercase tracking-wider">
                      QUIZ COMPLETE
                    </div>
                    <h3 className="text-base font-bold text-[#211f1b] mt-1">
                      {selectedQuizTopic} Mastery
                    </h3>
                    <p className="text-xs text-[#746e64] mt-0.5">
                      You scored <strong className="text-[#211f1b]">{quizScore} / {quizQuestions.length}</strong> ({((quizScore / quizQuestions.length) * 100).toFixed(0)}%)
                    </p>
                  </div>

                  <div className="flex gap-2 w-full pt-2">
                    <button
                      onClick={() => {
                        setQuizCompleted(false)
                        setQuizAnswers({})
                        setCurrentQuestionIdx(0)
                        setQuizScore(0)
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-[#fffdf9] border border-[#ded7cb] text-[#211f1b] text-xs font-bold hover:bg-[#f4eee4] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#c96b2c]" />
                      <span>Retake</span>
                    </button>

                    <button
                      onClick={() => handleGenerateQuiz(selectedQuizTopic)}
                      className="flex-1 py-2.5 rounded-xl bg-[#c96b2c] hover:bg-[#b05a20] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Next Quiz</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Slide-in animations */}
      <style jsx>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
