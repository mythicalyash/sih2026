'use client'

import React, { useRef, useEffect, useState } from 'react';
import type { BlochVector } from '@/types/quantum';
import { RotateCcw, Info } from 'lucide-react';

interface BlochSphereVisualizerProps {
  blochVectors?: BlochVector[];
  numQubits: number;
}

interface SingleSphereCanvasProps {
  vector?: BlochVector;
  qubitIndex: number;
}

function SingleSphereCanvas({ vector, qubitIndex }: SingleSphereCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotX, setRotX] = useState<number>(-0.3);
  const [rotY, setRotY] = useState<number>(0.5);
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const vx = vector ? vector.x : 0;
  const vy = vector ? vector.y : 0;
  const vz = vector ? vector.z : 1; // Default ground state |0>
  const r = vector ? vector.r : 1;
  const thetaDeg = vector ? Number(((vector.theta * 180) / Math.PI).toFixed(1)) : 0;
  const phiDeg = vector ? Number(((vector.phi * 180) / Math.PI).toFixed(1)) : 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.38;

    ctx.clearRect(0, 0, width, height);

    // 3D rotation helper
    const project = (x3d: number, y3d: number, z3d: number) => {
      // Rotate around Y axis
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const x1 = x3d * cosY + z3d * sinY;
      const z1 = -x3d * sinY + z3d * cosY;

      // Rotate around X axis
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const y2 = y3d * cosX - z1 * sinX;
      const z2 = y3d * sinX + z1 * cosX;

      return {
        x: cx + x1 * radius,
        y: cy - y2 * radius,
        depth: z2,
      };
    };

    // Draw main sphere outline
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#fffdf9';
    ctx.fill();
    ctx.strokeStyle = '#ded7cb';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw equator ellipse (X-Y plane)
    ctx.beginPath();
    for (let angle = 0; angle <= 360; angle += 5) {
      const rad = (angle * Math.PI) / 180;
      const p = project(Math.cos(rad), 0, Math.sin(rad));
      if (angle === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = '#e2dbce';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw meridian ellipse (Z-X plane)
    ctx.beginPath();
    for (let angle = 0; angle <= 360; angle += 5) {
      const rad = (angle * Math.PI) / 180;
      const p = project(Math.sin(rad), Math.cos(rad), 0);
      if (angle === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = '#e2dbce';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Axes: Z (Up), X, Y
    const origin = project(0, 0, 0);
    const zPos = project(0, 1.25, 0);
    const zNeg = project(0, -1.25, 0);
    const xPos = project(1.25, 0, 0);
    const yPos = project(0, 0, 1.25);

    // Z-axis line
    ctx.beginPath();
    ctx.moveTo(zNeg.x, zNeg.y);
    ctx.lineTo(zPos.x, zPos.y);
    ctx.strokeStyle = '#b0a89a';
    ctx.lineWidth = 1;
    ctx.stroke();

    // X-axis line
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(xPos.x, xPos.y);
    ctx.strokeStyle = '#b0a89a';
    ctx.stroke();

    // Y-axis line
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(yPos.x, yPos.y);
    ctx.strokeStyle = '#b0a89a';
    ctx.stroke();

    // Axis Labels
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#211f1b';
    ctx.fillText('|0⟩', zPos.x - 7, zPos.y - 4);
    ctx.fillText('|1⟩', zNeg.x - 7, zNeg.y + 12);
    ctx.fillStyle = '#746e64';
    ctx.font = '9px monospace';
    ctx.fillText('+X', xPos.x + 3, xPos.y + 3);
    ctx.fillText('+Y', yPos.x + 3, yPos.y + 3);

    // State Vector Arrow (vx, vz is up in math so y_3d = vz, z_3d = vy)
    const stateTip = project(vx, vz, vy);

    // Draw Vector Line
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(stateTip.x, stateTip.y);
    ctx.strokeStyle = '#c96b2c';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Vector Tip Circle
    ctx.beginPath();
    ctx.arc(stateTip.x, stateTip.y, 4.5, 0, 2 * Math.PI);
    ctx.fillStyle = '#c96b2c';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [rotX, rotY, vx, vy, vz, vector]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    setRotY((prev) => prev + dx * 0.015);
    setRotX((prev) => Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, prev + dy * 0.015)));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="bg-[#fffdf9] border border-[#ded7cb] rounded-lg p-2.5 flex flex-col items-center justify-between shadow-xs">
      <div className="w-full flex items-center justify-between pb-1.5 border-b border-[#ded7cb]/60">
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-bold text-xs text-[#c96b2c] bg-[#fff5eb] px-1.5 py-0.5 rounded border border-[#c96b2c]/30">
            q[{qubitIndex}]
          </span>
          <span className="text-[11px] font-semibold text-[#211f1b]">Bloch Sphere</span>
        </div>
        <button
          onClick={() => {
            setRotX(-0.3);
            setRotY(0.5);
          }}
          className="p-1 rounded text-[#746e64] hover:text-[#211f1b] hover:bg-[#eee9df] transition-colors"
          title="Reset rotation"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      <div className="relative w-full aspect-square max-w-[180px] my-1 flex items-center justify-center cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          width={220}
          height={220}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-full"
        />
      </div>

      {/* Vector Coordinates Breakdown */}
      <div className="w-full grid grid-cols-3 gap-1 pt-1.5 border-t border-[#ded7cb]/60 text-center font-mono text-[10px]">
        <div className="bg-[#f7f4ee] p-1 rounded border border-[#ded7cb]">
          <div className="text-[9px] text-[#746e64]">⟨X⟩</div>
          <div className="font-bold text-[#211f1b]">{vx >= 0 ? `+${vx.toFixed(2)}` : vx.toFixed(2)}</div>
        </div>
        <div className="bg-[#f7f4ee] p-1 rounded border border-[#ded7cb]">
          <div className="text-[9px] text-[#746e64]">⟨Y⟩</div>
          <div className="font-bold text-[#211f1b]">{vy >= 0 ? `+${vy.toFixed(2)}` : vy.toFixed(2)}</div>
        </div>
        <div className="bg-[#f7f4ee] p-1 rounded border border-[#ded7cb]">
          <div className="text-[9px] text-[#746e64]">⟨Z⟩</div>
          <div className="font-bold text-[#211f1b]">{vz >= 0 ? `+${vz.toFixed(2)}` : vz.toFixed(2)}</div>
        </div>
      </div>

      <div className="w-full flex items-center justify-between mt-1 text-[9.5px] font-mono text-[#746e64] px-0.5">
        <span>Purity r = {r.toFixed(3)}</span>
        <span>θ={thetaDeg}° φ={phiDeg}°</span>
      </div>
    </div>
  );
}

export const BlochSphereVisualizer: React.FC<BlochSphereVisualizerProps> = ({
  blochVectors = [],
  numQubits,
}) => {
  return (
    <div className="h-full flex flex-col bg-[#fffdf9] border border-[#ded7cb] rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#ded7cb] bg-[#f0ece4] shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-[#211f1b] uppercase tracking-wider">
            Individual Qubit Bloch Spheres
          </span>
          <span className="text-[10px] text-[#746e64] font-mono">({numQubits} Qubits)</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[#746e64]">
          <Info className="w-3.5 h-3.5 text-[#746e64]" />
          <span className="hidden sm:inline">Drag to rotate 3D view</span>
        </div>
      </div>

      <div className="p-3 flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
        {Array.from({ length: numQubits }).map((_, idx) => {
          const vec = blochVectors.find((b) => b.qubit === idx);
          return <SingleSphereCanvas key={idx} vector={vec} qubitIndex={idx} />;
        })}
      </div>
    </div>
  );
};
