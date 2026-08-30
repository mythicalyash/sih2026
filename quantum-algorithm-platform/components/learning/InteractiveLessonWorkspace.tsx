'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles,
  Check,
  Copy,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Zap,
  Clock,
  Trash2,
  Trophy,
  X,
  MessageSquare,
  HelpCircle,
  Flame,
  Layers,
} from 'lucide-react';
import { Course, Lesson } from './types';
import type { CircuitIR, GateIR, PlacedGate, ExecutionResponse } from '@/types/quantum';
import { BACKEND_URL } from '@/config';
import { ir_to_qasm, qasm_to_ir } from '@/utils/qasm';
import { InteractiveBlochSphere } from './InteractiveBlochSphere';

interface InteractiveLessonWorkspaceProps {
  course: Course;
  lesson: Lesson;
  onBackToCourse: () => void;
  onNextLesson?: () => void;
  onOpenSimulator?: () => void;
  onLessonCompleted?: (lessonId: string, xp: number) => void;
}

const GATE_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  h: { bg: 'bg-[#da1e28]', text: 'text-white', border: 'border-[#da1e28]', label: 'H' },
  x: { bg: 'bg-[#d12771]', text: 'text-white', border: 'border-[#d12771]', label: 'X' },
  y: { bg: 'bg-[#d12771]', text: 'text-white', border: 'border-[#d12771]', label: 'Y' },
  z: { bg: 'bg-[#1192e8]', text: 'text-white', border: 'border-[#1192e8]', label: 'Z' },
  s: { bg: 'bg-[#1192e8]', text: 'text-white', border: 'border-[#1192e8]', label: 'S' },
  t: { bg: 'bg-[#1192e8]', text: 'text-white', border: 'border-[#1192e8]', label: 'T' },
  cx: { bg: 'bg-[#6929c4]', text: 'text-white', border: 'border-[#6929c4]', label: '⊕' },
  cnot: { bg: 'bg-[#6929c4]', text: 'text-white', border: 'border-[#6929c4]', label: '⊕' },
  cz: { bg: 'bg-[#6929c4]', text: 'text-white', border: 'border-[#6929c4]', label: 'CZ' },
};

// Interactive 2D/3D Bloch Sphere Component

function BlochSphereVisualizer({ theta, phi, label }: { theta: number; phi: number; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const r = width * 0.38;

    ctx.clearRect(0, 0, width, height);

    // Outer Sphere Outline
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.fillStyle = '#faf8f5';
    ctx.fill();
    ctx.strokeStyle = '#d8d2c6';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Equator Ellipse
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.32, 0, 0, 2 * Math.PI);
    ctx.strokeStyle = '#e2dcce';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Z-Axis (Vertical)
    ctx.beginPath();
    ctx.moveTo(cx, cy - r - 10);
    ctx.lineTo(cx, cy + r + 10);
    ctx.strokeStyle = '#8c857b';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Labels |0⟩ and |1⟩
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillStyle = '#211f1b';
    ctx.textAlign = 'center';
    ctx.fillText('|0⟩', cx, cy - r - 14);
    ctx.fillText('|1⟩', cx, cy + r + 22);

    // X/Y Axis hint
    ctx.font = '9px system-ui, sans-serif';
    ctx.fillStyle = '#8c857b';
    ctx.fillText('|+⟩ (X)', cx + r + 16, cy + 4);
    ctx.fillText('|-⟩ (-X)', cx - r - 16, cy + 4);

    // State Vector calculation
    const xVal = Math.sin(theta) * Math.cos(phi);
    const yVal = Math.sin(theta) * Math.sin(phi);
    const zVal = Math.cos(theta);

    // Projected to 2.5D Canvas:
    const projX = cx + (xVal * r) + (yVal * -0.2 * r);
    const projY = cy - (zVal * r) + (yVal * 0.28 * r);

    // Vector Arrow
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(projX, projY);
    ctx.strokeStyle = '#c96b2c';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Vector Tip
    ctx.beginPath();
    ctx.arc(projX, projY, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#c96b2c';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [theta, phi]);

  return (
    <div className="flex flex-col items-center justify-center p-2 bg-[#fdfbf7] rounded-2xl">
      <canvas ref={canvasRef} width={220} height={220} className="w-44 h-44 sm:w-52 sm:h-52" />
      <span className="text-xs font-mono font-bold text-[#c96b2c] mt-1">{label}</span>
    </div>
  );
}

function computeStateEvolution(gates: PlacedGate[]): { stepFormula: string; matrixMath?: string } {
  const sorted = [...gates].sort((a, b) => a.step - b.step);
  if (sorted.length === 0) {
    return {
      stepFormula: '|0⟩ (Initial Ground State, 100% P(0))',
      matrixMath: 'Input Statevector: |ψ₀⟩ = [ 1, 0 ]ᵀ',
    };
  }

  const gateNames = sorted.map((g) => g.gate.toUpperCase());
  if (gateNames.length === 1) {
    if (gateNames[0] === 'H') {
      return {
        stepFormula: '|0⟩ ➔ [ H ] ➔ (|0⟩ + |1⟩)/√2 = |+⟩ (50% 0 / 50% 1)',
        matrixMath: '(1/√2)[ [1, 1], [1, -1] ] × [ 1, 0 ]ᵀ = [ 1/√2, 1/√2 ]ᵀ = |+⟩',
      };
    }
    if (gateNames[0] === 'X') {
      return {
        stepFormula: '|0⟩ ➔ [ X ] ➔ |1⟩ (Excited State, 100% P(1))',
        matrixMath: '[ [0, 1], [1, 0] ] × [ 1, 0 ]ᵀ = [ 0, 1 ]ᵀ = |1⟩',
      };
    }
    if (gateNames[0] === 'Y') {
      return {
        stepFormula: '|0⟩ ➔ [ Y ] ➔ i|1⟩ (Complex Imaginary Phase, 100% P(1))',
        matrixMath: '[ [0, -i], [i, 0] ] × [ 1, 0 ]ᵀ = [ 0, i ]ᵀ = i|1⟩',
      };
    }
    if (gateNames[0] === 'Z') {
      return {
        stepFormula: '|0⟩ ➔ [ Z ] ➔ |0⟩ (Z leaves |0⟩ unchanged)',
        matrixMath: '[ [1, 0], [0, -1] ] × [ 1, 0 ]ᵀ = [ 1, 0 ]ᵀ = |0⟩',
      };
    }
    if (gateNames[0] === 'S') {
      return {
        stepFormula: '|0⟩ ➔ [ S ] ➔ |0⟩ (S leaves |0⟩ unchanged)',
        matrixMath: '[ [1, 0], [0, i] ] × [ 1, 0 ]ᵀ = [ 1, 0 ]ᵀ = |0⟩',
      };
    }
  } else if (gateNames.length === 2) {
    if (gateNames[0] === 'H' && gateNames[1] === 'Z') {
      return {
        stepFormula: '|0⟩ ➔ [ H ] ➔ |+⟩ ➔ [ Z ] ➔ (|0⟩ - |1⟩)/√2 = |−⟩',
        matrixMath: 'Z × |+⟩ = [ [1, 0], [0, -1] ] × [ 1/√2, 1/√2 ]ᵀ = [ 1/√2, -1/√2 ]ᵀ = |−⟩',
      };
    }
    if (gateNames[0] === 'H' && gateNames[1] === 'H') {
      return {
        stepFormula: '|0⟩ ➔ [ H ] ➔ |+⟩ ➔ [ H ] ➔ |0⟩ (Coherent Cancellation, H² = I)',
        matrixMath: 'H × H = Identity matrix I. Constructive wave interference returns state to [ 1, 0 ]ᵀ.',
      };
    }
    if (gateNames[0] === 'H' && gateNames[1] === 'S') {
      return {
        stepFormula: '|0⟩ ➔ [ H ] ➔ |+⟩ ➔ [ S ] ➔ (|0⟩ + i|1⟩)/√2 = |R⟩',
        matrixMath: 'S × |+⟩ = [ [1, 0], [0, i] ] × [ 1/√2, 1/√2 ]ᵀ = [ 1/√2, i/√2 ]ᵀ = |R⟩',
      };
    }
    if (gateNames[0] === 'H' && gateNames[1] === 'X') {
      return {
        stepFormula: '|0⟩ ➔ [ H ] ➔ |+⟩ ➔ [ X ] ➔ |+⟩ (Bit flip leaves symmetric |+⟩ invariant)',
        matrixMath: 'X × |+⟩ = [ [0, 1], [1, 0] ] × [ 1/√2, 1/√2 ]ᵀ = [ 1/√2, 1/√2 ]ᵀ = |+⟩',
      };
    }
  } else if (gateNames.length === 3) {
    if (gateNames[0] === 'H' && gateNames[1] === 'X' && gateNames[2] === 'H') {
      return {
        stepFormula: '|0⟩ ➔ [ H ] ➔ |+⟩ ➔ [ X ] ➔ |+⟩ ➔ [ H ] ➔ |0⟩ (H·X·H = Z Identity)',
        matrixMath: 'H·X·H = Z. Applying Z to initial |0⟩ produces ground state |0⟩ with 100% fidelity.',
      };
    }
  }

  return {
    stepFormula: `|0⟩ ➔ ${gateNames.map((g) => `[ ${g} ]`).join(' ➔ ')} ➔ |ψ⟩`,
  };
}

export const InteractiveLessonWorkspace: React.FC<InteractiveLessonWorkspaceProps> = ({
  course,
  lesson: initialLesson,
  onBackToCourse,
  onNextLesson,
  onOpenSimulator,
  onLessonCompleted,
}) => {
  const [currentLesson, setCurrentLesson] = useState<Lesson>(initialLesson);

  // 1. Canonical Circuit State
  const [numQubits] = useState<number>(currentLesson.numQubits || 1);
  const [gates, setGates] = useState<PlacedGate[]>([]);
  const [selectedGate, setSelectedGate] = useState<string | null>(null);
  const [showMatrixMath, setShowMatrixMath] = useState<boolean>(false);

  // 2. OpenQASM 3.0 Code State
  const [qasmCode, setQasmCode] = useState<string>(currentLesson.starterQasm);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // 3. Interactive Bloch Section State
  const [blochTheta, setBlochTheta] = useState<number>(0);
  const [blochPhi, setBlochPhi] = useState<number>(0);
  const [blochLabel, setBlochLabel] = useState<string>('|0⟩ (Ground State)');
  const [blochProbs, setBlochProbs] = useState<{ p0: number; p1: number }>({ p0: 100, p1: 0 });

  // 4. Challenge Simulation & Verification State
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<ExecutionResponse | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(currentLesson.completed);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(currentLesson.completed);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [aiExplanationText, setAiExplanationText] = useState<string | null>(null);

  // 5. AI Mentor Chat Modal
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiChatQuestion, setAiChatQuestion] = useState<string>('');
  const [aiChatMessages, setAiChatMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([]);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // 6. Interactive Prediction Checkpoint & Laser Pulse State
  const [selectedPredictionOption, setSelectedPredictionOption] = useState<number | null>(null);
  const [isPredictionSubmitted, setIsPredictionSubmitted] = useState<boolean>(false);
  const [isLaserPulsing, setIsLaserPulsing] = useState<boolean>(false);

  // Initialize from currentLesson starter gates
  useEffect(() => {
    setIsSubmitted(currentLesson.completed);
    setSubmissionSuccess(currentLesson.completed);
    setFeedbackText(null);
    setAiExplanationText(null);
    setSimulationResult(null);

    setBlochTheta(0);
    setBlochPhi(0);
    setBlochLabel('|0⟩ (Ground State)');
    setBlochProbs({ p0: 100, p1: 0 });
    setSelectedPredictionOption(null);
    setIsPredictionSubmitted(false);

    if (currentLesson.starterCircuitGates && currentLesson.starterCircuitGates.length > 0) {
      const placed: PlacedGate[] = currentLesson.starterCircuitGates.map((g, idx) => ({
        id: `gate-start-${idx}`,
        gate: g.name.toLowerCase(),
        qubit: g.qubit,
        step: g.step,
        params: g.params,
      }));
      setGates(placed);
      setQasmCode(ir_to_qasm({ num_qubits: 1, gates: [{ name: placed[0].gate, qubits: [0] }] }));
    } else {
      setGates([]);
      setQasmCode(currentLesson.starterQasm);
    }
  }, [currentLesson]);

  // Derive canonical CircuitIR
  const circuitIR: CircuitIR = useMemo(() => {
    const irGates: GateIR[] = [];
    const sorted = [...gates].sort((a, b) => a.step - b.step);

    for (const g of sorted) {
      irGates.push({
        name: g.gate.toUpperCase(),
        qubits: [g.qubit],
        params: g.params,
      });
    }

    return {
      num_qubits: currentLesson.numQubits || 1,
      gates: irGates,
    };
  }, [gates, currentLesson.numQubits]);

  // Gate Palette Handlers
  const handlePlaceGate = (qubitIdx: number, stepIdx: number) => {
    if (!selectedGate) return;
    const gateName = selectedGate.toLowerCase();

    const filtered = gates.filter((g) => !(g.qubit === qubitIdx && g.step === stepIdx));
    const newGates: PlacedGate[] = [...filtered];

    if (gateName === 'cx' || gateName === 'cnot') {
      newGates.push({
        id: `gate-${Date.now()}`,
        gate: 'cx',
        qubit: 0,
        step: stepIdx,
      });
    } else if (gateName === 'cz') {
      newGates.push({
        id: `gate-${Date.now()}`,
        gate: 'cz',
        qubit: 0,
        step: stepIdx,
      });
    } else {
      newGates.push({
        id: `gate-${Date.now()}`,
        gate: gateName,
        qubit: qubitIdx,
        step: stepIdx,
      });
    }

    setGates(newGates);
    setSelectedGate(null);
    setSimulationResult(null);

    const totalQubits = currentLesson.numQubits || 1;
    const nextIR: CircuitIR = {
      num_qubits: totalQubits,
      gates: newGates.map((g) => ({
        name: g.gate,
        qubits: g.gate === 'cx' || g.gate === 'cz' ? [0, 1] : [g.qubit],
      })),
    };
    setQasmCode(ir_to_qasm(nextIR));
  };

  const handleRemoveGate = (qubitIdx: number, stepIdx: number) => {
    const newGates = gates.filter((g) => !(g.qubit === qubitIdx && g.step === stepIdx));
    setGates(newGates);
    setSimulationResult(null);

    const totalQubits = currentLesson.numQubits || 1;
    const nextIR: CircuitIR = {
      num_qubits: totalQubits,
      gates: newGates.map((g) => ({
        name: g.gate,
        qubits: g.gate === 'cx' || g.gate === 'cz' ? [0, 1] : [g.qubit],
      })),
    };
    setQasmCode(ir_to_qasm(nextIR));
  };

  const handleClearCircuit = () => {
    setGates([]);
    setSimulationResult(null);
    setQasmCode(ir_to_qasm({ num_qubits: currentLesson.numQubits || 1, gates: [] }));
  };

  // Run Simulation
  const handleRunCircuit = async () => {
    setIsSimulating(true);
    setIsLaserPulsing(true);
    setTimeout(() => setIsLaserPulsing(false), 900);
    try {
      const res = await fetch(`${BACKEND_URL}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          circuit: circuitIR,
          shots: 1024,
          include_statevector: true,
          backend: 'qiskit_aer',
        }),
      });

      if (res.ok) {
        const data: ExecutionResponse = await res.json();
        setSimulationResult(data);
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Submit Solution Verification
  const handleSubmitSolution = async () => {
    setIsSimulating(true);
    setIsLaserPulsing(true);
    setTimeout(() => setIsLaserPulsing(false), 900);
    setFeedbackText(null);

    let currentExec = simulationResult;
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
        setSimulationResult(currentExec);
      }
    } catch (e) {
      console.error('Submission execution failed:', e);
    }

    const expected = currentLesson.challenge?.expectedProbabilities || { '0': 0.5, '1': 0.5 };
    const actualProbs = currentExec?.probabilities || {};

    let matches = true;
    for (const [key, expVal] of Object.entries(expected)) {
      const actVal = actualProbs[key] || 0;
      if (Math.abs(actVal - expVal) > 0.15) {
        matches = false;
        break;
      }
    }

    setIsSubmitted(true);
    if (matches) {
      setSubmissionSuccess(true);
      setFeedbackText('Congratulations! Your quantum circuit matched the target statevector.');
      currentLesson.completed = true;

      // Fetch dynamic Gemini explanation of why it worked
      try {
        const aiRes = await fetch(`${BACKEND_URL}/tutor/explain`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            circuit: circuitIR,
            question: `In Lesson 1, the student placed ${circuitIR.gates.map((g) => g.name.toUpperCase()).join(' ')} on wire q[0] and created the superposition state (|0⟩+|1⟩)/√2 with 50% P(0) and 50% P(1). Explain concisely in 2-3 sentences why this Hadamard rotation works on the Bloch sphere.`,
          }),
        });
        if (aiRes.ok) {
          const data = await aiRes.json();
          setAiExplanationText(data.explanation);
        }
      } catch (e) {
        setAiExplanationText('The Hadamard gate transforms |0⟩ into an equal superposition of |0⟩ and |1⟩. Measuring the resulting state produces each outcome with approximately 50% probability.');
      }

      // Log event to backend analytics
      try {
        fetch(`${BACKEND_URL}/dashboard/log-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'lesson_completed',
            metadata: {
              course_id: course.id,
              lesson_id: currentLesson.id,
              topic: course.title,
            },
            xp: currentLesson.challenge?.xpReward || 120,
          }),
        }).catch(() => {});
      } catch (e) {}
      if (onLessonCompleted) {
        onLessonCompleted(currentLesson.id, currentLesson.challenge?.xpReward || 100);
      }
    } else {
      setSubmissionSuccess(false);
      setFeedbackText('Your circuit does not yet create the target state. Check the mission requirements above.');
    }
    setIsSimulating(false);
  };

  const handleSendAiQuestion = async (customQ?: string) => {
    const qText = customQ || aiChatQuestion;
    if (!qText.trim() || isAiLoading) return;

    setAiChatMessages((prev) => [...prev, { role: 'user', text: qText.trim() }]);
    setAiChatQuestion('');
    setIsAiLoading(true);
    setShowAiModal(true);

    try {
      const res = await fetch(`${BACKEND_URL}/tutor/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          circuit: circuitIR,
          question: `In Lesson "${currentLesson.title}", ${qText.trim()}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiChatMessages((prev) => [...prev, { role: 'ai', text: data.explanation }]);
      } else {
        setAiChatMessages((prev) => [
          ...prev,
          { role: 'ai', text: 'The Hadamard gate maps the North pole of the Bloch sphere (|0⟩) to the positive X-axis equator (|+⟩).' },
        ]);
      }
    } catch (e) {
      setAiChatMessages((prev) => [
        ...prev,
        { role: 'ai', text: 'Unitary quantum gates rotate state vectors continuously along the surface of the Bloch sphere.' },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const gateAtStep = (stepIdx: number) => gates.find((g) => g.step === stepIdx);

  const currentLessonIndex = course.lessons.findIndex((l) => l.id === currentLesson.id);
  const prevLesson = currentLessonIndex > 0 ? course.lessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < course.lessons.length - 1 ? course.lessons[currentLessonIndex + 1] : null;

  return (
    <div className="fixed inset-0 z-50 bg-[#fdfcf9] w-screen h-screen flex flex-col select-none font-sans overflow-hidden text-[#211f1b]">

      {/* 1. TOP MINIMALIST HEADER BAR */}

      <header className="px-6 py-3 bg-[#fdfcf9] border-b border-[#eee8dd] flex items-center justify-between shrink-0 h-14">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBackToCourse}
            className="flex items-center gap-1 text-xs font-semibold text-[#746e64] hover:text-[#211f1b] transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Courses</span>
          </button>
          <span>/</span>
          <span className="text-xs font-mono font-bold text-[#746e64] uppercase tracking-wider truncate">
            {course.code} · {course.title}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 bg-[#edf7ed] px-3 py-1 rounded-full text-xs font-bold text-[#1e4620]">
            <Trophy className="w-3.5 h-3.5 text-[#1e4620]" />
            <span>+{currentLesson.challenge?.xpReward || 100} XP</span>
          </div>

          <button
            onClick={onBackToCourse}
            className="p-1.5 rounded-lg text-[#8c8275] hover:text-[#211f1b] hover:bg-[#f0eae0] transition-colors cursor-pointer"
            title="Exit Workspace"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. DUAL-PANE WORKSPACE: LEFT NAV BAR + RIGHT OPEN PROSE */}

      <div className="flex-1 min-h-0 flex overflow-hidden">
        
        {/* ----------------- Clean Left Sidebar: Lesson Switcher ----------------- */}
        <aside className="w-64 sm:w-72 bg-[#fbf9f4] border-r border-[#eee8dd] flex flex-col shrink-0 overflow-y-auto hidden md:flex">
          <div className="p-4 flex items-center justify-between text-xs font-bold text-[#8c8275] uppercase tracking-wider border-b border-[#eee8dd]">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#c96b2c]" />
              <span>Lessons Navigation</span>
            </span>
            <span className="font-mono text-[#c96b2c]">
              {currentLesson.number}/{course.lessons.length}
            </span>
          </div>

          <nav className="p-2.5 flex flex-col gap-1">
            {course.lessons.map((l) => {
              const isActive = currentLesson.id === l.id;
              const isDone = l.completed;

              return (
                <button
                  key={l.id}
                  onClick={() => setCurrentLesson(l)}
                  className={`w-full px-3.5 py-3 rounded-xl text-left text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-[#fff5eb] text-[#c96b2c] font-bold shadow-2xs'
                      : 'hover:bg-[#f3ede1] text-[#6b6357]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-[#137333] shrink-0" />
                    ) : (
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 ${
                          isActive ? 'bg-[#c96b2c] text-white font-bold' : 'text-[#a39a8e]'
                        }`}
                      >
                        {l.number}
                      </span>
                    )}
                    <div className="flex flex-col truncate">
                      <span className="truncate">{l.title}</span>
                      <span className="text-[10px] text-[#8c8275] font-normal">{l.duration}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ----------------- Clean Main Content (Open Editorial Flow) ----------------- */}
        <main className="flex-1 min-h-0 overflow-y-auto bg-[#fdfcf9] px-6 py-8 sm:px-12 sm:py-10 lg:px-16 lg:py-12">
          
          <div className="max-w-3xl mx-auto flex flex-col gap-8">

            {/* Lesson Title & Subtitle */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono font-bold text-[#c96b2c] uppercase tracking-wider">
                  Lesson {currentLesson.number} of {course.lessons.length} · {currentLesson.level}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1d1a16] tracking-tight">
                {currentLesson.title}
              </h2>
              {currentLesson.subtitle && (
                <p className="text-xs sm:text-sm text-[#746e64] mt-1">{currentLesson.subtitle}</p>
              )}
            </div>

            {/* 1. CLEAN THEORY SECTION (Zero Heavy Outer Borders)                        */}

            <div className="flex flex-col gap-5 text-base sm:text-lg text-[#332f2a] leading-relaxed">
              <h3 className="text-lg sm:text-xl font-extrabold text-[#1d1a16] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#c96b2c]" />
                <span>{currentLesson.conceptHeading || currentLesson.title}</span>
              </h3>

              {currentLesson.conceptBody && currentLesson.conceptBody.length > 0 ? (
                currentLesson.conceptBody.map((paragraph, pIdx) => {
                  const isMultiLineFormula =
                    paragraph.includes('\n') &&
                    (paragraph.includes(' = ') ||
                     paragraph.includes('⊗') ||
                     paragraph.includes('[') ||
                     paragraph.includes('diag(') ||
                     paragraph.startsWith('|') ||
                     paragraph.includes('➔'));

                  const isSingleFormula =
                    !paragraph.includes('\n') &&
                    (paragraph.startsWith('H =') ||
                     paragraph.startsWith('X =') ||
                     paragraph.startsWith('Y =') ||
                     paragraph.startsWith('Z =') ||
                     paragraph.startsWith('S =') ||
                     paragraph.startsWith('T =') ||
                     paragraph.startsWith('CZ =') ||
                     paragraph.startsWith('CNOT =') ||
                     paragraph.startsWith('D =') ||
                     paragraph.startsWith('|ψ⟩') ||
                     paragraph.startsWith('P(') ||
                     (paragraph.includes(' = ') && paragraph.length < 80));

                  if (isMultiLineFormula) {
                    const lines = paragraph.split('\n').map((l) => l.trim()).filter(Boolean);
                    return (
                      <div
                        key={pIdx}
                        className="my-2.5 p-4 bg-[#fbf9f4] border border-[#e8e2d8] rounded-xl shadow-2xs flex flex-col gap-2 divide-y divide-[#eee8dd]"
                      >
                        {lines.map((line, lIdx) => (
                          <div
                            key={lIdx}
                            className={`font-mono text-center text-[#c96b2c] font-bold text-xs sm:text-sm ${lIdx > 0 ? 'pt-2' : ''}`}
                          >
                            {line}
                          </div>
                        ))}
                      </div>
                    );
                  }

                  if (isSingleFormula) {
                    return (
                      <div
                        key={pIdx}
                        className="my-1.5 p-3.5 bg-[#fbf9f4] border border-[#e8e2d8] rounded-xl font-mono text-center text-[#c96b2c] font-bold text-sm sm:text-base shadow-2xs whitespace-pre-wrap"
                      >
                        {paragraph}
                      </div>
                    );
                  }

                  return (
                    <p key={pIdx} className="leading-relaxed whitespace-pre-line">
                      {paragraph}
                    </p>
                  );
                })
              ) : (
                <p>{currentLesson.subtitle || 'Explore this quantum computing foundational concept.'}</p>
              )}

              {/* Educational Illustration Diagram */}
              {currentLesson.illustrationUrl && (
                <div className="my-3 overflow-hidden rounded-2xl border border-[#e8e2d8] bg-[#fbf9f4] shadow-2xs">
                  <div className="relative w-full aspect-video max-h-80 bg-[#1d1a16] flex items-center justify-center overflow-hidden">
                    <img
                      src={currentLesson.illustrationUrl}
                      alt={currentLesson.illustrationCaption || currentLesson.title}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  {currentLesson.illustrationCaption && (
                    <div className="p-3.5 bg-[#faf7f0] border-t border-[#ede7dc] flex items-start gap-2.5 text-xs text-[#635c51]">
                      <Layers className="w-4 h-4 text-[#c96b2c] flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed font-medium">{currentLesson.illustrationCaption}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Clean Left-Border Comparison */}
              {currentLesson.calloutComparison && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div className="border-l-4 border-[#746e64] pl-4 py-1 text-sm text-[#38342e]">
                    <span className="text-xs font-bold text-[#746e64] uppercase tracking-wider block">
                      {currentLesson.calloutComparison.leftTitle}
                    </span>
                    <p className="whitespace-pre-line leading-relaxed mt-0.5">
                      {currentLesson.calloutComparison.leftContent}
                    </p>
                  </div>

                  <div className="border-l-4 border-[#c96b2c] pl-4 py-1 text-sm text-[#38342e]">
                    <span className="text-xs font-bold text-[#c96b2c] uppercase tracking-wider block">
                      {currentLesson.calloutComparison.rightTitle}
                    </span>
                    <p className="whitespace-pre-line leading-relaxed mt-0.5">
                      {currentLesson.calloutComparison.rightContent}
                    </p>
                  </div>
                </div>
              )}

              {/* ENRICHMENT: Key Insight / Real-World Application / Historical Note        */}

              {currentLesson.keyInsight && (
                <div className="mt-4 relative overflow-hidden rounded-xl bg-gradient-to-br from-[#fef9e7] to-[#fdf4d9] p-4 sm:p-5">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#f59e0b] to-[#d97706]" />
                  <div className="flex items-start gap-3 pl-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] flex items-center justify-center shadow-sm">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#92400e] mb-1">Key Insight</h4>
                      <p className="text-sm text-[#78350f] leading-relaxed font-medium">{currentLesson.keyInsight}</p>
                    </div>
                  </div>
                </div>
              )}

              {currentLesson.realWorldApplication && (
                <div className="mt-3 relative overflow-hidden rounded-xl bg-gradient-to-br from-[#ecfdf5] to-[#d1fae5] p-4 sm:p-5">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#10b981] to-[#059669]" />
                  <div className="flex items-start gap-3 pl-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-[#34d399] to-[#10b981] flex items-center justify-center shadow-sm">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#065f46] mb-1">Real-World Application</h4>
                      <p className="text-sm text-[#064e3b] leading-relaxed">{currentLesson.realWorldApplication}</p>
                    </div>
                  </div>
                </div>
              )}

              {currentLesson.historicalNote && (
                <div className="mt-3 relative overflow-hidden rounded-xl bg-gradient-to-br from-[#f0f4ff] to-[#e0e7ff] p-4 sm:p-5">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#6366f1] to-[#4f46e5]" />
                  <div className="flex items-start gap-3 pl-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-[#818cf8] to-[#6366f1] flex items-center justify-center shadow-sm">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#3730a3] mb-1">Historical Note</h4>
                      <p className="text-sm text-[#312e81] leading-relaxed italic">{currentLesson.historicalNote}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Gradient Divider                                                           */}

              <div className="h-px bg-gradient-to-r from-transparent via-[#d8d2c6] to-transparent my-2" />

              {/* Beginner Born Rule & Wave Insight Callouts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="border-l-4 border-[#0f62fe] pl-4 py-1 text-xs text-[#002d9c] leading-relaxed">
                  <strong className="font-bold flex items-center gap-1 text-[#0f62fe] mb-0.5">
                    <Sparkles className="w-3.5 h-3.5" /> Why Amplitude Squared (Born Rule)?
                  </strong>
                  <span>
                    Quantum statevectors store amplitudes ($1/\sqrt{'{2}'}$), not probabilities directly. Probability equals amplitude squared: $|1/\sqrt{'{2}'}|^2 = 50\%$.
                  </span>
                </div>

                <div className="border-l-4 border-[#137333] pl-4 py-1 text-xs text-[#1e4620] leading-relaxed">
                  <strong className="font-bold flex items-center gap-1 text-[#137333] mb-0.5">
                    <HelpCircle className="w-3.5 h-3.5" /> Wave Interference Principle
                  </strong>
                  <span>
                    In-phase quantum waves add constructively (+100%), while out-of-phase waves cancel each other out destructively to 0%.
                  </span>
                </div>
              </div>
            </div>

            {/* 2. INTERACTIVE BLOCH SPHERE (Contextual 1-Qubit)                          */}

            {currentLesson.numQubits === 1 && (
              <InteractiveBlochSphere compact={false} />
            )}

            {/* 2.5 INLINE PREDICTION CHECKPOINT (Active Learning)                        */}

            {currentLesson.predictionCheckpoint && (
              <div className="rounded-2xl bg-white border border-[#fed7aa] p-5 sm:p-6 shadow-2xs flex flex-col gap-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-[#fff4e6] pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#d97706]" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#b45309]">
                      Concept Checkpoint · Predict the Outcome
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
                    +25 Bonus XP
                  </span>
                </div>

                <p className="text-sm font-bold text-[#1c1917] leading-snug">
                  {currentLesson.predictionCheckpoint.question}
                </p>

                {/* Multiple Choice Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentLesson.predictionCheckpoint.options.map((opt, optIdx) => {
                    const isSelected = selectedPredictionOption === optIdx;
                    const isCorrect = optIdx === currentLesson.predictionCheckpoint?.correctIndex;

                    return (
                      <button
                        key={optIdx}
                        disabled={isPredictionSubmitted}
                        onClick={() => setSelectedPredictionOption(optIdx)}
                        className={`p-3 rounded-xl border text-xs text-left font-medium transition-all cursor-pointer ${
                          isPredictionSubmitted
                            ? isCorrect
                              ? 'bg-[#ecfdf5] border-[#10b981] text-[#065f46] ring-1 ring-[#10b981]'
                              : isSelected
                              ? 'bg-[#fef2f2] border-[#ef4444] text-[#991b1b]'
                              : 'bg-[#faf8f5] border-[#e7e5e4] text-[#78716c] opacity-60'
                            : isSelected
                            ? 'bg-[#fffbeb] border-[#d97706] text-[#78350f] ring-1 ring-[#d97706]'
                            : 'bg-[#faf8f5] border-[#e7e5e4] hover:border-[#d97706]/60 hover:bg-white text-[#1c1917]'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="font-mono font-bold text-[#78716c] shrink-0">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          <span className="leading-relaxed">{opt}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Submit / Feedback Button & Explanation */}
                <div className="flex flex-col gap-2 pt-1">
                  {!isPredictionSubmitted ? (
                    <button
                      disabled={selectedPredictionOption === null}
                      onClick={() => setIsPredictionSubmitted(true)}
                      className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedPredictionOption !== null
                          ? 'bg-[#1c1917] hover:bg-[#292524] text-white shadow-2xs'
                          : 'bg-[#e7e5e4] text-[#a8a29e] cursor-not-allowed'
                      }`}
                    >
                      Check Prediction
                    </button>
                  ) : (
                    <div
                      className={`p-3.5 rounded-xl text-xs leading-relaxed animate-fadeIn ${
                        selectedPredictionOption === currentLesson.predictionCheckpoint.correctIndex
                          ? 'bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46]'
                          : 'bg-[#fffbeb] border border-[#fde68a] text-[#78350f]'
                      }`}
                    >
                      <strong className="font-bold block mb-0.5">
                        {selectedPredictionOption === currentLesson.predictionCheckpoint.correctIndex
                          ? '🎉 Spot on! Great quantum intuition!'
                          : '💡 Good thought! Here is the physical principle:'}
                      </strong>
                      <span>{currentLesson.predictionCheckpoint.explanation}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. YOUR TURN: INTERACTIVE CIRCUIT WORKSPACE                              */}

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[#eee8dd] pb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#c96b2c]" />
                  <h3 className="text-base font-extrabold text-[#1d1a16] uppercase tracking-wider">
                    Interactive Challenge
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-[#c96b2c]">
                  Target: {currentLesson.challenge?.mathTarget || '|ψ⟩ target'}
                </span>
              </div>

              <div className="flex flex-col gap-1 text-sm text-[#38342e]">
                <strong className="font-bold">{currentLesson.challenge?.title}</strong>
                <p className="text-[#6b6357] text-xs sm:text-sm leading-relaxed">
                  {currentLesson.challenge?.targetDescription}
                </p>
              </div>

              {/* Seamless Circuit Canvas */}
              <div className="bg-[#f7f4ee]/80 rounded-2xl p-6 sm:p-8 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#8c8275]">Gate Palette:</span>
                    {['H', 'X', 'Y', 'Z', 'S', 'T'].map((g) => {
                      const style = GATE_STYLES[g.toLowerCase()] || GATE_STYLES.h;
                      const isSelected = selectedGate === g;

                      return (
                        <button
                          key={g}
                          onClick={() => setSelectedGate(isSelected ? null : g)}
                          className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'ring-2 ring-[#c96b2c] scale-110 ' + style.bg + ' ' + style.text
                              : style.bg + ' ' + style.text + ' hover:scale-105'
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleClearCircuit}
                    className="p-2 rounded-lg bg-white text-[#8c8275] cursor-pointer hover:bg-[#eee8dd]"
                    title="Clear wire"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Circuit Wires (1 or 2 Qubits) */}
                <div className="py-4 px-3 flex flex-col gap-4 bg-white rounded-xl shadow-2xs relative overflow-hidden">
                  {/* Laser Beam Pulse Animation */}
                  {isLaserPulsing && (
                    <div className="absolute inset-0 pointer-events-none z-20 flex items-center overflow-hidden">
                      <div className="h-full w-32 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent animate-pulse" />
                    </div>
                  )}

                  {/* Wire 0 */}
                  <div className="flex items-center gap-3 relative min-h-[48px]">
                    <span className="font-mono font-bold text-xs text-[#211f1b] shrink-0 w-16">
                      q[0]: |0⟩ ──
                    </span>
                    <div className="flex-1 h-[2px] bg-[#c8c1b4] relative flex items-center justify-around px-4">
                      {[0, 1, 2, 3].map((slotIdx) => {
                        const placed = gates.find((g) => g.qubit === 0 && g.step === slotIdx);
                        const isCxControl = placed?.gate === 'cx';
                        const isCz = placed?.gate === 'cz';
                        const style = placed ? GATE_STYLES[placed.gate] || GATE_STYLES.h : null;

                        return (
                          <div
                            key={slotIdx}
                            onClick={() => {
                              if (placed) handleRemoveGate(0, slotIdx);
                              else handlePlaceGate(0, slotIdx);
                            }}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs transition-all cursor-pointer z-10 ${
                              isCxControl
                                ? 'bg-[#6929c4] text-white rounded-full shadow-xs'
                                : isCz
                                ? 'bg-[#1192e8] text-white rounded-full shadow-xs'
                                : placed
                                ? style?.bg + ' ' + style?.text
                                : selectedGate
                                ? 'bg-[#fff5eb] border border-[#fed7aa] hover:scale-105'
                                : 'bg-[#f7f4ee] hover:bg-[#eee8dd]'
                            }`}
                            title={placed ? 'Click to remove gate' : 'Click to place selected gate on q[0]'}
                          >
                            {isCxControl ? '●' : isCz ? '●' : placed ? style?.label || placed.gate.toUpperCase() : '+'}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Wire 1 (Multi-Qubit Lessons) */}
                  {(currentLesson.numQubits || 1) >= 2 && (
                    <div className="flex items-center gap-3 relative min-h-[48px] border-t border-[#f0ece4] pt-3">
                      <span className="font-mono font-bold text-xs text-[#211f1b] shrink-0 w-16">
                        q[1]: |0⟩ ──
                      </span>
                      <div className="flex-1 h-[2px] bg-[#c8c1b4] relative flex items-center justify-around px-4">
                        {[0, 1, 2, 3].map((slotIdx) => {
                          const placedControl = gates.find((g) => g.qubit === 0 && g.step === slotIdx);
                          const isCxTarget = placedControl?.gate === 'cx';
                          const isCzTarget = placedControl?.gate === 'cz';
                          const placedLocal = gates.find((g) => g.qubit === 1 && g.step === slotIdx);
                          const style = placedLocal ? GATE_STYLES[placedLocal.gate] || GATE_STYLES.h : null;

                          return (
                            <div
                              key={slotIdx}
                              onClick={() => {
                                if (isCxTarget || isCzTarget) handleRemoveGate(0, slotIdx);
                                else if (placedLocal) handleRemoveGate(1, slotIdx);
                                else handlePlaceGate(1, slotIdx);
                              }}
                              className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs transition-all cursor-pointer z-10 ${
                                isCxTarget
                                  ? 'bg-[#6929c4] text-white rounded-full text-base font-extrabold ring-2 ring-[#6929c4]/40 shadow-xs'
                                  : isCzTarget
                                  ? 'bg-[#1192e8] text-white rounded-full text-base font-extrabold ring-2 ring-[#1192e8]/40 shadow-xs'
                                  : placedLocal
                                  ? style?.bg + ' ' + style?.text
                                  : selectedGate
                                  ? 'bg-[#fff5eb] border border-[#fed7aa] hover:scale-105'
                                  : 'bg-[#f7f4ee] hover:bg-[#eee8dd]'
                              }`}
                              title={isCxTarget ? 'Target of CNOT on q[0]' : placedLocal ? 'Click to remove gate' : 'Click to place selected gate on q[1]'}
                            >
                              {isCxTarget ? '⊕' : isCzTarget ? '●' : placedLocal ? style?.label || placedLocal.gate.toUpperCase() : '+'}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Live Statevector Evolution Inspector */}
                <div className="bg-white rounded-xl p-3 flex flex-col gap-1 text-xs shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#746e64] uppercase text-[10px] tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#c96b2c]" /> Live State Evolution:
                    </span>
                    <button
                      onClick={() => setShowMatrixMath(!showMatrixMath)}
                      className="text-[10px] font-bold text-[#c96b2c] hover:underline cursor-pointer"
                    >
                      {showMatrixMath ? 'Hide Matrix Math' : '🧮 Show Matrix Math'}
                    </button>
                  </div>
                  <div className="font-mono text-xs font-bold text-[#211f1b] break-all">
                    {computeStateEvolution(gates).stepFormula}
                  </div>
                  {showMatrixMath && computeStateEvolution(gates).matrixMath && (
                    <div className="mt-1 p-2 rounded bg-[#f7f4ee] font-mono text-[11px] text-[#0f62fe] animate-fadeIn">
                      <strong>Matrix Multiplication:</strong> {computeStateEvolution(gates).matrixMath}
                    </div>
                  )}
                </div>

                {/* Run & Verify Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleRunCircuit}
                    disabled={isSimulating}
                    className="flex-1 py-3 rounded-xl bg-white hover:bg-[#f3ede1] text-[#211f1b] font-bold text-xs cursor-pointer border border-[#d8d2c6] shadow-2xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>▶ Run Simulation</span>
                  </button>
                  <button
                    onClick={handleSubmitSolution}
                    disabled={isSimulating}
                    className="flex-1 py-3 rounded-xl bg-[#c96b2c] hover:bg-[#b55e24] text-white font-bold text-xs cursor-pointer shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>✓ Submit Solution</span>
                  </button>
                </div>

                {/* Simulation Result with Phase Dials */}
                {simulationResult && simulationResult.probabilities && (
                  <div className="p-4 rounded-xl bg-white flex flex-col gap-3 font-mono text-xs sm:text-sm font-bold shadow-2xs animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#746e64] font-sans font-bold uppercase">Measurement Probabilities & Phase Dials:</span>
                      <span className={submissionSuccess ? 'text-[#137333]' : 'text-[#c96b2c]'}>
                        {submissionSuccess ? '✓ Validated (+XP)' : 'Run Completed'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Object.entries(simulationResult.probabilities).map(([st, p]) => {
                        const hasNegativePhase = st.includes('1') && !st.includes('0') && gates.some(g => g.gate === 'z');
                        return (
                          <div key={st} className="p-2.5 rounded-lg bg-[#faf8f5] border border-[#eee8dd] flex items-center justify-between gap-2">
                            <div className="flex flex-col">
                              <span className="text-[#0f62fe] font-bold">|{st}⟩</span>
                              <span className="text-xs text-[#1c1917]">{(p * 100).toFixed(1)}%</span>
                            </div>
                            {/* Mini Phase Clock Dial */}
                            <div className="w-6 h-6 rounded-full border border-[#d8d2c6] bg-white flex items-center justify-center relative shadow-2xs" title={`Basis state |${st}⟩ phase angle`}>
                              <div
                                className="w-2.5 h-[1.5px] bg-[#d97706] origin-left rounded-full transition-transform duration-300"
                                style={{
                                  transform: `rotate(${hasNegativePhase ? 180 : 0}deg)`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {feedbackText && (
                  <div className={`p-4 rounded-xl text-xs sm:text-sm font-semibold animate-fadeIn ${submissionSuccess ? 'bg-[#edf7ed] text-[#1e4620]' : 'bg-[#fff5eb] text-[#c96b2c]'}`}>
                    {feedbackText}
                  </div>
                )}
              </div>
            </div>

          </div>

        </main>

      </div>

      {/* 4. BOTTOM LESSON SEQUENCER FOOTER */}

      <footer className="px-8 py-3 bg-[#fdfcf9] border-t border-[#eee8dd] flex items-center justify-between shrink-0 h-14">
        <button
          onClick={() => prevLesson && setCurrentLesson(prevLesson)}
          disabled={!prevLesson}
          className="flex items-center gap-1 px-4 py-2 rounded-xl text-[#6b6357] hover:text-[#1d1a16] hover:bg-[#f0eae0] disabled:opacity-25 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous: {prevLesson?.number ? `Lesson ${prevLesson.number}` : 'Start'}</span>
        </button>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline font-mono text-xs text-[#8c8275]">
            Topic {currentLesson.number} of {course.lessons.length}
          </span>

          <button
            onClick={() => {
              if (onLessonCompleted) {
                onLessonCompleted(currentLesson.id, currentLesson.challenge?.xpReward || 100);
              }
              if (nextLesson) {
                setCurrentLesson(nextLesson);
              } else {
                onBackToCourse();
              }
            }}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer bg-[#c96b2c] hover:bg-[#b55e24] text-white hover:scale-102 active:scale-98"
          >
            <span>{nextLesson ? `Next: Lesson ${nextLesson.number}` : 'Finish Course ✓'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
};
