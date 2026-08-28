import React, { useState } from 'react';
import type { CircuitIR, TutorResponse } from '../types/quantum';
import { Bot, Sparkles, Send, X, AlertTriangle, AlertCircle, Info } from 'lucide-react';

import { BACKEND_URL } from '../config';

interface AITutorPanelProps {
  circuitIR: CircuitIR;
  isOpen: boolean;
  onClose: () => void;
}

export const AITutorPanel: React.FC<AITutorPanelProps> = ({ circuitIR, isOpen, onClose }) => {
  const [question, setQuestion] = useState('');
  const [tutorResponse, setTutorResponse] = useState<TutorResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAskTutor = async (customQuestion?: string) => {
    const query = customQuestion !== undefined ? customQuestion : question;
    setLoading(true);
    setError(null);

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

  const sampleQuestions = [
    'What quantum state does this circuit prepare?',
    'Why is qubit 1 unchanged?',
    'Are there any errors or unmeasured qubits?',
    'Explain the quantum interference here.',
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-950/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-100 text-sm">Quantum AI Tutor & Diagnostics</h3>
              <p className="text-[11px] text-gray-400">Deterministic circuit verification & conceptual physics explanations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* Quick Prompts */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Ask a Quick Question:</span>
            <div className="flex flex-wrap gap-1.5">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuestion(q);
                    handleAskTutor(q);
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-indigo-300 border border-gray-700 transition-colors text-left cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Question Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskTutor()}
              placeholder="Ask anything about your quantum circuit..."
              className="flex-1 bg-gray-950 border border-gray-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <button
              onClick={() => handleAskTutor()}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs shadow-md transition-colors cursor-pointer"
            >
              {loading ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{loading ? 'Analyzing...' : 'Ask'}</span>
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Diagnostics & Explanation Output */}
          {tutorResponse && (
            <div className="flex flex-col gap-4 mt-2">
              {/* Issues List */}
              {tutorResponse.issues.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Deterministic Findings:</span>
                  {tutorResponse.issues.map((iss, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                        iss.severity === 'error'
                          ? 'bg-red-950/60 border-red-800 text-red-200'
                          : iss.severity === 'warning'
                          ? 'bg-amber-950/60 border-amber-800 text-amber-200'
                          : 'bg-blue-950/60 border-blue-800 text-blue-200'
                      }`}
                    >
                      {iss.severity === 'error' ? (
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      ) : iss.severity === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
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

              {/* Tutor Narrative */}
              <div className="p-4 bg-gray-950 rounded-xl border border-gray-800 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs border-b border-gray-800 pb-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Tutor Explanation:</span>
                </div>
                <div className="text-xs text-gray-200 whitespace-pre-wrap leading-relaxed font-sans">
                  {tutorResponse.explanation}
                </div>
              </div>

              {/* Suggestions */}
              {tutorResponse.suggestions.length > 0 && (
                <div className="p-3 bg-indigo-950/30 rounded-lg border border-indigo-500/20 flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-indigo-300">Suggestions:</span>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-indigo-200/80">
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
