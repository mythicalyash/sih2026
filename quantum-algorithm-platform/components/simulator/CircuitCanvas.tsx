'use client'

import React, { useState } from 'react';
import type { PlacedGate } from '@/types/quantum';
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
  onDropGate: (gate: string, qubit: number, step: number, params?: number[]) => void;
  onMoveGate: (gateId: string, targetQubit: number, targetStep: number) => void;
}

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
  onDropGate,
  onMoveGate,
}) => {
  const [inspectMode, setInspectMode] = useState<boolean>(false);
  const [dragOverCell, setDragOverCell] = useState<{ qubit: number; step: number } | null>(null);

  const cellMap = new Map<string, PlacedGate>();
  gates.forEach((g) => {
    cellMap.set(`${g.qubit}-${g.step}`, g);
  });

  const connectionsByStep = new Map<number, { control: number; target: number; id: string; gate: string }[]>();
  gates.forEach((g) => {
    if (g.isTarget && g.controlQubit !== undefined) {
      const list = connectionsByStep.get(g.step) || [];
      list.push({ control: g.controlQubit, target: g.qubit, id: g.id, gate: g.gate });
      connectionsByStep.set(g.step, list);
    }
  });

  const handleCellDragOver = (e: React.DragEvent<HTMLDivElement>, qubit: number, step: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!dragOverCell || dragOverCell.qubit !== qubit || dragOverCell.step !== step) {
      setDragOverCell({ qubit, step });
    }
  };

  const handleCellDragLeave = (e: React.DragEvent<HTMLDivElement>, qubit: number, step: number) => {
    if (dragOverCell?.qubit === qubit && dragOverCell?.step === step) {
      setDragOverCell(null);
    }
  };

  const handleCellDrop = (e: React.DragEvent<HTMLDivElement>, targetQubit: number, targetStep: number) => {
    e.preventDefault();
    setDragOverCell(null);
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (raw) {
        const data = JSON.parse(raw);
        if (data.source === 'palette' || data.gate) {
          onDropGate(data.gate, targetQubit, targetStep, data.params);
          return;
        } else if (data.source === 'canvas') {
          onMoveGate(data.gateId, targetQubit, targetStep);
          return;
        }
      }
      const textRaw = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text');
      if (textRaw) {
        onDropGate(textRaw.toLowerCase(), targetQubit, targetStep);
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  const handleGateDragStart = (e: React.DragEvent<HTMLDivElement>, gate: PlacedGate) => {
    e.stopPropagation();
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        source: 'canvas',
        gateId: gate.id,
        gate: gate.gate,
        qubit: gate.qubit,
        step: gate.step,
      })
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="bg-[#fffdf9] border border-[#ded7cb] rounded-lg p-3 sm:p-4 flex flex-col gap-3 shadow-sm select-none">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ded7cb] pb-2.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1.5 rounded hover:bg-[#eee9df] disabled:opacity-30 text-[#746e64] hover:text-[#211f1b] transition-colors cursor-pointer"
              title="Undo"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              disabled
              className="p-1.5 rounded hover:bg-[#eee9df] opacity-30 text-[#746e64] cursor-not-allowed"
              title="Redo"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-[1px] bg-[#ded7cb]" />

          <div className="flex items-center gap-1 text-xs text-[#211f1b] px-2 py-1 rounded bg-[#f0ece4] border border-[#ded7cb] cursor-pointer">
            <span>Left alignment</span>
            <ChevronDown className="w-3 h-3 text-[#746e64]" />
          </div>

          <div className="h-4 w-[1px] bg-[#ded7cb]" />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setInspectMode(!inspectMode)}
              className={`w-7 h-4 rounded-full transition-colors relative cursor-pointer ${
                inspectMode ? 'bg-[#c96b2c]' : 'bg-[#ded7cb]'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                  inspectMode ? 'translate-x-3' : ''
                }`}
              />
            </button>
            <span className="text-xs text-[#746e64]">Inspect</span>
          </div>

          <span className="hidden sm:inline-block text-[11px] text-[#746e64] italic ml-2">
            Drag gates from palette or click to place
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#f0ece4] px-2 py-1 rounded border border-[#ded7cb] text-xs">
            <span className="text-[#746e64]">Qubits:</span>
            <button
              onClick={() => onNumQubitsChange(Math.max(2, numQubits - 1))}
              disabled={numQubits <= 2}
              className="p-0.5 rounded text-[#211f1b] hover:text-[#c96b2c] disabled:opacity-30 cursor-pointer"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-mono font-bold text-[#211f1b] px-1">{numQubits}</span>
            <button
              onClick={() => onNumQubitsChange(Math.min(5, numQubits + 1))}
              disabled={numQubits >= 5}
              className="p-0.5 rounded text-[#211f1b] hover:text-[#c96b2c] disabled:opacity-30 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={onAddStep}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-[#f0ece4] hover:bg-[#eee9df] text-[#211f1b] border border-[#ded7cb] transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3 text-[#c96b2c]" />
            <span>Step</span>
          </button>

          <button
            onClick={onClear}
            disabled={gates.length === 0}
            className="p-1.5 rounded hover:bg-[#fce8e6] disabled:opacity-30 text-[#746e64] hover:text-[#c5221f] transition-colors cursor-pointer"
            title="Clear all gates"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative overflow-x-auto p-4 bg-[#f7f4ee] rounded-md border border-[#ded7cb] min-h-[260px]">
        <div className="flex ml-16 mb-2 gap-3 min-w-max">
          {Array.from({ length: numSteps }).map((_, sIdx) => (
            <div key={sIdx} className="w-10 text-center font-mono text-[9px] text-[#746e64]">
              {sIdx}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-6 min-w-max relative">
          {Array.from({ length: numQubits }).map((_, qIdx) => (
            <div key={qIdx} className="flex items-center gap-3 relative h-10">
              <div className="w-12 text-xs font-mono font-semibold text-[#211f1b] z-10">
                q[{qIdx}]
              </div>

              <div className="absolute left-14 right-8 h-[1.5px] bg-[#c8c1b4] z-0 pointer-events-none" />

              <div className="flex gap-3 relative z-10 pl-2">
                {Array.from({ length: numSteps }).map((_, sIdx) => {
                  const key = `${qIdx}-${sIdx}`;
                  const gate = cellMap.get(key);
                  const isArmed = armedGate !== null;
                  const isPendingControl =
                    (armedGate === 'cnot' || armedGate === 'cz' || armedGate === 'swap') &&
                    cnotControlPending === qIdx;
                  const isDragOver =
                    dragOverCell?.qubit === qIdx && dragOverCell?.step === sIdx;

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
                      onDragOver={(e) => handleCellDragOver(e, qIdx, sIdx)}
                      onDragLeave={(e) => handleCellDragLeave(e, qIdx, sIdx)}
                      onDrop={(e) => handleCellDrop(e, qIdx, sIdx)}
                      className={`w-10 h-10 rounded flex items-center justify-center cursor-pointer transition-all border ${
                        isDragOver
                          ? 'bg-[#fff5eb] border-[#c96b2c] border-2 border-dashed scale-110 shadow-md ring-2 ring-[#c96b2c]/30 z-20'
                          : gate
                          ? 'border-transparent'
                          : isPendingControl
                          ? 'bg-[#fff5eb] border-[#c96b2c] border-dashed animate-pulse ring-2 ring-[#c96b2c]'
                          : isArmed
                          ? 'bg-[#fffdf9] border-[#c8c1b4] border-dashed hover:border-[#c96b2c] hover:bg-[#fff5eb]/40'
                          : 'bg-transparent border-transparent hover:bg-[#ded7cb]/40'
                      }`}
                      title={gate ? `Drag to move or click to remove ${gate.gate.toUpperCase()}` : 'Drop or click gate here'}
                    >
                      {gate ? (
                        <div
                          draggable={true}
                          onDragStart={(e) => handleGateDragStart(e, gate)}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveGate(gate.id);
                          }}
                          className={`w-9 h-9 rounded-sm border flex flex-col items-center justify-center font-mono font-bold text-xs shadow-md transition-all cursor-grab active:cursor-grabbing hover:scale-105 active:scale-95 ${
                            gate.isControl
                              ? 'bg-[#0f62fe] border-[#0043ce] text-white rounded-full !w-4 !h-4'
                              : gate.isTarget && (gate.gate === 'cx' || gate.gate === 'cnot')
                              ? 'bg-[#0f62fe] border-[#0043ce] text-white rounded-full !w-6 !h-6 text-sm font-bold'
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
                      ) : isDragOver ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#c96b2c] animate-ping" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#c8c1b4] opacity-60 hover:opacity-100" />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="w-7 h-7 rounded-full border border-[#ded7cb] bg-[#fffdf9] flex items-center justify-center text-[#746e64] text-xs font-bold z-10 ml-auto shadow-sm">
                ◓
              </div>
            </div>
          ))}

          <div className="flex items-center gap-3 relative h-8 pt-2">
            <div className="w-12 text-xs font-mono font-semibold text-[#746e64] z-10">
              c{numQubits}
            </div>
            <div className="absolute left-14 right-8 top-5 flex flex-col gap-[2px] pointer-events-none">
              <div className="h-[1px] bg-[#c8c1b4]" />
              <div className="h-[1px] bg-[#c8c1b4]" />
            </div>
          </div>

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
                    stroke="#0f62fe"
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
