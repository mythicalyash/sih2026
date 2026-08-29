'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type {
  CircuitIR,
  GateIR,
  PlacedGate,
  ExecutionResponse,
  ComparisonResponse,
  BlochVector,
} from '@/types/quantum';
import { ChevronLeft, ChevronRight, PanelRightOpen } from 'lucide-react';
import { BACKEND_URL } from '@/config';
import { Navbar } from './Navbar';
import { GatePalette } from './GatePalette';
import { CircuitCanvas } from './CircuitCanvas';
import { CodePanel } from './CodePanel';
import { ResultsPanel } from './ResultsPanel';
import { QuirkImportModal } from './QuirkImportModal';
import { AITutorPanel } from './AITutorPanel';
import { GateCheatSheetModal } from './GateCheatSheetModal';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { AboutModal } from './AboutModal';

interface QuantumSimulatorWorkbenchProps {
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

export function QuantumSimulatorWorkbench({
  onToggleSidebar,
  sidebarCollapsed,
}: QuantumSimulatorWorkbenchProps = {}) {
  const [numQubits, setNumQubits] = useState<number>(4);
  const [numSteps, setNumSteps] = useState<number>(6);
  const [gates, setGates] = useState<PlacedGate[]>([]);
  const [history, setHistory] = useState<PlacedGate[][]>([]);

  const [armedGate, setArmedGate] = useState<string | null>(null);
  const [armedParams, setArmedParams] = useState<number[] | undefined>(undefined);
  const [cnotControlPending, setCnotControlPending] = useState<number | null>(null);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResponse | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResponse | null>(null);
  const [blochVectors, setBlochVectors] = useState<BlochVector[]>([]);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const [circuitName, setCircuitName] = useState<string>('Untitled circuit');
  const [isQuirkModalOpen, setIsQuirkModalOpen] = useState<boolean>(false);
  const [isTutorModalOpen, setIsTutorModalOpen] = useState<boolean>(false);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [selectedBackend, setSelectedBackend] = useState<string>('qiskit_aer');
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  // Resizable Code Editor States
  const [editorWidthPercent, setEditorWidthPercent] = useState<number>(40);
  const [isEditorCollapsed, setIsEditorCollapsed] = useState<boolean>(false);
  const [isEditorMaximized, setIsEditorMaximized] = useState<boolean>(false);
  const [isDraggingSplitter, setIsDraggingSplitter] = useState<boolean>(false);
  const workbenchContainerRef = useRef<HTMLDivElement | null>(null);

  // Mouse drag handler for horizontal splitter
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSplitter || !workbenchContainerRef.current) return;
      const rect = workbenchContainerRef.current.getBoundingClientRect();
      const rightDistance = rect.right - e.clientX;
      const newPercent = (rightDistance / rect.width) * 100;
      // Clamp between 20% and 75%
      const clamped = Math.max(20, Math.min(75, newPercent));
      setEditorWidthPercent(clamped);
      if (isEditorCollapsed) setIsEditorCollapsed(false);
      if (isEditorMaximized) setIsEditorMaximized(false);
    };

    const handleMouseUp = () => {
      setIsDraggingSplitter(false);
    };

    if (isDraggingSplitter) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingSplitter, isEditorCollapsed, isEditorMaximized]);

  const handleSetWidthPreset = (preset: 'compact' | 'standard' | 'wide') => {
    setIsEditorCollapsed(false);
    setIsEditorMaximized(false);
    if (preset === 'compact') setEditorWidthPercent(28);
    else if (preset === 'standard') setEditorWidthPercent(40);
    else if (preset === 'wide') setEditorWidthPercent(56);
  };


  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/health`);
      if (res.ok) {
        setBackendConnected(true);
      }
    } catch {
      setBackendConnected(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    return () => clearInterval(interval);
  }, [checkHealth]);

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

  const handleRunSimulation = useCallback(
    async (targetIR?: CircuitIR, overrideBackend?: string) => {
      const activeIR =
        targetIR && typeof targetIR === 'object' && 'num_qubits' in targetIR
          ? targetIR
          : circuitIR;
      const bChoice = overrideBackend || selectedBackend;
      setIsRunning(true);
      setSimulationError(null);

      console.group(`%c🚀 Quantum Simulation Running [${bChoice.toUpperCase()}]`, 'color: #c96b2c; font-weight: bold; font-size: 12px;');
      console.log(`%c[CIRCUIT DETAILS]%c Qubits: ${activeIR.num_qubits} | Gates: ${activeIR.gates.length}`, 'color: #746e64; font-weight: bold;', 'color: #211f1b;', activeIR.gates);
      console.log(`%c[BACKEND]%c ${bChoice} (1024 shots)`, 'color: #746e64; font-weight: bold;', 'color: #211f1b;');

      try {
        const execRes = await fetch(`${BACKEND_URL}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            circuit: activeIR,
            shots: 1024,
            include_statevector: true,
            backend: bChoice,
          }),
        });

        if (!execRes.ok) {
          const errData = await execRes.json();
          throw new Error(errData.detail || `Execution failed on ${bChoice}.`);
        }
        const execData: ExecutionResponse = await execRes.json();
        setExecutionResult(execData);

        console.log(`%c[EXECUTION SUCCESS]%c Simulated in ${execData.execution_time_ms} ms`, 'color: #137333; font-weight: bold;', 'color: #137333;', {
          probabilities: execData.probabilities,
          measuredCounts: execData.counts,
          statevector: execData.statevector,
        });

        const compRes = await fetch(`${BACKEND_URL}/execute/compare`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            circuit: activeIR,
            tolerance: 0.0001,
            shots: 1024,
            backends: ['qiskit_aer', 'pennylane', 'qsim', 'qbraid'],
          }),
        });

        if (compRes.ok) {
          const compData: ComparisonResponse = await compRes.json();
          setComparisonResult(compData);
          console.log(`%c[CROSS-ENGINE VERIFICATION]%c Match: ${compData.match ? '✅ EXACT' : '❌ DIFF'} | Fidelity: ${compData.fidelity?.toFixed(6)} | Max Diff: ${compData.max_statevector_diff?.toFixed(6)}`, 'color: #0f62fe; font-weight: bold;', 'color: #211f1b;', compData.comparison);
        }

        const blochRes = await fetch(`${BACKEND_URL}/state/bloch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(activeIR),
        });

        if (blochRes.ok) {
          const blochData = await blochRes.json();
          setBlochVectors(blochData.bloch_vectors || []);
        }
      } catch (err: any) {
        console.error(`%c[SIMULATION ERROR]%c ${err.message || 'Error executing simulation'}`, 'color: #c5221f; font-weight: bold;', 'color: #c5221f;');
        setSimulationError(err.message || 'Error executing simulation.');
      } finally {
        console.groupEnd();
        setIsRunning(false);
      }
    },
    [circuitIR, selectedBackend]
  );

  const applyCircuitIR = useCallback(
    (ir: CircuitIR, autoRun = false) => {
      const newNumQubits = Math.max(2, Math.min(5, ir.num_qubits));
      setNumQubits(newNumQubits);

      const placed: PlacedGate[] = [];
      let currentStep = 0;
      const qubitCurrentStep: number[] = new Array(newNumQubits).fill(0);

      ir.gates.forEach((g, gIdx) => {
        const name = g.name.toLowerCase();
        const qubits = g.qubits;

        if (qubits.length >= 2) {
          const c = qubits[0];
          const t = qubits[1];
          if (c < newNumQubits && t < newNumQubits) {
            const step = Math.max(qubitCurrentStep[c], qubitCurrentStep[t]);
            const pairId = `multi-${gIdx}-${Date.now()}`;
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
            qubitCurrentStep[c] = step + 1;
            qubitCurrentStep[t] = step + 1;
            currentStep = Math.max(currentStep, step + 1);
          }
        } else if (qubits.length === 1) {
          const q = qubits[0];
          if (q < newNumQubits) {
            const step = qubitCurrentStep[q];
            placed.push({
              id: `gate-${gIdx}-${q}-${Date.now()}`,
              gate: name,
              qubit: q,
              step,
              params: g.params,
            });
            qubitCurrentStep[q] = step + 1;
            currentStep = Math.max(currentStep, step + 1);
          }
        }
      });

      setNumSteps(Math.max(6, currentStep + 2));
      setGates(placed);
      setHistory((prev) => [...prev, gates]);

      if (autoRun) {
        handleRunSimulation(ir);
      }
    },
    [gates, handleRunSimulation]
  );

  useEffect(() => {
    applyCircuitIR(
      {
        num_qubits: 4,
        gates: [
          { name: 'h', qubits: [0] },
          { name: 'cx', qubits: [0, 1] },
        ],
      },
      true
    );
  }, []);

  const handleLoadPreset = async (algorithmKey: string) => {
    setSelectedPreset(algorithmKey);
    setIsRunning(true);
    try {
      const res = await fetch(`${BACKEND_URL}/algorithms/${algorithmKey}`);
      if (!res.ok) throw new Error('Failed to fetch algorithm preset.');
      const data = await res.json();
      applyCircuitIR(data.circuit, true);
    } catch (err: any) {
      setSimulationError(err.message || 'Failed to load algorithm preset.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleCellClick = (qubit: number, step: number) => {
    if (!armedGate) return;

    const is2Qubit = ['cnot', 'cx', 'ncx', 'cz', 'swap', 'cp'].includes(armedGate);

    if (is2Qubit) {
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

      if (step >= numSteps - 1) {
        setNumSteps((prev) => prev + 2);
      }
    }
  };

  const handleDropGate = (gate: string, qubit: number, step: number, params?: number[]) => {
    const isMulti = ['cnot', 'cx', 'ncx', 'cz', 'swap', 'cp'].includes(gate);

    setHistory((prev) => [...prev, gates]);

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
        ...prev.filter(
          (g) => !(g.step === step && (g.qubit === qubit || g.qubit === targetQubit))
        ),
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
        ...prev.filter(
          (g) => g.id !== gateId && !(g.qubit === targetQubit && g.step === targetStep)
        ),
        updatedGate,
      ]);
    }

    if (targetStep >= numSteps - 1) {
      setNumSteps((prev) => Math.max(prev, targetStep + 3));
    }
  };

  const handleRemoveGate = (gateId: string) => {
    setHistory((prev) => [...prev, gates]);
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
  };

  const handleClear = () => {
    setHistory((prev) => [...prev, gates]);
    setGates([]);
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNewCircuit = () => {
    setHistory((prev) => [...prev, gates]);
    setGates([]);
    setNumQubits(3);
    setNumSteps(6);
    setCircuitName('New Quantum Circuit');
    setSelectedPreset('');
  };

  const handleExportQASM = () => {
    const lines = [
      'OPENQASM 3.0;',
      'include "stdgates.inc";',
      '',
      `qubit[${circuitIR.num_qubits}] q;`,
      `bit[${circuitIR.num_qubits}] c;`,
      '',
    ];
    for (const g of circuitIR.gates) {
      const name = g.name.toLowerCase();
      if (name === 'cx' || name === 'cnot') {
        lines.push(`cx q[${g.qubits[0]}], q[${g.qubits[1]}];`);
      } else if (name === 'cz') {
        lines.push(`cz q[${g.qubits[0]}], q[${g.qubits[1]}];`);
      } else if (name === 'swap') {
        lines.push(`swap q[${g.qubits[0]}], q[${g.qubits[1]}];`);
      } else if (name === 'ccx') {
        lines.push(`ccx q[${g.qubits[0]}], q[${g.qubits[1]}], q[${g.qubits[2]}];`);
      } else if (name === 'measure') {
        lines.push(`c[${g.qubits[0]}] = measure q[${g.qubits[0]}];`);
      } else if (['rx', 'ry', 'rz', 'p'].includes(name) && g.params) {
        lines.push(`${name}(${g.params[0].toFixed(4)}) q[${g.qubits[0]}];`);
      } else {
        lines.push(`${name} q[${g.qubits[0]}];`);
      }
    }
    const safeName = (circuitName || 'circuit').toLowerCase().replace(/\s+/g, '_');
    downloadFile(lines.join('\n'), `${safeName}.qasm`, 'text/plain');
  };

  const handleExportPython = () => {
    const lines = [
      'import numpy as np',
      'from qiskit import QuantumCircuit',
      'from qiskit_aer import AerSimulator',
      '',
      `# Initialize ${circuitIR.num_qubits}-qubit quantum circuit`,
      `qc = QuantumCircuit(${circuitIR.num_qubits})`,
      '',
    ];
    for (const g of circuitIR.gates) {
      const name = g.name.toLowerCase();
      if (['h', 'x', 'y', 'z', 's', 'sdg', 't', 'tdg'].includes(name)) {
        lines.push(`qc.${name}(${g.qubits[0]})`);
      } else if (name === 'cx' || name === 'cnot') {
        lines.push(`qc.cx(${g.qubits[0]}, ${g.qubits[1]})`);
      } else if (name === 'cz') {
        lines.push(`qc.cz(${g.qubits[0]}, ${g.qubits[1]})`);
      } else if (name === 'swap') {
        lines.push(`qc.swap(${g.qubits[0]}, ${g.qubits[1]})`);
      } else if (name === 'ccx') {
        lines.push(`qc.ccx(${g.qubits[0]}, ${g.qubits[1]}, ${g.qubits[2]})`);
      } else if (['rx', 'ry', 'rz', 'p'].includes(name) && g.params) {
        lines.push(`qc.${name}(${g.params[0].toFixed(6)}, ${g.qubits[0]})`);
      }
    }
    lines.push('');
    lines.push('# Simulate on Qiskit Aer backend');
    lines.push('sim = AerSimulator()');
    lines.push('qc.measure_all()');
    lines.push('result = sim.run(qc, shots=1024).result()');
    lines.push('print("Measurement Counts:", result.get_counts())');

    const safeName = (circuitName || 'circuit').toLowerCase().replace(/\s+/g, '_');
    downloadFile(lines.join('\n'), `${safeName}_qiskit.py`, 'text/x-python');
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(circuitIR, null, 2);
    const safeName = (circuitName || 'circuit').toLowerCase().replace(/\s+/g, '_');
    downloadFile(jsonStr, `${safeName}.json`, 'application/json');
  };

  const handleImportFile = (content: string, filename: string) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed.num_qubits && Array.isArray(parsed.gates)) {
        applyCircuitIR(parsed, true);
        setCircuitName(filename.replace(/\.[^/.]+$/, ''));
        return;
      }
    } catch {
      // Text format
    }
    setCircuitName(filename.replace(/\.[^/.]+$/, ''));
  };

  return (
    <div className="w-full h-full max-h-screen bg-[#f7f4ee] text-[#211f1b] flex flex-col font-sans selection:bg-[#c96b2c] selection:text-white overflow-hidden">
      <Navbar
        circuitName={circuitName}
        onRenameCircuit={setCircuitName}
        onNewCircuit={handleNewCircuit}
        onExportQASM={handleExportQASM}
        onExportPython={handleExportPython}
        onExportJSON={handleExportJSON}
        onImportFile={handleImportFile}
        onUndo={handleUndo}
        canUndo={history.length > 0}
        onClearGates={handleClear}
        onAddQubit={() => setNumQubits((prev) => Math.min(8, prev + 1))}
        onRemoveQubit={() => setNumQubits((prev) => Math.max(1, prev - 1))}
        numQubits={numQubits}
        onAddSteps={() => setNumSteps((prev) => prev + 2)}
        onToggleCodeEditor={() => setIsEditorCollapsed((prev) => !prev)}
        onOpenQuirkModal={() => setIsQuirkModalOpen(true)}
        onOpenTutorModal={() => setIsTutorModalOpen(true)}
        onOpenCheatSheet={() => setIsCheatSheetOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onRunSimulation={() => handleRunSimulation()}
        isLoading={isRunning}
        backendConnected={backendConnected}
        selectedBackend={selectedBackend}
        onSelectBackend={(b: string) => {
          setSelectedBackend(b);
          handleRunSimulation(undefined, b);
        }}
        selectedPreset={selectedPreset}
        onLoadPreset={handleLoadPreset}
        onToggleSidebar={onToggleSidebar}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Main Resizable Workbench Area */}
      <div
        ref={workbenchContainerRef}
        className="flex-1 min-h-0 overflow-hidden p-2 sm:p-2.5 max-w-[1920px] w-full mx-auto flex flex-col lg:flex-row gap-2 lg:gap-0 items-stretch relative"
      >
        {/* Left Side: Circuit Canvas & Visualizers */}
        {!isEditorMaximized && (
          <div
            className="h-full flex flex-col gap-2 min-w-0 overflow-hidden transition-[width] duration-75"
            style={{
              width: isEditorCollapsed ? '100%' : `calc(${100 - editorWidthPercent}% - 8px)`,
            }}
          >
            {/* Top Row: Gate Palette (Fixed Width) & Circuit Canvas (Flexible Width) */}
            <div className="h-[49%] min-h-[220px] max-h-[50%] flex-shrink-0 flex flex-row gap-2 items-stretch overflow-hidden">
              <div className="w-[260px] xl:w-[270px] flex-shrink-0 flex flex-col h-full overflow-hidden">
                <GatePalette
                  armedGate={armedGate}
                  onArmGate={(gate, params) => {
                    setArmedGate(gate);
                    setArmedParams(params);
                    setCnotControlPending(null);
                  }}
                  onDisarm={() => {
                    setArmedGate(null);
                    setArmedParams(undefined);
                    setCnotControlPending(null);
                  }}
                  cnotControlPending={cnotControlPending}
                />
              </div>

              <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
                <CircuitCanvas
                  numQubits={numQubits}
                  onNumQubitsChange={(val) => {
                    setNumQubits(val);
                    setGates((prev) => prev.filter((g) => g.qubit < val && (!g.controlQubit || g.controlQubit < val)));
                  }}
                  gates={gates}
                  numSteps={numSteps}
                  onAddStep={() => setNumSteps((prev) => Math.min(32, prev + 1))}
                  onRemoveStep={() => setNumSteps((prev) => Math.max(4, prev - 1))}
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
            </div>

            {/* Bottom Row: Probabilities & Q-Sphere Visualizers (Constant Locked Height) */}
            <div className="h-[51%] min-h-0 flex-1 flex flex-col overflow-hidden">
              <ResultsPanel
                onRunSimulation={() => handleRunSimulation()}
                isRunning={isRunning}
                executionResult={executionResult}
                comparisonResult={comparisonResult}
                blochVectors={blochVectors}
                numQubits={numQubits}
                error={simulationError}
              />
            </div>
          </div>
        )}

        {/* Resizable Horizontal Splitter Bar (Desktop) */}
        {!isEditorCollapsed && !isEditorMaximized && (
          <div
            onMouseDown={() => setIsDraggingSplitter(true)}
            onDoubleClick={() => setEditorWidthPercent(40)}
            className={`hidden lg:flex items-center justify-center w-2 hover:w-3 cursor-col-resize select-none group transition-all shrink-0 z-20 mx-1 ${
              isDraggingSplitter ? 'bg-[#c96b2c]/40' : 'hover:bg-[#c96b2c]/20'
            }`}
            title="Drag horizontally to resize editor (Double-click to reset to 40%)"
          >
            <div className="w-[3px] h-16 rounded-full bg-[#ded7cb] group-hover:bg-[#c96b2c] transition-colors" />
          </div>
        )}

        {/* Whole Right Side: Code Editor */}
        {!isEditorCollapsed && (
          <div
            className="h-full flex flex-col shrink-0 min-w-0 overflow-hidden transition-[width] duration-75"
            style={{
              width: isEditorMaximized ? '100%' : `${editorWidthPercent}%`,
            }}
          >
            <CodePanel
              circuitIR={circuitIR}
              onApplyIR={applyCircuitIR}
              isMaximized={isEditorMaximized}
              onToggleMaximize={() => setIsEditorMaximized((prev) => !prev)}
              onToggleCollapse={() => setIsEditorCollapsed(true)}
              onSetWidthPreset={handleSetWidthPreset}
            />
          </div>
        )}

        {/* Floating Expand Trigger when Editor is Collapsed */}
        {isEditorCollapsed && (
          <button
            onClick={() => setIsEditorCollapsed(false)}
            className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-[#fffdf9] border-l border-y border-[#ded7cb] hover:border-[#c96b2c] rounded-l-md px-2 py-4 shadow-md text-[#211f1b] hover:text-[#c96b2c] items-center gap-1 text-xs font-mono transition-all cursor-pointer group"
            title="Open Code Editor"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-[#c96b2c] group-hover:-translate-x-0.5 transition-transform" />
            <span className="[writing-mode:vertical-rl] tracking-wider font-semibold text-[11px]">
              Code Editor
            </span>
          </button>
        )}
      </div>

      <QuirkImportModal
        isOpen={isQuirkModalOpen}
        onClose={() => setIsQuirkModalOpen(false)}
        onImportSuccess={(importedCircuit) => {
          applyCircuitIR(importedCircuit, true);
        }}
      />

      <AITutorPanel
        circuitIR={circuitIR}
        isOpen={isTutorModalOpen}
        onClose={() => setIsTutorModalOpen(false)}
      />

      <GateCheatSheetModal
        isOpen={isCheatSheetOpen}
        onClose={() => setIsCheatSheetOpen(false)}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
}
