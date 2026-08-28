import React from 'react';
import type {
  ExecutionResponse,
  ComparisonResponse,
  BlochVector,
} from '../types/quantum';
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

  // Format probabilities for Recharts - generate all 2^n basis states for complete chart
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
            className="flex items-center gap-2 px-5 py-2 rounded bg-[#0f62fe] hover:bg-[#0043ce] disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Simulating...' : 'Run Simulation'}</span>
          </button>

          {executionResult && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
              <Clock className="w-3 h-3 text-gray-500" />
              <span>{executionResult.execution_time_ms} ms</span>
            </div>
          )}
        </div>

        {/* Cross-Backend Equivalence Badge */}
        {comparisonResult && (
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-mono font-medium transition-all ${
              comparisonResult.match
                ? 'bg-[#198038]/20 border border-[#24a148] text-[#42be65]'
                : 'bg-[#da1e28]/20 border border-[#fa4d56] text-[#ff8389]'
            }`}
          >
            {comparisonResult.match ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#42be65]" />
                <span>
                  Aer ⇄ PennyLane MATCH (Δ={comparisonResult.max_diff.toFixed(6)}, F={comparisonResult.fidelity.toFixed(4)})
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5 text-[#fa4d56]" />
                <span>
                  MISMATCH (Δ={comparisonResult.max_diff.toFixed(6)}, Tol={comparisonResult.tolerance})
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="p-2.5 rounded bg-red-950/70 border border-red-800 text-red-300 text-xs">
          <strong>Simulation Error:</strong> {error}
        </div>
      )}

      {/* Main Split View: Probabilities (Left) and Q-Sphere (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* Left Card: Probabilities Bar Chart */}
        <div className="bg-[#161616] border border-[#393939] rounded-lg flex flex-col h-full shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#262626] bg-[#121619]/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-200 uppercase tracking-wider">
                Probabilities
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Info className="w-3.5 h-3.5 hover:text-gray-200 cursor-pointer" />
            </div>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between min-h-[300px]">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis
                    dataKey="state"
                    stroke="#8d8d8d"
                    fontSize={10}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#8d8d8d"
                    fontSize={10}
                    domain={[0, 100]}
                    unit="%"
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f242b',
                      borderColor: '#393939',
                      borderRadius: '0.375rem',
                      fontSize: '11px',
                      color: '#f4f4f4',
                      fontFamily: 'monospace',
                    }}
                    formatter={(val: any) => [`${val}%`, 'Probability']}
                  />
                  <Bar dataKey="probability" radius={[2, 2, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.probability > 0 ? '#1192e8' : '#262626'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center text-[10px] text-gray-400 font-mono -mt-2">
              Computational basis states
            </div>
          </div>
        </div>

        {/* Right Card: Interactive 3D Q-Sphere */}
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
