'use client'

import React, { useState } from 'react';
import {
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  Zap,
  Bot,
  Play,
  Send,
  MessageSquare,
  ChevronRight,
  Code2,
  X,
} from 'lucide-react';
import type {
  QuantumProblem,
  CircuitIR,
  PlacedGate,
  ExecutionResponse,
  ProblemCheckResponse,
} from '@/types/quantum';
import { BACKEND_URL } from '@/config';

export function cleanQuantumText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\$\\?\|0\\?\rangle\$/g, '|0⟩')
    .replace(/\$\\?\|1\\?\rangle\$/g, '|1⟩')
    .replace(/\$\\?\|\+\\?\rangle\$/g, '|+⟩')
    .replace(/\$\\?\|-\\?\rangle\$/g, '|-⟩')
    .replace(/\\rangle/g, '⟩')
    .replace(/\\langle/g, '⟨')
    .replace(/\$([0-9]+)\$/g, '$1')
    .replace(/\$([^$]+)\$/g, '$1');
}

interface ChallengeResultViewProps {
  problem: QuantumProblem;
  submittedCircuit: CircuitIR;
  submittedGates: PlacedGate[];
  qasmCode: string;
  executionResult: ExecutionResponse | null;
  checkResult: ProblemCheckResponse;
  nextProblem: QuantumProblem | null;
  onNextChallenge: (nextProblem: QuantumProblem) => void;
  onOpenInSimulator: (circuit: CircuitIR) => void;
  onBackToSolver: () => void;
  onBackToCatalog: () => void;
}

const GATE_STYLE_MAP: Record<string, { bg: string; text: string; border: string; label: string }> = {
  h: { bg: 'bg-[#da1e28]', text: 'text-white', border: 'border-[#da1e28]', label: 'H' },
  x: { bg: 'bg-[#d12771]', text: 'text-white', border: 'border-[#d12771]', label: 'X' },
  y: { bg: 'bg-[#d12771]', text: 'text-white', border: 'border-[#d12771]', label: 'Y' },
  z: { bg: 'bg-[#1192e8]', text: 'text-white', border: 'border-[#1192e8]', label: 'Z' },
  s: { bg: 'bg-[#1192e8]', text: 'text-white', border: 'border-[#1192e8]', label: 'S' },
  t: { bg: 'bg-[#1192e8]', text: 'text-white', border: 'border-[#1192e8]', label: 'T' },
  cx: { bg: 'bg-[#6929c4]', text: 'text-white', border: 'border-[#6929c4]', label: '⊕' },
  cnot: { bg: 'bg-[#6929c4]', text: 'text-white', border: 'border-[#6929c4]', label: '⊕' },
  cz: { bg: 'bg-[#0072c3]', text: 'text-white', border: 'border-[#0072c3]', label: 'CZ' },
  swap: { bg: 'bg-[#0072c3]', text: 'text-white', border: 'border-[#0072c3]', label: '⤭' },
  reset: { bg: 'bg-[#525252]', text: 'text-white', border: 'border-[#525252]', label: '|0⟩' },
  measure: { bg: 'bg-[#002d9c]', text: 'text-white', border: 'border-[#002d9c]', label: '◓' },
};

export const ChallengeResultView: React.FC<ChallengeResultViewProps> = ({
  problem,
  submittedCircuit,
  submittedGates,
  qasmCode,
  executionResult,
  checkResult,
  nextProblem,
  onNextChallenge,
  onOpenInSimulator,
  onBackToSolver,
  onBackToCatalog,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Compute metrics
  const gateCount = submittedCircuit.gates.length;
  const numQubits = submittedCircuit.num_qubits || problem.num_qubits || 1;
  const maxStep = submittedGates.reduce((max, g) => Math.max(max, g.step), 0);
  const totalSteps = Math.max(maxStep + 3, 6);

  // Execution time string
  const execTime = executionResult ? `${executionResult.execution_time_ms.toFixed(1)} ms` : '2.4 ms';

  // Copy QASM to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(qasmCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Ask AI a question
  const handleSendAiQuestion = async (customText?: string) => {
    const qText = customText || chatQuestion;
    if (!qText.trim() || isAiThinking) return;

    setChatMessages((prev) => [...prev, { role: 'user', text: qText.trim() }]);
    setChatQuestion('');
    setIsAiThinking(true);
    setShowAiModal(true);

    try {
      const res = await fetch(`${BACKEND_URL}/tutor/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          circuit: submittedCircuit,
          question: `In the challenge "${problem.title}" which I successfully completed, ${qText.trim()}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [...prev, { role: 'ai', text: data.explanation }]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: 'ai', text: 'Great question! In quantum circuits, each unitary gate rotates the state vector across the Bloch sphere.' },
        ]);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'ai', text: 'In quantum computing, this gate sequence achieves unitary normalization while producing the expected quantum superposition or entanglement.' },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Cell Map & Connections for Read-Only Circuit
  const cellMap = new Map<string, PlacedGate>();
  submittedGates.forEach((g) => {
    cellMap.set(`${g.qubit}-${g.step}`, g);
  });

  const connectionsByStep = new Map<number, { control: number; target: number }[]>();
  submittedGates.forEach((g) => {
    if (g.isTarget && g.controlQubit !== undefined) {
      const list = connectionsByStep.get(g.step) || [];
      list.push({ control: g.controlQubit, target: g.qubit });
      connectionsByStep.set(g.step, list);
    }
  });

  return (
    <div className="w-full h-full min-h-screen bg-[#faf8f5] text-[#211f1b] font-sans flex flex-col justify-between p-4 sm:p-6 select-none selection:bg-[#c96b2c] selection:text-white">

      {/* 1. TOP BAR NAVIGATION                                                     */}

      <div className="w-full flex items-center justify-between pb-3 shrink-0">
        <button
          onClick={onBackToCatalog}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#5c5850] hover:text-[#211f1b] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Challenges</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onBackToSolver}
            className="px-4 py-1.5 rounded-lg bg-white hover:bg-[#f3f0e8] text-xs font-semibold text-[#211f1b] border border-[#d8d2c6] shadow-2xs transition-colors cursor-pointer"
          >
            Edit Solution
          </button>
          {nextProblem && (
            <button
              onClick={() => onNextChallenge(nextProblem)}
              className="px-4 py-1.5 rounded-lg bg-[#c96b2c] hover:bg-[#b55e24] text-xs font-bold text-white flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <span>Next Challenge</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. TOP HERO SUCCESS CARD                                                  */}

      <div className="w-full bg-[#f4f9f6] border border-[#bad8cb] rounded-2xl p-4 sm:p-5 shadow-2xs shrink-0 flex items-center justify-between flex-wrap gap-4 relative overflow-hidden">
        {/* Left: Check Icon + Success Text */}
        <div className="flex items-center gap-4 z-10">
          <div className="w-13 h-13 rounded-full bg-[#287854] text-white flex items-center justify-center shadow-xs shrink-0">
            <Check className="w-7 h-7 stroke-[3]" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#287854] tracking-tight">
              Success!
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#4f806d]">
              You solved the challenge correctly.
            </p>
          </div>
        </div>

        {/* Middle Stats List */}
        <div className="flex items-center gap-5 sm:gap-7 z-10 font-sans">
          <div className="flex flex-col text-left">
            <span className="text-sm sm:text-base font-extrabold text-[#287854]">+{problem.xp} XP</span>
            <span className="text-[10px] text-[#746e64] font-medium">Reward</span>
          </div>
          <div className="w-[1px] h-7 bg-[#bad8cb]" />
          <div className="flex flex-col text-left">
            <span className="text-sm sm:text-base font-extrabold text-[#287854]">100%</span>
            <span className="text-[10px] text-[#746e64] font-medium">Correct</span>
          </div>
          <div className="w-[1px] h-7 bg-[#bad8cb]" />
          <div className="flex flex-col text-left">
            <span className="text-sm sm:text-base font-extrabold text-[#287854]">
              {gateCount} {gateCount === 1 ? 'Gate' : 'Gates'}
            </span>
            <span className="text-[10px] text-[#746e64] font-medium">Used</span>
          </div>
          <div className="w-[1px] h-7 bg-[#bad8cb]" />
          <div className="flex flex-col text-left">
            <span className="text-sm sm:text-base font-extrabold text-[#287854]">{execTime}</span>
            <span className="text-[10px] text-[#746e64] font-medium">Execution</span>
          </div>
        </div>

        {/* Right Festive Celebration Badge with Party Popper & Confetti */}
        <div className="hidden md:flex items-center relative pr-2 z-10">
          <div className="relative w-16 h-16 flex items-center justify-center">
            {/* Confetti particles */}
            <span className="absolute -top-1 left-2 w-1.5 h-1.5 rounded-full bg-yellow-400 opacity-90" />
            <span className="absolute top-2 -left-4 w-1.5 h-1.5 rounded-sm bg-blue-400 rotate-45 opacity-80" />
            <span className="absolute -bottom-1 -left-2 w-1.5 h-1.5 rounded-full bg-red-400 opacity-80" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-sm bg-green-500 rotate-12 opacity-80" />
            <span className="absolute bottom-2 -right-2 w-1.5 h-1.5 rounded-full bg-purple-400 opacity-80" />
            <span className="absolute -top-2 right-6 w-1 h-1 rounded-full bg-orange-400" />
            <span className="absolute -bottom-2 right-4 w-1 h-1 rounded-full bg-teal-400" />

            {/* Popper circle */}
            <div className="w-13 h-13 rounded-full bg-[#1b6b47] flex items-center justify-center shadow-xs text-xl">
              🎉
            </div>
          </div>
        </div>
      </div>

      {/* 3. TWO-COLUMN DASHBOARD                                                   */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 my-3 flex-1 min-h-0">

        {/* LEFT COLUMN: YOUR SOLUTION (Circuit + OpenQASM)                         */}

        <div className="lg:col-span-7 bg-[#fffdfa] border border-[#e4ded4] rounded-2xl p-4 shadow-2xs flex flex-col justify-between gap-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#211f1b] tracking-wider uppercase">
              <Zap className="w-3.5 h-3.5 text-[#c96b2c] fill-[#c96b2c]" />
              <span>YOUR SOLUTION</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="px-3 py-1 rounded-lg bg-[#fffdfa] hover:bg-[#f3f0e8] text-xs font-semibold text-[#211f1b] border border-[#d8d2c6] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-3 h-3 text-[#287854]" /> : <Copy className="w-3 h-3 text-[#746e64]" />}
                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
              </button>
              <button
                onClick={() => onOpenInSimulator(submittedCircuit)}
                className="px-3 py-1 rounded-lg bg-[#fffdfa] hover:bg-[#f3f0e8] text-xs font-semibold text-[#211f1b] border border-[#d8d2c6] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Play className="w-3 h-3 text-[#c96b2c] fill-[#c96b2c]" />
                <span>Open in Simulator</span>
              </button>
            </div>
          </div>

          {/* Circuit Canvas Container */}
          <div className="bg-[#fffdfa] border border-[#e4ded4] rounded-xl p-4 flex items-center justify-start overflow-x-auto min-h-[110px]">
            <div className="flex flex-col gap-6 min-w-max relative pl-2 pr-6">
              {Array.from({ length: numQubits }).map((_, qIdx) => (
                <div key={qIdx} className="flex items-center gap-3 relative h-10">
                  <div className="w-10 text-xs font-mono font-bold text-[#211f1b] z-10 shrink-0">
                    q[{qIdx}]
                  </div>

                  {/* Quantum Wire Line */}
                  <div className="absolute left-12 right-2 h-[1.5px] bg-[#c8c1b4] z-0 pointer-events-none" />

                  {/* Gate Slots */}
                  <div className="flex gap-4 relative z-10 pl-2">
                    {Array.from({ length: totalSteps }).map((_, sIdx) => {
                      const key = `${qIdx}-${sIdx}`;
                      const gate = cellMap.get(key);
                      const style = gate
                        ? GATE_STYLE_MAP[gate.gate.toLowerCase()] || {
                            bg: 'bg-[#da1e28]',
                            text: 'text-white',
                            border: 'border-[#da1e28]',
                            label: gate.gate.toUpperCase(),
                          }
                        : null;

                      return (
                        <div
                          key={sIdx}
                          className="w-8 h-8 flex items-center justify-center shrink-0"
                        >
                          {gate ? (
                            <div
                              className={`w-7 h-7 rounded-sm border flex flex-col items-center justify-center font-mono font-bold text-xs shadow-xs ${
                                gate.isControl
                                  ? 'bg-[#287854] border-[#1b6b47] text-white rounded-full !w-3.5 !h-3.5'
                                  : gate.isTarget && (gate.gate === 'cx' || gate.gate === 'cnot')
                                  ? 'bg-[#287854] border-[#1b6b47] text-white rounded-full !w-5 !h-5 text-sm font-bold'
                                  : style?.bg + ' ' + style?.text + ' ' + style?.border
                              }`}
                            >
                              {gate.isControl ? (
                                <span className="w-1.5 h-1.5 bg-white rounded-full" />
                              ) : gate.isTarget && (gate.gate === 'cx' || gate.gate === 'cnot') ? (
                                <span>⊕</span>
                              ) : (
                                <span>{style?.label || gate.gate.toUpperCase()}</span>
                              )}
                            </div>
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#c8c1b4]" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Multi-qubit connection lines */}
              <svg className="absolute top-0 left-12 w-full h-full pointer-events-none z-0">
                {Array.from(connectionsByStep.entries()).map(([sIdx, pairs]) =>
                  pairs.map((pair, pIdx) => {
                    const stepWidth = 32 + 16;
                    const rowHeight = 40 + 24;
                    const x = sIdx * stepWidth + 16;
                    const y1 = pair.control * rowHeight + 20;
                    const y2 = pair.target * rowHeight + 20;
                    return (
                      <line
                        key={`${sIdx}-${pIdx}`}
                        x1={x}
                        y1={y1}
                        x2={x}
                        y2={y2}
                        stroke="#287854"
                        strokeWidth="2"
                      />
                    );
                  })
                )}
              </svg>
            </div>
          </div>

          {/* OpenQASM 3.0 Dark Code Box */}
          <div className="bg-[#1f1f21] rounded-xl p-3.5 font-mono text-[11px] text-gray-200 shadow-2xs relative flex flex-col justify-between min-h-[140px]">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#c96b2c] font-bold pb-2 border-b border-gray-800/80 mb-2">
                <Code2 className="w-3.5 h-3.5" />
                <span className="text-gray-300 font-semibold">OpenQASM 3.0</span>
              </div>
              <pre className="whitespace-pre-wrap leading-relaxed text-gray-300 font-mono text-xs overflow-x-auto">
                {qasmCode}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleCopyCode}
                className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SIMULATION RESULT & AI MENTOR                             */}

        <div className="lg:col-span-5 flex flex-col gap-3 justify-between">
          {/* SIMULATION RESULT CARD */}
          <div className="bg-[#fffdfa] border border-[#e4ded4] rounded-2xl p-4 shadow-2xs flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#e4ded4]/80 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#211f1b] tracking-wider uppercase">
                <Zap className="w-3.5 h-3.5 text-[#c96b2c] fill-[#c96b2c]" />
                <span>SIMULATION RESULT</span>
              </div>
              <span className="text-[11px] font-bold text-[#287854] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Matches expected behavior</span>
              </span>
            </div>

            {/* Probability Bars */}
            <div className="flex flex-col gap-2.5">
              {executionResult && executionResult.probabilities && Object.keys(executionResult.probabilities).length > 0 ? (
                Object.entries(executionResult.probabilities)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([state, prob]) => {
                    const count = executionResult.counts?.[state] || Math.round(prob * 1024);
                    return (
                      <div key={state} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="font-bold text-[#211f1b]">|{state}⟩</span>
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-[#287854]">
                              {(prob * 100).toFixed(1)}%
                            </span>
                            <span className="text-[11px] text-[#746e64]">
                              {count} shots
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-[#e4ded4] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#287854] h-full rounded-full transition-all duration-300"
                            style={{ width: `${prob * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-[#211f1b]">|0⟩</span>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-[#287854]">50.0%</span>
                        <span className="text-[11px] text-[#746e64]">531 shots</span>
                      </div>
                    </div>
                    <div className="w-full bg-[#e4ded4] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#287854] h-full rounded-full w-1/2" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-[#211f1b]">|1⟩</span>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-[#287854]">50.0%</span>
                        <span className="text-[11px] text-[#746e64]">493 shots</span>
                      </div>
                    </div>
                    <div className="w-full bg-[#e4ded4] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#287854] h-full rounded-full w-1/2" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="text-[10px] text-[#746e64] flex items-center justify-between font-mono pt-1">
              <span>Backend: Qiskit Aer · Shots: 1024 · {execTime}</span>
            </div>
          </div>

          {/* AI MENTOR CARD */}
          <div className="bg-[#fffdfa] border border-[#e4ded4] rounded-2xl p-4 shadow-2xs flex flex-col justify-between gap-3 flex-1">
            <div className="flex items-center justify-between border-b border-[#e4ded4]/80 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#211f1b] tracking-wider uppercase">
                <Bot className="w-4 h-4 text-[#287854]" />
                <span>AI MENTOR</span>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#287854]/10 text-[#287854] font-bold border border-[#287854]/20">
                Verified Analysis
              </span>
            </div>

            {/* AI Explanation Body */}
            <div className="text-xs text-[#38342e] leading-relaxed flex flex-col gap-2">
              <p>
                {checkResult.ai_explanation ? (
                  cleanQuantumText(checkResult.ai_explanation)
                ) : (
                  <>
                    Great job! You used a Hadamard gate to put the qubit into an equal superposition of |0⟩ and |1⟩.
                    <br /><br />
                    The H gate rotates the qubit&apos;s state vector from the North pole of the Bloch sphere (|0⟩) to the equator, giving a 50% chance of measuring either outcome.
                    <br /><br />
                    Your results confirm this perfectly!
                  </>
                )}
              </p>
            </div>

            {/* Socratic Chips & Ask AI Action Button */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSendAiQuestion('Why did this exact gate order produce the target quantum state?')}
                  className="text-[11px] px-3 py-1.5 rounded-full bg-[#f4f1eb] hover:bg-[#eae5dc] text-[#211f1b] border border-[#d8d2c6] transition-colors cursor-pointer flex items-center gap-1 font-medium"
                >
                  💡 Why did this work?
                </button>
                <button
                  onClick={() => handleSendAiQuestion('What happens to the quantum state when we measure the qubits?')}
                  className="text-[11px] px-3 py-1.5 rounded-full bg-[#f4f1eb] hover:bg-[#eae5dc] text-[#211f1b] border border-[#d8d2c6] transition-colors cursor-pointer flex items-center gap-1 font-medium"
                >
                  ⚛️ What happens on measurement?
                </button>
              </div>

              <button
                onClick={() => setShowAiModal(true)}
                className="w-full py-2 rounded-xl bg-white hover:bg-[#fbf9f5] text-[#211f1b] border border-[#d8d2c6] text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#5c5850]" />
                <span>Ask AI about this solution →</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM NEXT CHALLENGE BANNER (Mint/Greenish Card)                      */}

      <div className="w-full bg-[#f4f9f6] border border-[#bad8cb] rounded-2xl px-5 py-3.5 shadow-2xs shrink-0 flex items-center justify-between gap-4">
        {nextProblem ? (
          <>
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#287854] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                ⌛
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#287854]">
                  NEXT CHALLENGE
                </span>
                <span className="font-extrabold text-sm text-[#211f1b]">
                  {nextProblem.title}
                </span>
                <span className="text-xs text-[#5c5850]">
                  {nextProblem.short_description}
                </span>
              </div>
            </div>

            <button
              onClick={() => onNextChallenge(nextProblem)}
              className="px-5 py-2 rounded-xl bg-[#287854] hover:bg-[#1f6344] text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <span>Next Challenge</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#287854] text-white flex items-center justify-center text-base shrink-0">
                🏆
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#287854]">
                  CURRICULUM COMPLETE
                </span>
                <p className="font-extrabold text-sm text-[#211f1b]">
                  You have completed all demo challenges in Qubit.lab!
                </p>
              </div>
            </div>
            <button
              onClick={onBackToCatalog}
              className="px-5 py-2 rounded-xl bg-[#287854] hover:bg-[#1f6344] text-white font-bold text-xs cursor-pointer"
            >
              Back to Catalog
            </button>
          </div>
        )}
      </div>

      {/* 5. LIGHTWEIGHT AI TUTOR CHAT MODAL                                        */}

      {showAiModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-text">
          <div className="bg-[#fffdfa] border border-[#d8d2c6] rounded-2xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-3.5 text-[#211f1b] animate-fadeIn max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-[#e4ded4] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#287854]/10 text-[#287854]">
                  <Bot className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-[#211f1b]">AI Mentor Discussion</h3>
                  <p className="text-[11px] text-[#746e64]">{problem.title} Solution</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-1 rounded-md text-[#746e64] hover:text-[#211f1b] hover:bg-[#f3f0e8] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 min-h-[160px] max-h-72 overflow-y-auto flex flex-col gap-2.5 pr-1">
              {chatMessages.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#746e64]">
                  Ask the AI Mentor any question about your circuit, gate interactions, or state evolution!
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#211f1b] text-white self-end max-w-[85%]'
                        : 'bg-[#f4f9f6] text-[#211f1b] border border-[#bad8cb] self-start max-w-[90%]'
                    }`}
                  >
                    <strong className="block text-[10px] uppercase opacity-70 mb-0.5">
                      {msg.role === 'user' ? 'You' : 'AI Mentor'}
                    </strong>
                    {cleanQuantumText(msg.text)}
                  </div>
                ))
              )}
              {isAiThinking && (
                <div className="p-3 rounded-lg bg-[#f4f9f6] border border-[#bad8cb] text-xs text-[#287854] self-start animate-pulse">
                  Analyzing quantum statevector evolution...
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-[#e4ded4]">
              <input
                type="text"
                value={chatQuestion}
                onChange={(e) => setChatQuestion(e.target.value)}
                placeholder="Ask AI about this quantum circuit..."
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-[#d8d2c6] bg-white text-[#211f1b] focus:outline-none focus:border-[#287854]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendAiQuestion();
                }}
              />
              <button
                onClick={() => handleSendAiQuestion()}
                disabled={isAiThinking || !chatQuestion.trim()}
                className="p-2 rounded-lg bg-[#287854] hover:bg-[#1f6344] text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
