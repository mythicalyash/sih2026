'use client'

import React, { useState } from 'react';
import type { AmplitudeItem } from '@/types/quantum';
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
import { Copy, Check, ChevronDown, Layers } from 'lucide-react';

interface StatevectorVisualizerProps {
  amplitudes?: AmplitudeItem[];
  numQubits: number;
}

export const StatevectorVisualizer: React.FC<StatevectorVisualizerProps> = ({
  amplitudes,
  numQubits,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [showMore, setShowMore] = useState<boolean>(false);

  const totalStates = Math.pow(2, numQubits);

  // Generate fallback/default state amplitudes if not provided
  const items: AmplitudeItem[] =
    amplitudes && amplitudes.length > 0
      ? amplitudes
      : Array.from({ length: totalStates }).map((_, idx) => {
          const bitstr = idx.toString(2).padStart(numQubits, '0');
          const isInitial = idx === 0;
          return {
            state: bitstr,
            index: idx,
            real: isInitial ? 1 : 0,
            imag: 0,
            magnitude: isInitial ? 1 : 0,
            phase_rad: 0,
            phase_deg: 0,
          };
        });

  const chartData = items.map((item) => {
    return {
      state: item.state,
      amplitude: Number(item.magnitude.toFixed(4)),
      real: item.real,
      imag: item.imag,
      phase_rad: item.phase_rad,
      phase_deg: item.phase_deg,
    };
  });

  // Convert raw values for array display
  const rawArrayValues = items.map((item) => {
    if (showMore) {
      const sign = item.imag >= 0 ? '+' : '-';
      return `${item.real.toFixed(3)}${sign}${Math.abs(item.imag).toFixed(3)}j`;
    }
    // Simple magnitude or rounded integer representation
    if (Math.abs(item.magnitude - 1) < 1e-4) return '1';
    if (item.magnitude < 1e-4) return '0';
    return item.magnitude.toFixed(2);
  });

  const rawArrayText = `[ ${rawArrayValues.join(', ')} ]`;

  const handleCopy = () => {
    navigator.clipboard.writeText(rawArrayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPhaseBarColor = (phaseDeg: number, magnitude: number) => {
    if (magnitude < 1e-4) return '#eee9df';
    const hue = Math.round(((phaseDeg + 360) % 360 + 260) % 360);
    return `hsl(${hue}, 85%, 55%)`;
  };

  return (
    <div className="bg-[#fffdf9] border border-[#ded7cb] rounded-lg flex flex-col h-full shadow-sm overflow-hidden min-w-0 select-none">
      {/* Card Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#ded7cb] bg-[#f0ece4] shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Layers className="w-3.5 h-3.5 text-[#c96b2c] shrink-0" />
          <span className="text-[11px] font-semibold text-[#211f1b] uppercase tracking-wider truncate">
            Statevector
          </span>
          <span className="text-[10px] text-[#746e64] font-mono shrink-0">
            ({numQubits} Qubits)
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-2 flex-1 min-h-0 flex flex-col justify-between overflow-hidden gap-1.5">
        {/* Top: Amplitude Bar Chart */}
        <div className="flex-1 min-h-0 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 6, right: 6, left: -26, bottom: 18 }}>
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
                domain={[0, 1.0]}
                ticks={[0, 0.2, 0.4, 0.6, 0.8, 1.0]}
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
                formatter={(val: any, name: any, item: any) => [
                  `${val} (Phase: ${item.payload.phase_deg.toFixed(1)}°)`,
                  'Amplitude',
                ]}
              />
              <Bar dataKey="amplitude" radius={[2, 2, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getPhaseBarColor(entry.phase_deg, entry.amplitude)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="text-center text-[9px] text-[#746e64] font-mono shrink-0 -mt-1">
          Computational basis states
        </div>

        {/* Bottom Section: Phase Color Wheel (Left) & Array Box (Right) */}
        <div className="flex items-center gap-2 pt-1 border-t border-[#ded7cb] shrink-0">
          {/* Phase Legend Wheel */}
          <div className="flex items-center gap-1.5 p-1 rounded bg-[#fffdf9] border border-[#ded7cb] shrink-0">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div
                className="w-7 h-7 rounded-full border border-[#ded7cb] shadow-inner"
                style={{
                  background:
                    'conic-gradient(from 0deg, hsl(260, 85%, 60%), hsl(200, 85%, 60%), hsl(140, 85%, 60%), hsl(35, 85%, 60%), hsl(260, 85%, 60%))',
                }}
              />
              <div className="absolute inset-0 m-auto w-3.5 h-3.5 rounded-full bg-[#fffdf9] flex items-center justify-center text-[6px] font-bold text-[#211f1b]">
                Phase
              </div>
            </div>

            <div className="flex flex-col text-[7px] font-mono text-[#746e64] leading-tight font-medium pr-0.5">
              <span>π/2</span>
              <div className="flex justify-between gap-1.5">
                <span>π</span>
                <span>0</span>
              </div>
              <span>3π/2</span>
            </div>
          </div>

          {/* Raw Statevector Array Box */}
          <div className="flex-1 min-w-0 p-1.5 rounded bg-[#f0ece4] border border-[#ded7cb] flex flex-col justify-between overflow-hidden">
            <div className="flex items-start justify-between gap-1">
              <div
                className="font-mono text-[9.5px] text-[#211f1b] leading-tight break-all line-clamp-2 max-h-[32px] overflow-y-auto"
                title={rawArrayText}
              >
                {rawArrayText}
              </div>
              <button
                onClick={handleCopy}
                className="p-1 rounded hover:bg-[#ded7cb] text-[#746e64] hover:text-[#211f1b] transition-colors shrink-0 cursor-pointer"
                title="Copy statevector array"
              >
                {copied ? <Check className="w-3 h-3 text-[#137333]" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            <button
              onClick={() => setShowMore(!showMore)}
              className="text-[9px] text-[#746e64] hover:text-[#211f1b] flex items-center gap-0.5 ml-auto pt-0.5 cursor-pointer font-medium"
            >
              <span>{showMore ? 'Show less' : 'Show more'}</span>
              <ChevronDown
                className={`w-2.5 h-2.5 transition-transform duration-200 ${
                  showMore ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
