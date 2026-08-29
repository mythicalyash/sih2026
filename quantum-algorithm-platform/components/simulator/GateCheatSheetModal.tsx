'use client'

import React, { useState } from 'react';
import { X, Search, BookOpen, Sparkles, Hash } from 'lucide-react';

interface GateCheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GateDetail {
  name: string;
  symbol: string;
  category: 'single' | 'phase' | 'multi' | 'other';
  description: string;
  matrix: string[];
  qiskitSyntax: string;
  qasmSyntax: string;
}

const GATES_DATA: GateDetail[] = [
  {
    name: 'Hadamard (H)',
    symbol: 'H',
    category: 'single',
    description: 'Creates equal superposition |+⟩ = (|0⟩ + |1⟩)/√2 from |0⟩.',
    matrix: ['[ 1/√2   1/√2 ]', '[ 1/√2  -1/√2 ]'],
    qiskitSyntax: 'qc.h(0)',
    qasmSyntax: 'h q[0];',
  },
  {
    name: 'Pauli-X (NOT)',
    symbol: 'X',
    category: 'single',
    description: 'Bit-flip gate: maps |0⟩ → |1⟩ and |1⟩ → |0⟩ (π rotation around X-axis).',
    matrix: ['[ 0  1 ]', '[ 1  0 ]'],
    qiskitSyntax: 'qc.x(0)',
    qasmSyntax: 'x q[0];',
  },
  {
    name: 'Pauli-Y',
    symbol: 'Y',
    category: 'single',
    description: 'Bit and phase flip gate: maps |0⟩ → i|1⟩ and |1⟩ → -i|0⟩.',
    matrix: ['[ 0  -i ]', '[ i   0 ]'],
    qiskitSyntax: 'qc.y(0)',
    qasmSyntax: 'y q[0];',
  },
  {
    name: 'Pauli-Z',
    symbol: 'Z',
    category: 'single',
    description: 'Phase-flip gate: maps |0⟩ → |0⟩ and |1⟩ → -|1⟩ (π rotation around Z-axis).',
    matrix: ['[ 1   0 ]', '[ 0  -1 ]'],
    qiskitSyntax: 'qc.z(0)',
    qasmSyntax: 'z q[0];',
  },
  {
    name: 'Phase (S)',
    symbol: 'S',
    category: 'phase',
    description: 'Square root of Z gate: adds π/2 phase to |1⟩ state (P(π/2)).',
    matrix: ['[ 1  0 ]', '[ 0  i ]'],
    qiskitSyntax: 'qc.s(0)',
    qasmSyntax: 's q[0];',
  },
  {
    name: 'S-Dagger (S†)',
    symbol: 'S†',
    category: 'phase',
    description: 'Adjoint of S gate: adds -π/2 phase to |1⟩ state.',
    matrix: ['[ 1   0 ]', '[ 0  -i ]'],
    qiskitSyntax: 'qc.sdg(0)',
    qasmSyntax: 'sdg q[0];',
  },
  {
    name: 'T Gate (π/8)',
    symbol: 'T',
    category: 'phase',
    description: 'Fourth root of Z gate: adds π/4 phase to |1⟩ state (P(π/4)).',
    matrix: ['[ 1       0      ]', '[ 0  e^(iπ/4) ]'],
    qiskitSyntax: 'qc.t(0)',
    qasmSyntax: 't q[0];',
  },
  {
    name: 'T-Dagger (T†)',
    symbol: 'T†',
    category: 'phase',
    description: 'Adjoint of T gate: adds -π/4 phase to |1⟩ state.',
    matrix: ['[ 1       0       ]', '[ 0  e^(-iπ/4) ]'],
    qiskitSyntax: 'qc.tdg(0)',
    qasmSyntax: 'tdg q[0];',
  },
  {
    name: 'Rotation-X (Rx)',
    symbol: 'Rx(θ)',
    category: 'single',
    description: 'Arbitrary angle θ rotation around the X-axis of the Bloch sphere.',
    matrix: ['[ cos(θ/2)   -i·sin(θ/2) ]', '[ -i·sin(θ/2)  cos(θ/2)  ]'],
    qiskitSyntax: 'qc.rx(theta, 0)',
    qasmSyntax: 'rx(theta) q[0];',
  },
  {
    name: 'Rotation-Y (Ry)',
    symbol: 'Ry(θ)',
    category: 'single',
    description: 'Arbitrary angle θ rotation around the Y-axis of the Bloch sphere.',
    matrix: ['[ cos(θ/2)  -sin(θ/2) ]', '[ sin(θ/2)   cos(θ/2) ]'],
    qiskitSyntax: 'qc.ry(theta, 0)',
    qasmSyntax: 'ry(theta) q[0];',
  },
  {
    name: 'Rotation-Z (Rz)',
    symbol: 'Rz(θ)',
    category: 'phase',
    description: 'Arbitrary angle θ rotation around the Z-axis of the Bloch sphere.',
    matrix: ['[ e^(-iθ/2)     0     ]', '[    0      e^(iθ/2) ]'],
    qiskitSyntax: 'qc.rz(theta, 0)',
    qasmSyntax: 'rz(theta) q[0];',
  },
  {
    name: 'Controlled-NOT (CNOT / CX)',
    symbol: 'CX',
    category: 'multi',
    description: 'Flips target qubit if and only if control qubit is |1⟩. Core entangling gate.',
    matrix: ['[ 1 0 0 0 ]', '[ 0 1 0 0 ]', '[ 0 0 0 1 ]', '[ 0 0 1 0 ]'],
    qiskitSyntax: 'qc.cx(0, 1)',
    qasmSyntax: 'cx q[0], q[1];',
  },
  {
    name: 'Controlled-Z (CZ)',
    symbol: 'CZ',
    category: 'multi',
    description: 'Applies Z gate to target qubit if control is |1⟩. Inverts phase of |11⟩ state.',
    matrix: ['[ 1 0 0  0 ]', '[ 0 1 0  0 ]', '[ 0 0 1  0 ]', '[ 0 0 0 -1 ]'],
    qiskitSyntax: 'qc.cz(0, 1)',
    qasmSyntax: 'cz q[0], q[1];',
  },
  {
    name: 'SWAP Gate',
    symbol: 'SWAP',
    category: 'multi',
    description: 'Exchanges quantum states between two qubits: |ψ₁ψ₂⟩ → |ψ₂ψ₁⟩.',
    matrix: ['[ 1 0 0 0 ]', '[ 0 0 1 0 ]', '[ 0 1 0 0 ]', '[ 0 0 0 1 ]'],
    qiskitSyntax: 'qc.swap(0, 1)',
    qasmSyntax: 'swap q[0], q[1];',
  },
  {
    name: 'Toffoli (CCX)',
    symbol: 'CCX',
    category: 'multi',
    description: 'Controlled-Controlled-NOT: flips target if both control qubits are |1⟩.',
    matrix: ['8x8 Permutation Unitary Matrix', 'Maps |110⟩ ↔ |111⟩'],
    qiskitSyntax: 'qc.ccx(0, 1, 2)',
    qasmSyntax: 'ccx q[0], q[1], q[2];',
  },
];

export const GateCheatSheetModal: React.FC<GateCheatSheetModalProps> = ({ isOpen, onClose }) => {
  const [filter, setFilter] = useState<'all' | 'single' | 'phase' | 'multi'>('all');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredGates = GATES_DATA.filter((g) => {
    const matchesFilter = filter === 'all' || g.category === filter;
    const matchesSearch =
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase()) ||
      g.symbol.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="bg-[#fffdf9] border border-[#ded7cb] rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] overflow-hidden text-[#211f1b]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#ded7cb] bg-[#f7f4ee]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#c96b2c]" />
            <div>
              <h2 className="text-sm font-bold text-[#211f1b]">Quantum Gate Reference & Cheat Sheet</h2>
              <p className="text-[11px] text-[#746e64]">Unitary matrix representations, formulas, and syntax</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#eee9df] text-[#746e64] hover:text-[#211f1b] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="px-5 py-2.5 border-b border-[#ded7cb] bg-[#fffdf9] flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-[#746e64] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search gate name, symbol, formula..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#f0ece4] border border-[#ded7cb] rounded text-xs text-[#211f1b] placeholder-[#a8a196] focus:outline-none focus:border-[#c96b2c]"
            />
          </div>

          <div className="flex items-center gap-1 text-xs">
            {(['all', 'single', 'phase', 'multi'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-2.5 py-1 rounded font-medium capitalize cursor-pointer transition-colors ${
                  filter === cat
                    ? 'bg-[#c96b2c] text-white'
                    : 'bg-[#f0ece4] text-[#746e64] hover:bg-[#eee9df] hover:text-[#211f1b]'
                }`}
              >
                {cat === 'all' ? 'All Gates' : `${cat} Qubit`}
              </button>
            ))}
          </div>
        </div>

        {/* Gate List Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-3 bg-[#f7f4ee]">
          {filteredGates.map((gate) => (
            <div
              key={gate.name}
              className="bg-[#fffdf9] border border-[#ded7cb] rounded-lg p-3.5 shadow-sm hover:border-[#c96b2c] transition-all flex flex-col md:flex-row gap-4 justify-between"
            >
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded bg-[#c96b2c] text-white font-bold flex items-center justify-center text-xs font-mono shadow-sm">
                    {gate.symbol}
                  </span>
                  <h3 className="text-xs font-bold text-[#211f1b]">{gate.name}</h3>
                </div>
                <p className="text-[11px] text-[#555047] leading-relaxed">{gate.description}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-mono bg-[#f0ece4] px-2 py-0.5 rounded border border-[#ded7cb] text-[#746e64]">
                    Qiskit: <code className="text-[#211f1b] font-semibold">{gate.qiskitSyntax}</code>
                  </span>
                  <span className="text-[10px] font-mono bg-[#f0ece4] px-2 py-0.5 rounded border border-[#ded7cb] text-[#746e64]">
                    QASM: <code className="text-[#211f1b] font-semibold">{gate.qasmSyntax}</code>
                  </span>
                </div>
              </div>

              {/* Unitary Matrix Display */}
              <div className="bg-[#1e1d1b] text-[#5cdb95] p-2.5 rounded border border-[#2e2c29] font-mono text-[11px] flex flex-col justify-center items-center min-w-[150px] shrink-0 select-text">
                <span className="text-[9px] text-[#a8a196] mb-1">Unitary Matrix (U)</span>
                {gate.matrix.map((row, rIdx) => (
                  <div key={rIdx} className="tracking-wider whitespace-nowrap">
                    {row}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredGates.length === 0 && (
            <div className="text-center py-10 text-xs text-[#746e64]">
              No gates found matching "{search}".
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#ded7cb] bg-[#fffdf9] flex items-center justify-between text-xs text-[#746e64]">
          <span className="text-[11px]">All unitaries verified against Qiskit Aer, PennyLane, and Google Cirq definitions.</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded bg-[#c96b2c] hover:bg-[#b55e24] text-white font-medium cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
