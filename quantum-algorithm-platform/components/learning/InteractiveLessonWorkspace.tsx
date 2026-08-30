'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Play,
  Zap,
  Bot,
  Lightbulb,
  BookOpen,
  Code2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Send,
  Clock,
  Trash2,
  Trophy,
  X,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { Course, Lesson } from './types';
import type { CircuitIR, GateIR, PlacedGate, ExecutionResponse } from '@/types/quantum';
import { BACKEND_URL } from '@/config';
import { ir_to_qasm, qasm_to_ir } from '@/utils/qasm';

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
};

// -----------------------------------------------------------------------------
// Interactive 2D/3D Bloch Sphere Component
// -----------------------------------------------------------------------------
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
    // x = sin(theta)*cos(phi), y = sin(theta)*sin(phi), z = cos(theta)
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
    <div className="flex flex-col items-center justify-center p-2 bg-[#fdfbf7] border border-[#e4ded4] rounded-2xl">
      <canvas ref={canvasRef} width={240} height={240} className="w-48 h-48 sm:w-56 sm:h-56" />
      <span className="text-xs font-mono font-bold text-[#c96b2c] mt-1">{label}</span>
    </div>
  );
}

export const InteractiveLessonWorkspace: React.FC<InteractiveLessonWorkspaceProps> = ({
  course,
  lesson,
  onBackToCourse,
  onNextLesson,
  onOpenSimulator,
  onLessonCompleted,
}) => {
  // 1. Canonical Circuit State
  const [numQubits] = useState<number>(lesson.numQubits || 1);
  const [gates, setGates] = useState<PlacedGate[]>([]);
  const [selectedGate, setSelectedGate] = useState<string | null>(null);

  // 2. OpenQASM 3.0 Code State
  const [qasmCode, setQasmCode] = useState<string>(lesson.starterQasm);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // 3. Interactive Bloch Section State
  const [blochTheta, setBlochTheta] = useState<number>(0);
  const [blochPhi, setBlochPhi] = useState<number>(0);
  const [blochLabel, setBlochLabel] = useState<string>('|0⟩ (Ground State)');
  const [blochProbs, setBlochProbs] = useState<{ p0: number; p1: number }>({ p0: 100, p1: 0 });

  // 4. Challenge Simulation & Verification State
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<ExecutionResponse | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(lesson.completed);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(lesson.completed);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [aiExplanationText, setAiExplanationText] = useState<string | null>(null);

  // 5. AI Mentor Chat Modal
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiChatQuestion, setAiChatQuestion] = useState<string>('');
  const [aiChatMessages, setAiChatMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([]);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Initialize from lesson starter gates
  useEffect(() => {
    setIsSubmitted(lesson.completed);
    setSubmissionSuccess(lesson.completed);
    setFeedbackText(null);
    setAiExplanationText(null);
    setSimulationResult(null);

    // Initial Bloch state
    setBlochTheta(0);
    setBlochPhi(0);
    setBlochLabel('|0⟩ (Ground State)');
    setBlochProbs({ p0: 100, p1: 0 });

    if (lesson.starterCircuitGates && lesson.starterCircuitGates.length > 0) {
      const placed: PlacedGate[] = lesson.starterCircuitGates.map((g, idx) => ({
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
      setQasmCode(lesson.starterQasm);
    }
  }, [lesson]);

  // Derive canonical CircuitIR
  const circuitIR: CircuitIR = useMemo(() => {
    const irGates: GateIR[] = [];
    const sorted = [...gates].sort((a, b) => a.step - b.step);

    for (const g of sorted) {
      irGates.push({
        name: g.gate.toLowerCase(),
        qubits: [g.qubit],
        params: g.params,
      });
    }

    return {
      num_qubits: numQubits,
      gates: irGates,
    };
  }, [gates, numQubits]);

  // Gate placement on circuit wire
  const handlePlaceGate = (stepIdx: number) => {
    if (!selectedGate) return;
    const gateName = selectedGate.toLowerCase();

    const newGates = gates.filter((g) => g.step !== stepIdx);
    newGates.push({
      id: `gate-${Date.now()}`,
      gate: gateName,
      qubit: 0,
      step: stepIdx,
    });

    setGates(newGates);
    setSelectedGate(null);
    setSimulationResult(null);

    // Sync OpenQASM
    const nextIR: CircuitIR = {
      num_qubits: 1,
      gates: newGates.map((g) => ({ name: g.gate, qubits: [0] })),
    };
    setQasmCode(ir_to_qasm(nextIR));
  };

  const handleRemoveGate = (stepIdx: number) => {
    const newGates = gates.filter((g) => g.step !== stepIdx);
    setGates(newGates);
    setSimulationResult(null);

    const nextIR: CircuitIR = {
      num_qubits: 1,
      gates: newGates.map((g) => ({ name: g.gate, qubits: [0] })),
    };
    setQasmCode(ir_to_qasm(nextIR));
  };

  const handleClearCircuit = () => {
    setGates([]);
    setSimulationResult(null);
    setQasmCode(ir_to_qasm({ num_qubits: 1, gates: [] }));
  };

  // Run Simulation
  const handleRunCircuit = async () => {
    setIsSimulating(true);
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
    setFeedbackText(null);

    // 1. Run simulation to get verified results
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
    } catch (e) {}

    // 2. Validate against expected outcome
    const probs = currentExec?.probabilities || {};
    const hasH = circuitIR.gates.some((g) => g.name.toLowerCase() === 'h');
    const p0 = probs['0'] || probs['00'] || 0;
    const p1 = probs['1'] || probs['01'] || 0;

    const isMatch = hasH && Math.abs(p0 - 0.5) <= 0.15 && Math.abs(p1 - 0.5) <= 0.15;

    setIsSubmitted(true);
    if (isMatch) {
      setSubmissionSuccess(true);
      setFeedbackText('You successfully created the equal superposition state.');

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
              lesson_id: lesson.id,
              topic: course.title,
            },
            xp: lesson.challenge.xpReward || 120,
          }),
        }).catch(() => {});
      } catch (e) {}

      if (onLessonCompleted) {
        onLessonCompleted(lesson.id, lesson.challenge.xpReward);
      }
    } else {
      setSubmissionSuccess(false);
      setFeedbackText('Your circuit does not yet create an equal superposition. Place an H (Hadamard) gate on wire q[0].');
    }
    setIsSimulating(false);
  };

  // AI Socratic Question
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
          question: `In Lesson "${lesson.title}", ${qText.trim()}`,
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

  // Find placed gate on timeline slots
  const gateAtStep = (stepIdx: number) => gates.find((g) => g.step === stepIdx);

  return (
    <div className="w-full min-h-screen bg-[#faf8f5] text-[#211f1b] font-sans p-4 sm:p-8 flex flex-col items-center selection:bg-[#c96b2c] selection:text-white pb-20 animate-fadeIn">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        {/* ===================================================================== */}
        {/* 1. LESSON PAGE HEADER                                                 */}
        {/* ===================================================================== */}
        <header className="flex flex-col gap-3">
          {/* Top Breadcrumb & XP Reward */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#746e64] truncate">
              <button
                onClick={onBackToCourse}
                className="hover:text-[#211f1b] transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Courses</span>
              </button>
              <span>/</span>
              <span className="text-[#746e64] truncate">{course.title}</span>
              <span>/</span>
              <strong className="text-[#211f1b] truncate">Lesson {lesson.number}</strong>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#287854] bg-[#eef8f2] px-3 py-1 rounded-full border border-[#bad8cb]">
                +{lesson.challenge.xpReward} XP Reward
              </span>
            </div>
          </div>

          {/* Title & Metadata */}
          <div className="flex flex-col gap-1 pt-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#c96b2c]/15 text-[#c96b2c] uppercase tracking-wider">
                INTERACTIVE LESSON
              </span>
              <span className="text-xs font-mono text-[#746e64] flex items-center gap-1">
                <Clock className="w-3 h-3" /> {lesson.duration} · {lesson.level}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#211f1b] tracking-tight">
              {lesson.title}
            </h1>
            {lesson.subtitle && (
              <p className="text-xs sm:text-sm text-[#5c5850]">{lesson.subtitle}</p>
            )}
          </div>
        </header>

        {/* ===================================================================== */}
        {/* 2. THEORY SECTION (Clean Card + Formatted Math)                       */}
        {/* ===================================================================== */}
        <section className="bg-[#fffdfa] border border-[#e4ded4] rounded-2xl p-6 shadow-2xs flex flex-col gap-4">
          <h2 className="text-base font-extrabold text-[#211f1b] flex items-center gap-2 border-b border-[#e4ded4]/80 pb-2.5">
            <BookOpen className="w-4 h-4 text-[#c96b2c]" />
            <span>Classical Bits vs Quantum Bits</span>
          </h2>

          <div className="flex flex-col gap-3 text-xs sm:text-sm text-[#38342e] leading-relaxed">
            <p>
              A classical bit can only represent <strong>0</strong> or <strong>1</strong> at any point in time. Digital computation relies on these discrete binary switches.
            </p>
            <p>
              A quantum bit (qubit), however, exists in a two-dimensional Hilbert space. It can exist in the basis state |0⟩, the basis state |1⟩, or in a continuous <strong>superposition</strong> of both:
            </p>

            {/* Mathematical Formula Blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-1">
              <div className="bg-[#f7f4ee] border border-[#e4ded4] rounded-xl p-3.5 text-center font-mono font-bold text-sm text-[#211f1b] shadow-2xs">
                |ψ⟩ = α|0⟩ + β|1⟩
              </div>
              <div className="bg-[#f7f4ee] border border-[#e4ded4] rounded-xl p-3.5 text-center font-mono font-bold text-sm text-[#211f1b] shadow-2xs">
                |α|² + |β|² = 1
              </div>
            </div>

            <p className="text-xs text-[#5c5850]">
              The complex values α and β are called <em>probability amplitudes</em>. When measured, the qubit yields outcome 0 with probability |α|² and outcome 1 with probability |β|².
            </p>
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-[#fcfaf7] border border-[#e4ded4] rounded-xl p-4 flex flex-col gap-1 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#746e64]">
                CLASSICAL BIT
              </span>
              <strong className="text-xs font-bold text-[#211f1b]">0 OR 1</strong>
              <span className="text-xs text-[#5c5850]">Deterministic binary state.</span>
            </div>

            <div className="bg-[#fffaf0] border border-[#fed7aa] rounded-xl p-4 flex flex-col gap-1 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#c96b2c]">
                QUBIT
              </span>
              <strong className="text-xs font-bold text-[#211f1b]">α|0⟩ + β|1⟩</strong>
              <span className="text-xs text-[#5c5850]">Continuous quantum state with amplitudes.</span>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* 3. INTERACTIVE QUBIT SECTION (Bloch Sphere + Live State)              */}
        {/* ===================================================================== */}
        <section className="bg-[#f4f9f6] border border-[#bad8cb] rounded-2xl p-6 shadow-2xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#bad8cb] pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#287854]" />
              <h2 className="text-xs sm:text-sm font-extrabold text-[#287854] uppercase tracking-wider">
                TRY IT YOURSELF · INTERACTIVE QUBIT
              </h2>
            </div>
            <button
              onClick={() => {
                setBlochTheta(0);
                setBlochPhi(0);
                setBlochLabel('|0⟩ (Ground State)');
                setBlochProbs({ p0: 100, p1: 0 });
              }}
              className="text-xs font-semibold text-[#287854] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: 3D/2D Bloch Sphere Canvas */}
            <div className="md:col-span-5 flex justify-center">
              <BlochSphereVisualizer theta={blochTheta} phi={blochPhi} label={blochLabel} />
            </div>

            {/* Right: State Selector & Live Probabilities */}
            <div className="md:col-span-7 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-[#211f1b]">Select State Preset:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setBlochTheta(0);
                      setBlochPhi(0);
                      setBlochLabel('|0⟩ (Ground State)');
                      setBlochProbs({ p0: 100, p1: 0 });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      blochTheta === 0
                        ? 'bg-[#287854] text-white border-[#287854] shadow-xs'
                        : 'bg-white text-[#211f1b] border-[#bad8cb] hover:bg-[#eef8f2]'
                    }`}
                  >
                    |0⟩ State
                  </button>

                  <button
                    onClick={() => {
                      setBlochTheta(Math.PI);
                      setBlochPhi(0);
                      setBlochLabel('|1⟩ (Excited State)');
                      setBlochProbs({ p0: 0, p1: 100 });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      blochTheta === Math.PI
                        ? 'bg-[#287854] text-white border-[#287854] shadow-xs'
                        : 'bg-white text-[#211f1b] border-[#bad8cb] hover:bg-[#eef8f2]'
                    }`}
                  >
                    |1⟩ State (X Gate)
                  </button>

                  <button
                    onClick={() => {
                      setBlochTheta(Math.PI / 2);
                      setBlochPhi(0);
                      setBlochLabel('|+⟩ = (|0⟩ + |1⟩)/√2 (Equal Superposition)');
                      setBlochProbs({ p0: 50, p1: 50 });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      blochTheta === Math.PI / 2 && blochPhi === 0
                        ? 'bg-[#287854] text-white border-[#287854] shadow-xs'
                        : 'bg-white text-[#211f1b] border-[#bad8cb] hover:bg-[#eef8f2]'
                    }`}
                  >
                    |+⟩ Equal Superposition (H Gate)
                  </button>
                </div>
              </div>

              {/* Live Probability Bars */}
              <div className="bg-white border border-[#bad8cb] rounded-xl p-4 flex flex-col gap-3 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-mono border-b border-[#bad8cb]/60 pb-1.5">
                  <span>State: <strong className="text-[#287854]">{blochLabel}</strong></span>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span>P(0)</span>
                      <span className="text-[#287854]">{blochProbs.p0.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-[#bad8cb]/40 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#287854] h-full rounded-full transition-all duration-300"
                        style={{ width: `${blochProbs.p0}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span>P(1)</span>
                      <span className="text-[#287854]">{blochProbs.p1.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-[#bad8cb]/40 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#287854] h-full rounded-full transition-all duration-300"
                        style={{ width: `${blochProbs.p1}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* 4. MINI CHALLENGE ("YOUR TURN")                                        */}
        {/* ===================================================================== */}
        <section className="bg-[#fffdfa] border border-[#e4ded4] rounded-2xl p-6 shadow-2xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#e4ded4] pb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#c96b2c] fill-[#c96b2c]" />
              <h2 className="text-sm font-extrabold text-[#211f1b] uppercase tracking-wider">
                YOUR TURN · MINI CHALLENGE
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-[#c96b2c]">
              Target: |ψ⟩ = (|0⟩ + |1⟩) / √2
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[#38342e] leading-relaxed">
            <strong>Problem:</strong> Create an equal superposition from the initial |0⟩ state.
            <br />
            You need to apply the appropriate quantum gate to transform |0⟩ into an equal superposition.
          </p>

          {/* 2-Column Challenge Workspace: Left (Circuit + Results) | Right (Code) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start pt-2">
            {/* LEFT COLUMN: YOUR CIRCUIT & PALETTE (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              <div className="bg-[#fffdfa] border border-[#e4ded4] rounded-xl p-4 shadow-2xs flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-[#e4ded4] pb-2">
                  <span className="text-xs font-extrabold text-[#211f1b] uppercase tracking-wider">
                    YOUR CIRCUIT
                  </span>
                  <button
                    onClick={handleClearCircuit}
                    className="text-[11px] text-[#746e64] hover:text-[#211f1b] flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                </div>

                {/* Simplified Clean Wire: q[0] ─── [ H ] ─── [   ] ─── */}
                <div className="py-4 px-2 flex items-center gap-3 relative overflow-x-auto min-h-[70px]">
                  <span className="font-mono font-bold text-xs text-[#211f1b] shrink-0">
                    q[0]
                  </span>
                  <div className="flex-1 h-[2px] bg-[#c8c1b4] relative flex items-center justify-around px-4">
                    {[0, 1, 2].map((slotIdx) => {
                      const placed = gateAtStep(slotIdx);
                      const style = placed ? GATE_STYLES[placed.gate] || GATE_STYLES.h : null;

                      return (
                        <div
                          key={slotIdx}
                          onClick={() => {
                            if (placed) {
                              handleRemoveGate(slotIdx);
                            } else {
                              handlePlaceGate(slotIdx);
                            }
                          }}
                          className={`w-9 h-9 rounded-md border flex items-center justify-center font-mono font-bold text-xs shadow-xs transition-all cursor-pointer z-10 ${
                            placed
                              ? style?.bg + ' ' + style?.text + ' ' + style?.border
                              : selectedGate
                              ? 'bg-[#fffaf0] border-[#fed7aa] hover:border-[#c96b2c] hover:scale-105'
                              : 'bg-white border-[#e4ded4] hover:border-[#c96b2c]/50'
                          }`}
                          title={placed ? 'Click to remove gate' : 'Click to place selected gate'}
                        >
                          {placed ? (
                            <span>{style?.label || placed.gate.toUpperCase()}</span>
                          ) : (
                            <span className="text-[#c8c1b4] text-[10px]">+</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Gate Palette */}
                <div className="border-t border-[#e4ded4] pt-2.5 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#746e64]">Palette:</span>
                    <div className="flex items-center gap-1.5">
                      {['H', 'X', 'Y', 'Z', 'S', 'T'].map((g) => {
                        const style = GATE_STYLES[g.toLowerCase()] || GATE_STYLES.h;
                        const isSelected = selectedGate === g;

                        return (
                          <button
                            key={g}
                            onClick={() => setSelectedGate(isSelected ? null : g)}
                            className={`w-7 h-7 rounded-md text-xs font-mono font-bold border transition-all cursor-pointer shadow-2xs ${
                              isSelected
                                ? 'ring-2 ring-[#c96b2c] scale-110 ' + style.bg + ' ' + style.text
                                : style.bg + ' ' + style.text + ' ' + style.border + ' opacity-90 hover:opacity-100'
                            }`}
                          >
                            {g}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleRunCircuit}
                    disabled={isSimulating}
                    className="px-3 py-1.5 rounded-lg bg-[#f0ece4] hover:bg-[#e4ded4] text-xs font-bold text-[#211f1b] border border-[#d8d2c6] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Run Circuit</span>
                  </button>
                </div>
              </div>

              {/* SIMULATION RESULT */}
              {simulationResult && simulationResult.probabilities && (
                <div className="bg-[#fffdfa] border border-[#e4ded4] rounded-xl p-3.5 shadow-2xs flex flex-col gap-2 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-[#e4ded4] pb-1.5">
                    <span className="text-[11px] font-bold text-[#746e64] uppercase tracking-wider">
                      SIMULATION RESULT
                    </span>
                    <span className="text-[11px] font-bold text-[#287854] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Matches expected state
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(simulationResult.probabilities).map(([st, p]) => (
                      <div key={st} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs font-mono font-bold">
                          <span>|{st}⟩</span>
                          <span className="text-[#287854]">{(p * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-[#e4ded4] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#287854] h-full rounded-full transition-all duration-300"
                            style={{ width: `${p * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Solution Primary Action */}
              <button
                onClick={handleSubmitSolution}
                disabled={isSimulating}
                className="w-full py-3 rounded-xl bg-[#c96b2c] hover:bg-[#b55e24] text-white font-extrabold text-sm shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Solution</span>
              </button>

              {/* Alert message if incorrect */}
              {feedbackText && !submissionSuccess && (
                <div className="p-3 rounded-xl bg-[#fffaf3] border border-[#f0d1b3] text-xs text-[#c96b2c] flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{feedbackText}</span>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: YOUR CODE (5 Cols) */}
            <div className="lg:col-span-5 bg-[#1f1f21] rounded-xl p-4 font-mono text-xs text-gray-200 shadow-2xs flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-2">
                  <span className="text-xs text-[#c96b2c] font-bold flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5" /> YOUR CODE (OpenQASM)
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(qasmCode);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>

                <pre className="text-green-400 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                  {qasmCode}
                </pre>
              </div>

              <div className="text-[10px] text-gray-500 border-t border-gray-800 pt-2 flex items-center justify-between">
                <span>Circuit → Code synchronized</span>
                <span>{circuitIR.gates.length} gates</span>
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* 5. SUCCESS EXPERIENCE (Prominent LeetCode-style Card)              */}
          {/* =================================================================== */}
          {submissionSuccess && (
            <div className="bg-[#f4f9f6] border border-[#bad8cb] rounded-2xl p-5 shadow-xs flex flex-col gap-4 animate-fadeIn mt-2">
              <div className="flex items-center justify-between border-b border-[#bad8cb] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#287854] text-white flex items-center justify-center shadow-xs">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-[#287854]">
                      ✓ SUCCESS · Challenge completed
                    </h3>
                    <p className="text-xs text-[#4f806d]">
                      You successfully created the equal superposition state.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-[#287854]">
                  <span className="font-bold">+{lesson.challenge.xpReward} XP</span>
                  <span>|</span>
                  <span className="font-bold">100% Correct · 1 Gate · 2.4 ms</span>
                </div>
              </div>

              {/* AI MENTOR SECTION */}
              <div className="bg-white rounded-xl p-4 border border-[#bad8cb] flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#287854] uppercase tracking-wider flex items-center gap-1.5">
                    <Bot className="w-4 h-4" /> AI MENTOR · Why did this work?
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#287854]/10 text-[#287854] font-bold border border-[#287854]/20">
                    Verified Analysis
                  </span>
                </div>

                <p className="text-xs text-[#211f1b] leading-relaxed">
                  {aiExplanationText ||
                    'The Hadamard gate transforms |0⟩ into an equal superposition of |0⟩ and |1⟩. Measuring the resulting state therefore produces each outcome with approximately 50% probability.'}
                </p>

                <div className="flex items-center gap-2 pt-1 border-t border-[#bad8cb]/50">
                  <button
                    onClick={() => handleSendAiQuestion('Why does the Hadamard gate rotate the state to the Bloch equator?')}
                    className="text-[11px] px-3 py-1 rounded-full bg-[#f4f9f6] hover:bg-[#eef8f2] text-[#287854] border border-[#bad8cb] transition-colors cursor-pointer"
                  >
                    💡 Why did this work?
                  </button>
                  <button
                    onClick={() => setShowAiModal(true)}
                    className="text-[11px] px-3 py-1 rounded-full bg-[#f4f9f6] hover:bg-[#eef8f2] text-[#287854] border border-[#bad8cb] transition-colors cursor-pointer"
                  >
                    💬 Ask AI about this
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ===================================================================== */}
        {/* 6. NEXT LESSON CONTINUATION BANNER                                    */}
        {/* ===================================================================== */}
        <section className="bg-gradient-to-r from-[#211f1b] to-[#38332a] text-white rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#c96b2c]">
              NEXT LESSON
            </span>
            <strong className="text-sm font-extrabold text-white">
              Computational Basis States |0⟩ and |1⟩
            </strong>
            <span className="text-xs text-gray-300">
              Explore orthonormal Dirac vectors and the mathematical basis of Hilbert space.
            </span>
          </div>

          <button
            onClick={onNextLesson || onBackToCourse}
            className="px-5 py-2.5 rounded-xl bg-[#c96b2c] hover:bg-[#b55e24] text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <span>Continue Lesson</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 7. LIGHTWEIGHT AI TUTOR MODAL                                             */}
      {/* ========================================================================= */}
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
                  <p className="text-[11px] text-[#746e64]">{lesson.title}</p>
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
              {aiChatMessages.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#746e64]">
                  Ask the AI Mentor any question about your circuit, gate interactions, or state evolution!
                </div>
              ) : (
                aiChatMessages.map((msg, i) => (
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
                    {msg.text}
                  </div>
                ))
              )}
              {isAiLoading && (
                <div className="p-3 rounded-lg bg-[#f4f9f6] border border-[#bad8cb] text-xs text-[#287854] self-start animate-pulse">
                  Analyzing quantum statevector evolution...
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-[#e4ded4]">
              <input
                type="text"
                value={aiChatQuestion}
                onChange={(e) => setAiChatQuestion(e.target.value)}
                placeholder="Ask AI about this quantum circuit..."
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-[#d8d2c6] bg-white text-[#211f1b] focus:outline-none focus:border-[#287854]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendAiQuestion();
                }}
              />
              <button
                onClick={() => handleSendAiQuestion()}
                disabled={isAiLoading || !aiChatQuestion.trim()}
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
