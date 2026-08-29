'use client'

import React from 'react';
import type {
  ExecutionResponse,
  ComparisonResponse,
  BlochVector,
} from '@/types/quantum';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Info,
} from 'lucide-react';
import { QSphere } from './QSphere';

interface ResultsPanelProps {
  onRunSimulation: () => void;
  isRunning: boolean;
  executionResult: ExecutionResponse | null;
  comparisonResult: ComparisonResponse | null;
  blochVectors?: BlochVector[];
  numQubits: number;
  error: string | null;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  onRunSimulation,
  isRunning,
  executionResult,
  comparisonResult,
  numQubits,
  error,
}) => {
  const totalStates = Math.pow(2, numQubits);
  const chartData = Array.from({ length: totalStates }).map((_, idx) => {
    const bitstr = idx.toString(2).padStart(numQubits, '0');
    const prob = executionResult?.probabilities ? executionResult.probabilities[bitstr] || 0 : (idx === 0 ? 1 : 0);
    return {
      state: bitstr,
      probability: Number((prob * 100).toFixed(2)),
      probDecimal: prob,
    };
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Top Action & Verification Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onRunSimulation()}
            disabled={isRunning}
            className="flex items-center gap-2 px-5 py-2 rounded bg-[#c96b2c] hover:bg-[#b55e24] disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-sm cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Simulating...' : 'Run Simulation'}</span>
          </button>

          {executionResult && (
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2 py-0.5 rounded bg-[#f0ece4] border border-[#ded7cb] text-[#211f1b] font-semibold text-[11px]">
                {executionResult.backend_name || 'Qiskit Aer'}
              </span>
              <div className="flex items-center gap-1 text-[#746e64]">
                <Clock className="w-3 h-3 text-[#746e64]" />
                <span>{executionResult.execution_time_ms} ms</span>
              </div>
            </div>
          )}
        </div>

        {/* Cross-Backend Equivalence Badge */}
        {comparisonResult && (
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-mono font-medium transition-all ${
              comparisonResult.match
                ? 'bg-[#e6f4ea] border border-[#34a853] text-[#137333]'
                : 'bg-[#fce8e6] border border-[#ea4335] text-[#c5221f]'
            }`}
            title={comparisonResult.details}
          >
            {comparisonResult.match ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#137333]" />
                <span>
                  Multi-Backend Verified: MATCH (Δ={comparisonResult.max_diff.toFixed(6)}, F={comparisonResult.fidelity.toFixed(4)})
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5 text-[#c5221f]" />
                <span>
                  MISMATCH (Δ={comparisonResult.max_diff.toFixed(6)}, Tol={comparisonResult.tolerance})
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="p-2.5 rounded bg-[#fce8e6] border border-[#ea4335] text-[#c5221f] text-xs">
          <strong>Simulation Error:</strong> {error}
        </div>
      )}

      {/* Main Split View: Probabilities (Left) and Q-Sphere (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <div className="bg-[#fffdf9] border border-[#ded7cb] rounded-lg flex flex-col h-full shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#ded7cb] bg-[#f0ece4]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#211f1b] uppercase tracking-wider">
                Probabilities
              </span>
            </div>
            <div className="flex items-center gap-2 text-[#746e64]">
              <Info className="w-3.5 h-3.5 hover:text-[#211f1b] cursor-pointer" />
            </div>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between min-h-[300px]">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ded7cb" vertical={false} />
                  <XAxis
                    dataKey="state"
                    stroke="#746e64"
                    fontSize={10}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#746e64"
                    fontSize={10}
                    domain={[0, 100]}
                    unit="%"
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fffdf9',
                      borderColor: '#ded7cb',
                      borderRadius: '0.375rem',
                      fontSize: '11px',
                      color: '#211f1b',
                      fontFamily: 'monospace',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(val: any) => [`${val}%`, 'Probability']}
                  />
                  <Bar dataKey="probability" radius={[2, 2, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.probability > 0 ? '#0f62fe' : '#eee9df'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center text-[10px] text-[#746e64] font-mono -mt-2">
              Computational basis states
            </div>
          </div>
        </div>

        <div className="h-full min-h-[340px]">
          <QSphere
            amplitudes={executionResult?.statevector}
            numQubits={numQubits}
          />
        </div>
      </div>
    </div>
  );
};
