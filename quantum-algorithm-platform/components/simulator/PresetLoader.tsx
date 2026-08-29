'use client'

import React from 'react';
import { BookOpen } from 'lucide-react';

interface PresetLoaderProps {
  onLoadPreset: (algorithmKey: string) => void;
  isLoading: boolean;
}

const PRESETS = [
  { id: 'deutsch_jozsa', name: 'Deutsch-Jozsa (Balanced)', desc: '1 query oracle determinism' },
  { id: 'bernstein_vazirani', name: 'Bernstein-Vazirani ("101")', desc: 'Recovers hidden bitstring in 1 query' },
  { id: 'grovers_search', name: 'Grover\'s Search ("11")', desc: 'Amplitude amplification speedup' },
  { id: 'qft', name: 'Quantum Fourier Transform', desc: 'Discrete Fourier basis rotation' },
  { id: 'teleportation', name: 'Quantum Teleportation', desc: 'State transfer via entanglement' },
  { id: 'superdense_coding', name: 'Superdense Coding', desc: 'Send 2 classical bits with 1 qubit' },
];

export const PresetLoader: React.FC<PresetLoaderProps> = ({ onLoadPreset, isLoading }) => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <select
          onChange={(e) => {
            if (e.target.value) {
              onLoadPreset(e.target.value);
              e.target.value = '';
            }
          }}
          defaultValue=""
          disabled={isLoading}
          className="appearance-none bg-[#f0ece4] border border-[#ded7cb] hover:border-[#c96b2c] rounded px-2.5 py-1 pr-7 text-xs text-[#211f1b] cursor-pointer focus:outline-none transition-colors"
        >
          <option value="" disabled>
            📚 Load Preset...
          </option>
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id} className="bg-[#fffdf9] text-[#211f1b]">
              {p.name}
            </option>
          ))}
        </select>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#746e64]">
          <BookOpen className="w-3 h-3 text-[#c96b2c]" />
        </div>
      </div>
    </div>
  );
};
