'use client'

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import type { StatevectorAmplitude } from '@/types/quantum';
import { RotateCcw } from 'lucide-react';

interface QSphereProps {
  amplitudes?: StatevectorAmplitude[];
  numQubits?: number;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

// Convert phase [-pi, pi] or [0, 2pi] to IBM Qiskit Q-Sphere color
function getPhaseColor(phaseRad: number): { hex: string; hsl: string } {
  let norm = phaseRad % (2 * Math.PI);
  if (norm < 0) norm += 2 * Math.PI;

  const hue = Math.round(((norm / (2 * Math.PI)) * 360 + 260) % 360);
  return {
    hex: `hsl(${hue}, 85%, 60%)`,
    hsl: `hsl(${hue}, 85%, 60%)`,
  };
}

function getHammingWeight(bitstr: string): number {
  let count = 0;
  for (let i = 0; i < bitstr.length; i++) {
    if (bitstr[i] === '1') count++;
  }
  return count;
}

export const QSphere: React.FC<QSphereProps> = ({
  amplitudes = [],
  numQubits = 2,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Orbit rotation angles
  const [rotX, setRotX] = useState<number>(-0.35);
  const [rotY, setRotY] = useState<number>(0.45);
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Display toggles
  const [showStateLabels, setShowStateLabels] = useState<boolean>(true);
  const [showPhaseLabels, setShowPhaseLabels] = useState<boolean>(false);

  // Hovered node state
  const [hoveredNode, setHoveredNode] = useState<{
    state: string;
    prob: number;
    magnitude: number;
    phase_rad: number;
    phase_deg: number;
    screenX: number;
    screenY: number;
  } | null>(null);

  const handleResetOrientation = () => {
    setRotX(-0.35);
    setRotY(0.45);
  };

  const sphereNodes = useMemo(() => {
    const totalStates = Math.pow(2, numQubits);
    const nodes: Array<{
      state: string;
      index: number;
      hammingWeight: number;
      p3: Point3D;
      magnitude: number;
      prob: number;
      phase_rad: number;
      phase_deg: number;
    }> = [];

    const byWeight: Record<number, number[]> = {};
    for (let w = 0; w <= numQubits; w++) {
      byWeight[w] = [];
    }

    for (let idx = 0; idx < totalStates; idx++) {
      const bitstr = idx.toString(2).padStart(numQubits, '0');
      const w = getHammingWeight(bitstr);
      byWeight[w].push(idx);
    }

    for (let w = 0; w <= numQubits; w++) {
      const list = byWeight[w];
      const count = list.length;
      const theta = (Math.PI * w) / numQubits;

      list.forEach((idx, orderInLevel) => {
        const bitstr = idx.toString(2).padStart(numQubits, '0');
        const phi = (2 * Math.PI * orderInLevel) / count;

        let x = Math.sin(theta) * Math.cos(phi);
        let y = Math.cos(theta);
        let z = Math.sin(theta) * Math.sin(phi);

        if (w === 0) {
          x = 0;
          y = 1;
          z = 0;
        } else if (w === numQubits) {
          x = 0;
          y = -1;
          z = 0;
        }

        const amp = amplitudes[idx] || {
          state: bitstr,
          index: idx,
          real: idx === 0 ? 1 : 0,
          imag: 0,
          magnitude: idx === 0 ? 1 : 0,
          phase_rad: 0,
          phase_deg: 0,
        };

        nodes.push({
          state: bitstr,
          index: idx,
          hammingWeight: w,
          p3: { x, y, z },
          magnitude: amp.magnitude,
          prob: amp.magnitude * amp.magnitude,
          phase_rad: amp.phase_rad,
          phase_deg: amp.phase_deg,
        });
      });
    }

    return nodes;
  }, [amplitudes, numQubits]);

  const draw = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const centerX = width / 2;
    const centerY = height / 2;
    const sphereRadius = Math.min(width, height) * 0.36;

    ctx.clearRect(0, 0, width, height);

    const project = (p: Point3D): { x: number; y: number; z: number; scale: number } => {
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const x1 = p.x * cosY + p.z * sinY;
      const y1 = p.y;
      const z1 = -p.x * sinY + p.z * cosY;

      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const x2 = x1;
      const y2 = y1 * cosX - z1 * sinX;
      const z2 = y1 * sinX + z1 * cosX;

      const cameraDist = 3.2;
      const scale = cameraDist / (cameraDist - z2 * 0.6);

      return {
        x: centerX + x2 * sphereRadius * scale,
        y: centerY - y2 * sphereRadius * scale,
        z: z2,
        scale,
      };
    };

    // 1. Draw Sphere Background Shading & Outline
    const grad = ctx.createRadialGradient(
      centerX - sphereRadius * 0.3,
      centerY - sphereRadius * 0.3,
      sphereRadius * 0.1,
      centerX,
      centerY,
      sphereRadius
    );
    grad.addColorStop(0, 'rgba(255, 253, 249, 0.95)');
    grad.addColorStop(0.7, 'rgba(240, 236, 228, 0.85)');
    grad.addColorStop(1, 'rgba(222, 215, 203, 0.95)');

    ctx.beginPath();
    ctx.arc(centerX, centerY, sphereRadius, 0, 2 * Math.PI);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(180, 172, 160, 0.8)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 2. Draw Latitude Rings
    for (let w = 0; w <= numQubits; w++) {
      const theta = (Math.PI * w) / numQubits;
      const rRing = Math.sin(theta);
      const yRing = Math.cos(theta);

      if (rRing > 0.001) {
        ctx.beginPath();
        const steps = 64;
        for (let i = 0; i <= steps; i++) {
          const phi = (2 * Math.PI * i) / steps;
          const p: Point3D = {
            x: rRing * Math.cos(phi),
            y: yRing,
            z: rRing * Math.sin(phi),
          };
          const proj = project(p);
          if (i === 0) ctx.moveTo(proj.x, proj.y);
          else ctx.lineTo(proj.x, proj.y);
        }
        ctx.strokeStyle =
          w === numQubits / 2
            ? 'rgba(37, 99, 235, 0.45)'
            : 'rgba(180, 172, 160, 0.45)';
        ctx.lineWidth = w === numQubits / 2 ? 1.2 : 0.8;
        ctx.stroke();
      }
    }

    // 3. Draw Longitude Meridian
    ctx.beginPath();
    for (let i = 0; i <= 64; i++) {
      const theta = (Math.PI * i) / 64;
      const p: Point3D = {
        x: Math.sin(theta),
        y: Math.cos(theta),
        z: 0,
      };
      const proj = project(p);
      if (i === 0) ctx.moveTo(proj.x, proj.y);
      else ctx.lineTo(proj.x, proj.y);
    }
    ctx.strokeStyle = 'rgba(180, 172, 160, 0.35)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // 4. Project and Sort Nodes
    const projectedNodes = sphereNodes.map((n) => {
      const proj = project(n.p3);
      return {
        ...n,
        proj,
      };
    });

    projectedNodes.sort((a, b) => a.proj.z - b.proj.z);

    // 5. Inactive dots
    projectedNodes.forEach((node) => {
      if (node.prob < 0.001) {
        ctx.beginPath();
        ctx.arc(node.proj.x, node.proj.y, 2 * node.proj.scale, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(160, 152, 140, 0.6)';
        ctx.fill();
      }
    });

    // 6. Active rays and nodes
    projectedNodes.forEach((node) => {
      if (node.prob >= 0.001) {
        const origin = project({ x: 0, y: 0, z: 0 });
        const { hex } = getPhaseColor(node.phase_rad);

        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);
        ctx.lineTo(node.proj.x, node.proj.y);
        ctx.strokeStyle = hex;
        ctx.lineWidth = Math.max(1.5, 2.5 * node.magnitude * node.proj.scale);
        ctx.stroke();

        const baseRadius = 8 + 18 * Math.sqrt(node.prob);
        const nodeR = Math.max(4, baseRadius * node.proj.scale);

        const nodeGrad = ctx.createRadialGradient(
          node.proj.x - nodeR * 0.3,
          node.proj.y - nodeR * 0.3,
          nodeR * 0.1,
          node.proj.x,
          node.proj.y,
          nodeR
        );
        nodeGrad.addColorStop(0, '#ffffff');
        nodeGrad.addColorStop(0.35, hex);
        nodeGrad.addColorStop(1, 'rgba(33, 31, 27, 0.85)');

        ctx.beginPath();
        ctx.arc(node.proj.x, node.proj.y, nodeR, 0, 2 * Math.PI);
        ctx.fillStyle = nodeGrad;
        ctx.fill();
        ctx.strokeStyle = hex;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(node.proj.x, node.proj.y, nodeR + 3, 0, 2 * Math.PI);
        ctx.strokeStyle = `${hex}44`;
        ctx.lineWidth = 2;
        ctx.stroke();

        if (showStateLabels) {
          ctx.font = 'bold 11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
          ctx.fillStyle = '#211f1b';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(`|${node.state}⟩`, node.proj.x, node.proj.y - nodeR - 4);
        }

        if (showPhaseLabels) {
          ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
          ctx.fillStyle = hex;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(`${node.phase_rad.toFixed(2)} rad`, node.proj.x, node.proj.y + nodeR + 4);
        }
      }
    });
  }, [sphereNodes, rotX, rotY, showStateLabels, showPhaseLabels, numQubits]);

  useEffect(() => {
    draw();
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      draw();
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
    };
  }, [draw]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const width = rect.width;
      const height = rect.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const sphereRadius = Math.min(width, height) * 0.36;

      let found = null;
      for (const n of sphereNodes) {
        if (n.prob >= 0.001) {
          const cosY = Math.cos(rotY);
          const sinY = Math.sin(rotY);
          const x1 = n.p3.x * cosY + n.p3.z * sinY;
          const y1 = n.p3.y;
          const z1 = -n.p3.x * sinY + n.p3.z * cosY;

          const cosX = Math.cos(rotX);
          const sinX = Math.sin(rotX);
          const x2 = x1;
          const y2 = y1 * cosX - z1 * sinX;
          const z2 = y1 * sinX + z1 * cosX;

          const scale = 3.2 / (3.2 - z2 * 0.6);
          const px = centerX + x2 * sphereRadius * scale;
          const py = centerY - y2 * sphereRadius * scale;
          const dist = Math.hypot(mouseX - px, mouseY - py);

          if (dist < 22) {
            found = {
              state: n.state,
              prob: n.prob,
              magnitude: n.magnitude,
              phase_rad: n.phase_rad,
              phase_deg: n.phase_deg,
              screenX: e.clientX,
              screenY: e.clientY,
            };
            break;
          }
        }
      }
      setHoveredNode(found);
      return;
    }

    const deltaX = e.clientX - lastMousePosRef.current.x;
    const deltaY = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    setRotY((prev) => prev + deltaX * 0.008);
    setRotX((prev) => Math.max(-Math.PI / 2, Math.min(Math.PI / 2, prev + deltaY * 0.008)));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-[#fffdf9] rounded-lg border border-[#ded7cb] select-none overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#ded7cb] bg-[#f0ece4] shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-semibold text-[#211f1b] uppercase tracking-wider truncate">
            Q-sphere
          </span>
          <span className="text-[10px] text-[#746e64] font-mono shrink-0">({numQubits} Qubits)</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleResetOrientation}
            className="p-1 rounded text-[#746e64] hover:text-[#211f1b] hover:bg-[#eee9df] transition-colors cursor-pointer"
            title="Reset 3D View Orientation"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 3D Sphere Interactive Area */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full min-h-0 cursor-grab active:cursor-grabbing flex items-center justify-center bg-[#fcfbf9] overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
        />

        {hoveredNode && (
          <div
            className="absolute z-20 pointer-events-none p-2 rounded-md bg-[#fffdf9] border border-[#ded7cb] shadow-xl text-[11px] font-mono text-[#211f1b] flex flex-col gap-0.5"
            style={{
              left: Math.min(hoveredNode.screenX - 80, 160),
              top: Math.min(hoveredNode.screenY - 120, 120),
            }}
          >
            <div className="text-xs font-bold text-[#0f62fe]">|{hoveredNode.state}⟩</div>
            <div className="text-[#4f806d] font-semibold">Prob: {(hoveredNode.prob * 100).toFixed(1)}%</div>
            <div className="text-[#746e64]">Amp: {hoveredNode.magnitude.toFixed(3)}</div>
            <div className="text-[#c96b2c]">Phase: {hoveredNode.phase_rad.toFixed(2)} rad ({hoveredNode.phase_deg.toFixed(0)}°)</div>
          </div>
        )}

        {/* Labels checkbox in bottom right */}
        <div className="absolute bottom-2 right-2 p-1.5 rounded bg-[#fffdf9]/95 border border-[#ded7cb] flex items-center gap-2 shadow-xs backdrop-blur-xs text-[10px]">
          <label className="flex items-center gap-1 text-[#211f1b] cursor-pointer hover:text-[#c96b2c]">
            <input
              type="checkbox"
              checked={showStateLabels}
              onChange={(e) => setShowStateLabels(e.target.checked)}
              className="w-2.5 h-2.5 rounded bg-[#fffdf9] border-[#ded7cb] text-[#c96b2c] focus:ring-0 cursor-pointer"
            />
            <span>State</span>
          </label>
          <label className="flex items-center gap-1 text-[#211f1b] cursor-pointer hover:text-[#c96b2c]">
            <input
              type="checkbox"
              checked={showPhaseLabels}
              onChange={(e) => setShowPhaseLabels(e.target.checked)}
              className="w-2.5 h-2.5 rounded bg-[#fffdf9] border-[#ded7cb] text-[#c96b2c] focus:ring-0 cursor-pointer"
            />
            <span>Phase</span>
          </label>
        </div>
      </div>
    </div>
  );
};
