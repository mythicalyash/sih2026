'use client'

import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUT_GROUPS = [
  {
    category: 'Simulation & Execution',
    items: [
      { key: '⌘ + Enter / Ctrl + Enter', desc: 'Trigger full multi-backend simulation pass' },
      { key: '⌘ + S / Ctrl + S', desc: 'Export / Save current quantum circuit' },
      { key: '⌘ + O / Ctrl + O', desc: 'Open / Import QASM or JSON circuit file' },
    ],
  },
  {
    category: 'Circuit Composer & Canvas',
    items: [
      { key: '⌘ + Z / Ctrl + Z', desc: 'Undo last gate placement or removal' },
      { key: 'Escape', desc: 'Unarm currently selected gate / deselect palette' },
      { key: 'Click Gate + Click Slot', desc: 'Place armed single or multi-qubit gate' },
      { key: 'Drag & Drop', desc: 'Drag gates directly from palette to wire slot' },
    ],
  },
  {
    category: 'Live Code Editor',
    items: [
      { key: 'Tab', desc: 'Indent 4 spaces in Python / QASM editor' },
      { key: 'Click Line in Gutter', desc: 'Inspect line number and position' },
      { key: '⌘ + C / Ctrl + C', desc: 'Copy formatted quantum script' },
    ],
  },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="bg-[#fffdf9] border border-[#ded7cb] rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden text-[#211f1b]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#ded7cb] bg-[#f7f4ee]">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-[#c96b2c]" />
            <div>
              <h2 className="text-sm font-bold text-[#211f1b]">Keyboard Shortcuts</h2>
              <p className="text-[11px] text-[#746e64]">Hotkeys for quantum workflow speedup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#eee9df] text-[#746e64] hover:text-[#211f1b] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts Content */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto bg-[#f7f4ee]">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.category} className="bg-[#fffdf9] border border-[#ded7cb] rounded-lg p-3.5 shadow-sm">
              <h3 className="text-xs font-bold text-[#c96b2c] mb-2.5 flex items-center gap-1.5">
                <Command className="w-3.5 h-3.5" />
                {group.category}
              </h3>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-[#555047] text-[11px]">{item.desc}</span>
                    <kbd className="px-2 py-0.5 rounded bg-[#f0ece4] border border-[#ded7cb] text-[10px] font-mono font-semibold text-[#211f1b] shadow-2xs whitespace-nowrap">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#ded7cb] bg-[#fffdf9] flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded bg-[#c96b2c] hover:bg-[#b55e24] text-white text-xs font-medium cursor-pointer transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
