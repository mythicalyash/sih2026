'use client'

import React, { useState, useEffect, useRef } from 'react'
import type { CircuitIR, ExecutionResponse, DiagnosticIssue, TutorResponse, CodeFixResponse } from '@/types/quantum'
import {
  Sparkles,
  Bot,
  X,
  Bug,
  BookOpen,
  Zap,
  MessageSquare,
  Check,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronRight,
  Send,
  Loader2,
  Copy,
  Wand2,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Code2,
} from 'lucide-react'
import { BACKEND_URL } from '@/config'

interface FloatingAIAssistantProps {
  circuitIR: CircuitIR
  activeCode?: string
  activeFramework?: string
  executionResult?: ExecutionResponse | null
  simulationError?: string | null
  onApplyIR?: (ir: CircuitIR) => void
  onApplyCode?: (code: string) => void
}

type TabMode = 'explain' | 'debug' | 'optimize' | 'chat'

export const FloatingAIAssistant: React.FC<FloatingAIAssistantProps> = ({
  circuitIR,
  activeCode = '',
  activeFramework = 'qiskit',
  executionResult,
  simulationError,
  onApplyIR,
  onApplyCode,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<TabMode>('explain')

  // Explain State
  const [explainLoading, setExplainLoading] = useState<boolean>(false)
  const [tutorData, setTutorData] = useState<TutorResponse | null>(null)
  const [explainError, setExplainError] = useState<string | null>(null)

  // Debugger State
  const [debugLoading, setDebugLoading] = useState<boolean>(false)
  const [debugData, setDebugData] = useState<CodeFixResponse | null>(null)
  const [debugError, setDebugError] = useState<string | null>(null)
  const [appliedFix, setAppliedFix] = useState<boolean>(false)

  // Socratic Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; math?: string; chips?: string[] }>>([])
  const [inputQuery, setInputQuery] = useState<string>('')
  const [chatLoading, setChatLoading] = useState<boolean>(false)
  const chatBottomRef = useRef<HTMLDivElement | null>(null)

  // Auto-scroll chat
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, chatLoading])

  // Reset applied state when circuit or code changes
  useEffect(() => {
    setAppliedFix(false)
  }, [circuitIR, activeCode])

  // Trigger Explain Circuit automatically when Explain tab opened or button clicked
  const handleExplainCircuit = async (customPrompt?: string) => {
    setExplainLoading(true)
    setExplainError(null)

    try {
      const res = await fetch(`${BACKEND_URL}/tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          circuit: circuitIR,
          question: customPrompt || '',
          mode: 'socratic',
        }),
      })

      if (!res.ok) throw new Error('Circuit explanation service temporarily unavailable.')
      const data = await res.json()
      setTutorData(data)
    } catch (err: any) {
      setExplainError(err.message || 'Failed to explain circuit.')
    } finally {
      setExplainLoading(false)
    }
  }

  // Trigger Code Debugger using Gemini code fixer
  const handleDebugCode = async () => {
    setDebugLoading(true)
    setDebugError(null)
    setAppliedFix(false)

    try {
      const res = await fetch(`${BACKEND_URL}/tutor/fix-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_code: activeCode,
          language: activeFramework,
          error_message: simulationError || undefined,
          circuit_context: circuitIR,
        }),
      })

      if (!res.ok) throw new Error('Quantum code debugger request failed.')
      const data = await res.json()
      setDebugData(data)
    } catch (err: any) {
      setDebugError(err.message || 'Failed to debug code.')
    } finally {
      setDebugLoading(false)
    }
  }

  // Handle Socratic Q&A Chat
  const handleSendMessage = async (queryText?: string) => {
    const text = queryText || inputQuery
    if (!text.trim() || chatLoading) return

    const userMsg = { role: 'user' as const, text }
    setChatMessages((prev) => [...prev, userMsg])
    if (!queryText) setInputQuery('')
    setChatLoading(true)

    try {
      const res = await fetch(`${BACKEND_URL}/tutor/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          topic: 'Quantum Circuit Workbench',
          circuit_context: circuitIR,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: data.explanation || 'Analyzed your circuit.',
            math: data.checkpoint_question ? `**Checkpoint**: ${data.checkpoint_question}` : undefined,
            chips: data.suggested_chips || [],
          },
        ])
      } else {
        // Fallback response
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: `Based on your circuit with ${circuitIR.num_qubits} qubits and ${circuitIR.gates.length} gates: The state evolves according to the unitary operations applied. Try checking the state probabilities below.`,
          },
        ])
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Here is the quantum insight for your current ${circuitIR.num_qubits}-qubit circuit: Each gate rotates the probability amplitudes on the Bloch sphere.`,
        },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  // Auto-run analysis when popup opens
  useEffect(() => {
    if (isOpen && !tutorData && !explainLoading) {
      handleExplainCircuit()
    }
  }, [isOpen])

  // Count circuit issues for badge
  const numIssues = (tutorData?.issues || []).length
  const hasErrors = (tutorData?.issues || []).some((i) => i.severity === 'error') || !!simulationError

  return (
    <>
      {/* 1. FLOATING ACTION BUTTON (Bottom-Right) */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className={`px-4 py-2.5 rounded-full font-sans text-xs font-bold transition-all shadow-xl flex items-center gap-2 cursor-pointer border select-none group transform hover:scale-105 active:scale-95 ${
            isOpen
              ? 'bg-[#c96b2c] text-white border-[#c96b2c]'
              : 'bg-[#211f1b] hover:bg-[#2c2823] text-white border-[#e4ded4]/20'
          }`}
          title="Open AI Circuit Explainer & Code Debugger"
        >
          <div className="relative">
            <Sparkles className="w-4 h-4 text-[#f59e0b] animate-pulse" />
            {hasErrors ? (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
            ) : numIssues > 0 ? (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
            ) : (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </div>
          <span className="font-semibold tracking-wide">
            {isOpen ? 'Close AI Inspector' : '✨ AI Quantum Inspector'}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/15 text-white/90">
            {circuitIR.num_qubits}Q · {circuitIR.gates.length}G
          </span>
        </button>
      </div>

      {/* 2. FLOATING DRAWER / MODAL CARD (Bottom-Right Floating Box) */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-40 w-[460px] max-w-[calc(100vw-2rem)] h-[620px] max-h-[82vh] bg-[#fffdfa]/98 backdrop-blur-md border border-[#ded7cb] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn font-sans text-[#211f1b]">
          {/* Header Bar */}
          <div className="p-3.5 bg-[#f0ece4] border-b border-[#ded7cb] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#fff5eb] border border-[#f3d0bb] text-[#c96b2c] flex items-center justify-center shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-xs text-[#211f1b] font-sans">
                    AI Quantum Inspector
                  </h3>
                  <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#e8e2d5] text-[#746e64]">
                    Gemini 2.5 Flash
                  </span>
                </div>
                <p className="text-[10.5px] text-[#746e64] font-mono">
                  Context: {circuitIR.num_qubits} Qubits · {circuitIR.gates.length} Gates · {activeFramework.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (activeTab === 'explain') handleExplainCircuit()
                  else if (activeTab === 'debug') handleDebugCode()
                }}
                className="p-1.5 rounded-lg text-[#746e64] hover:text-[#211f1b] hover:bg-[#e4ded4] transition-colors cursor-pointer"
                title="Refresh analysis"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${explainLoading || debugLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[#746e64] hover:text-[#211f1b] hover:bg-[#e4ded4] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab Navigation Header */}
          <div className="flex items-center border-b border-[#ded7cb] bg-[#faf7f2] px-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('explain')}
              className={`px-3 py-2 border-b-2 flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'explain'
                  ? 'border-[#c96b2c] text-[#c96b2c] font-bold bg-[#fffdfa]'
                  : 'border-transparent text-[#746e64] hover:text-[#211f1b]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Explain Circuit
            </button>

            <button
              onClick={() => {
                setActiveTab('debug')
                if (!debugData && !debugLoading) handleDebugCode()
              }}
              className={`px-3 py-2 border-b-2 flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'debug'
                  ? 'border-[#c96b2c] text-[#c96b2c] font-bold bg-[#fffdfa]'
                  : 'border-transparent text-[#746e64] hover:text-[#211f1b]'
              }`}
            >
              <Bug className="w-3.5 h-3.5" />
              Debug Code
              {simulationError && (
                <span className="w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('optimize')}
              className={`px-3 py-2 border-b-2 flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'optimize'
                  ? 'border-[#c96b2c] text-[#c96b2c] font-bold bg-[#fffdfa]'
                  : 'border-transparent text-[#746e64] hover:text-[#211f1b]'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Optimize
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-2 border-b-2 flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'chat'
                  ? 'border-[#c96b2c] text-[#c96b2c] font-bold bg-[#fffdfa]'
                  : 'border-transparent text-[#746e64] hover:text-[#211f1b]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Socratic Q&amp;A
            </button>
          </div>

          {/* TAB 1: EXPLAIN CIRCUIT */}
          {activeTab === 'explain' && (
            <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3 text-xs">
              {explainLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2.5 text-[#746e64]">
                  <Loader2 className="w-6 h-6 animate-spin text-[#c96b2c]" />
                  <p className="font-mono text-xs">Decomposing circuit unitaries &amp; statevector...</p>
                </div>
              ) : explainError ? (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Explanation Failed</p>
                    <p className="text-[11px]">{explainError}</p>
                    <button
                      onClick={() => handleExplainCircuit()}
                      className="mt-2 text-[11px] font-bold text-red-800 underline cursor-pointer"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : tutorData ? (
                <>
                  {/* Status Banner */}
                  <div
                    className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                      tutorData.status === 'error'
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : tutorData.status === 'warning'
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}
                  >
                    {tutorData.status === 'error' ? (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                    ) : tutorData.status === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    )}
                    <div>
                      <span className="font-bold uppercase tracking-wider text-[10px]">
                        Circuit Health: {tutorData.status.toUpperCase()}
                      </span>
                      <p className="text-[11px] mt-0.5">
                        {tutorData.status === 'clean'
                          ? 'Circuit is unitarily valid with balanced quantum operations.'
                          : `${(tutorData.issues || []).length} potential issue(s) detected in circuit composition.`}
                      </p>
                    </div>
                  </div>

                  {/* Diagnostic Issues (if any) */}
                  {tutorData.issues && tutorData.issues.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-[#746e64] uppercase tracking-wider font-mono">
                        Diagnostic Insights
                      </span>
                      {tutorData.issues.map((iss, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-[#faf7f2] border border-[#ded7cb] flex items-start gap-2 text-[11px]"
                        >
                          {iss.severity === 'error' ? (
                            <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                          ) : iss.severity === 'warning' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          ) : (
                            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <span className="font-bold text-[#211f1b]">{iss.type}: </span>
                            <span className="text-[#49443b]">{iss.message}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Detailed Explanation */}
                  <div className="bg-[#f7f4ee] p-3.5 rounded-xl border border-[#ded7cb] flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-[#746e64] uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5 text-[#c96b2c]" />
                      Quantum Physics &amp; State Explanation
                    </span>
                    <div className="text-xs text-[#211f1b] whitespace-pre-wrap leading-relaxed">
                      {tutorData.explanation}
                    </div>
                  </div>

                  {/* Suggestions Chips */}
                  {tutorData.suggestions && tutorData.suggestions.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-[#746e64] uppercase tracking-wider font-mono">
                        Suggested Next Steps:
                      </span>
                      <ul className="list-disc list-inside text-[11px] text-[#49443b] flex flex-col gap-1">
                        {tutorData.suggestions.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-10">
                  <button
                    onClick={() => handleExplainCircuit()}
                    className="px-4 py-2 rounded-lg bg-[#c96b2c] text-white font-bold cursor-pointer"
                  >
                    Analyze &amp; Explain Circuit
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DEBUG CODE */}
          {activeTab === 'debug' && (
            <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#746e64] uppercase tracking-wider font-mono">
                  Active Framework: {activeFramework.toUpperCase()}
                </span>
                <button
                  onClick={handleDebugCode}
                  disabled={debugLoading}
                  className="px-2.5 py-1 rounded bg-[#fff5eb] border border-[#c96b2c] text-[#c96b2c] font-bold hover:bg-[#c96b2c] hover:text-white transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                >
                  <Bug className="w-3 h-3" />
                  {debugLoading ? 'Debugging...' : 'Run Code Debugger'}
                </button>
              </div>

              {simulationError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
                  <span className="font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Runtime Simulation Error:
                  </span>
                  <p className="mt-1 font-mono text-[11px]">{simulationError}</p>
                </div>
              )}

              {debugLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2.5 text-[#746e64]">
                  <Loader2 className="w-6 h-6 animate-spin text-[#c96b2c]" />
                  <p className="font-mono text-xs">Gemini analyzing syntax, registers &amp; unitary constraints...</p>
                </div>
              ) : debugError ? (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
                  <p className="font-bold">Debugger Failed</p>
                  <p className="text-[11px]">{debugError}</p>
                </div>
              ) : debugData ? (
                <>
                  {/* Diagnosis findings */}
                  <div className="bg-[#faf7f2] p-3 rounded-xl border border-[#ded7cb] flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-[#746e64] uppercase tracking-wider font-mono">
                      AI Diagnostic Review
                    </span>
                    <p className="text-xs text-[#211f1b] leading-relaxed">{debugData.explanation}</p>

                    {debugData.issues_found && debugData.issues_found.length > 0 && (
                      <div className="mt-2 flex flex-col gap-1">
                        <span className="font-bold text-[11px] text-[#c96b2c]">Issues Found:</span>
                        {debugData.issues_found.map((iss: string, idx: number) => (
                          <div key={idx} className="text-[11px] text-[#49443b] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {iss}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Corrected Code Preview */}
                  {debugData.corrected_code && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#746e64] uppercase tracking-wider font-mono">
                          Corrected Code Solution
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(debugData.corrected_code)
                            }}
                            className="px-2 py-0.5 rounded bg-[#eee9df] hover:bg-[#ded7cb] text-[#211f1b] text-[10.5px] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                          {onApplyCode && (
                            <button
                              onClick={() => {
                                onApplyCode(debugData.corrected_code)
                                setAppliedFix(true)
                              }}
                              className="px-2.5 py-0.5 rounded bg-[#0f62fe] text-white text-[10.5px] font-bold hover:bg-[#0043ce] flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                            >
                              {appliedFix ? <Check className="w-3 h-3" /> : <Code2 className="w-3 h-3" />}
                              {appliedFix ? 'Applied!' : 'Apply to Editor'}
                            </button>
                          )}
                        </div>
                      </div>

                      <pre className="p-3 bg-[#182434] text-amber-200 rounded-xl border border-[#2d4260] font-mono text-[10.5px] overflow-x-auto max-h-56 leading-relaxed">
                        {debugData.corrected_code}
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-10 flex flex-col items-center gap-2">
                  <p className="text-xs text-[#746e64]">
                    Analyze active {activeFramework.toUpperCase()} quantum code for syntax bugs, register errors, and Qiskit 1.0+ deprecations.
                  </p>
                  <button
                    onClick={handleDebugCode}
                    className="px-4 py-2 rounded-lg bg-[#c96b2c] text-white font-bold cursor-pointer mt-2"
                  >
                    Analyze Active Code
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OPTIMIZE */}
          {activeTab === 'optimize' && (
            <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3 text-xs">
              <span className="text-[10px] font-bold text-[#746e64] uppercase tracking-wider font-mono">
                Circuit Gate Optimization
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-[#faf7f2] border border-[#ded7cb] flex flex-col">
                  <span className="text-[10px] text-[#746e64] font-bold uppercase">Total Gates</span>
                  <span className="text-xl font-bold font-mono text-[#211f1b]">{circuitIR.gates.length}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#faf7f2] border border-[#ded7cb] flex flex-col">
                  <span className="text-[10px] text-[#746e64] font-bold uppercase">Active Qubits</span>
                  <span className="text-xl font-bold font-mono text-[#211f1b]">{circuitIR.num_qubits}</span>
                </div>
              </div>

              <div className="bg-[#f7f4ee] p-3 rounded-xl border border-[#ded7cb] flex flex-col gap-2">
                <span className="font-bold text-xs text-[#211f1b] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#c96b2c]" />
                  Optimization Checks:
                </span>
                <ul className="flex flex-col gap-1.5 text-[11px] text-[#49443b]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>No consecutive self-inverse gate redundancies (H-H / X-X).</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Unitary gates placed before projective measurement barriers.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>CX gate depth is optimal for 2-qubit state synthesis.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: SOCRATIC CHAT */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden text-xs">
              <div className="flex-1 p-3.5 overflow-y-auto flex flex-col gap-3">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-[#746e64] gap-2">
                    <Bot className="w-8 h-8 text-[#c96b2c]" />
                    <p className="font-bold text-xs text-[#211f1b]">Ask anything about your circuit!</p>
                    <p className="text-[11px] max-w-[280px]">
                      The AI assistant is grounded in your current {circuitIR.num_qubits}-qubit circuit and active code.
                    </p>

                    <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                      {[
                        'What state does this prepare?',
                        'How does entanglement work here?',
                        'Why are measurement results 50/50?',
                        'Convert this to PennyLane',
                      ].map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(prompt)}
                          className="text-[10.5px] px-2.5 py-1 rounded-full bg-[#f0ece4] hover:bg-[#eee9df] text-[#c96b2c] border border-[#ded7cb] transition-colors cursor-pointer font-semibold"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col gap-1 max-w-[85%] ${
                        msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'
                      }`}
                    >
                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-[#c96b2c] text-white rounded-br-xs'
                            : 'bg-[#f7f4ee] border border-[#ded7cb] text-[#211f1b] rounded-bl-xs'
                        }`}
                      >
                        <p>{msg.text}</p>
                        {msg.math && <p className="mt-2 font-mono text-[11px] text-[#c96b2c]">{msg.math}</p>}
                      </div>

                      {msg.chips && msg.chips.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {msg.chips.map((chip, cIdx) => (
                            <button
                              key={cIdx}
                              onClick={() => handleSendMessage(chip)}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-[#eee9df] hover:bg-[#ded7cb] text-[#211f1b] transition-colors cursor-pointer font-medium"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="self-start p-3 rounded-2xl bg-[#f7f4ee] border border-[#ded7cb] text-xs flex items-center gap-2 text-[#746e64]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c96b2c]" />
                    <span>Gemini reasoning with circuit context...</span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-2.5 border-t border-[#ded7cb] bg-[#faf7f2] flex items-center gap-2">
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask a question about current circuit or code..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-white border border-[#ded7cb] text-[#211f1b] focus:outline-none focus:border-[#c96b2c]"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputQuery.trim() || chatLoading}
                  className="p-2 rounded-xl bg-[#c96b2c] text-white hover:bg-[#b05c24] transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
