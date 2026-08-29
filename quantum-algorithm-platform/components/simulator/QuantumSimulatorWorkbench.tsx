'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  CircuitIR,
  GateIR,
  PlacedGate,
  ExecutionResponse,
  ComparisonResponse,
  BlochVector,
} from '@/types/quantum';
import { BACKEND_URL } from '@/config';
import { Navbar } from './Navbar';
import { GatePalette } from './GatePalette';
import { CircuitCanvas } from './CircuitCanvas';
import { CodePanel } from './CodePanel';
import { ResultsPanel } from './ResultsPanel';
import { QuirkImportModal } from './QuirkImportModal';
import { AITutorPanel } from './AITutorPanel';

export function QuantumSimulatorWorkbench() {
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

  const [isQuirkModalOpen, setIsQuirkModalOpen] = useState<boolean>(false);
  const [isTutorModalOpen, setIsTutorModalOpen] = useState<boolean>(false);

  const [selectedBackend, setSelectedBackend] = useState<string>('qiskit_aer');

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
        setSimulationError(err.message || 'Error executing simulation.');
      } finally {
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

    if (armedGate === 'cnot' || armedGate === 'cz' || armedGate === 'swap') {
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
    const isMulti = gate === 'cnot' || gate === 'cx' || gate === 'cz' || gate === 'swap';

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

  return (
    <div className="w-full bg-[#f7f4ee] text-[#211f1b] flex flex-col font-sans selection:bg-[#c96b2c] selection:text-white min-h-screen">
      <Navbar
        onLoadPreset={handleLoadPreset}
        onOpenQuirkModal={() => setIsQuirkModalOpen(true)}
        onOpenTutorModal={() => setIsTutorModalOpen(true)}
        onRunSimulation={() => handleRunSimulation()}
        isLoading={isRunning}
        backendConnected={backendConnected}
        selectedBackend={selectedBackend}
        onSelectBackend={(b: string) => {
          setSelectedBackend(b);
          handleRunSimulation(undefined, b);
        }}
      />

      <div className="p-3 sm:p-4 max-w-[1750px] w-full mx-auto flex flex-col gap-4">
        {/* Top Grid: Operations | Canvas | Code */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
          <div className="lg:col-span-3">
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

          <div className="lg:col-span-6">
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

          <div className="lg:col-span-3">
            <CodePanel circuitIR={circuitIR} onApplyIR={applyCircuitIR} />
          </div>
        </div>

        {/* Bottom Section: Probabilities & Q-Sphere */}
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
    </div>
  );
}
