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
import { StatevectorVisualizer } from './StatevectorVisualizer';

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
    <div className="h-full flex flex-col gap-1.5 overflow-hidden">
      {/* Top Action & Verification Status Bar */}
      <div className="flex items-center justify-between gap-2 px-0.5 shrink-0">
        <div className="flex items-center gap-2">
          {executionResult && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <span className="px-1.5 py-0.5 rounded bg-[#f0ece4] border border-[#ded7cb] text-[#211f1b] font-semibold text-[10px]">
                {executionResult.backend_name || 'Qiskit Aer'}
              </span>
              <div className="hidden sm:flex items-center gap-1 text-[#746e64] text-[10px]">
                <Clock className="w-2.5 h-2.5 text-[#746e64]" />
                <span>{executionResult.execution_time_ms} ms</span>
              </div>
            </div>
          )}
        </div>

        {/* Cross-Backend Equivalence Badge */}
        {comparisonResult && (
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-all ${
              comparisonResult.match
                ? 'bg-[#e6f4ea] border border-[#34a853] text-[#137333]'
                : 'bg-[#fce8e6] border border-[#ea4335] text-[#c5221f]'
            }`}
            title={comparisonResult.details}
          >
            {comparisonResult.match ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-[#137333]" />
                <span className="truncate">
                  Verified: MATCH (Δ={comparisonResult.max_diff.toFixed(6)})
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3 text-[#c5221f]" />
                <span className="truncate">
                  MISMATCH (Δ={comparisonResult.max_diff.toFixed(6)})
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="p-1.5 rounded bg-[#fce8e6] border border-[#ea4335] text-[#c5221f] text-[11px] shrink-0">
          <strong>Simulation Error:</strong> {error}
        </div>
      )}

      {/* Main 3-Box View: Probabilities, Statevector, and Q-Sphere */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-2 items-stretch overflow-hidden">
        {/* 1. State Probabilities */}
        <div className="bg-[#fffdf9] border border-[#ded7cb] rounded-lg flex flex-col h-full shadow-sm overflow-hidden min-w-0">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#ded7cb] bg-[#f0ece4] shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[#211f1b] uppercase tracking-wider">
                Probabilities
              </span>
            </div>
            <div className="flex items-center gap-2 text-[#746e64]">
              <Info className="w-3.5 h-3.5 hover:text-[#211f1b] cursor-pointer" />
            </div>
          </div>

          <div className="p-2 flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
            <div className="flex-1 min-h-0 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 6, right: 6, left: -30, bottom: 18 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ded7cb" vertical={false} />
                  <XAxis
                    dataKey="state"
                    stroke="#746e64"
                    fontSize={9}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#746e64"
                    fontSize={9}
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
            <div className="text-center text-[9px] text-[#746e64] font-mono shrink-0">
              Computational basis states
            </div>
          </div>
        </div>

        {/* 2. Statevector Visualizer */}
        <div className="h-full min-h-0 min-w-0 overflow-hidden">
          <StatevectorVisualizer
            amplitudes={executionResult?.statevector as any}
            numQubits={numQubits}
          />
        </div>

        {/* 3. Q-Sphere */}
        <div className="h-full min-h-0 min-w-0 overflow-hidden">
          <QSphere
            amplitudes={executionResult?.statevector as any}
            numQubits={numQubits}
          />
        </div>
      </div>
    </div>
  );
};
