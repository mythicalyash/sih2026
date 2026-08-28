import React, { useState, useEffect } from 'react';
import type { CircuitIR } from '../types/quantum';
import { Copy, Check, ChevronDown, Edit3, Play } from 'lucide-react';
import { BACKEND_URL } from '../config';

interface CodePanelProps {
  circuitIR: CircuitIR;
  onApplyIR: (ir: CircuitIR) => void;
}

export const CodePanel: React.FC<CodePanelProps> = ({ circuitIR, onApplyIR }) => {
  const [viewMode, setViewMode] = useState<'qasm' | 'ir'>('qasm');
  const [copied, setCopied] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editText, setEditText] = useState<string>('');
  const [qasmCode, setQasmCode] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);

  // Generate fallback OpenQASM 3.0
  const generateQasmLocally = (ir: CircuitIR): string => {
    const lines = [
      'OPENQASM 3.0;',
      'include "stdgates.inc";',
      '',
      `qubit[${ir.num_qubits}] q;`,
      `bit[${ir.num_qubits}] c;`,
      '',
    ];

    ir.gates.forEach((g) => {
      const name = g.name.toLowerCase();
      if (name === 'cx' || name === 'cnot') {
        lines.push(`cx q[${g.qubits[0]}], q[${g.qubits[1]}];`);
      } else if (name === 'cz') {
        lines.push(`cz q[${g.qubits[0]}], q[${g.qubits[1]}];`);
      } else if (name === 'swap') {
        lines.push(`swap q[${g.qubits[0]}], q[${g.qubits[1]}];`);
      } else if (['rx', 'ry', 'rz', 'p', 'phase'].includes(name) && g.params) {
        lines.push(`${name}(${g.params[0].toFixed(4)}) q[${g.qubits[0]}];`);
      } else if (name === 'measure') {
        lines.push(`c[${g.qubits[0]}] = measure q[${g.qubits[0]}];`);
      } else if (name === 'reset') {
        lines.push(`reset q[${g.qubits[0]}];`);
      } else {
        lines.push(`${name} q[${g.qubits[0]}];`);
      }
    });

    return lines.join('\n');
  };

  useEffect(() => {
    // Fetch QASM from backend if available or compute locally
    const updateQasm = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/export/qasm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(circuitIR),
        });
        if (res.ok) {
          const data = await res.json();
          setQasmCode(data.qasm);
          return;
        }
      } catch {}
      setQasmCode(generateQasmLocally(circuitIR));
    };

    updateQasm();
  }, [circuitIR]);

  const activeContent = viewMode === 'qasm' ? qasmCode : JSON.stringify(circuitIR, null, 2);

  useEffect(() => {
    if (!isEditing) {
      setEditText(activeContent);
      setParseError(null);
    }
  }, [activeContent, isEditing]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleApply = () => {
    try {
      if (viewMode === 'ir') {
        const parsed = JSON.parse(editText);
        if (!parsed.num_qubits || !Array.isArray(parsed.gates)) {
          throw new Error("Missing 'num_qubits' or 'gates' in CircuitIR JSON.");
        }
        onApplyIR(parsed);
      }
      setIsEditing(false);
      setParseError(null);
    } catch (err: any) {
      setParseError(err.message || 'Parse error.');
    }
  };

  const lines = activeContent.split('\n');

  return (
    <div className="bg-[#161616] border border-[#393939] rounded-lg flex flex-col h-full shadow-xl overflow-hidden font-mono text-xs select-none">
      {/* Header bar with dropdown */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#262626] bg-[#121619]/60">
        <div className="flex items-center gap-2">
          <select
            value={viewMode}
            onChange={(e) => {
              setViewMode(e.target.value as 'qasm' | 'ir');
              setIsEditing(false);
            }}
            className="appearance-none bg-[#262626] border border-[#393939] text-gray-200 text-xs px-2 py-1 pr-6 rounded focus:outline-none focus:border-[#0f62fe] cursor-pointer"
          >
            <option value="qasm">OpenQASM 3.0</option>
            <option value="ir">Circuit IR (JSON)</option>
          </select>
          <ChevronDown className="w-3 h-3 text-gray-400 -ml-5 pointer-events-none" />
        </div>

        <div className="flex items-center gap-1.5">
          {viewMode === 'ir' && (
            <button
              onClick={() => {
                if (isEditing) {
                  setIsEditing(false);
                  setParseError(null);
                } else {
                  setEditText(activeContent);
                  setIsEditing(true);
                }
              }}
              className="px-2 py-1 rounded bg-[#262626] text-gray-300 hover:text-white border border-[#393939] text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3 text-[#4589ff]" />
              <span>{isEditing ? 'Cancel' : 'Edit'}</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="px-2 py-1 rounded bg-[#262626] text-gray-300 hover:text-white border border-[#393939] text-[11px] flex items-center gap-1 cursor-pointer"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-gray-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {parseError && (
        <div className="p-2 bg-red-950/70 border border-red-800 text-red-300 text-[11px]">
          {parseError}
        </div>
      )}

      {/* Editor Content Area */}
      {isEditing ? (
        <div className="p-2 flex flex-col gap-2 flex-1">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full h-[220px] bg-[#121619] border border-[#0f62fe] rounded p-2 text-xs font-mono text-emerald-400 focus:outline-none resize-none"
          />
          <button
            onClick={handleApply}
            className="w-full py-1.5 rounded bg-[#0f62fe] hover:bg-[#0043ce] text-white font-sans text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Apply to Canvas</span>
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-3 bg-[#121619] max-h-[280px]">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <tbody>
              {lines.map((line, idx) => {
                // Syntax highlighting tokens
                const isComment = line.trim().startsWith('//');
                const isInclude = line.includes('include') || line.includes('OPENQASM');
                const isDecl = line.includes('qubit[') || line.includes('bit[');
                const isMeasure = line.includes('measure') || line.includes('reset');

                return (
                  <tr key={idx} className="hover:bg-[#1a202c]/40">
                    <td className="pr-4 py-0.5 text-gray-600 select-none text-right w-6 text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-0.5 whitespace-pre">
                      {isComment ? (
                        <span className="text-gray-500">{line}</span>
                      ) : isInclude ? (
                        <span className="text-[#33b1ff] font-bold">{line}</span>
                      ) : isDecl ? (
                        <span className="text-[#42be65]">{line}</span>
                      ) : isMeasure ? (
                        <span className="text-[#fa4d56]">{line}</span>
                      ) : (
                        <span className="text-[#f4f4f4]">{line}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
