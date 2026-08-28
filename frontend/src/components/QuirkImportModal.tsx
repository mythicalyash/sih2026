import React, { useState } from 'react';
import type { CircuitIR } from '../types/quantum';
import { Download, X, AlertTriangle } from 'lucide-react';

import { BACKEND_URL } from '../config';

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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-gray-100 text-sm">Import Quirk Circuit</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-300">
          Paste an exported Quirk URL (e.g. <code className="text-indigo-300 font-mono text-[11px]">https://algassert.com/quirk#circuit=...</code>) or Quirk JSON columns:
        </p>

        <textarea
          value={inputData}
          onChange={(e) => setInputData(e.target.value)}
          placeholder='{"cols": [["H"], ["•", "X"]]}'
          className="w-full h-32 bg-gray-950 border border-gray-800 focus:border-indigo-500 rounded-lg p-3 text-xs font-mono text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />

        {error && (
          <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800 text-amber-200 text-xs flex flex-col gap-1">
            <div className="flex items-center gap-1.5 font-medium text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Imported with Notes:</span>
            </div>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-200/80">
              {warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs shadow-md transition-colors"
          >
            {loading ? 'Importing...' : 'Import to Canvas'}
          </button>
        </div>
      </div>
    </div>
  );
};
