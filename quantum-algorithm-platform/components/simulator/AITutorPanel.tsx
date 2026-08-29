'use client'

import React, { useState, useEffect } from 'react';
import type { CircuitIR, TutorResponse, QuantumProblem } from '@/types/quantum';
import {
  Bot,
  Sparkles,
  Send,
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  Lightbulb,
  BookOpen,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { BACKEND_URL } from '@/config';

interface AITutorPanelProps {
  circuitIR: CircuitIR;
  isOpen: boolean;
  onClose: () => void;
  activeProblem?: QuantumProblem | null;
  initialMode?: 'default' | 'hint' | 'review' | 'concept';
}

export const AITutorPanel: React.FC<AITutorPanelProps> = ({
  circuitIR,
  isOpen,
  onClose,
  activeProblem,
  initialMode = 'default',
}) => {
  const [question, setQuestion] = useState('');
  const [tutorResponse, setTutorResponse] = useState<TutorResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Problem-specific mode state
  const [hintLevel, setHintLevel] = useState<number>(1);
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [reviewResult, setReviewResult] = useState<{
    status: string;
    positives: string[];
    guidance: string[];
  } | null>(null);
  const [conceptText, setConceptText] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && activeProblem) {
      if (initialMode === 'hint') {
        handleGetHint(1);
      } else if (initialMode === 'review') {
        handleReviewCircuit();
      } else if (initialMode === 'concept') {
        handleGetConcept();
      }
    }
  }, [isOpen, activeProblem, initialMode]);

  if (!isOpen) return null;

  const handleAskTutor = async (customQuestion?: string) => {
    const query = customQuestion !== undefined ? customQuestion : question;
    setLoading(true);
    setError(null);
    setActiveHint(null);
    setReviewResult(null);
    setConceptText(null);

    try {
      const response = await fetch(`${BACKEND_URL}/tutor/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          circuit: circuitIR,
          question: query,
        }),
      });

      if (!response.ok) {
        throw new Error('Tutor analysis request failed.');
      }

      const data: TutorResponse = await response.json();
      setTutorResponse(data);
    } catch (err: any) {
      setError(err.message || 'Failed to contact AI Tutor.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetHint = async (level?: number) => {
    if (!activeProblem) return;
    const targetLevel = level || hintLevel;
    setLoading(true);
    setError(null);
    setTutorResponse(null);
    setReviewResult(null);
    setConceptText(null);

    try {
      const res = await fetch(`${BACKEND_URL}/problem/hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_id: activeProblem.id,
          circuit: circuitIR,
          hint_level: targetLevel,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveHint(data.hint);
        setHintLevel(targetLevel);
      }
    } catch (err: any) {
      setError('Failed to fetch hint.');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewCircuit = async () => {
    if (!activeProblem) return;
    setLoading(true);
    setError(null);
    setTutorResponse(null);
    setActiveHint(null);
    setConceptText(null);

    try {
      const res = await fetch(`${BACKEND_URL}/problem/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_id: activeProblem.id,
          circuit: circuitIR,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setReviewResult(data);
      }
    } catch (err: any) {
      setError('Failed to review circuit.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetConcept = async () => {
    if (!activeProblem) return;
    setLoading(true);
    setError(null);
    setTutorResponse(null);
    setActiveHint(null);
    setReviewResult(null);

    try {
      const res = await fetch(`${BACKEND_URL}/problem/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_id: activeProblem.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setConceptText(data.concept_explanation);
      }
    } catch (err: any) {
      setError('Failed to fetch concept explanation.');
    } finally {
      setLoading(false);
    }
  };

  const genericSampleQuestions = [
    'What quantum state does this circuit prepare?',
    'Why is qubit 1 unchanged?',
    'Are there any errors or unmeasured qubits?',
    'Explain the quantum interference here.',
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#fffdf9] border border-[#ded7cb] rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans text-[#211f1b]">
        {/* Header */}
        <div className="p-4 border-b border-[#ded7cb] flex items-center justify-between bg-[#f0ece4]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-[#c96b2c]/10 border border-[#c96b2c]/30 text-[#c96b2c]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[#211f1b]">Quantum AI Socratic Tutor</h3>
              <p className="text-[11px] text-[#746e64]">
                {activeProblem
                  ? `Problem-Aware Guidance: ${activeProblem.title}`
                  : 'Deterministic circuit verification & physics analysis'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-[#746e64] hover:text-[#211f1b] hover:bg-[#ded7cb] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* Active Problem Context Badge */}
          {activeProblem && (
            <div className="p-3 rounded-lg bg-[#fffaf3] border border-[#f0d1b3] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#c96b2c] text-white">
                  Active Challenge
                </span>
                <strong className="text-xs text-[#211f1b]">{activeProblem.title}</strong>
              </div>
              <span className="text-[11px] text-[#746e64]">{activeProblem.topic}</span>
            </div>
          )}

          {/* Quick Problem Actions (when solving a problem) */}
          {activeProblem ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-[#746e64] uppercase tracking-wider">
                Tutor Challenge Tools:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleGetHint(hintLevel)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#fffdf9] hover:bg-[#fffaf3] border border-[#ded7cb] hover:border-[#c96b2c] text-xs font-medium text-[#211f1b] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-[#c96b2c]" />
                  <span>💡 Get Hint</span>
                </button>
                <button
                  onClick={handleReviewCircuit}
                  className="px-2.5 py-1.5 rounded-lg bg-[#fffdf9] hover:bg-[#fffaf3] border border-[#ded7cb] hover:border-[#c96b2c] text-xs font-medium text-[#211f1b] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-[#4f806d]" />
                  <span>🔍 Review Circuit</span>
                </button>
                <button
                  onClick={handleGetConcept}
                  className="px-2.5 py-1.5 rounded-lg bg-[#fffdf9] hover:bg-[#fffaf3] border border-[#ded7cb] hover:border-[#c96b2c] text-xs font-medium text-[#211f1b] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#211f1b]" />
                  <span>🧠 Concept</span>
                </button>
              </div>
            </div>
          ) : (
            /* Quick Sandbox Prompts */
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-[#746e64] uppercase tracking-wider">
                Suggested Questions:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {genericSampleQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuestion(q);
                      handleAskTutor(q);
                    }}
                    className="text-xs px-2.5 py-1 rounded bg-[#eee9df] hover:bg-[#ded7cb] text-[#211f1b] border border-[#ded7cb] transition-colors text-left cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Question Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskTutor()}
              placeholder={
                activeProblem
                  ? `Ask tutor about ${activeProblem.title}...`
                  : 'Ask anything about your quantum circuit...'
              }
              className="flex-1 bg-[#fffdf9] border border-[#ded7cb] focus:border-[#c96b2c] rounded-lg px-3 py-2 text-xs text-[#211f1b] focus:outline-none"
            />
            <button
              onClick={() => handleAskTutor()}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#c96b2c] hover:bg-[#b55e24] disabled:opacity-50 text-white font-medium text-xs shadow-sm transition-colors cursor-pointer"
            >
              {loading ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{loading ? 'Thinking...' : 'Ask'}</span>
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          )}

          {/* Active Hint Output */}
          {activeHint && (
            <div className="p-4 rounded-xl bg-[#fffaf3] border border-[#f0d1b3] flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-[#f0d1b3] pb-2">
                <span className="text-xs font-bold text-[#c96b2c] flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4" /> Hint Level {hintLevel} of {activeProblem?.hints.length || 3}
                </span>
                {activeProblem && hintLevel < activeProblem.hints.length && (
                  <button
                    onClick={() => handleGetHint(hintLevel + 1)}
                    className="text-[11px] font-semibold text-[#c96b2c] hover:underline cursor-pointer"
                  >
                    Need a bigger hint? (Tier {hintLevel + 1}) →
                  </button>
                )}
              </div>
              <p className="text-xs text-[#211f1b] leading-relaxed mt-1">{activeHint}</p>
            </div>
          )}

          {/* Circuit Review Output */}
          {reviewResult && (
            <div className="p-4 rounded-xl bg-[#fffdf9] border border-[#ded7cb] flex flex-col gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#211f1b] border-b border-[#ded7cb] pb-2">
                <Search className="w-4 h-4 text-[#4f806d]" />
                <span>AI Circuit Review for {activeProblem?.title}</span>
              </div>

              {reviewResult.positives.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-[#4f806d] uppercase">What is working well:</span>
                  {reviewResult.positives.map((pos, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-[#211f1b]">
                      <CheckCircle2 className="w-4 h-4 text-[#4f806d] flex-shrink-0 mt-0.5" />
                      <span>{pos}</span>
                    </div>
                  ))}
                </div>
              )}

              {reviewResult.guidance.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-2 border-t border-[#ded7cb]">
                  <span className="text-[11px] font-semibold text-[#c96b2c] uppercase">Suggestions to complete:</span>
                  {reviewResult.guidance.map((g, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-[#211f1b]">
                      <AlertCircle className="w-4 h-4 text-[#c96b2c] flex-shrink-0 mt-0.5" />
                      <span>{g}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Concept Explanation Output */}
          {conceptText && (
            <div className="p-4 rounded-xl bg-[#f0ece4] border border-[#ded7cb] flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#211f1b] border-b border-[#ded7cb] pb-2">
                <BookOpen className="w-4 h-4 text-[#c96b2c]" />
                <span>Theory: {activeProblem?.suggested_concept}</span>
              </div>
              <p className="text-xs text-[#211f1b] leading-relaxed mt-1 whitespace-pre-wrap">
                {conceptText}
              </p>
            </div>
          )}

          {/* Generic Diagnostics & Explanation Output */}
          {tutorResponse && (
            <div className="flex flex-col gap-4 mt-2">
              {tutorResponse.issues.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-[#746e64] uppercase tracking-wider">
                    Diagnostic Findings:
                  </span>
                  {tutorResponse.issues.map((iss, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                        iss.severity === 'error'
                          ? 'bg-red-50 border-red-200 text-red-800'
                          : iss.severity === 'warning'
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : 'bg-blue-50 border-blue-200 text-blue-800'
                      }`}
                    >
                      {iss.severity === 'error' ? (
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      ) : iss.severity === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
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

              {/* Narrative */}
              <div className="p-4 bg-[#f0ece4] rounded-lg border border-[#ded7cb] flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[#211f1b] font-semibold text-xs border-b border-[#ded7cb] pb-2">
                  <Sparkles className="w-4 h-4 text-[#c96b2c]" />
                  <span>Socratic Analysis:</span>
                </div>
                <div className="text-xs text-[#211f1b] whitespace-pre-wrap leading-relaxed">
                  {tutorResponse.explanation}
                </div>
              </div>

              {/* Suggestions */}
              {tutorResponse.suggestions.length > 0 && (
                <div className="p-3 bg-[#fffaf3] rounded-lg border border-[#f0d1b3] flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[#c96b2c]">Next Steps:</span>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-[#211f1b]">
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
  );
};
