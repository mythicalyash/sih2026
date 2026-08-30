'use client'

import React, { useState } from 'react'
import type { CircuitIR, TutorResponse } from '@/types/quantum'
import { Bot, Sparkles, Send, X, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { BACKEND_URL } from '@/config'

interface AITutorPanelProps {
  circuitIR: CircuitIR
  isOpen: boolean
  onClose: () => void
}

export const AITutorPanel: React.FC<AITutorPanelProps> = ({ circuitIR, isOpen, onClose }) => {
  const [question, setQuestion] = useState('')
  const [tutorResponse, setTutorResponse] = useState<TutorResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleAskTutor = async (customQuestion?: string) => {
    const query = customQuestion !== undefined ? customQuestion : question
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${BACKEND_URL}/tutor/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          circuit: circuitIR,
          question: query,
        }),
      })

      if (!response.ok) {
        throw new Error('Tutor analysis request failed.')
      }

      const data: TutorResponse = await response.json()
      setTutorResponse(data)
    } catch (err: any) {
      setError(err.message || 'Failed to contact AI Tutor.')
    } finally {
      setLoading(false)
    }
  }

  const sampleQuestions = [
    'What quantum state does this circuit prepare?',
    'Why is qubit 1 unchanged?',
    'Are there any errors or unmeasured qubits?',
    'Explain the quantum interference here.',
  ]

  return (
    <div className="fixed inset-0 bg-[#211f1b]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#fffdf9] border border-[#ded7cb] rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans text-[#211f1b]">
        {/* Header */}
        <div className="p-4 border-b border-[#ded7cb] flex items-center justify-between bg-[#f0ece4]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#fff5eb] border border-[#f3d0bb] text-[#c96b2c]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#211f1b] text-sm font-sans">Quantum AI Tutor &amp; Diagnostics</h3>
              <p className="text-[11px] text-[#746e64]">Deterministic circuit verification &amp; physics explanations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#746e64] hover:text-[#211f1b] hover:bg-[#eee9df] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-[#746e64] font-mono uppercase tracking-wider">Ask a Quick Question:</span>
            <div className="flex flex-wrap gap-1.5">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuestion(q)
                    handleAskTutor(q)
                  }}
                  className="text-xs px-2.5 py-1 rounded-md bg-[#f0ece4] hover:bg-[#eee9df] text-[#c96b2c] border border-[#ded7cb] transition-colors text-left cursor-pointer font-semibold shadow-2xs"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskTutor()}
              placeholder="Ask anything about your quantum circuit..."
              className="flex-1 bg-[#fcfbf9] border border-[#ded7cb] focus:border-[#c96b2c] rounded-lg px-3 py-2 text-xs text-[#211f1b] outline-none transition-colors"
            />
            <button
              onClick={() => handleAskTutor()}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#c96b2c] hover:bg-[#b05a20] disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              {loading ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{loading ? 'Analyzing...' : 'Ask'}</span>
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-[#fdeeed] border border-[#d32f2f] text-[#5f2120] text-xs">
              {error}
            </div>
          )}

          {tutorResponse && (
            <div className="flex flex-col gap-4 mt-2">
              {tutorResponse.issues.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-[#211f1b] uppercase font-mono tracking-wider">Findings:</span>
                  {tutorResponse.issues.map((iss, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                        iss.severity === 'error'
                          ? 'bg-[#fdeeed] border-[#d32f2f] text-[#5f2120]'
                          : iss.severity === 'warning'
                          ? 'bg-[#fff5eb] border-[#c96b2c] text-[#c96b2c]'
                          : 'bg-[#edf7ed] border-[#4f806d] text-[#1e4620]'
                      }`}
                    >
                      {iss.severity === 'error' ? (
                        <AlertCircle className="w-4 h-4 text-[#d32f2f] flex-shrink-0 mt-0.5" />
                      ) : iss.severity === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-[#c96b2c] flex-shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-4 h-4 text-[#4f806d] flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <strong className="uppercase font-mono text-[10px] tracking-wide block mb-0.5">
                          {iss.type}
                        </strong>
                        <span>{iss.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 bg-[#f7f4ee] rounded-lg border border-[#ded7cb] flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[#c96b2c] font-bold text-xs border-b border-[#ded7cb] pb-2 font-mono">
                  <Sparkles className="w-4 h-4 text-[#c96b2c]" />
                  <span>Tutor Explanation:</span>
                </div>
                <div className="text-xs text-[#211f1b] whitespace-pre-wrap leading-relaxed font-sans">
                  {tutorResponse.explanation}
                </div>
              </div>

              {tutorResponse.suggestions.length > 0 && (
                <div className="p-3 bg-[#fff5eb] rounded-lg border border-[#f3d0bb] flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-[#c96b2c]">Suggestions:</span>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-[#746e64]">
                    {tutorResponse.suggestions.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
