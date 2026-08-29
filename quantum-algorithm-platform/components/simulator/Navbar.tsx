'use client'

import React, { useState } from 'react';
import {
  Download,
  Cpu,
  MoreVertical,
  X,
  Bot,
} from 'lucide-react';
import { PresetLoader } from './PresetLoader';

interface NavbarProps {
  onLoadPreset: (algorithmKey: string) => void;
  onOpenQuirkModal: () => void;
  onOpenTutorModal: () => void;
  onRunSimulation: () => void;
  isLoading: boolean;
  backendConnected: boolean;
  selectedBackend: string;
  onSelectBackend: (b: any) => void;
}

const BACKENDS_LIST = [
  { id: 'qiskit_aer', label: 'Qiskit Aer', badge: 'IBM', icon: '⚡', desc: 'Aer Statevector & Shot Simulator' },
  { id: 'pennylane', label: 'PennyLane', badge: 'Xanadu', icon: '🧪', desc: 'Differentiable default.qubit' },
  { id: 'qsim', label: 'qsim', badge: 'Google', icon: '🚀', desc: 'C++ Schrodinger Wavefunction Sim' },
  { id: 'cirq', label: 'Google Cirq', badge: 'Google', icon: '⭕', desc: 'Cirq StateVector Simulator' },
  { id: 'qbraid', label: 'qBraid', badge: 'Hub', icon: '🔀', desc: 'Transpiler & Cross-SDK Runner' },
];

export const Navbar: React.FC<NavbarProps> = ({
  onLoadPreset,
  onOpenQuirkModal,
  onOpenTutorModal,
  onRunSimulation,
  isLoading,
  backendConnected,
  selectedBackend,
  onSelectBackend,
}) => {
  const [showBanner, setShowBanner] = useState<boolean>(true);
  const [circuitName, setCircuitName] = useState<string>('Untitled circuit');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);

  return (
    <header className="flex flex-col bg-[#fffdf9] border-b border-[#ded7cb] sticky top-0 z-40 select-none text-xs">
      {/* Top IBM Banner */}
      {showBanner && (
        <div className="bg-[#eee9df] border-b border-[#ded7cb] px-4 py-1.5 flex items-center justify-between text-[11px] text-[#746e64]">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[#211f1b]">Multi-Backend Engine:</span>
            <span>
              Execute and cross-verify quantum circuits across <strong>Qiskit Aer</strong>, <strong>PennyLane</strong>, <strong>Google qsim</strong>, <strong>Cirq</strong>, and <strong>qBraid</strong>.
            </span>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="text-[#746e64] hover:text-[#211f1b] p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Composer Navigation Bar */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-4">
        {/* Left Section: Circuit Title & Menu Actions */}
        <div className="flex items-center gap-4">
          {/* Circuit Title */}
          {isEditingName ? (
            <input
              type="text"
              value={circuitName}
              onChange={(e) => setCircuitName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
              autoFocus
              className="bg-[#fffdf9] border border-[#c96b2c] rounded px-2 py-0.5 text-xs text-[#211f1b] font-medium focus:outline-none"
            />
          ) : (
            <span
              onClick={() => setIsEditingName(true)}
              className="text-xs font-semibold text-[#211f1b] hover:underline cursor-pointer"
              title="Click to rename"
            >
              {circuitName}
            </span>
          )}

          <div className="h-4 w-[1px] bg-[#ded7cb]" />

          {/* Menus */}
          <div className="flex items-center gap-1 text-[#746e64]">
            <button className="px-2 py-1 rounded hover:bg-[#eee9df] hover:text-[#211f1b] cursor-pointer">File</button>
            <button className="px-2 py-1 rounded hover:bg-[#eee9df] hover:text-[#211f1b] cursor-pointer">Edit</button>
            <button className="px-2 py-1 rounded hover:bg-[#eee9df] hover:text-[#211f1b] cursor-pointer">View</button>
            <button className="px-2 py-1 rounded hover:bg-[#eee9df] hover:text-[#211f1b] cursor-pointer">Help</button>
          </div>

          <div className="h-4 w-[1px] bg-[#ded7cb]" />

          {/* Presets & Importers */}
          <div className="flex items-center gap-2">
            <PresetLoader onLoadPreset={onLoadPreset} isLoading={isLoading} />

            <button
              onClick={onOpenQuirkModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#f0ece4] hover:bg-[#eee9df] text-[#211f1b] border border-[#ded7cb] transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3 text-[#c96b2c]" />
              <span>Import Quirk</span>
            </button>

            <button
              onClick={onOpenTutorModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#fff2ea] hover:bg-[#ffe6d6] text-[#c96b2c] border border-[#f3d0bb] transition-colors cursor-pointer font-medium"
            >
              <Bot className="w-3 h-3 text-[#c96b2c]" />
              <span>AI Tutor</span>
            </button>
          </div>
        </div>

        {/* Right Section: Backend Selector, Status & Run Button */}
        <div className="flex items-center gap-3">
          {/* Backend Engine Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#f0ece4] px-2 py-1 rounded border border-[#ded7cb]">
            <span className="text-[11px] text-[#746e64] font-medium hidden sm:inline">Engine:</span>
            <select
              value={selectedBackend}
              onChange={(e) => onSelectBackend(e.target.value)}
              className="bg-[#fffdf9] border border-[#ded7cb] rounded px-2 py-0.5 text-xs text-[#211f1b] font-medium cursor-pointer focus:outline-none focus:border-[#c96b2c]"
            >
              {BACKENDS_LIST.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.icon} {b.label} ({b.badge})
                </option>
              ))}
            </select>
          </div>

          {/* Backend Status Dot */}
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono border ${
              backendConnected
                ? 'bg-[#e6f4ea] border-[#34a853] text-[#137333]'
                : 'bg-[#fce8e6] border-[#ea4335] text-[#c5221f]'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                backendConnected ? 'bg-[#34a853] animate-pulse' : 'bg-[#ea4335]'
              }`}
            />
            <span>{backendConnected ? '5 Backends Online' : 'Connecting'}</span>
          </div>

          <button
            onClick={() => {
              const element = document.createElement('a');
              const file = new Blob([circuitName], { type: 'text/plain' });
              element.href = URL.createObjectURL(file);
              element.download = `${circuitName.toLowerCase().replace(/\s+/g, '_')}.qasm`;
              element.click();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[#211f1b] hover:bg-[#eee9df] border border-[#ded7cb] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#746e64]" />
            <span>Save</span>
          </button>

          <button
            onClick={onRunSimulation}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#c96b2c] hover:bg-[#b55e24] text-white font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Cpu className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Running...' : 'Set up and run'}</span>
          </button>

          <button className="p-1.5 rounded hover:bg-[#eee9df] text-[#746e64] hover:text-[#211f1b] cursor-pointer">
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
