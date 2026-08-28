import React from 'react';
import { BookOpen } from 'lucide-react';

interface PresetLoaderProps {
  onLoadPreset: (algorithmKey: string) => void;
  isLoading: boolean;
}

const PRESETS = [
  { id: 'deutsch_jozsa', name: 'Deutsch-Jozsa (Balanced Oracle)', desc: '1 query oracle determinism' },
  { id: 'bernstein_vazirani', name: 'Bernstein-Vazirani ("101")', desc: 'Recovers hidden bitstring in 1 query' },
  { id: 'grovers_search', name: 'Grover\'s Search (Target "11")', desc: 'Amplitude amplification speedup' },
  { id: 'qft', name: 'Quantum Fourier Transform (3Q)', desc: 'Discrete Fourier basis rotation' },
  { id: 'teleportation', name: 'Quantum Teleportation (3Q)', desc: 'State transfer via entanglement' },
  { id: 'superdense_coding', name: 'Superdense Coding (2 bits)', desc: 'Send 2 classical bits with 1 qubit' },
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
          className="appearance-none bg-gray-900 border border-gray-700 hover:border-indigo-500 rounded-lg px-3 py-1.5 pr-8 text-xs font-medium text-gray-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-colors shadow-sm"
        >
          <option value="" disabled>
            📚 Load Algorithm Preset...
          </option>
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id} className="bg-gray-900 text-gray-100 py-1">
              {p.name}
            </option>
          ))}
        </select>
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <BookOpen className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
