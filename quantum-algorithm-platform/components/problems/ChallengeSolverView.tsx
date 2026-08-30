'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Play,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Search,
  BookOpen,
  Sparkles,
  Bot,
  Send,
  Copy,
  Check,
  Undo2,
  Trash2,
  Trophy,
  Zap,
  Clock,
  Layers,
  Code2,
  Cpu,
  RotateCcw,
} from 'lucide-react';
import type {
  QuantumProblem,
  PlacedGate,
  CircuitIR,
  GateIR,
  ExecutionResponse,
  ProblemCheckResponse,
} from '@/types/quantum';
import { BACKEND_URL } from '@/config';
import { CircuitCanvas } from '@/components/simulator/CircuitCanvas';
import { ir_to_qasm } from '@/utils/qasm';
import { ChallengeResultView } from './ChallengeResultView';

interface ChallengeSolverViewProps {
  problem: QuantumProblem;
  allProblems: QuantumProblem[];
  onSelectProblem: (p: QuantumProblem) => void;
  onBackToCatalog: () => void;
  onProblemSolved: (problemId: string, nextProblemId?: string | null) => void;
  isSolved: boolean;
}

const COMPACT_GATE_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  h: { bg: 'bg-[#da1e28]', text: 'text-white', border: 'border-[#fa4d56]', label: 'H' },
  x: { bg: 'bg-[#d12771]', text: 'text-white', border: 'border-[#ee5396]', label: 'X' },
  y: { bg: 'bg-[#d12771]', text: 'text-white', border: 'border-[#ee5396]', label: 'Y' },
  z: { bg: 'bg-[#1192e8]', text: 'text-white', border: 'border-[#33b1ff]', label: 'Z' },
  s: { bg: 'bg-[#1192e8]', text: 'text-white', border: 'border-[#33b1ff]', label: 'S' },
  t: { bg: 'bg-[#1192e8]', text: 'text-white', border: 'border-[#33b1ff]', label: 'T' },
  cx: { bg: 'bg-[#6929c4]', text: 'text-white', border: 'border-[#8a3ffc]', label: 'CNOT' },
  cnot: { bg: 'bg-[#6929c4]', text: 'text-white', border: 'border-[#8a3ffc]', label: 'CNOT' },
  cz: { bg: 'bg-[#0072c3]', text: 'text-white', border: 'border-[#1192e8]', label: 'CZ' },
  swap: { bg: 'bg-[#0072c3]', text: 'text-white', border: 'border-[#1192e8]', label: 'SWAP' },
  reset: { bg: 'bg-[#525252]', text: 'text-white', border: 'border-[#6f6f6f]', label: '|0⟩' },
  measure: { bg: 'bg-[#002d9c]', text: 'text-white', border: 'border-[#0f62fe]', label: '◓' },
};

export function ChallengeSolverView({
  problem,
  allProblems,
  onSelectProblem,
  onBackToCatalog,
  onProblemSolved,
  isSolved,
}: ChallengeSolverViewProps) {
  // Circuit Canvas State
  const [numQubits, setNumQubits] = useState<number>(problem.num_qubits || 1);
  const [numSteps, setNumSteps] = useState<number>(6);
  const [gates, setGates] = useState<PlacedGate[]>([]);
  const [history, setHistory] = useState<PlacedGate[][]>([]);

  const [armedGate, setArmedGate] = useState<string | null>(null);
  const [armedParams, setArmedParams] = useState<number[] | undefined>(undefined);
  const [cnotControlPending, setCnotControlPending] = useState<number | null>(null);

  // Active Workspace Tab: 'circuit' | 'code'
  const [workspaceTab, setWorkspaceTab] = useState<'circuit' | 'code'>('circuit');

  // Simulation & Validation State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResponse | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [checkResult, setCheckResult] = useState<ProblemCheckResponse | null>(null);
  const [showResultView, setShowResultView] = useState<boolean>(false);
  const [showFailedBanner, setShowFailedBanner] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // AI Tutor State (Left Panel)
  const [aiTutorOpen, setAiTutorOpen] = useState<boolean>(true);
  const [hintLevel, setHintLevel] = useState<number>(1);
  const [aiResponseText, setAiResponseText] = useState<string | null>(null);
  const [aiResponseType, setAiResponseType] = useState<'hint' | 'review' | 'chat' | 'concept' | null>(null);
  const [aiReviewPositives, setAiReviewPositives] = useState<string[]>([]);
  const [aiReviewGuidance, setAiReviewGuidance] = useState<string[]>([]);
  const [aiCustomQuestion, setAiCustomQuestion] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Current problem index in catalog
  const currentIndex = allProblems.findIndex((p) => p.id === problem.id);
  const prevProblem = currentIndex > 0 ? allProblems[currentIndex - 1] : null;
  const nextProblem = currentIndex >= 0 && currentIndex < allProblems.length - 1 ? allProblems[currentIndex + 1] : null;

  // Derive CircuitIR from placed gates
  const circuitIR: CircuitIR = useMemo(() => {
    const irGates: GateIR[] = [];
    const sortedGates = [...gates].sort((a, b) => a.step - b.step);

    for (const g of sortedGates) {
      if (g.isControl) continue;

      if (g.isTarget && g.controlQubit !== undefined) {
        irGates.push({
          name: g.gate.toLowerCase() === 'cnot' ? 'cx' : g.gate.toLowerCase(),
          qubits: [g.controlQubit, g.qubit],
          params: g.params,
        });
      } else {
        irGates.push({
          name: g.gate.toLowerCase(),
          qubits: [g.qubit],
          params: g.params,
        });
      }
    }

    return {
      num_qubits: numQubits,
      gates: irGates,
    };
  }, [gates, numQubits]);

  // Generate OpenQASM code
  const qasmCode = useMemo(() => {
    return ir_to_qasm(circuitIR);
  }, [circuitIR]);

  // Load starter circuit when problem changes
  const initializeStarterCircuit = useCallback(
    (targetProblem: QuantumProblem) => {
      const qCount = targetProblem.num_qubits || 1;
      setNumQubits(qCount);
      setGates([]);
      setHistory([]);
      setExecutionResult(null);
      setCheckResult(null);
      setShowResultView(false);
      setShowFailedBanner(false);
      setAiResponseText(null);
      setAiResponseType(null);
      setHintLevel(1);

      const starter = targetProblem.starter_circuit;
      if (starter && starter.gates && starter.gates.length > 0) {
        const placed: PlacedGate[] = [];
        let currentStep = 0;
        const qubitStep: number[] = new Array(qCount).fill(0);

        starter.gates.forEach((g, idx) => {
          const name = g.name.toLowerCase();
          if (g.qubits.length >= 2) {
            const c = g.qubits[0];
            const t = g.qubits[1];
            if (c < qCount && t < qCount) {
              const step = Math.max(qubitStep[c], qubitStep[t]);
              const pairId = `multi-${idx}-${Date.now()}`;
              placed.push({
                id: `${pairId}-ctrl`,
                gate: name === 'cx' ? 'cnot' : name,
                qubit: c,
                step,
                isControl: true,
              });
              placed.push({
                id: pairId,
                gate: name === 'cx' ? 'cnot' : name,
                qubit: t,
                step,
                controlQubit: c,
                isTarget: true,
                params: g.params,
              });
              qubitStep[c] = step + 1;
              qubitStep[t] = step + 1;
              currentStep = Math.max(currentStep, step + 1);
            }
          } else if (g.qubits.length === 1) {
            const q = g.qubits[0];
            if (q < qCount) {
              const step = qubitStep[q];
              placed.push({
                id: `gate-${idx}-${q}-${Date.now()}`,
                gate: name,
                qubit: q,
                step,
                params: g.params,
              });
              qubitStep[q] = step + 1;
              currentStep = Math.max(currentStep, step + 1);
            }
          }
        });

        setNumSteps(Math.max(6, currentStep + 2));
        setGates(placed);
      } else {
        setNumSteps(6);
      }
    },
    []
  );

  useEffect(() => {
    initializeStarterCircuit(problem);
  }, [problem, initializeStarterCircuit]);

  // Run Simulation handler
  const handleRunSimulation = useCallback(async (customIR?: any) => {
    const activeIR =
      customIR && typeof customIR === 'object' && 'num_qubits' in customIR && Array.isArray(customIR.gates)
        ? customIR
        : circuitIR;
    setIsRunning(true);
    setShowFailedBanner(false);
    try {
      const res = await fetch(`${BACKEND_URL}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          circuit: activeIR,
          shots: 1024,
          include_statevector: true,
          backend: 'qiskit_aer',
        }),
      });
      if (res.ok) {
        const data: ExecutionResponse = await res.json();
        setExecutionResult(data);
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsRunning(false);
    }
  }, [circuitIR]);

  // Check Solution handler
  const handleCheckSolution = async () => {
    setIsChecking(true);
    setShowFailedBanner(false);
    try {
      // 1. Run simulation first to ensure fresh execution state
      let currentExec = executionResult;
      try {
        const execRes = await fetch(`${BACKEND_URL}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            circuit: circuitIR,
            shots: 1024,
            include_statevector: true,
            backend: 'qiskit_aer',
          }),
        });
        if (execRes.ok) {
          currentExec = await execRes.json();
          setExecutionResult(currentExec);
        }
      } catch (e) {}

      // 2. Validate circuit with backend
      const res = await fetch(`${BACKEND_URL}/problem/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_id: problem.id,
          circuit: circuitIR,
        }),
      });

      if (res.ok) {
        const checkData: ProblemCheckResponse = await res.json();
        setCheckResult(checkData);

        if (checkData.passed) {
          setShowResultView(true);
          onProblemSolved(problem.id, checkData.next_problem_id);
        } else {
          setShowFailedBanner(true);
        }
      }
    } catch (err) {
      console.error('Check error:', err);
    } finally {
      setIsChecking(false);
    }
  };

  // AI Tutor Actions
  const handleGetHint = async (level?: number) => {
    const targetLvl = level || hintLevel;
    setAiLoading(true);
    setAiResponseType('hint');
    try {
      const res = await fetch(`${BACKEND_URL}/problem/hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_id: problem.id,
          circuit: circuitIR,
          hint_level: targetLvl,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiResponseText(data.hint);
        setHintLevel(targetLvl);
      }
    } catch (e) {
      setAiResponseText('Try thinking about which gate prepares the required state.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleReviewCircuit = async () => {
    setAiLoading(true);
    setAiResponseType('review');
    try {
      const res = await fetch(`${BACKEND_URL}/problem/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_id: problem.id,
          circuit: circuitIR,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiReviewPositives(data.positives || []);
        setAiReviewGuidance(data.guidance || []);
        setAiResponseText(null);
      }
    } catch (e) {
      setAiReviewGuidance(['Could not analyze circuit right now.']);
    } finally {
      setAiLoading(false);
    }
  };

  const handleExplainConcept = async () => {
    setAiLoading(true);
    setAiResponseType('concept');
    try {
      const res = await fetch(`${BACKEND_URL}/problem/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_id: problem.id,
          circuit: circuitIR,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiResponseText(data.concept_explanation);
      }
    } catch (e) {
      setAiResponseText(problem.concept_explanation);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAskCustomQuestion = async (customQ?: string) => {
    const qText = customQ || aiCustomQuestion;
    if (!qText.trim()) return;
    setAiLoading(true);
    setAiResponseType('chat');
    try {
      const res = await fetch(`${BACKEND_URL}/tutor/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          circuit: circuitIR,
          question: `Regarding challenge "${problem.title}" (Goal: ${problem.goal}), ${qText.trim()}`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiResponseText(data.explanation);
        setAiCustomQuestion('');
      }
    } catch (e) {
      setAiResponseText('In quantum computing, check your gate sequence order and qubit connections.');
    } finally {
      setAiLoading(false);
    }
  };

  // Canvas Interactions
  const handleCellClick = (qubit: number, step: number) => {
    if (!armedGate) return;

    if (armedGate === 'cnot' || armedGate === 'cx' || armedGate === 'cz' || armedGate === 'swap') {
      if (cnotControlPending === null) {
        setCnotControlPending(qubit);
      } else {
        const controlQubit = cnotControlPending;
        if (controlQubit === qubit) {
          setCnotControlPending(null);
          return;
        }

        const pairId = `${armedGate}-${Date.now()}`;
        const newControlGate: PlacedGate = {
          id: `${pairId}-ctrl`,
          gate: armedGate,
          qubit: controlQubit,
          step,
          isControl: true,
        };
        const newTargetGate: PlacedGate = {
          id: pairId,
          gate: armedGate,
          qubit,
          step,
          controlQubit,
          isTarget: true,
          params: armedParams,
        };

        setHistory((prev) => [...prev, gates]);
        setGates((prev) => [
          ...prev.filter((g) => !(g.step === step && (g.qubit === controlQubit || g.qubit === qubit))),
          newControlGate,
          newTargetGate,
        ]);

        setCnotControlPending(null);
        setArmedGate(null);
        setExecutionResult(null);
        setCheckResult(null);
      }
    } else {
      const newGate: PlacedGate = {
        id: `gate-${Date.now()}`,
        gate: armedGate,
        qubit,
        step,
        params: armedParams,
      };

      setHistory((prev) => [...prev, gates]);
      setGates((prev) => [
        ...prev.filter((g) => !(g.qubit === qubit && g.step === step)),
        newGate,
      ]);
      setExecutionResult(null);
      setCheckResult(null);

      if (step >= numSteps - 1) {
        setNumSteps((prev) => prev + 2);
      }
    }
  };

  const handleDropGate = (gate: string, qubit: number, step: number, params?: number[]) => {
    const isMulti = gate === 'cnot' || gate === 'cx' || gate === 'cz' || gate === 'swap';
    setHistory((prev) => [...prev, gates]);
    setExecutionResult(null);
    setCheckResult(null);

    if (isMulti) {
      const targetQubit = qubit === numQubits - 1 ? qubit - 1 : qubit + 1;
      const pairId = `${gate}-${Date.now()}`;
      const newControlGate: PlacedGate = {
        id: `${pairId}-ctrl`,
        gate,
        qubit,
        step,
        isControl: true,
      };
      const newTargetGate: PlacedGate = {
        id: pairId,
        gate,
        qubit: targetQubit,
        step,
        controlQubit: qubit,
        isTarget: true,
        params,
      };

      setGates((prev) => [
        ...prev.filter((g) => !(g.step === step && (g.qubit === qubit || g.qubit === targetQubit))),
        newControlGate,
        newTargetGate,
      ]);
    } else {
      const newGate: PlacedGate = {
        id: `gate-${Date.now()}`,
        gate,
        qubit,
        step,
        params,
      };

      setGates((prev) => [
        ...prev.filter((g) => !(g.qubit === qubit && g.step === step)),
        newGate,
      ]);
    }

    if (step >= numSteps - 1) {
      setNumSteps((prev) => Math.max(prev, step + 3));
    }
  };

  const handleMoveGate = (gateId: string, targetQubit: number, targetStep: number) => {
    const gateToMove = gates.find((g) => g.id === gateId);
    if (!gateToMove) return;

    setHistory((prev) => [...prev, gates]);
    setExecutionResult(null);
    setCheckResult(null);

    if (gateToMove.isControl || gateToMove.isTarget) {
      const baseId = gateId.replace('-ctrl', '');
      const ctrlGate = gates.find((g) => g.id === `${baseId}-ctrl`);
      const targetGate = gates.find((g) => g.id === baseId);

      if (ctrlGate && targetGate) {
        let newControlQubit = ctrlGate.qubit;
        let newTargetQubit = targetGate.qubit;

        if (gateToMove.isControl) {
          newControlQubit = targetQubit;
          if (newControlQubit === newTargetQubit) {
            newTargetQubit = newControlQubit === numQubits - 1 ? newControlQubit - 1 : newControlQubit + 1;
          }
        } else {
          newTargetQubit = targetQubit;
          if (newTargetQubit === newControlQubit) {
            newControlQubit = newTargetQubit === numQubits - 1 ? newTargetQubit - 1 : newTargetQubit + 1;
          }
        }

        const updatedControl: PlacedGate = {
          ...ctrlGate,
          qubit: newControlQubit,
          step: targetStep,
        };
        const updatedTarget: PlacedGate = {
          ...targetGate,
          qubit: newTargetQubit,
          controlQubit: newControlQubit,
          step: targetStep,
        };

        setGates((prev) => [
          ...prev.filter(
            (g) =>
              g.id !== baseId &&
              g.id !== `${baseId}-ctrl` &&
              !(g.step === targetStep && (g.qubit === newControlQubit || g.qubit === newTargetQubit))
          ),
          updatedControl,
          updatedTarget,
        ]);
      }
    } else {
      const updatedGate: PlacedGate = {
        ...gateToMove,
        qubit: targetQubit,
        step: targetStep,
      };

      setGates((prev) => [
        ...prev.filter((g) => g.id !== gateId && !(g.qubit === targetQubit && g.step === targetStep)),
        updatedGate,
      ]);
    }

    if (targetStep >= numSteps - 1) {
      setNumSteps((prev) => Math.max(prev, targetStep + 3));
    }
  };

  const handleRemoveGate = (gateId: string) => {
    setHistory((prev) => [...prev, gates]);
    setExecutionResult(null);
    setCheckResult(null);
    const targetGate = gates.find((g) => g.id === gateId);
    if (targetGate && (targetGate.isControl || targetGate.isTarget)) {
      const baseId = gateId.replace('-ctrl', '');
      setGates((prev) => prev.filter((g) => g.id !== baseId && g.id !== `${baseId}-ctrl`));
    } else {
      setGates((prev) => prev.filter((g) => g.id !== gateId));
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setGates(last);
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setExecutionResult(null);
    setCheckResult(null);
  };

  const handleClear = () => {
    setHistory((prev) => [...prev, gates]);
    setGates([]);
    setExecutionResult(null);
    setCheckResult(null);
  };

  const copyQasmToClipboard = () => {
    navigator.clipboard.writeText(qasmCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Filter available gates for this challenge
  const activeGatesList = problem.available_gates || ['h', 'x', 'y', 'z', 'cx', 'measure'];

  // Dedicated Full-Page Challenge Result View
  if (showResultView && checkResult && checkResult.passed) {
    return (
      <ChallengeResultView
        problem={problem}
        submittedCircuit={circuitIR}
        submittedGates={gates}
        qasmCode={qasmCode}
        executionResult={executionResult}
        checkResult={checkResult}
        nextProblem={nextProblem}
        onNextChallenge={(nextProb) => {
          setShowResultView(false);
          onSelectProblem(nextProb);
        }}
        onOpenInSimulator={() => {
          onBackToCatalog();
        }}
        onBackToSolver={() => setShowResultView(false)}
        onBackToCatalog={onBackToCatalog}
      />
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#f7f4ee] text-[#211f1b] font-sans flex flex-col selection:bg-[#c96b2c] selection:text-white">

      {/* 1. Minimal LeetCode Header                                                 */}

      <header className="w-full bg-[#fffdf9] border-b border-[#ded7cb] px-4 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToCatalog}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#746e64] hover:text-[#211f1b] hover:bg-[#eee9df] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Challenges</span>
          </button>

          <span className="text-gray-300">|</span>

          {/* Prev / Next navigation */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => prevProblem && onSelectProblem(prevProblem)}
              disabled={!prevProblem}
              className="p-1 rounded text-[#746e64] hover:text-[#211f1b] hover:bg-[#eee9df] disabled:opacity-30 transition-colors cursor-pointer"
              title="Previous Problem"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-semibold text-[#211f1b] px-1.5">
              Challenge {currentIndex + 1} of {allProblems.length}
            </span>

            <button
              onClick={() => nextProblem && onSelectProblem(nextProblem)}
              disabled={!nextProblem}
              className="p-1 rounded text-[#746e64] hover:text-[#211f1b] hover:bg-[#eee9df] disabled:opacity-30 transition-colors cursor-pointer"
              title="Next Problem"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: Title & Badges */}
        <div className="hidden sm:flex items-center gap-2">
          <h1 className="font-bold text-sm text-[#211f1b]">{problem.title}</h1>
          <span
            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
              problem.difficulty === 'Beginner' ? 'bg-[#4f806d]/15 text-[#4f806d]' : 'bg-[#c96b2c]/15 text-[#c96b2c]'
            }`}
          >
            {problem.difficulty}
          </span>
          <span className="text-xs text-[#746e64] font-medium">• {problem.topic}</span>
        </div>

        {/* Right Action: Solved Status & XP */}
        <div className="flex items-center gap-3">
          {isSolved ? (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#4f806d]/15 text-[#4f806d] text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Solved
            </span>
          ) : (
            <span className="text-xs font-mono font-bold text-[#c96b2c]">+{problem.xp} XP</span>
          )}
        </div>
      </header>

      {/* 2. Main Two-Column Layout                                                  */}

      <div className="flex-1 max-w-[1750px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 p-3 sm:p-4 items-start">

        {/* LEFT COLUMN: Problem Details + Available Operations + AI Tutor          */}

        <div className="lg:col-span-5 flex flex-col gap-4 lg:sticky lg:top-[56px] lg:max-h-[calc(100vh-76px)] lg:overflow-y-auto pr-1 pb-6">
          {/* Problem Card */}
          <div className="p-5 rounded-xl bg-[#fffdf9] border border-[#ded7cb] shadow-sm flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#c96b2c] font-bold">
                  Problem {currentIndex + 1}
                </span>
                <span className="text-[10px] text-[#746e64]">•</span>
                <span className="text-[10px] text-[#746e64] flex items-center gap-1">
                  <Clock className="w-3 h-3" /> ~{problem.estimated_minutes} min
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-[#211f1b] tracking-tight">{problem.title}</h2>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5 border-t border-[#ded7cb] pt-3">
              <span className="text-[11px] font-bold text-[#746e64] uppercase tracking-wider">Description</span>
              <p className="text-xs text-[#211f1b] leading-relaxed whitespace-pre-wrap">{problem.goal}</p>
            </div>

            {/* Requirements / Constraints */}
            <div className="flex flex-col gap-1.5 bg-[#f0ece4] p-3 rounded-lg border border-[#ded7cb]">
              <span className="text-[10px] font-bold text-[#746e64] uppercase tracking-wider">Goal &amp; Requirements</span>
              <ul className="list-disc pl-4 space-y-1 text-xs text-[#211f1b]">
                {problem.requirements && problem.requirements.length > 0 ? (
                  problem.requirements.map((req, i) => <li key={i}>{req}</li>)
                ) : (
                  <>
                    <li>Start from the initialized state |0⟩</li>
                    <li>Use the circuit editor to build your solution</li>
                    <li>{problem.expected_behavior}</li>
                  </>
                )}
              </ul>
            </div>

            {/* Example Target Distribution */}
            {problem.example_distribution && Object.keys(problem.example_distribution).length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-[#746e64] uppercase tracking-wider">
                  Target Probability Distribution (Example)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(problem.example_distribution).map(([state, probVal]) => (
                    <div key={state} className="p-2 rounded-lg bg-[#fffaf3] border border-[#f0d1b3] flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs font-mono font-bold text-[#211f1b]">
                        <span>{state}</span>
                        <span className="text-[#c96b2c]">{(probVal * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-[#eee9df] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#c96b2c] h-full rounded-full" style={{ width: `${probVal * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Operations Section (Only relevant gates for the challenge)            */}

          <div className="p-4 rounded-xl bg-[#fffdf9] border border-[#ded7cb] shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#746e64] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#c96b2c]" /> Available Operations
              </span>
              <span className="text-[10px] text-[#746e64]">Click or drag to wire</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {activeGatesList.map((gName) => {
                const normalized = gName.toLowerCase() === 'cnot' ? 'cx' : gName.toLowerCase();
                const style = COMPACT_GATE_COLORS[normalized] || {
                  bg: 'bg-[#211f1b]',
                  text: 'text-white',
                  border: 'border-[#38342e]',
                  label: gName.toUpperCase(),
                };
                const isArmed = armedGate === normalized || (armedGate === 'cnot' && normalized === 'cx');

                return (
                  <button
                    key={gName}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        'application/json',
                        JSON.stringify({
                          source: 'palette',
                          gate: normalized,
                          symbol: style.label,
                        })
                      );
                      e.dataTransfer.setData('text/plain', normalized);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    onClick={() => {
                      if (isArmed) {
                        setArmedGate(null);
                        setCnotControlPending(null);
                      } else {
                        setArmedGate(normalized);
                        setCnotControlPending(null);
                      }
                    }}
                    className={`px-3 py-2 rounded-lg font-mono font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-grab active:cursor-grabbing ${
                      style.bg
                    } ${style.text} ${
                      isArmed
                        ? 'ring-2 ring-offset-2 ring-[#c96b2c] scale-105 shadow-md'
                        : 'hover:scale-102 hover:shadow-xs'
                    }`}
                  >
                    <span>{style.label}</span>
                    {isArmed && <span className="text-[9px] bg-black/20 px-1 rounded">Armed</span>}
                  </button>
                );
              })}
            </div>

            {armedGate && (
              <div className="text-[11px] text-[#c96b2c] font-medium flex items-center justify-between bg-[#fffaf3] p-2 rounded-lg border border-[#f0d1b3]">
                <span>
                  {cnotControlPending !== null
                    ? `Selected Control on q[${cnotControlPending}]. Click target qubit wire.`
                    : `Armed: ${armedGate.toUpperCase()}. Click any wire step to place.`}
                </span>
                <button
                  onClick={() => {
                    setArmedGate(null);
                    setCnotControlPending(null);
                  }}
                  className="text-[10px] font-bold text-[#746e64] hover:text-[#211f1b] underline cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* AI Tutor Assistant (Collapsible / Compact Drawer)                      */}

          <div className="p-4 rounded-xl bg-[#fffdf9] border border-[#ded7cb] shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#211f1b] uppercase tracking-wider flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-[#c96b2c]" /> AI Socratic Tutor
              </span>
              <button
                onClick={() => setAiTutorOpen(!aiTutorOpen)}
                className="text-[10px] font-semibold text-[#746e64] hover:text-[#211f1b] cursor-pointer"
              >
                {aiTutorOpen ? 'Collapse' : 'Expand'}
              </button>
            </div>

            {aiTutorOpen && (
              <div className="flex flex-col gap-3 pt-1">
                {/* 3 Quick Tutor Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleGetHint(hintLevel)}
                    disabled={aiLoading}
                    className="p-2 rounded-lg bg-[#fffaf3] border border-[#f0d1b3] hover:border-[#c96b2c] text-xs font-semibold text-[#211f1b] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-[#c96b2c]" />
                    <span className="text-[11px]">💡 Get Hint</span>
                  </button>

                  <button
                    onClick={handleReviewCircuit}
                    disabled={aiLoading}
                    className="p-2 rounded-lg bg-[#fffdf9] border border-[#ded7cb] hover:border-[#4f806d] text-xs font-semibold text-[#211f1b] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5 text-[#4f806d]" />
                    <span className="text-[11px]">🔍 Review</span>
                  </button>

                  <button
                    onClick={handleExplainConcept}
                    disabled={aiLoading}
                    className="p-2 rounded-lg bg-[#fffdf9] border border-[#ded7cb] hover:border-[#211f1b] text-xs font-semibold text-[#211f1b] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#211f1b]" />
                    <span className="text-[11px]">🧠 Concept</span>
                  </button>
                </div>

                {/* AI Chat Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiCustomQuestion}
                    onChange={(e) => setAiCustomQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskCustomQuestion()}
                    placeholder="Ask tutor why this circuit works..."
                    className="flex-1 bg-[#f7f4ee] border border-[#ded7cb] focus:border-[#c96b2c] rounded-lg px-2.5 py-1.5 text-xs text-[#211f1b] focus:outline-none"
                  />
                  <button
                    onClick={() => handleAskCustomQuestion()}
                    disabled={aiLoading}
                    className="px-3 py-1.5 rounded-lg bg-[#c96b2c] hover:bg-[#b55e24] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                  >
                    {aiLoading ? <Sparkles className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  </button>
                </div>

                {/* AI Response Display Box */}
                {aiResponseType === 'hint' && aiResponseText && (
                  <div className="p-3 rounded-lg bg-[#fffaf3] border border-[#f0d1b3] text-xs text-[#211f1b] flex flex-col gap-1.5 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-[#f0d1b3] pb-1">
                      <span className="font-bold text-[#c96b2c] flex items-center gap-1">
                        <Lightbulb className="w-3.5 h-3.5" /> Hint (Tier {hintLevel} of {problem.hints.length})
                      </span>
                      {hintLevel < problem.hints.length && (
                        <button
                          onClick={() => handleGetHint(hintLevel + 1)}
                          className="text-[10px] font-semibold text-[#c96b2c] hover:underline cursor-pointer"
                        >
                          Next Hint →
                        </button>
                      )}
                    </div>
                    <p className="leading-relaxed mt-0.5">{aiResponseText}</p>
                  </div>
                )}

                {aiResponseType === 'review' && (
                  <div className="p-3 rounded-lg bg-[#fffdf9] border border-[#ded7cb] text-xs text-[#211f1b] flex flex-col gap-2 animate-fadeIn">
                    <div className="font-bold text-[#211f1b] flex items-center gap-1 border-b border-[#ded7cb] pb-1">
                      <Search className="w-3.5 h-3.5 text-[#4f806d]" /> AI Circuit Review
                    </div>
                    {aiReviewPositives.length > 0 && (
                      <div className="space-y-1">
                        {aiReviewPositives.map((pos, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-[#4f806d] font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <span>{pos}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {aiReviewGuidance.length > 0 && (
                      <div className="space-y-1 border-t border-[#ded7cb] pt-1">
                        {aiReviewGuidance.map((g, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-[#c96b2c] font-medium">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <span>{g}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(aiResponseType === 'chat' || aiResponseType === 'concept') && aiResponseText && (
                  <div className="p-3 rounded-lg bg-[#f0ece4] border border-[#ded7cb] text-xs text-[#211f1b] flex flex-col gap-1 animate-fadeIn">
                    <span className="font-bold text-[#211f1b] flex items-center gap-1">
                      <Bot className="w-3.5 h-3.5 text-[#c96b2c]" /> AI Explanation:
                    </span>
                    <p className="leading-relaxed whitespace-pre-wrap">{aiResponseText}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Circuit + Code + Simulation Run/Check Controls */}

        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Workspace Container */}
          <div className="rounded-xl bg-[#fffdf9] border border-[#ded7cb] shadow-sm overflow-hidden flex flex-col">
            {/* Workspace Header Tabs */}
            <div className="px-4 py-2.5 bg-[#f0ece4] border-b border-[#ded7cb] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1 bg-[#ded7cb]/50 p-0.5 rounded-lg">
                <button
                  onClick={() => setWorkspaceTab('circuit')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    workspaceTab === 'circuit'
                      ? 'bg-[#fffdf9] text-[#211f1b] shadow-xs'
                      : 'text-[#746e64] hover:text-[#211f1b]'
                  }`}
                >
                  ⚡ Circuit Editor
                </button>
                <button
                  onClick={() => setWorkspaceTab('code')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    workspaceTab === 'code'
                      ? 'bg-[#fffdf9] text-[#211f1b] shadow-xs'
                      : 'text-[#746e64] hover:text-[#211f1b]'
                  }`}
                >
                  📄 OpenQASM Code
                </button>
              </div>

              {/* Stats & Quick Actions */}
              <div className="flex items-center gap-2 text-xs text-[#746e64]">
                <span className="font-mono">
                  Qubits: <strong className="text-[#211f1b]">{numQubits}</strong>
                </span>
                <span>•</span>
                <span className="font-mono">
                  Steps: <strong className="text-[#211f1b]">{numSteps}</strong>
                </span>
                <span>•</span>
                <button
                  onClick={handleUndo}
                  disabled={history.length === 0}
                  className="p-1 rounded hover:bg-[#ded7cb] text-[#746e64] hover:text-[#211f1b] disabled:opacity-30 transition-colors cursor-pointer"
                  title="Undo"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleClear}
                  disabled={gates.length === 0}
                  className="p-1 rounded hover:bg-[#ded7cb] text-[#746e64] hover:text-[#211f1b] disabled:opacity-30 transition-colors cursor-pointer"
                  title="Clear Canvas"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Main Interactive Canvas Area */}
            <div className="p-4 bg-[#fbf9f5] min-h-[260px] flex items-center justify-center overflow-x-auto">
              {workspaceTab === 'circuit' ? (
                <div className="w-full">
                  <CircuitCanvas
                    numQubits={numQubits}
                    onNumQubitsChange={(val) => {
                      setNumQubits(val);
                      setGates((prev) => prev.filter((g) => g.qubit < val && (!g.controlQubit || g.controlQubit < val)));
                    }}
                    gates={gates}
                    numSteps={numSteps}
                    onAddStep={() => setNumSteps((prev) => prev + 2)}
                    onCellClick={handleCellClick}
                    onRemoveGate={handleRemoveGate}
                    onUndo={handleUndo}
                    onClear={handleClear}
                    canUndo={history.length > 0}
                    armedGate={armedGate}
                    cnotControlPending={cnotControlPending}
                    onDropGate={handleDropGate}
                    onMoveGate={handleMoveGate}
                  />
                </div>
              ) : (
                /* OpenQASM Code View */
                <div className="w-full relative bg-[#211f1b] rounded-lg p-4 font-mono text-xs text-green-400">
                  <div className="flex items-center justify-between border-b border-gray-700 pb-2 mb-2">
                    <span className="text-gray-400 text-[11px]">OpenQASM 3.0</span>
                    <button
                      onClick={copyQasmToClipboard}
                      className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-white text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedCode ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed">{qasmCode}</pre>
                </div>
              )}
            </div>

            {/* Bottom Actions: [▶ Run Simulation] and [✓ Check Solution] */}
            <div className="p-4 bg-[#fffdf9] border-t border-[#ded7cb] flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-xs text-[#746e64]">
                <Cpu className="w-3.5 h-3.5 text-[#c96b2c]" />
                <span>Simulator: Qiskit Aer</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleRunSimulation()}
                  disabled={isRunning || isChecking}
                  className="px-4 py-2 rounded-lg bg-[#eee9df] hover:bg-[#ded7cb] text-[#211f1b] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isRunning ? 'Running...' : 'Run Simulation'}</span>
                </button>

                <button
                  onClick={() => handleCheckSolution()}
                  disabled={isChecking || isRunning}
                  className="px-6 py-2 rounded-lg bg-[#4f806d] hover:bg-[#3e6858] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isChecking ? 'Checking...' : 'Check Solution'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Failed Check Inline Alert Banner                                       */}

          {showFailedBanner && checkResult && !checkResult.passed && (
            <div className="p-4 rounded-xl bg-[#fffaf3] border border-[#f0d1b3] shadow-xs flex flex-col gap-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#c96b2c]">
                  <AlertCircle className="w-4 h-4" />
                  <span>Not quite yet</span>
                </div>
                <button
                  onClick={() => setShowFailedBanner(false)}
                  className="text-xs text-[#746e64] hover:text-[#211f1b] cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-[#211f1b] leading-relaxed">{checkResult.feedback}</p>

              {checkResult.ai_explanation && (
                <p className="text-xs text-[#746e64] bg-[#fffdf9] p-2.5 rounded-lg border border-[#ded7cb]">
                  💡 {checkResult.ai_explanation}
                </p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleGetHint(hintLevel)}
                  className="px-3 py-1.5 rounded-lg bg-[#c96b2c] hover:bg-[#b55e24] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>💡 Get Hint</span>
                </button>
                <button
                  onClick={() => setShowFailedBanner(false)}
                  className="px-3 py-1.5 rounded-lg bg-[#eee9df] hover:bg-[#ded7cb] text-[#211f1b] text-xs font-semibold cursor-pointer"
                >
                  Keep Trying
                </button>
              </div>
            </div>
          )}

          {/* Compact Simulation Results Card                                        */}

          <div className="p-4 rounded-xl bg-[#fffdf9] border border-[#ded7cb] shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#ded7cb] pb-2">
              <span className="text-[11px] font-bold text-[#746e64] uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#c96b2c]" /> Simulation Results
              </span>
              {executionResult && (
                <span className="text-[10px] text-[#746e64] font-mono">
                  {executionResult.execution_time_ms.toFixed(1)}ms · 1024 shots
                </span>
              )}
            </div>

            {executionResult && executionResult.probabilities && Object.keys(executionResult.probabilities).length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {Object.entries(executionResult.probabilities)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([state, prob]) => (
                    <div key={state} className="p-2.5 rounded-lg bg-[#f0ece4] border border-[#ded7cb] flex flex-col gap-1">
                      <div className="flex items-center justify-between font-mono text-xs font-bold text-[#211f1b]">
                        <span>|{state}⟩</span>
                        <span className={prob > 0.01 ? 'text-[#c96b2c]' : 'text-[#746e64]'}>
                          {(prob * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-[#ded7cb] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#c96b2c] h-full rounded-full transition-all duration-300"
                          style={{ width: `${prob * 100}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-[#746e64] font-mono text-right">
                        {executionResult.counts?.[state] || 0} counts
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[#746e64] flex flex-col items-center justify-center gap-1">
                <span>Click &apos;Run Simulation&apos; or place gates to see output statevector.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
