'use client'

import React, { useState } from 'react';
import type { CircuitIR, ExecutionResponse, ComparisonResponse } from '@/types/quantum';
import { X, Copy, Check, Download, Share2, FileText, Sparkles, CheckCircle2 } from 'lucide-react';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  circuitName: string;
  circuitIR: CircuitIR;
  executionResult: ExecutionResponse | null;
  comparisonResult: ComparisonResponse | null;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  circuitName,
  circuitIR,
  executionResult,
  comparisonResult,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedLatex, setCopiedLatex] = useState(false);

  if (!isOpen) return null;

  // Build state equation in Dirac notation
  const buildDiracEquation = () => {
    if (!executionResult?.statevector || executionResult.statevector.length === 0) {
      return '|ψ⟩ = 1.0000|0...0⟩';
    }
    const sv = executionResult.statevector;
    const numQubits = Math.max(1, Math.ceil(Math.log2(sv.length || 2)));
    const terms = sv
      .map((amp: any, idx: number) => {
        const real = typeof amp?.real === 'number' ? amp.real : Array.isArray(amp) ? amp[0] : 0;
        const imag = typeof amp?.imag === 'number' ? amp.imag : Array.isArray(amp) ? amp[1] : 0;
        const mag = typeof amp?.magnitude === 'number' ? amp.magnitude : Math.sqrt(real * real + imag * imag);
        const state = typeof amp?.state === 'string' ? amp.state : idx.toString(2).padStart(numQubits, '0');
        return { real, imag, magnitude: mag, state };
      })
      .filter((amp) => amp.magnitude > 0.001)
      .map((amp) => {
        const realAbs = Math.abs(amp.real).toFixed(3);
        const imagAbs = Math.abs(amp.imag).toFixed(3);
        let coeff = `${realAbs}`;
        if (Math.abs(amp.imag) > 0.001) {
          coeff = `(${amp.real >= 0 ? '' : '-'}${realAbs} ${amp.imag >= 0 ? '+' : '-'} ${imagAbs}i)`;
        } else if (amp.real < 0) {
          coeff = `-${realAbs}`;
        }
        return `${coeff}|${amp.state}⟩`;
      });
    return `|ψ⟩ = ${terms.join(' + ').replace(/\+ -/g, '- ')}`;
  };

  const handleCopyShareLink = () => {
    try {
      const payload = {
        name: circuitName,
        circuit: circuitIR,
      };
      const encoded = encodeURIComponent(JSON.stringify(payload));
      const url = `${window.location.origin}/?circuit=${encoded}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyJSON = () => {
    const reportData = {
      title: circuitName,
      timestamp: new Date().toISOString(),
      num_qubits: circuitIR.num_qubits,
      gates_count: circuitIR.gates.length,
      circuit: circuitIR,
      execution: executionResult,
      cross_backend_verification: comparisonResult,
    };
    navigator.clipboard.writeText(JSON.stringify(reportData, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleDownloadJSON = () => {
    const reportData = {
      title: circuitName,
      timestamp: new Date().toISOString(),
      num_qubits: circuitIR.num_qubits,
      gates_count: circuitIR.gates.length,
      circuit: circuitIR,
      execution: executionResult,
      cross_backend_verification: comparisonResult,
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${circuitName.toLowerCase().replace(/\s+/g, '_')}_quantum_report.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyLatex = () => {
    const dirac = buildDiracEquation();
    navigator.clipboard.writeText(dirac);
    setCopiedLatex(true);
    setTimeout(() => setCopiedLatex(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#fffdf9] border border-[#ded7cb] rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans text-[#211f1b]">
        {/* Header */}
        <div className="p-4 border-b border-[#ded7cb] flex items-center justify-between bg-[#f0ece4]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#fff5eb] border border-[#c96b2c]/30 text-[#c96b2c]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#211f1b] text-sm">Share Circuit &amp; Lab Report</h3>
              <p className="text-[11px] text-[#746e64]">
                Export verifiable quantum experiment metrics and Dirac math equations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-[#746e64] hover:text-[#211f1b] hover:bg-[#eee9df] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* Overview Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center">
            <div className="bg-[#f7f4ee] p-2.5 rounded-lg border border-[#ded7cb]">
              <div className="text-[10px] text-[#746e64] uppercase font-bold">Qubits</div>
              <div className="text-base font-extrabold text-[#c96b2c]">{circuitIR.num_qubits}</div>
            </div>
            <div className="bg-[#f7f4ee] p-2.5 rounded-lg border border-[#ded7cb]">
              <div className="text-[10px] text-[#746e64] uppercase font-bold">Total Gates</div>
              <div className="text-base font-extrabold text-[#211f1b]">{circuitIR.gates.length}</div>
            </div>
            <div className="bg-[#f7f4ee] p-2.5 rounded-lg border border-[#ded7cb]">
              <div className="text-[10px] text-[#746e64] uppercase font-bold">Sim Engine</div>
              <div className="text-xs font-bold text-[#0f62fe] truncate mt-1">
                {executionResult?.backend_name || 'Qiskit Aer'}
              </div>
            </div>
            <div className="bg-[#f7f4ee] p-2.5 rounded-lg border border-[#ded7cb]">
              <div className="text-[10px] text-[#746e64] uppercase font-bold">Verification</div>
              <div className="text-xs font-bold text-[#137333] truncate mt-1">
                {comparisonResult ? (comparisonResult.match ? '100% Match' : 'Mismatch') : 'Simulated'}
              </div>
            </div>
          </div>

          {/* Dirac State Equation */}
          <div className="bg-[#fcfbf9] border border-[#ded7cb] rounded-lg p-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#ded7cb]/60 mb-2">
              <span className="text-[10.5px] font-bold text-[#746e64] uppercase tracking-wider">
                Quantum State Representation (Dirac Equation)
              </span>
              <button
                onClick={handleCopyLatex}
                className="text-[11px] font-semibold text-[#c96b2c] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedLatex ? <Check className="w-3 h-3 text-[#137333]" /> : <Copy className="w-3 h-3" />}
                {copiedLatex ? 'Copied' : 'Copy Dirac Notation'}
              </button>
            </div>
            <div className="p-2 bg-[#f7f4ee] rounded border border-[#ded7cb] font-mono text-xs text-[#211f1b] overflow-x-auto whitespace-nowrap">
              {buildDiracEquation()}
            </div>
          </div>

          {/* Basis Probabilities Breakdown */}
          {executionResult?.probabilities && (
            <div className="bg-[#fcfbf9] border border-[#ded7cb] rounded-lg p-3">
              <span className="text-[10.5px] font-bold text-[#746e64] uppercase tracking-wider block mb-2">
                Measurement Basis Probabilities
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                {Object.entries(executionResult.probabilities)
                  .filter(([_, prob]) => prob > 0.001)
                  .map(([basis, prob]) => (
                    <div
                      key={basis}
                      className="p-2 rounded bg-[#f7f4ee] border border-[#ded7cb] flex items-center justify-between"
                    >
                      <span className="font-bold text-[#211f1b]">|{basis}⟩</span>
                      <span className="text-[#c96b2c] font-semibold">{(prob * 100).toFixed(1)}%</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Quick Action Export Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#ded7cb]/80">
            <button
              onClick={handleCopyShareLink}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#c96b2c] hover:bg-[#b55e24] text-white font-bold text-xs shadow-xs transition-transform active:scale-98 cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Shareable Link'}</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#fffdf9] border border-[#ded7cb] hover:bg-[#eee9df] text-[#211f1b] font-semibold text-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#c96b2c]" />
              <span>Download Report (.json)</span>
            </button>

            <button
              onClick={handleCopyJSON}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#fffdf9] border border-[#ded7cb] hover:bg-[#eee9df] text-[#211f1b] font-semibold text-xs transition-colors cursor-pointer"
            >
              {copiedJson ? <Check className="w-4 h-4 text-[#137333]" /> : <Copy className="w-4 h-4" />}
              <span>{copiedJson ? 'Copied JSON' : 'Copy JSON'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
