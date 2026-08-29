'use client'

import React, { useState } from 'react';
import type { CircuitIR } from '@/types/quantum';
import { Download, X, AlertTriangle } from 'lucide-react';
import { BACKEND_URL } from '@/config';

interface QuirkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (circuit: CircuitIR) => void;
}

export const QuirkImportModal: React.FC<QuirkImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [inputData, setInputData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleImport = async () => {
    setError(null);
    setWarnings([]);
    const trimmed = inputData.trim();
    if (!trimmed) {
      setError('Please paste a Quirk circuit URL or JSON.');
      return;
    }

    setLoading(true);
    try {
      const isUrl = trimmed.startsWith('http') || trimmed.includes('#circuit=');
      const payload = isUrl ? { quirk_url: trimmed } : { quirk_json: JSON.parse(trimmed) };

      const response = await fetch(`${BACKEND_URL}/import/quirk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Import failed');
      }

      const result = await response.json();
      onImportSuccess(result.circuit);
      if (result.warnings && result.warnings.length > 0) {
        setWarnings(result.warnings);
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to import Quirk circuit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#fffdf9] border border-[#ded7cb] rounded-lg max-w-lg w-full p-5 shadow-2xl flex flex-col gap-4 text-xs font-sans text-[#211f1b]">
        <div className="flex items-center justify-between border-b border-[#ded7cb] pb-3">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-[#c96b2c]" />
            <h3 className="font-semibold text-[#211f1b] text-sm">Import Quirk Circuit</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#746e64] hover:text-[#211f1b] hover:bg-[#eee9df] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[#746e64]">
          Paste an exported Quirk URL (e.g. <code className="text-[#0f62fe] font-mono text-[11px]">https://algassert.com/quirk#circuit=...</code>) or Quirk JSON:
        </p>

        <textarea
          value={inputData}
          onChange={(e) => setInputData(e.target.value)}
          placeholder='{"cols": [["H"], ["•", "X"]]}'
          className="w-full h-32 bg-[#fcfbf9] border border-[#ded7cb] focus:border-[#c96b2c] rounded p-3 font-mono text-[#211f1b] focus:outline-none resize-none"
        />

        {error && (
          <div className="p-2.5 rounded bg-[#fce8e6] border border-[#ea4335] text-[#c5221f] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-[#ea4335]" />
            <span>{error}</span>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="p-2.5 rounded bg-[#fff8e1] border border-[#ffb300] text-[#8f6b00] flex flex-col gap-1">
            <div className="flex items-center gap-1.5 font-medium text-[#8f6b00]">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Imported with Notes:</span>
            </div>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-[#8f6b00]">
              {warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ded7cb]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded text-[#746e64] hover:text-[#211f1b] hover:bg-[#eee9df] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#c96b2c] hover:bg-[#b55e24] disabled:opacity-50 text-white font-semibold shadow-sm transition-colors cursor-pointer"
          >
            {loading ? 'Importing...' : 'Import to Canvas'}
          </button>
        </div>
      </div>
    </div>
  );
};
