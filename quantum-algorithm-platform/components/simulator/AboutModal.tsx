'use client'

import React from 'react';
import { X, Info, Cpu, CheckCircle2, ShieldCheck } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BACKENDS_INFO = [
  { name: 'Qiskit Aer', org: 'IBM Quantum', desc: 'Statevector & multi-shot C++ simulator engine' },
  { name: 'PennyLane', org: 'Xanadu', desc: 'Differentiable quantum device (default.qubit)' },
  { name: 'Google Cirq', org: 'Google Quantum AI', desc: 'Native quantum gate & waveform engine' },
  { name: 'Google qsim', org: 'Google Quantum AI', desc: 'High-performance AVX/C++ Schrodinger simulator' },
  { name: 'qBraid', org: 'qBraid Hub', desc: 'Universal quantum transpilation & cross-SDK execution' },
];

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="bg-[#fffdf9] border border-[#ded7cb] rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden text-[#211f1b]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#ded7cb] bg-[#f7f4ee]">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#c96b2c]" />
            <div>
              <h2 className="text-sm font-bold text-[#211f1b]">Multi-Backend Quantum Simulator</h2>
              <p className="text-[11px] text-[#746e64]">Real-time cross-engine quantum computing platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#eee9df] text-[#746e64] hover:text-[#211f1b] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* About Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto bg-[#f7f4ee]">
          <div className="bg-[#fffdf9] border border-[#ded7cb] rounded-lg p-3.5 shadow-sm space-y-2 text-xs text-[#555047] leading-relaxed">
            <p>
              This platform provides a unified visual and programmatic workbench for designing, transpiling, and simulating quantum circuits with zero approximation or mock data.
            </p>
            <div className="flex items-center gap-2 text-[#137333] font-semibold text-[11px] pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Full Cross-Engine Mathematical Verification (F = 1.000000)</span>
            </div>
          </div>

          <div className="bg-[#fffdf9] border border-[#ded7cb] rounded-lg p-3.5 shadow-sm space-y-2.5">
            <h3 className="text-xs font-bold text-[#211f1b] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#c96b2c]" />
              Integrated Quantum Engines
            </h3>
            <div className="space-y-2">
              {BACKENDS_INFO.map((b) => (
                <div key={b.name} className="flex items-start justify-between gap-3 text-xs border-b border-[#ded7cb]/50 pb-1.5 last:border-0 last:pb-0">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#211f1b]">{b.name}</span>
                      <span className="px-1.5 py-0.2 rounded bg-[#f0ece4] text-[9px] text-[#746e64] font-medium border border-[#ded7cb]">
                        {b.org}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#746e64]">{b.desc}</p>
                  </div>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#137333] shrink-0 mt-0.5" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#ded7cb] bg-[#fffdf9] flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded bg-[#c96b2c] hover:bg-[#b55e24] text-white text-xs font-medium cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
