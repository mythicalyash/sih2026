'use client'

import React, { useState } from 'react';
import type { CircuitIR, TutorResponse } from '@/types/quantum';
import { Bot, Sparkles, Send, X, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { BACKEND_URL } from '@/config';

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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#fffdf9] border border-[#ded7cb] rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans text-[#211f1b]">
        <div className="p-4 border-b border-[#ded7cb] flex items-center justify-between bg-[#f0ece4]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-[#fff2ea] border border-[#f3d0bb] text-[#c96b2c]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-[#211f1b] text-sm">Quantum AI Tutor &amp; Diagnostics</h3>
              <p className="text-[11px] text-[#746e64]">Deterministic circuit verification &amp; physics explanations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-[#746e64] hover:text-[#211f1b] hover:bg-[#eee9df] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-[#746e64] uppercase tracking-wider">Ask a Quick Question:</span>
            <div className="flex flex-wrap gap-1.5">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuestion(q);
                    handleAskTutor(q);
                  }}
                  className="text-xs px-2.5 py-1 rounded bg-[#f0ece4] hover:bg-[#eee9df] text-[#c96b2c] border border-[#ded7cb] transition-colors text-left cursor-pointer font-medium"
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
              className="flex-1 bg-[#fcfbf9] border border-[#ded7cb] focus:border-[#c96b2c] rounded px-3 py-2 text-xs text-[#211f1b] focus:outline-none"
            />
            <button
              onClick={() => handleAskTutor()}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-[#c96b2c] hover:bg-[#b55e24] disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
            >
              {loading ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{loading ? 'Analyzing...' : 'Ask'}</span>
            </button>
          </div>

          {error && (
            <div className="p-3 rounded bg-[#fce8e6] border border-[#ea4335] text-[#c5221f] text-xs">
              {error}
            </div>
          )}

          {tutorResponse && (
            <div className="flex flex-col gap-4 mt-2">
              {tutorResponse.issues.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-[#211f1b] uppercase tracking-wider">Findings:</span>
                  {tutorResponse.issues.map((iss, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded border text-xs flex items-start gap-2.5 ${
                        iss.severity === 'error'
                          ? 'bg-[#fce8e6] border-[#ea4335] text-[#c5221f]'
                          : iss.severity === 'warning'
                          ? 'bg-[#fff8e1] border-[#ffb300] text-[#8f6b00]'
                          : 'bg-[#e8f0fe] border-[#aecbfa] text-[#1a73e8]'
                      }`}
                    >
                      {iss.severity === 'error' ? (
                        <AlertCircle className="w-4 h-4 text-[#ea4335] flex-shrink-0 mt-0.5" />
                      ) : iss.severity === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-[#ffb300] flex-shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-4 h-4 text-[#1a73e8] flex-shrink-0 mt-0.5" />
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

              <div className="p-4 bg-[#fcfbf9] rounded-lg border border-[#ded7cb] flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[#c96b2c] font-semibold text-xs border-b border-[#ded7cb] pb-2">
                  <Sparkles className="w-4 h-4 text-[#c96b2c]" />
                  <span>Tutor Explanation:</span>
                </div>
                <div className="text-xs text-[#211f1b] whitespace-pre-wrap leading-relaxed">
                  {tutorResponse.explanation}
                </div>
              </div>

              {tutorResponse.suggestions.length > 0 && (
                <div className="p-3 bg-[#fff5eb] rounded border border-[#f3d0bb] flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[#c96b2c]">Suggestions:</span>
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
  );
};
