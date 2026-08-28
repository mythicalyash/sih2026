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
}

export const Navbar: React.FC<NavbarProps> = ({
  onLoadPreset,
  onOpenQuirkModal,
  onOpenTutorModal,
  onRunSimulation,
  isLoading,
  backendConnected,
}) => {
  const [showBanner, setShowBanner] = useState<boolean>(true);
  const [circuitName, setCircuitName] = useState<string>('Untitled circuit');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);

  return (
    <header className="flex flex-col bg-[#161616] border-b border-[#393939] sticky top-0 z-40 select-none text-xs">
      {/* Top IBM Banner */}
      {showBanner && (
        <div className="bg-[#121619] border-b border-[#262626] px-4 py-1.5 flex items-center justify-between text-[11px] text-gray-300">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-white">New!</span>
            <span>
              Composer now supports OpenQASM 3 by default. QASM2 can still be selected under "File &gt; New".
            </span>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="text-gray-400 hover:text-white p-0.5 rounded cursor-pointer"
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
              className="bg-[#262626] border border-[#0f62fe] rounded px-2 py-0.5 text-xs text-white font-medium focus:outline-none"
            />
          ) : (
            <span
              onClick={() => setIsEditingName(true)}
              className="text-xs font-semibold text-gray-100 hover:underline cursor-pointer"
              title="Click to rename"
            >
              {circuitName}
            </span>
          )}

          <div className="h-4 w-[1px] bg-[#393939]" />

          {/* Menus: File, Edit, View, Help */}
          <div className="flex items-center gap-1 text-gray-300">
            <button className="px-2 py-1 rounded hover:bg-[#262626] cursor-pointer">File</button>
            <button className="px-2 py-1 rounded hover:bg-[#262626] cursor-pointer">Edit</button>
            <button className="px-2 py-1 rounded hover:bg-[#262626] cursor-pointer">View</button>
            <button className="px-2 py-1 rounded hover:bg-[#262626] cursor-pointer">Help</button>
          </div>

          <div className="h-4 w-[1px] bg-[#393939]" />

          {/* Presets & Importers */}
          <div className="flex items-center gap-2">
            <PresetLoader onLoadPreset={onLoadPreset} isLoading={isLoading} />

            <button
              onClick={onOpenQuirkModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#262626] hover:bg-[#393939] text-gray-200 border border-[#393939] transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3 text-[#4589ff]" />
              <span>Import Quirk</span>
            </button>

            <button
              onClick={onOpenTutorModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1e293b] hover:bg-[#283548] text-indigo-300 border border-[#3b82f6]/40 transition-colors cursor-pointer"
            >
              <Bot className="w-3 h-3 text-indigo-400" />
              <span>AI Tutor</span>
            </button>
          </div>
        </div>

        {/* Right Section: Save File & Primary 'Set up and run' Button */}
        <div className="flex items-center gap-3">
          {/* Backend Status Dot */}
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border ${
              backendConnected
                ? 'bg-[#198038]/20 border-[#24a148] text-[#42be65]'
                : 'bg-[#da1e28]/20 border-[#fa4d56] text-[#ff8389]'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                backendConnected ? 'bg-[#42be65] animate-pulse' : 'bg-[#fa4d56]'
              }`}
            />
            <span>{backendConnected ? 'Aer & PL Active' : 'Connecting'}</span>
          </div>

          <button
            onClick={() => {
              const element = document.createElement('a');
              const file = new Blob([circuitName], { type: 'text/plain' });
              element.href = URL.createObjectURL(file);
              element.download = `${circuitName.toLowerCase().replace(/\s+/g, '_')}.qasm`;
              element.click();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-gray-200 hover:bg-[#262626] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-gray-400" />
            <span>Save file</span>
          </button>

          {/* Primary Action: Set up and run */}
          <button
            onClick={onRunSimulation}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#0f62fe] hover:bg-[#0043ce] text-white font-medium transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <Cpu className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Running...' : 'Set up and run'}</span>
          </button>

          <button className="p-1.5 rounded hover:bg-[#262626] text-gray-400 hover:text-white cursor-pointer">
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
