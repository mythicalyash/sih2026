import { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  CircuitIR,
  GateIR,
  PlacedGate,
  ExecutionResponse,
  ComparisonResponse,
  BlochVector,
} from './types/quantum';
import { BACKEND_URL } from './config';
import { Navbar } from './components/Navbar';
import { GatePalette } from './components/GatePalette';
import { CircuitCanvas } from './components/CircuitCanvas';
import { CodePanel } from './components/CodePanel';
import { ResultsPanel } from './components/ResultsPanel';
import { QuirkImportModal } from './components/QuirkImportModal';
import { AITutorPanel } from './components/AITutorPanel';
import { Globe, Sun, Moon, Monitor } from 'lucide-react';

export function App() {
  const [numQubits, setNumQubits] = useState<number>(4);
  const [numSteps, setNumSteps] = useState<number>(6);
  const [gates, setGates] = useState<PlacedGate[]>([]);
  const [history, setHistory] = useState<PlacedGate[][]>([]);

  // Gate Palette Arming State
  const [armedGate, setArmedGate] = useState<string | null>(null);
  const [armedParams, setArmedParams] = useState<number[] | undefined>(undefined);
  const [cnotControlPending, setCnotControlPending] = useState<number | null>(null);

  // Execution & Backend State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResponse | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResponse | null>(null);
  const [blochVectors, setBlochVectors] = useState<BlochVector[]>([]);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  // Modals
  const [isQuirkModalOpen, setIsQuirkModalOpen] = useState<boolean>(false);
  const [isTutorModalOpen, setIsTutorModalOpen] = useState<boolean>(false);

  // Check backend health
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
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // Convert PlacedGate[] to CircuitIR
  const circuitIR: CircuitIR = useMemo(() => {
    const sortedGates = [...gates].sort((a, b) => a.step - b.step);
    const irGates: GateIR[] = [];

    const processedMultiIds = new Set<string>();

    for (const g of sortedGates) {
      if (g.isTarget && g.controlQubit !== undefined) {
        if (!processedMultiIds.has(g.id)) {
          irGates.push({
            name: g.gate.toLowerCase(),
            qubits: [g.controlQubit, g.qubit],
            params: g.params && g.params.length > 0 ? g.params : undefined,
          });
          processedMultiIds.add(g.id);
        }
      } else if (!g.isControl) {
        irGates.push({
          name: g.gate.toLowerCase(),
          qubits: [g.qubit],
          params: g.params && g.params.length > 0 ? g.params : undefined,
        });
      }
    }

    return {
      num_qubits: numQubits,
      gates: irGates,
    };
  }, [gates, numQubits]);

  // Run Simulation & Equivalence Verification
  const handleRunSimulation = useCallback(
    async (targetIR?: CircuitIR) => {
      const activeIR =
        targetIR && typeof targetIR === 'object' && 'num_qubits' in targetIR
          ? targetIR
          : circuitIR;
      setIsRunning(true);
      setSimulationError(null);

      try {
        // 1. Run /execute on Qiskit Aer
        const execRes = await fetch(`${BACKEND_URL}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            circuit: activeIR,
            shots: 1024,
            include_statevector: true,
          }),
        });

        if (!execRes.ok) {
          const errData = await execRes.json();
          throw new Error(errData.detail || 'Execution failed on Aer.');
        }
        const execData: ExecutionResponse = await execRes.json();
        setExecutionResult(execData);

        // 2. Run /execute/compare for cross-backend equivalence
        const compRes = await fetch(`${BACKEND_URL}/execute/compare`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            circuit: activeIR,
            tolerance: 0.0001,
            shots: 1024,
          }),
        });

        if (compRes.ok) {
          const compData: ComparisonResponse = await compRes.json();
          setComparisonResult(compData);
        }

        // 3. Fetch Bloch vectors
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
    [circuitIR]
  );

  // Convert CircuitIR to PlacedGate[] (for Presets and Quirk import)
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

  // Initialize with default 4-qubit state
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

  // Load Preset Algorithm from Backend
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

  // Canvas Cell Click Placement
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
    <div className="min-h-screen bg-[#121619] text-gray-100 flex flex-col font-sans selection:bg-[#0f62fe] selection:text-white">
      {/* Top Header Navigation */}
      <Navbar
        onLoadPreset={handleLoadPreset}
        onOpenQuirkModal={() => setIsQuirkModalOpen(true)}
        onOpenTutorModal={() => setIsTutorModalOpen(true)}
        onRunSimulation={() => handleRunSimulation()}
        isLoading={isRunning}
        backendConnected={backendConnected}
      />

      {/* Main Composer Body */}
      <main className="flex-1 p-3 sm:p-4 max-w-[1750px] w-full mx-auto flex flex-col gap-4">
        {/* Top Split: Operations | Circuit Canvas | Code Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
          {/* Operations Palette (3 cols) */}
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

          {/* Circuit Canvas (6 cols) */}
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
            />
          </div>

          {/* Code Panel: OpenQASM 3.0 / IR (3 cols) */}
          <div className="lg:col-span-3">
            <CodePanel circuitIR={circuitIR} onApplyIR={applyCircuitIR} />
          </div>
        </div>

        {/* Bottom Split: Probabilities & Q-Sphere Visualizers */}
        <ResultsPanel
          onRunSimulation={() => handleRunSimulation()}
          isRunning={isRunning}
          executionResult={executionResult}
          comparisonResult={comparisonResult}
          blochVectors={blochVectors}
          numQubits={numQubits}
          error={simulationError}
        />
      </main>

      {/* Footer matching IBM Composer */}
      <footer className="mt-auto border-t border-[#262626] bg-[#161616] px-4 py-2 text-[11px] text-gray-400 flex flex-wrap items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-4">
          <span className="hover:text-gray-200 cursor-pointer">Terms</span>
          <span className="hover:text-gray-200 cursor-pointer">Privacy</span>
          <span className="hover:text-gray-200 cursor-pointer">Cookie preferences</span>
          <span className="hover:text-gray-200 cursor-pointer">Support</span>
          <span className="hover:text-gray-200 cursor-pointer">Accessibility</span>
          <span className="hover:text-gray-200 cursor-pointer">Security</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#262626] border border-[#393939] text-gray-300 cursor-pointer">
            <Globe className="w-3 h-3" />
            <span>English</span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#262626] border border-[#393939] text-gray-400">
            <Sun className="w-3 h-3 hover:text-white cursor-pointer" />
            <Monitor className="w-3 h-3 hover:text-white cursor-pointer" />
            <Moon className="w-3 h-3 text-white" />
          </div>
        </div>
      </footer>

      {/* Modals */}
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

export default App;
