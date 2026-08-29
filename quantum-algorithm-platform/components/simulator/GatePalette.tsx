'use client'

import React, { useState } from 'react';
import { Search, RotateCw, X } from 'lucide-react';

interface GatePaletteProps {
  armedGate: string | null;
  onArmGate: (gate: string, params?: number[]) => void;
  onDisarm: () => void;
  cnotControlPending: number | null;
}

export interface OperationButton {
  id: string;
  symbol: string;
  name: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  hasParam?: boolean;
  paramCount?: number;
  isMulti?: boolean;
  desc: string;
}

export const EXACT_OPERATIONS: OperationButton[] = [
  // Row 1: H, CNOT, CZ, CCX, SWAP, I
  { id: 'h', symbol: 'H', name: 'Hadamard', bgColor: 'bg-[#fa4d56] hover:bg-[#da1e28]', textColor: 'text-white', borderColor: 'border-[#fa4d56]', desc: 'Creates equal superposition (|0> + |1>)/√2' },
  { id: 'cnot', symbol: '⊕', name: 'CNOT', bgColor: 'bg-[#0f62fe] hover:bg-[#0043ce]', textColor: 'text-white', borderColor: 'border-[#4589ff]', isMulti: true, desc: 'Controlled-NOT' },
  { id: 'cz', symbol: '⨂', name: 'CZ', bgColor: 'bg-[#0f62fe] hover:bg-[#0043ce]', textColor: 'text-white', borderColor: 'border-[#4589ff]', isMulti: true, desc: 'Controlled-Phase Flip' },
  { id: 'ccx', symbol: 'CCX', name: 'Toffoli', bgColor: 'bg-[#0f62fe] hover:bg-[#0043ce]', textColor: 'text-white', borderColor: 'border-[#4589ff]', isMulti: true, desc: 'Toffoli (Controlled-Controlled-NOT)' },
  { id: 'swap', symbol: '⤭', name: 'SWAP', bgColor: 'bg-[#0f62fe] hover:bg-[#0043ce]', textColor: 'text-white', borderColor: 'border-[#4589ff]', isMulti: true, desc: 'Swaps states of two qubits' },
  { id: 'id', symbol: 'I', name: 'Identity', bgColor: 'bg-[#0f62fe] hover:bg-[#0043ce]', textColor: 'text-white', borderColor: 'border-[#4589ff]', desc: 'Identity no-op wire spacer' },

  // Row 2: T, S, Z, T†, S†, P
  { id: 't', symbol: 'T', name: 'T gate', bgColor: 'bg-[#a6c8ff] hover:bg-[#78a9ff]', textColor: 'text-[#002d9c]', borderColor: 'border-[#78a9ff]', desc: 'π/4 phase shift (Z^0.25)' },
  { id: 's', symbol: 'S', name: 'Phase S', bgColor: 'bg-[#a6c8ff] hover:bg-[#78a9ff]', textColor: 'text-[#002d9c]', borderColor: 'border-[#78a9ff]', desc: 'π/2 phase shift (Z^0.5)' },
  { id: 'z', symbol: 'Z', name: 'Pauli-Z', bgColor: 'bg-[#a6c8ff] hover:bg-[#78a9ff]', textColor: 'text-[#002d9c]', borderColor: 'border-[#78a9ff]', desc: 'Phase flip (|1> -> -|1>)' },
  { id: 'tdg', symbol: 'T†', name: 'T dagger', bgColor: 'bg-[#a6c8ff] hover:bg-[#78a9ff]', textColor: 'text-[#002d9c]', borderColor: 'border-[#78a9ff]', desc: '-π/4 phase shift (Z^-0.25)' },
  { id: 'sdg', symbol: 'S†', name: 'S dagger', bgColor: 'bg-[#a6c8ff] hover:bg-[#78a9ff]', textColor: 'text-[#002d9c]', borderColor: 'border-[#78a9ff]', desc: '-π/2 phase shift (Z^-0.5)' },
  { id: 'p', symbol: 'P', name: 'Phase(λ)', bgColor: 'bg-[#a6c8ff] hover:bg-[#78a9ff]', textColor: 'text-[#002d9c]', borderColor: 'border-[#78a9ff]', hasParam: true, desc: 'Arbitrary phase shift P(λ)' },

  // Row 3: RZ, Measure, Reset, Barrier, Control, QFT/box
  { id: 'rz', symbol: 'RZ', name: 'RZ(θ)', bgColor: 'bg-[#a6c8ff] hover:bg-[#78a9ff]', textColor: 'text-[#002d9c]', borderColor: 'border-[#78a9ff]', hasParam: true, desc: 'Rotation around Z axis by angle θ' },
  { id: 'measure', symbol: '◓', name: 'Measure', bgColor: 'bg-[#8d8d8d] hover:bg-[#6f6f6f]', textColor: 'text-white', borderColor: 'border-[#8d8d8d]', desc: 'Measure qubit into classical register' },
  { id: 'reset', symbol: '|0⟩', name: 'Reset', bgColor: 'bg-[#8d8d8d] hover:bg-[#6f6f6f]', textColor: 'text-white', borderColor: 'border-[#8d8d8d]', desc: 'Resets qubit to |0>' },
  { id: 'barrier', symbol: '┆', name: 'Barrier', bgColor: 'bg-[#8d8d8d] hover:bg-[#6f6f6f]', textColor: 'text-white', borderColor: 'border-[#8d8d8d]', desc: 'Visual synchronization barrier' },
  { id: 'ctrl_dot', symbol: '•', name: 'Control', bgColor: 'bg-[#8d8d8d] hover:bg-[#6f6f6f]', textColor: 'text-white', borderColor: 'border-[#8d8d8d]', desc: 'Control condition' },
  { id: 'qft', symbol: 'box', name: 'QFT Box', bgColor: 'bg-[#8d8d8d] hover:bg-[#6f6f6f]', textColor: 'text-white', borderColor: 'border-[#8d8d8d]', desc: 'Quantum Fourier Transform subroutine box' },

  // Row 4: X, Y, √X, RX, RY, U
  { id: 'x', symbol: 'X', name: 'Pauli-X', bgColor: 'bg-[#ff7eb6] hover:bg-[#ee5396]', textColor: 'text-[#670038]', borderColor: 'border-[#ee5396]', desc: 'Bit flip NOT gate' },
  { id: 'y', symbol: 'Y', name: 'Pauli-Y', bgColor: 'bg-[#ff7eb6] hover:bg-[#ee5396]', textColor: 'text-[#670038]', borderColor: 'border-[#ee5396]', desc: 'Bit and phase flip' },
  { id: 'sx', symbol: '√X', name: 'Sqrt(X)', bgColor: 'bg-[#ff7eb6] hover:bg-[#ee5396]', textColor: 'text-[#670038]', borderColor: 'border-[#ee5396]', desc: 'Square root of NOT (X^0.5)' },
  { id: 'rx', symbol: 'RX', name: 'RX(θ)', bgColor: 'bg-[#ff7eb6] hover:bg-[#ee5396]', textColor: 'text-[#670038]', borderColor: 'border-[#ee5396]', hasParam: true, desc: 'Rotation around X axis' },
  { id: 'ry', symbol: 'RY', name: 'RY(θ)', bgColor: 'bg-[#ff7eb6] hover:bg-[#ee5396]', textColor: 'text-[#670038]', borderColor: 'border-[#ee5396]', hasParam: true, desc: 'Rotation around Y axis' },
  { id: 'u', symbol: 'U', name: 'U(θ,φ,λ)', bgColor: 'bg-[#ff7eb6] hover:bg-[#ee5396]', textColor: 'text-[#670038]', borderColor: 'border-[#ee5396]', hasParam: true, paramCount: 3, desc: 'Universal 3-parameter unitary' },

  // Row 5: Phase Disk, Anti-CNOT
  { id: 'prob_0', symbol: '◐', name: 'Phase Disk', bgColor: 'bg-[#002d9c] hover:bg-[#001d6c]', textColor: 'text-[#78a9ff]', borderColor: 'border-[#0f62fe]', desc: 'Phase state probability disk visualizer' },
  { id: 'ncx', symbol: '⊖', name: 'Anti-CNOT', bgColor: 'bg-[#0f62fe] hover:bg-[#0043ce]', textColor: 'text-white', borderColor: 'border-[#4589ff]', isMulti: true, desc: 'Zero-controlled NOT' },
];

export const GatePalette: React.FC<GatePaletteProps> = ({
  armedGate,
  onArmGate,
  onDisarm,
  cnotControlPending,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchInput, setShowSearchInput] = useState<boolean>(false);

  const [rotationAngle, setRotationAngle] = useState<number>(Math.PI);
  const [anglePreset, setAnglePreset] = useState<string>('pi');

  const displayedGates = EXACT_OPERATIONS.filter((gate) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      gate.name.toLowerCase().includes(q) ||
      gate.symbol.toLowerCase().includes(q) ||
      gate.id.toLowerCase().includes(q)
    );
  });

  const handleAnglePresetChange = (preset: string) => {
    setAnglePreset(preset);
    let val = Math.PI;
    if (preset === 'pi/4') val = Math.PI / 4;
    else if (preset === 'pi/2') val = Math.PI / 2;
    else if (preset === 'pi') val = Math.PI;
    else if (preset === '3pi/2') val = (3 * Math.PI) / 2;
    else if (preset === '2pi') val = 2 * Math.PI;
    setRotationAngle(val);

    if (armedGate && ['rx', 'ry', 'rz', 'p', 'u'].includes(armedGate)) {
      onArmGate(armedGate, armedGate === 'u' ? [val, 0, 0] : [val]);
    }
  };

  const handleGateClick = (gate: OperationButton) => {
    if (armedGate === gate.id) {
      onDisarm();
    } else {
      const params = gate.hasParam
        ? gate.paramCount === 3
          ? [rotationAngle, 0, 0]
          : [rotationAngle]
        : undefined;
      onArmGate(gate.id, params);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, gate: OperationButton) => {
    const params = gate.hasParam
      ? gate.paramCount === 3
        ? [rotationAngle, 0, 0]
        : [rotationAngle]
      : undefined;
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        source: 'palette',
        gate: gate.id,
        symbol: gate.symbol,
        params,
      })
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="bg-[#fffdf9] border border-[#ded7cb] rounded-lg p-2.5 flex flex-col h-full shadow-sm select-none gap-2 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#ded7cb] pb-1.5 px-0.5 shrink-0">
        <span className="text-[11px] font-semibold text-[#211f1b] uppercase tracking-wider">Operations</span>
        <div className="flex items-center gap-1.5 text-[#746e64]">
          <button
            onClick={() => setShowSearchInput((prev) => !prev)}
            className={`p-1 rounded hover:bg-[#eee9df] hover:text-[#211f1b] transition-colors cursor-pointer ${
              showSearchInput || searchQuery ? 'bg-[#eee9df] text-[#c96b2c]' : ''
            }`}
            title="Search operations"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Search Input */}
      {showSearchInput && (
        <div className="relative shrink-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter operations..."
            className="w-full bg-[#f7f4ee] border border-[#ded7cb] rounded px-2 py-1 text-[11px] text-[#211f1b] placeholder-[#746e64] focus:outline-none focus:border-[#c96b2c]"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#746e64] hover:text-[#211f1b]"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Armed Gate Status */}
      {armedGate && (
        <div className="p-1.5 rounded bg-[#fff5eb] border border-[#c96b2c] text-[10.5px] text-[#9a4214] flex flex-col gap-0.5 shrink-0 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#9a4214]">Armed: {armedGate.toUpperCase()}</span>
            <button
              onClick={onDisarm}
              className="text-[9px] px-1.5 py-0.2 rounded bg-[#fce8e6] text-[#c5221f] border border-[#ea4335] hover:bg-[#fbd0cb] cursor-pointer"
            >
              Cancel
            </button>
          </div>
          <span className="text-[9px] text-[#746e64] truncate">
            {['cnot', 'ncx', 'cz', 'swap'].includes(armedGate)
              ? cnotControlPending !== null
                ? `Control Q${cnotControlPending} set! Click target.`
                : 'Click control wire first.'
              : 'Click or drag onto wire.'}
          </span>
        </div>
      )}

      {/* Rotation Parameter Presets */}
      {armedGate && ['rx', 'ry', 'rz', 'p', 'u'].includes(armedGate) && (
        <div className="p-1.5 bg-[#f0ece4] rounded border border-[#ded7cb] flex flex-col gap-1 shrink-0 animate-fade-in">
          <div className="flex items-center justify-between text-[10px] text-[#211f1b]">
            <span className="flex items-center gap-1 font-mono">
              <RotateCw className="w-3 h-3 text-[#c96b2c]" /> θ:
            </span>
            <span className="font-mono text-[#c96b2c] font-bold">{(rotationAngle / Math.PI).toFixed(2)}π</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {['pi/4', 'pi/2', 'pi', '2pi'].map((p) => (
              <button
                key={p}
                onClick={() => handleAnglePresetChange(p)}
                className={`text-[9px] py-0.5 rounded font-mono border transition-all cursor-pointer ${
                  anglePreset === p
                    ? 'bg-[#c96b2c] border-[#c96b2c] text-white font-bold'
                    : 'bg-[#fffdf9] border-[#ded7cb] text-[#211f1b] hover:bg-[#eee9df]'
                }`}
              >
                {p === 'pi' ? 'π' : p.replace('pi', 'π')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Operation Grid: 6 columns matching IBM Composer */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-6 gap-1 auto-rows-max">
          {displayedGates.map((gate) => {
            const isArmed = armedGate === gate.id;
            return (
              <button
                key={gate.id}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, gate)}
                onClick={() => handleGateClick(gate)}
                title={`${gate.name}: ${gate.desc} (Click or Drag & Drop)`}
                className={`w-full aspect-square max-w-[38px] max-h-[38px] mx-auto rounded-sm border flex items-center justify-center font-mono font-bold text-[11px] transition-all transform active:scale-95 cursor-grab active:cursor-grabbing shadow-xs ${
                  gate.bgColor
                } ${gate.textColor} ${gate.borderColor} ${
                  isArmed ? 'ring-2 ring-[#211f1b] scale-105 z-10' : 'opacity-90 hover:opacity-100 hover:scale-105'
                }`}
              >
                {gate.symbol}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-1 border-t border-[#ded7cb]/70 flex items-center justify-between text-[9px] text-[#746e64] font-mono shrink-0">
        <span>{displayedGates.length} Operations</span>
        <span className="text-[#c96b2c] font-medium">Drag & Drop</span>
      </div>
    </div>
  );
};

