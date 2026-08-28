import React from 'react';
import type { PlacedGate } from '../types/quantum';
import { Undo2, Redo2, Plus, Minus, Trash2, ChevronDown } from 'lucide-react';

interface CircuitCanvasProps {
  numQubits: number;
  onNumQubitsChange: (val: number) => void;
  gates: PlacedGate[];
  numSteps: number;
  onAddStep: () => void;
  onCellClick: (qubit: number, step: number) => void;
  onRemoveGate: (gateId: string) => void;
  onUndo: () => void;
  onClear: () => void;
  canUndo: boolean;
  armedGate: string | null;
  cnotControlPending: number | null;
}

// Gate color definitions matching IBM Composer
const GATE_STYLE_MAP: Record<string, { bg: string; text: string; border: string; label: string }> = {
  h: { bg: 'bg-[#da1e28]', text: 'text-white', border: 'border-[#fa4d56]', label: 'H' },
  x: { bg: 'bg-[#d12771]', text: 'text-white', border: 'border-[#ee5396]', label: 'X' },
  y: { bg: 'bg-[#d12771]', text: 'text-white', border: 'border-[#ee5396]', label: 'Y' },
  z: { bg: 'bg-[#1192e8]', text: 'text-white', border: 'border-[#33b1ff]', label: 'Z' },
  s: { bg: 'bg-[#1192e8]', text: 'text-white', border: 'border-[#33b1ff]', label: 'S' },
  sdg: { bg: 'bg-[#1192e8]', text: 'text-white', border: 'border-[#33b1ff]', label: 'S†' },
  t: { bg: 'bg-[#1192e8]', text: 'text-white', border: 'border-[#33b1ff]', label: 'T' },
  tdg: { bg: 'bg-[#1192e8]', text: 'text-white', border: 'border-[#33b1ff]', label: 'T†' },
  p: { bg: 'bg-[#1192e8]', text: 'text-white', border: 'border-[#33b1ff]', label: 'P' },
  rx: { bg: 'bg-[#d12771]', text: 'text-white', border: 'border-[#ee5396]', label: 'RX' },
  ry: { bg: 'bg-[#d12771]', text: 'text-white', border: 'border-[#ee5396]', label: 'RY' },
  rz: { bg: 'bg-[#0072c3]', text: 'text-white', border: 'border-[#1192e8]', label: 'RZ' },
  id: { bg: 'bg-[#0f62fe]', text: 'text-white', border: 'border-[#4589ff]', label: 'I' },
  sx: { bg: 'bg-[#d12771]', text: 'text-white', border: 'border-[#ee5396]', label: '√X' },
  reset: { bg: 'bg-[#525252]', text: 'text-white', border: 'border-[#6f6f6f]', label: '|0⟩' },
  measure: { bg: 'bg-[#002d9c]', text: 'text-white', border: 'border-[#0f62fe]', label: '◓' },
};

export const CircuitCanvas: React.FC<CircuitCanvasProps> = ({
  numQubits,
  onNumQubitsChange,
  gates,
  numSteps,
  onAddStep,
  onCellClick,
  onRemoveGate,
  onUndo,
  onClear,
  canUndo,
  armedGate,
  cnotControlPending,
}) => {
  const [inspectMode, setInspectMode] = React.useState<boolean>(false);

  // Index placed gates by "qubit-step"
  const cellMap = new Map<string, PlacedGate>();
  gates.forEach((g) => {
    cellMap.set(`${g.qubit}-${g.step}`, g);
  });

  // Group multi-qubit connections for SVG line rendering
  const connectionsByStep = new Map<number, { control: number; target: number; id: string; gate: string }[]>();
  gates.forEach((g) => {
    if (g.isTarget && g.controlQubit !== undefined) {
      const list = connectionsByStep.get(g.step) || [];
      list.push({ control: g.controlQubit, target: g.qubit, id: g.id, gate: g.gate });
      connectionsByStep.set(g.step, list);
    }
  });

  return (
    <div className="bg-[#161616] border border-[#393939] rounded-lg p-3 sm:p-4 flex flex-col gap-3 shadow-xl select-none">
      {/* IBM Composer Canvas Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#262626] pb-2.5">
        {/* Left tools: Undo, Redo, Alignment, Inspect */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1.5 rounded hover:bg-[#262626] disabled:opacity-30 text-gray-300 transition-colors cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              disabled
              className="p-1.5 rounded hover:bg-[#262626] opacity-30 text-gray-300 cursor-not-allowed"
              title="Redo"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-[1px] bg-[#393939]" />

          {/* Alignment dropdown */}
          <div className="flex items-center gap-1 text-xs text-gray-300 px-2 py-1 rounded bg-[#262626] border border-[#393939] cursor-pointer">
            <span>Left alignment</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </div>

          <div className="h-4 w-[1px] bg-[#393939]" />

          {/* Inspect mode toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setInspectMode(!inspectMode)}
              className={`w-7 h-4 rounded-full transition-colors relative cursor-pointer ${
                inspectMode ? 'bg-[#0f62fe]' : 'bg-[#525252]'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                  inspectMode ? 'translate-x-3' : ''
                }`}
              />
            </button>
            <span className="text-xs text-gray-400">Inspect</span>
          </div>
        </div>

        {/* Right tools: Qubit count stepper, Step add, Clear */}
        <div className="flex items-center gap-3">
          {/* Qubits Stepper */}
          <div className="flex items-center gap-1.5 bg-[#262626] px-2 py-1 rounded border border-[#393939] text-xs">
            <span className="text-gray-400">Qubits:</span>
            <button
              onClick={() => onNumQubitsChange(Math.max(2, numQubits - 1))}
              disabled={numQubits <= 2}
              className="p-0.5 rounded text-gray-300 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-mono font-bold text-gray-100 px-1">{numQubits}</span>
            <button
              onClick={() => onNumQubitsChange(Math.min(5, numQubits + 1))}
              disabled={numQubits >= 5}
              className="p-0.5 rounded text-gray-300 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={onAddStep}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-[#262626] hover:bg-[#393939] text-gray-200 border border-[#393939] transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3 text-[#4589ff]" />
            <span>Step</span>
          </button>

          <button
            onClick={onClear}
            disabled={gates.length === 0}
            className="p-1.5 rounded hover:bg-red-950/60 disabled:opacity-30 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
            title="Clear all gates"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Wires Area */}
      <div className="relative overflow-x-auto p-4 bg-[#121619] rounded-md border border-[#262626] min-h-[260px]">
        {/* Step Column Labels */}
        <div className="flex ml-16 mb-2 gap-3 min-w-max">
          {Array.from({ length: numSteps }).map((_, sIdx) => (
            <div key={sIdx} className="w-10 text-center font-mono text-[9px] text-gray-500">
              {sIdx}
            </div>
          ))}
        </div>

        {/* Qubit Wires */}
        <div className="flex flex-col gap-6 min-w-max relative">
          {Array.from({ length: numQubits }).map((_, qIdx) => (
            <div key={qIdx} className="flex items-center gap-3 relative h-10">
              {/* Qubit Label */}
              <div className="w-12 text-xs font-mono font-medium text-gray-300 z-10">
                q[{qIdx}]
              </div>

              {/* Wire Horizontal Line */}
              <div className="absolute left-14 right-8 h-[1px] bg-[#393939] z-0 pointer-events-none" />

              {/* Time Step Cells */}
              <div className="flex gap-3 relative z-10 pl-2">
                {Array.from({ length: numSteps }).map((_, sIdx) => {
                  const key = `${qIdx}-${sIdx}`;
                  const gate = cellMap.get(key);
                  const isArmed = armedGate !== null;
                  const isPendingControl =
                    (armedGate === 'cnot' || armedGate === 'cz' || armedGate === 'swap') &&
                    cnotControlPending === qIdx;

                  const style = gate
                    ? GATE_STYLE_MAP[gate.gate.toLowerCase()] || {
                        bg: 'bg-[#0f62fe]',
                        text: 'text-white',
                        border: 'border-[#4589ff]',
                        label: gate.gate.toUpperCase(),
                      }
                    : null;

                  return (
                    <div
                      key={sIdx}
                      onClick={() => onCellClick(qIdx, sIdx)}
                      className={`w-10 h-10 rounded flex items-center justify-center cursor-pointer transition-all border ${
                        gate
                          ? 'border-transparent'
                          : isPendingControl
                          ? 'bg-[#1e293b] border-[#0f62fe] border-dashed animate-pulse ring-1 ring-[#0f62fe]'
                          : isArmed
                          ? 'bg-[#1a202c]/30 border-[#393939] border-dashed hover:border-[#0f62fe] hover:bg-[#0f62fe]/10'
                          : 'bg-transparent border-transparent hover:bg-[#262626]/40'
                      }`}
                      title={gate ? `Click to remove ${gate.gate.toUpperCase()}` : ''}
                    >
                      {gate ? (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveGate(gate.id);
                          }}
                          className={`w-9 h-9 rounded-sm border flex flex-col items-center justify-center font-mono font-bold text-xs shadow-md transition-transform hover:scale-105 active:scale-95 ${
                            gate.isControl
                              ? 'bg-[#0f62fe] border-[#4589ff] text-white rounded-full !w-4 !h-4'
                              : gate.isTarget && (gate.gate === 'cx' || gate.gate === 'cnot')
                              ? 'bg-[#0f62fe] border-[#4589ff] text-white rounded-full !w-6 !h-6 text-sm font-bold'
                              : style?.bg + ' ' + style?.text + ' ' + style?.border
                          }`}
                        >
                          {gate.isControl ? (
                            <span className="w-2 h-2 bg-white rounded-full" />
                          ) : gate.isTarget && (gate.gate === 'cx' || gate.gate === 'cnot') ? (
                            <span>⊕</span>
                          ) : (
                            <>
                              <span>{style?.label || gate.gate.toUpperCase()}</span>
                              {gate.params && gate.params.length > 0 && (
                                <span className="text-[7px] font-normal opacity-90 -mt-0.5">
                                  {(gate.params[0] / Math.PI).toFixed(1)}π
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="w-1 h-1 rounded-full bg-[#393939] opacity-40 hover:opacity-100" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Measurement Meter Badge at Wire End */}
              <div className="w-7 h-7 rounded-full border border-[#525252] bg-[#161616] flex items-center justify-center text-gray-400 text-xs font-bold z-10 ml-auto shadow-sm">
                ◓
              </div>
            </div>
          ))}

          {/* Classical Register Wire c[N] */}
          <div className="flex items-center gap-3 relative h-8 pt-2">
            <div className="w-12 text-xs font-mono font-medium text-gray-400 z-10">
              c{numQubits}
            </div>
            <div className="absolute left-14 right-8 top-5 flex flex-col gap-[2px] pointer-events-none">
              <div className="h-[1px] bg-[#393939]" />
              <div className="h-[1px] bg-[#393939]" />
            </div>
          </div>

          {/* SVG Overlay to Draw Control-Target Vertical Connecting Lines */}
          <svg className="absolute top-0 left-16 w-full h-full pointer-events-none z-0">
            {Array.from(connectionsByStep.entries()).map(([sIdx, pairs]) =>
              pairs.map((pair) => {
                const stepWidth = 40 + 12;
                const rowHeight = 40 + 24;
                const x = sIdx * stepWidth + 24;
                const y1 = pair.control * rowHeight + 20;
                const y2 = pair.target * rowHeight + 20;

                return (
                  <line
                    key={pair.id}
                    x1={x}
                    y1={y1}
                    x2={x}
                    y2={y2}
                    stroke="#4589ff"
                    strokeWidth="2"
                  />
                );
              })
            )}
          </svg>
        </div>
      </div>
    </div>
  );
};
