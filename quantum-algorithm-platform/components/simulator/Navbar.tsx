'use client'

import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Upload,
  Cpu,
  X,
  Bot,
  FilePlus,
  FileCode,
  FileJson,
  RotateCcw,
  Trash2,
  PlusCircle,
  MinusCircle,
  HelpCircle,
  Keyboard,
  Info,
  BookOpen,
  Layout,
  ChevronDown,
  Sparkles,
  PanelLeft,
} from 'lucide-react';
import { PresetLoader } from './PresetLoader';

interface NavbarProps {
  circuitName: string;
  onRenameCircuit: (name: string) => void;
  onNewCircuit: () => void;
  onExportQASM: () => void;
  onExportPython: () => void;
  onExportJSON: () => void;
  onImportFile: (content: string, filename: string) => void;
  onUndo: () => void;
  canUndo: boolean;
  onClearGates: () => void;
  onAddQubit: () => void;
  onRemoveQubit: () => void;
  numQubits: number;
  onAddSteps: () => void;
  onToggleCodeEditor: () => void;
  onOpenQuirkModal: () => void;
  onOpenTutorModal: () => void;
  onOpenCheatSheet: () => void;
  onOpenShortcuts: () => void;
  onOpenAbout: () => void;
  onRunSimulation: () => void;
  isLoading: boolean;
  backendConnected: boolean;
  selectedBackend: string;
  onSelectBackend: (b: any) => void;
  selectedPreset?: string;
  onLoadPreset: (algorithmKey: string) => void;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

const BACKENDS_LIST = [
  { id: 'qiskit_aer', label: 'Qiskit Aer', badge: 'IBM', desc: 'Aer Statevector & Shot Simulator' },
  { id: 'pennylane', label: 'PennyLane', badge: 'Xanadu', desc: 'Differentiable default.qubit' },
  { id: 'qsim', label: 'qsim', badge: 'Google', desc: 'C++ Schrodinger Wavefunction Sim' },
  { id: 'cirq', label: 'Google Cirq', badge: 'Google', desc: 'Cirq StateVector Simulator' },
  { id: 'qbraid', label: 'qBraid', badge: 'Hub', desc: 'Transpiler & Cross-SDK Runner' },
];

export const Navbar: React.FC<NavbarProps> = ({
  circuitName,
  onRenameCircuit,
  onNewCircuit,
  onExportQASM,
  onExportPython,
  onExportJSON,
  onImportFile,
  onUndo,
  canUndo,
  onClearGates,
  onAddQubit,
  onRemoveQubit,
  numQubits,
  onAddSteps,
  onToggleCodeEditor,
  onOpenQuirkModal,
  onOpenTutorModal,
  onOpenCheatSheet,
  onOpenShortcuts,
  onOpenAbout,
  onRunSimulation,
  isLoading,
  backendConnected,
  selectedBackend,
  onSelectBackend,
  selectedPreset,
  onLoadPreset,
  onToggleSidebar,
  sidebarCollapsed,
}) => {
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [activeMenu, setActiveMenu] = useState<'file' | 'edit' | 'view' | 'help' | null>(null);

  const menuContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportFile(content, file.name);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    setActiveMenu(null);
  };

  return (
    <header className="flex flex-col bg-[#fffdf9] border-b border-[#ded7cb] sticky top-0 z-40 select-none text-xs">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".qasm,.py,.json,.txt"
        className="hidden"
      />

      {/* Main Composer Navigation Bar */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-4">
        {/* Left Section: Circuit Title & Menu Actions */}
        <div className="flex items-center gap-2.5">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1 rounded hover:bg-[#eee9df] text-[#746e64] hover:text-[#211f1b] transition-colors cursor-pointer"
              title={sidebarCollapsed ? 'Expand App Sidebar (⌘\\)' : 'Collapse App Sidebar (⌘\\)'}
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
          {/* Circuit Title */}
          {isEditingName ? (
            <input
              type="text"
              value={circuitName}
              onChange={(e) => onRenameCircuit(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
              autoFocus
              className="bg-[#fffdf9] border border-[#c96b2c] rounded px-2 py-0.5 text-xs text-[#211f1b] font-medium focus:outline-none"
            />
          ) : (
            <span
              onClick={() => setIsEditingName(true)}
              className="text-xs font-semibold text-[#211f1b] hover:underline cursor-pointer tracking-tight"
              title="Click to rename circuit"
            >
              {circuitName}
            </span>
          )}

          <div className="h-4 w-[1px] bg-[#ded7cb]" />

          {/* Interactive Top Menus (File, Edit, View, Help) */}
          <div ref={menuContainerRef} className="flex items-center gap-0.5 text-[#555047] relative">
            {/* File Menu */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
                className={`px-2.5 py-1 rounded hover:bg-[#eee9df] hover:text-[#211f1b] font-medium cursor-pointer transition-colors ${
                  activeMenu === 'file' ? 'bg-[#eee9df] text-[#211f1b]' : ''
                }`}
              >
                File
              </button>

              {activeMenu === 'file' && (
                <div className="absolute left-0 top-full mt-1 w-56 bg-[#fffdf9] border border-[#ded7cb] rounded-lg shadow-xl py-1 z-50 animate-fade-in font-sans text-xs">
                  <button
                    onClick={() => {
                      onNewCircuit();
                      setActiveMenu(null);
                    }}
                    className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#f0ece4] text-[#211f1b] text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <FilePlus className="w-3.5 h-3.5 text-[#c96b2c]" />
                      <span>New Circuit</span>
                    </div>
                    <span className="text-[10px] text-[#746e64] font-mono">⌘+N</span>
                  </button>

                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                    className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#f0ece4] text-[#211f1b] text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Upload className="w-3.5 h-3.5 text-[#746e64]" />
                      <span>Open File (.qasm, .json)</span>
                    </div>
                    <span className="text-[10px] text-[#746e64] font-mono">⌘+O</span>
                  </button>

                  <div className="h-[1px] bg-[#ded7cb] my-1" />

                  <button
                    onClick={() => {
                      onExportQASM();
                      setActiveMenu(null);
                    }}
                    className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#f0ece4] text-[#211f1b] text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Download className="w-3.5 h-3.5 text-[#746e64]" />
                      <span>Export OpenQASM 3.0</span>
                    </div>
                    <span className="text-[10px] text-[#746e64] font-mono">.qasm</span>
                  </button>

                  <button
                    onClick={() => {
                      onExportPython();
                      setActiveMenu(null);
                    }}
                    className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#f0ece4] text-[#211f1b] text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <FileCode className="w-3.5 h-3.5 text-[#746e64]" />
                      <span>Export Qiskit Python</span>
                    </div>
                    <span className="text-[10px] text-[#746e64] font-mono">.py</span>
                  </button>

                  <button
                    onClick={() => {
                      onExportJSON();
                      setActiveMenu(null);
                    }}
                    className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#f0ece4] text-[#211f1b] text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <FileJson className="w-3.5 h-3.5 text-[#746e64]" />
                      <span>Export Circuit JSON IR</span>
                    </div>
                    <span className="text-[10px] text-[#746e64] font-mono">.json</span>
                  </button>
                </div>
              )}
            </div>

            {/* Edit Menu */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}
                className={`px-2.5 py-1 rounded hover:bg-[#eee9df] hover:text-[#211f1b] font-medium cursor-pointer transition-colors ${
                  activeMenu === 'edit' ? 'bg-[#eee9df] text-[#211f1b]' : ''
                }`}
              >
                Edit
              </button>

              {activeMenu === 'edit' && (
                <div className="absolute left-0 top-full mt-1 w-52 bg-[#fffdf9] border border-[#ded7cb] rounded-lg shadow-xl py-1 z-50 animate-fade-in font-sans text-xs">
                  <button
                    onClick={() => {
                      onUndo();
                      setActiveMenu(null);
                    }}
                    disabled={!canUndo}
                    className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#f0ece4] text-[#211f1b] disabled:opacity-40 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-3.5 h-3.5 text-[#746e64]" />
                      <span>Undo Gate</span>
                    </div>
                    <span className="text-[10px] text-[#746e64] font-mono">⌘+Z</span>
                  </button>

                  <button
                    onClick={() => {
                      onClearGates();
                      setActiveMenu(null);
                    }}
                    className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#fce8e6] text-[#c5221f] text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-3.5 h-3.5 text-[#c5221f]" />
                      <span>Clear All Gates</span>
                    </div>
                  </button>

                  <div className="h-[1px] bg-[#ded7cb] my-1" />

                  <button
                    onClick={() => {
                      onAddQubit();
                      setActiveMenu(null);
                    }}
                    disabled={numQubits >= 8}
                    className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#f0ece4] text-[#211f1b] disabled:opacity-40 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <PlusCircle className="w-3.5 h-3.5 text-[#137333]" />
                      <span>Add Qubit Wire</span>
                    </div>
                    <span className="text-[10px] text-[#746e64] font-mono">{numQubits}/8</span>
                  </button>

                  <button
                    onClick={() => {
                      onRemoveQubit();
                      setActiveMenu(null);
                    }}
                    disabled={numQubits <= 1}
                    className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#f0ece4] text-[#211f1b] disabled:opacity-40 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <MinusCircle className="w-3.5 h-3.5 text-[#c5221f]" />
                      <span>Remove Qubit Wire</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onAddSteps();
                      setActiveMenu(null);
                    }}
                    className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#f0ece4] text-[#211f1b] text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <PlusCircle className="w-3.5 h-3.5 text-[#746e64]" />
                      <span>Add Time Steps (+2)</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* View Menu */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
                className={`px-2.5 py-1 rounded hover:bg-[#eee9df] hover:text-[#211f1b] font-medium cursor-pointer transition-colors ${
                  activeMenu === 'view' ? 'bg-[#eee9df] text-[#211f1b]' : ''
                }`}
              >
                View
              </button>

              {activeMenu === 'view' && (
                <div className="absolute left-0 top-full mt-1 w-52 bg-[#fffdf9] border border-[#ded7cb] rounded-lg shadow-xl py-1 z-50 animate-fade-in font-sans text-xs">
                  <button
                    onClick={() => {
                      onToggleCodeEditor();
                      setActiveMenu(null);
                    }}
                    className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#f0ece4] text-[#211f1b] text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Layout className="w-3.5 h-3.5 text-[#c96b2c]" />
                      <span>Toggle Code Editor</span>
                    </div>
                    <span className="text-[10px] text-[#746e64] font-mono">⌘+B</span>
                  </button>
                </div>
              )}
            </div>

            {/* Help Menu */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'help' ? null : 'help')}
                className={`px-2.5 py-1 rounded hover:bg-[#eee9df] hover:text-[#211f1b] font-medium cursor-pointer transition-colors ${
                  activeMenu === 'help' ? 'bg-[#eee9df] text-[#211f1b]' : ''
                }`}
              >
                Help
              </button>

              {activeMenu === 'help' && (
                <div className="absolute left-0 top-full mt-1 w-56 bg-[#fffdf9] border border-[#ded7cb] rounded-lg shadow-xl py-1 z-50 animate-fade-in font-sans text-xs">
                  <button
                    onClick={() => {
                      onOpenCheatSheet();
                      setActiveMenu(null);
                    }}
                    className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#f0ece4] text-[#211f1b] text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-[#c96b2c]" />
                      <span>Gate Reference Sheet</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onOpenShortcuts();
                      setActiveMenu(null);
                    }}
                    className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#f0ece4] text-[#211f1b] text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Keyboard className="w-3.5 h-3.5 text-[#746e64]" />
                      <span>Keyboard Shortcuts</span>
                    </div>
                    <span className="text-[10px] text-[#746e64] font-mono">?</span>
                  </button>

                  <button
                    onClick={() => {
                      onOpenTutorModal();
                      setActiveMenu(null);
                    }}
                    className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#f0ece4] text-[#211f1b] text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Bot className="w-3.5 h-3.5 text-[#c96b2c]" />
                      <span>AI Quantum Tutor</span>
                    </div>
                  </button>

                  <div className="h-[1px] bg-[#ded7cb] my-1" />

                  <button
                    onClick={() => {
                      onOpenAbout();
                      setActiveMenu(null);
                    }}
                    className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#f0ece4] text-[#211f1b] text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-[#746e64]" />
                      <span>About Multi-Engine Sim</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="h-4 w-[1px] bg-[#ded7cb]" />

          {/* Presets & Importers */}
          <div className="flex items-center gap-2">
            <PresetLoader
              selectedPreset={selectedPreset}
              onLoadPreset={onLoadPreset}
              isLoading={isLoading}
            />

            <button
              onClick={onOpenQuirkModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#f0ece4] hover:bg-[#eee9df] text-[#211f1b] border border-[#ded7cb] transition-colors cursor-pointer"
              title="Import circuit from Quirk URL or JSON"
            >
              <Download className="w-3 h-3 text-[#c96b2c]" />
              <span>Import Quirk</span>
            </button>

            <button
              onClick={onOpenTutorModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#fff2ea] hover:bg-[#ffe6d6] text-[#c96b2c] border border-[#f3d0bb] transition-colors cursor-pointer font-medium"
              title="Open AI Quantum Assistant"
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
                  {b.label} ({b.badge})
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

          {/* Export / Save Button */}
          <button
            onClick={onExportQASM}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[#211f1b] hover:bg-[#eee9df] border border-[#ded7cb] transition-colors cursor-pointer"
            title="Download OpenQASM 3.0 file"
          >
            <Download className="w-3.5 h-3.5 text-[#746e64]" />
            <span>Save</span>
          </button>

          {/* Setup and Run Button */}
          <button
            onClick={onRunSimulation}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#c96b2c] hover:bg-[#b55e24] text-white font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Cpu className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Running...' : 'Set up and run'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
