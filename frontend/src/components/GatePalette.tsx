import React, { useState } from 'react';
import { Search, Sliders, RotateCw } from 'lucide-react';

interface GatePaletteProps {
  armedGate: string | null;
  onArmGate: (gate: string, params?: number[]) => void;
  onDisarm: () => void;
  cnotControlPending: number | null;
}

interface OperationButton {
  id: string;
  symbol: string;
  name: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  hasParam?: boolean;
  isMulti?: boolean;
  desc: string;
}

const OPERATIONS_GRID: OperationButton[][] = [
  [
    { id: 'h', symbol: 'H', name: 'Hadamard', bgColor: 'bg-[#da1e28] hover:bg-[#b81921]', textColor: 'text-white', borderColor: 'border-[#fa4d56]', desc: 'Creates equal superposition (|0> + |1>)/√2' },
    { id: 'cnot', symbol: '⊕', name: 'CNOT', bgColor: 'bg-[#0f62fe] hover:bg-[#0043ce]', textColor: 'text-white', borderColor: 'border-[#4589ff]', isMulti: true, desc: 'Controlled-NOT (click control wire then target wire)' },
    { id: 'cz', symbol: '⨂', name: 'CZ', bgColor: 'bg-[#0f62fe] hover:bg-[#0043ce]', textColor: 'text-white', borderColor: 'border-[#4589ff]', isMulti: true, desc: 'Controlled-Phase Flip' },
    { id: 'swap', symbol: '⤭', name: 'SWAP', bgColor: 'bg-[#0f62fe] hover:bg-[#0043ce]', textColor: 'text-white', borderColor: 'border-[#4589ff]', isMulti: true, desc: 'Swaps states of two qubits' },
    { id: 'id', symbol: 'I', name: 'Identity', bgColor: 'bg-[#0f62fe] hover:bg-[#0043ce]', textColor: 'text-white', borderColor: 'border-[#4589ff]', desc: 'Identity (no-op)' },
  ],
  [
    { id: 't', symbol: 'T', name: 'T gate', bgColor: 'bg-[#1192e8] hover:bg-[#0072c3]', textColor: 'text-white', borderColor: 'border-[#33b1ff]', desc: 'π/4 phase shift (Z^(1/4))' },
    { id: 's', symbol: 'S', name: 'Phase S', bgColor: 'bg-[#1192e8] hover:bg-[#0072c3]', textColor: 'text-white', borderColor: 'border-[#33b1ff]', desc: 'π/2 phase shift (Z^(1/2))' },
    { id: 'z', symbol: 'Z', name: 'Pauli-Z', bgColor: 'bg-[#1192e8] hover:bg-[#0072c3]', textColor: 'text-white', borderColor: 'border-[#33b1ff]', desc: 'Phase flip (|1> -> -|1>)' },
    { id: 'tdg', symbol: 'T†', name: 'T dagger', bgColor: 'bg-[#1192e8] hover:bg-[#0072c3]', textColor: 'text-white', borderColor: 'border-[#33b1ff]', desc: '-π/4 phase shift' },
    { id: 'sdg', symbol: 'S†', name: 'S dagger', bgColor: 'bg-[#1192e8] hover:bg-[#0072c3]', textColor: 'text-white', borderColor: 'border-[#33b1ff]', desc: '-π/2 phase shift' },
  ],
  [
    { id: 'p', symbol: 'P', name: 'Phase(λ)', bgColor: 'bg-[#1192e8] hover:bg-[#0072c3]', textColor: 'text-white', borderColor: 'border-[#33b1ff]', hasParam: true, desc: 'Arbitrary phase shift P(λ)' },
    { id: 'rz', symbol: 'RZ', name: 'RZ(θ)', bgColor: 'bg-[#0072c3] hover:bg-[#00539a]', textColor: 'text-white', borderColor: 'border-[#1192e8]', hasParam: true, desc: 'Rotation around Z axis' },
    { id: 'reset', symbol: '|0⟩', name: 'Reset', bgColor: 'bg-[#525252] hover:bg-[#393939]', textColor: 'text-white', borderColor: 'border-[#6f6f6f]', desc: 'Resets qubit to |0>' },
    { id: 'ctrl_dot', symbol: '•', name: 'Control', bgColor: 'bg-[#393939] hover:bg-[#262626]', textColor: 'text-white', borderColor: 'border-[#525252]', desc: 'Control condition' },
    { id: 'sx', symbol: '√X', name: 'Sqrt(X)', bgColor: 'bg-[#d12771] hover:bg-[#9f1853]', textColor: 'text-white', borderColor: 'border-[#ee5396]', desc: 'Square root of NOT' },
  ],
  [
    { id: 'x', symbol: 'X', name: 'Pauli-X', bgColor: 'bg-[#d12771] hover:bg-[#9f1853]', textColor: 'text-white', borderColor: 'border-[#ee5396]', desc: 'Bit flip NOT gate' },
    { id: 'y', symbol: 'Y', name: 'Pauli-Y', bgColor: 'bg-[#d12771] hover:bg-[#9f1853]', textColor: 'text-white', borderColor: 'border-[#ee5396]', desc: 'Bit & phase flip' },
    { id: 'rx', symbol: 'RX', name: 'RX(θ)', bgColor: 'bg-[#d12771] hover:bg-[#9f1853]', textColor: 'text-white', borderColor: 'border-[#ee5396]', hasParam: true, desc: 'Rotation around X axis' },
    { id: 'ry', symbol: 'RY', name: 'RY(θ)', bgColor: 'bg-[#d12771] hover:bg-[#9f1853]', textColor: 'text-white', borderColor: 'border-[#ee5396]', hasParam: true, desc: 'Rotation around Y axis' },
    { id: 'measure', symbol: '◓', name: 'Measure', bgColor: 'bg-[#002d9c] hover:bg-[#001d6c]', textColor: 'text-white', borderColor: 'border-[#0f62fe]', desc: 'Measure qubit into classical register' },
  ],
];

export const GatePalette: React.FC<GatePaletteProps> = ({
  armedGate,
  onArmGate,
  onDisarm,
  cnotControlPending,
}) => {
  const [rotationAngle, setRotationAngle] = useState<number>(Math.PI);
  const [anglePreset, setAnglePreset] = useState<string>('pi');

  const handleAnglePresetChange = (preset: string) => {
    setAnglePreset(preset);
    let val = Math.PI;
    if (preset === 'pi/4') val = Math.PI / 4;
    else if (preset === 'pi/2') val = Math.PI / 2;
    else if (preset === 'pi') val = Math.PI;
    else if (preset === '3pi/2') val = (3 * Math.PI) / 2;
    else if (preset === '2pi') val = 2 * Math.PI;
    setRotationAngle(val);

    if (armedGate && ['rx', 'ry', 'rz', 'p'].includes(armedGate)) {
      onArmGate(armedGate, [val]);
    }
  };

  const handleGateClick = (gate: OperationButton) => {
    if (armedGate === gate.id) {
      onDisarm();
    } else {
      const params = gate.hasParam ? [rotationAngle] : undefined;
      onArmGate(gate.id, params);
    }
  };

  return (
    <div className="bg-[#161616] border border-[#393939] rounded-lg p-3 flex flex-col gap-3 shadow-xl select-none">
      {/* Header matching IBM Composer */}
      <div className="flex items-center justify-between border-b border-[#262626] pb-2 px-1">
        <span className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Operations</span>
        <div className="flex items-center gap-2 text-gray-400">
          <Search className="w-3.5 h-3.5 hover:text-gray-200 cursor-pointer" />
          <Sliders className="w-3.5 h-3.5 hover:text-gray-200 cursor-pointer" />
        </div>
      </div>

      {/* Armed Gate Status Badge */}
      {armedGate && (
        <div className="p-2 rounded bg-[#1e293b] border border-[#0f62fe] text-xs text-blue-200 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-blue-300">Armed: {armedGate.toUpperCase()}</span>
            <button
              onClick={onDisarm}
              className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/60 text-red-300 hover:bg-red-800"
            >
              Cancel
            </button>
          </div>
          <span className="text-[10px] text-gray-300">
            {armedGate === 'cnot' || armedGate === 'cz' || armedGate === 'swap'
              ? cnotControlPending !== null
                ? `Control Q${cnotControlPending} set! Click target wire.`
                : 'Click control wire cell.'
              : 'Click any cell on the circuit wire.'}
          </span>
        </div>
      )}

      {/* Param Angle Preset for RX, RY, RZ, P */}
      {armedGate && ['rx', 'ry', 'rz', 'p'].includes(armedGate) && (
        <div className="p-2 bg-[#1f242b] rounded border border-[#393939] flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] text-gray-300">
            <span className="flex items-center gap-1 font-mono">
              <RotateCw className="w-3 h-3 text-cyan-400" /> θ:
            </span>
            <span className="font-mono text-cyan-400 font-bold">{(rotationAngle / Math.PI).toFixed(2)}π</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {['pi/4', 'pi/2', 'pi', '2pi'].map((p) => (
              <button
                key={p}
                onClick={() => handleAnglePresetChange(p)}
                className={`text-[10px] py-0.5 rounded font-mono border transition-all ${
                  anglePreset === p
                    ? 'bg-[#0f62fe] border-[#4589ff] text-white font-bold'
                    : 'bg-[#262626] border-[#393939] text-gray-300 hover:bg-[#393939]'
                }`}
              >
                {p === 'pi' ? 'π' : p.replace('pi', 'π')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Compact Grid of Operation Tiles */}
      <div className="flex flex-col gap-1.5">
        {OPERATIONS_GRID.map((row, rIdx) => (
          <div key={rIdx} className="grid grid-cols-5 gap-1.5">
            {row.map((gate) => {
              const isArmed = armedGate === gate.id;
              return (
                <button
                  key={gate.id}
                  onClick={() => handleGateClick(gate)}
                  title={`${gate.name}: ${gate.desc}`}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-sm border flex items-center justify-center font-mono font-bold text-xs sm:text-sm transition-all transform active:scale-95 cursor-pointer shadow-md ${
                    gate.bgColor
                  } ${gate.textColor} ${gate.borderColor} ${
                    isArmed ? 'ring-2 ring-white scale-105 z-10' : 'opacity-90 hover:opacity-100'
                  }`}
                >
                  {gate.symbol}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
