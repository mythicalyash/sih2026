'use client'

import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Sparkles, Compass, Eye, Info } from 'lucide-react';

interface InteractiveBlochSphereProps {
  initialTheta?: number; // Polar angle in radians (0 = |0>, PI = |1>)
  initialPhi?: number;   // Azimuthal phase in radians
  onStateChange?: (theta: number, phi: number, stateName?: string) => void;
  compact?: boolean;
}

export const InteractiveBlochSphere: React.FC<InteractiveBlochSphereProps> = ({
  initialTheta = 0,
  initialPhi = 0,
  onStateChange,
  compact = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Statevector angles
  const [theta, setTheta] = useState<number>(initialTheta);
  const [phi, setPhi] = useState<number>(initialPhi);
  
  // 3D View rotation angles (for dragging view)
  const [rotX, setRotX] = useState<number>(0.35);
  const [rotY, setRotY] = useState<number>(-0.45);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [lastMousePos, setLastMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Sync state changes upward
  useEffect(() => {
    if (onStateChange) {
      onStateChange(theta, phi);
    }
  }, [theta, phi, onStateChange]);

  // Apply quantum gate transformations to (theta, phi)
  const applyGate = (gate: 'x' | 'y' | 'z' | 'h' | 's' | 't' | 'reset') => {
    // Current Cartesian coordinates
    let x = Math.sin(theta) * Math.cos(phi);
    let y = Math.sin(theta) * Math.sin(phi);
    let z = Math.cos(theta);

    if (gate === 'reset') {
      setTheta(0);
      setPhi(0);
      return;
    }

    if (gate === 'x') {
      // Rotate 180 deg around X-axis: y -> -y, z -> -z
      y = -y;
      z = -z;
    } else if (gate === 'y') {
      // Rotate 180 deg around Y-axis: x -> -x, z -> -z
      x = -x;
      z = -z;
    } else if (gate === 'z') {
      // Rotate 180 deg around Z-axis: x -> -x, y -> -y
      x = -x;
      y = -y;
    } else if (gate === 'h') {
      // Hadamard: swap X and Z axes (X -> Z, Z -> X, Y -> -Y)
      const temp = x;
      x = z;
      z = temp;
      y = -y;
    } else if (gate === 's') {
      // Phase gate (+90 deg rotation around Z): (x, y) -> (-y, x)
      const tempX = x;
      x = -y;
      y = tempX;
    } else if (gate === 't') {
      // T gate (+45 deg rotation around Z)
      const cos45 = Math.SQRT1_2;
      const sin45 = Math.SQRT1_2;
      const newX = x * cos45 - y * sin45;
      const newY = x * sin45 + y * cos45;
      x = newX;
      y = newY;
    }

    // Convert (x, y, z) back to spherical (theta, phi)
    const newTheta = Math.acos(Math.max(-1, Math.min(1, z)));
    let newPhi = Math.atan2(y, x);
    if (newPhi < 0) newPhi += 2 * Math.PI;

    setTheta(newTheta);
    setPhi(newPhi);
  };

  // Preset basis states
  const setPreset = (preset: '|0>' | '|1>' | '|+>' | '|->' | '|i>' | '|-i>') => {
    switch (preset) {
      case '|0>': setTheta(0); setPhi(0); break;
      case '|1>': setTheta(Math.PI); setPhi(0); break;
      case '|+>': setTheta(Math.PI / 2); setPhi(0); break;
      case '|->': setTheta(Math.PI / 2); setPhi(Math.PI); break;
      case '|i>': setTheta(Math.PI / 2); setPhi(Math.PI / 2); break;
      case '|-i>': setTheta(Math.PI / 2); setPhi((3 * Math.PI) / 2); break;
    }
  };

  // Canvas 3D Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const R = Math.min(width, height) * 0.38;

    ctx.clearRect(0, 0, width, height);

    // 3D projection function
    const project = (x: number, y: number, z: number) => {
      // Rotate around Y axis
      const x1 = x * Math.cos(rotY) + z * Math.sin(rotY);
      const z1 = -x * Math.sin(rotY) + z * Math.cos(rotY);
      // Rotate around X axis
      const y2 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
      const z2 = y * Math.sin(rotX) + z1 * Math.cos(rotX);
      return {
        px: cx + x1 * R,
        py: cy - y2 * R,
        depth: z2,
      };
    };

    // 1. Draw outer sphere circle with subtle depth gradient
    const grad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    grad.addColorStop(0.8, 'rgba(244, 241, 235, 0.6)');
    grad.addColorStop(1, 'rgba(224, 218, 206, 0.8)');

    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 2 * Math.PI);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#d6cebf';
    ctx.stroke();

    // 2. Draw Equator (XY Plane) and Meridians
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#c4bbaa';
    ctx.setLineDash([4, 4]);

    // Equator circle
    for (let angle = 0; angle <= 2 * Math.PI; angle += 0.05) {
      const p = project(Math.cos(angle), Math.sin(angle), 0);
      if (angle === 0) ctx.moveTo(p.px, p.py);
      else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();

    // XZ Meridian
    ctx.beginPath();
    for (let angle = 0; angle <= 2 * Math.PI; angle += 0.05) {
      const p = project(Math.cos(angle), 0, Math.sin(angle));
      if (angle === 0) ctx.moveTo(p.px, p.py);
      else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();

    // YZ Meridian
    ctx.beginPath();
    for (let angle = 0; angle <= 2 * Math.PI; angle += 0.05) {
      const p = project(0, Math.cos(angle), Math.sin(angle));
      if (angle === 0) ctx.moveTo(p.px, p.py);
      else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Draw 3D Coordinate Axes (X: Red, Y: Green, Z: Blue)
    const drawAxis = (x: number, y: number, z: number, label: string, color: string) => {
      const p1 = project(0, 0, 0);
      const p2 = project(x * 1.25, y * 1.25, z * 1.25);

      ctx.beginPath();
      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(p2.px, p2.py);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = 'bold 11px monospace';
      ctx.fillText(label, p2.px + 4, p2.py + 4);
    };

    drawAxis(1, 0, 0, '+x |+⟩', '#d97706');
    drawAxis(0, 1, 0, '+y |i⟩', '#10b981');
    drawAxis(0, 0, 1, '+z |0⟩', '#2563eb');
    drawAxis(0, 0, -1, '-z |1⟩', '#64748b');

    // 4. Calculate Current Statevector tip
    const vx = Math.sin(theta) * Math.cos(phi);
    const vy = Math.sin(theta) * Math.sin(phi);
    const vz = Math.cos(theta);
    const tip = project(vx, vy, vz);
    const origin = project(0, 0, 0);

    // 5. Draw Statevector Arrow (Glowing Amber/Cyan Vector)
    ctx.beginPath();
    ctx.moveTo(origin.px, origin.py);
    ctx.lineTo(tip.px, tip.py);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Arrowhead / Tip Sphere
    ctx.beginPath();
    ctx.arc(tip.px, tip.py, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Projected Shadow onto XY plane
    const projShadow = project(vx, vy, 0);
    ctx.beginPath();
    ctx.moveTo(origin.px, origin.py);
    ctx.lineTo(projShadow.px, projShadow.py);
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(projShadow.px, projShadow.py);
    ctx.lineTo(tip.px, tip.py);
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
    ctx.stroke();
    ctx.setLineDash([]);
  }, [theta, phi, rotX, rotY]);

  // Mouse drag handlers for 3D sphere viewport rotation
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;

    setRotY((prev) => prev + dx * 0.01);
    setRotX((prev) => Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, prev + dy * 0.01)));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Probabilities
  const prob0 = Math.cos(theta / 2) ** 2;
  const prob1 = Math.sin(theta / 2) ** 2;

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white border border-[#e7e5e4] p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-[#f5f5f4] pb-2.5">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#d97706]" />
          <h3 className="font-bold text-sm text-[#1c1917]">Interactive 3D Bloch Sphere</h3>
        </div>
        <button
          onClick={() => applyGate('reset')}
          className="text-xs text-[#78716c] hover:text-[#1c1917] flex items-center gap-1 font-medium transition-colors cursor-pointer"
          title="Reset to ground state |0>"
        >
          <RotateCcw className="w-3 h-3" /> Reset |0⟩
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-5">
        {/* Interactive 3D Canvas */}
        <div className="relative cursor-grab active:cursor-grabbing select-none shrink-0">
          <canvas
            ref={canvasRef}
            width={compact ? 220 : 260}
            height={compact ? 220 : 260}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="rounded-xl bg-[#faf8f5]"
          />
          <span className="absolute bottom-1.5 right-2 text-[10px] font-mono text-[#a8a29e] flex items-center gap-1 pointer-events-none">
            <Eye className="w-3 h-3" /> Drag to rotate
          </span>
        </div>

        {/* State Coordinates & Quantum Gate Controls */}
        <div className="flex flex-col gap-3.5 flex-1 min-w-0 w-full">
          {/* Coordinates & Born Probabilities */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-[#faf8f5] border border-[#f5f5f4]">
              <span className="text-[10px] text-[#a8a29e] block font-sans uppercase">Polar θ</span>
              <strong className="text-sm text-[#1c1917]">{(theta / Math.PI).toFixed(2)}π</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-[#faf8f5] border border-[#f5f5f4]">
              <span className="text-[10px] text-[#a8a29e] block font-sans uppercase">Phase φ</span>
              <strong className="text-sm text-[#1c1917]">{(phi / Math.PI).toFixed(2)}π</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] text-[#15803d]">
              <span className="text-[10px] block font-sans uppercase">P(|0⟩)</span>
              <strong className="text-sm">{(prob0 * 100).toFixed(1)}%</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-[#eff6ff] border border-[#dbeafe] text-[#1d4ed8]">
              <span className="text-[10px] block font-sans uppercase">P(|1⟩)</span>
              <strong className="text-sm">{(prob1 * 100).toFixed(1)}%</strong>
            </div>
          </div>

          {/* Preset Basis States */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-[#78716c]">Basis Presets:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['|0>', '|1>', '|+>', '|->', '|i>', '|-i>'] as const).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setPreset(preset)}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-[#faf8f5] hover:bg-[#f5f5f4] text-[#1c1917] border border-[#e7e5e4] transition-all cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Live Gate Operators */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-[#78716c]">Apply Unitary Gate:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['x', 'y', 'z', 'h', 's', 't'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => applyGate(g)}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#1c1917] hover:bg-[#292524] text-white shadow-2xs transition-all cursor-pointer active:scale-95"
                >
                  {g.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
