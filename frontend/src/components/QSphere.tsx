import React, { useRef, useEffect, useState, useMemo } from 'react';
import type { StatevectorAmplitude } from '../types/quantum';
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
  // Normalize to [0, 2pi)
  let norm = phaseRad % (2 * Math.PI);
  if (norm < 0) norm += 2 * Math.PI;

  // Qiskit color wheel: 0 -> Red/Purple (300deg), pi/2 -> Blue (200deg), pi -> Cyan/Green (140deg), 3pi/2 -> Orange (35deg)
  // Mapping 0 -> 280deg, counter-clockwise
  const hue = Math.round(((norm / (2 * Math.PI)) * 360 + 260) % 360);
  return {
    hex: `hsl(${hue}, 85%, 60%)`,
    hsl: `hsl(${hue}, 85%, 60%)`,
  };
}

// Calculate Hamming weight of bitstring
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Orbit rotation angles (Euler angles in radians)
  const [rotX, setRotX] = useState<number>(-0.35);
  const [rotY, setRotY] = useState<number>(0.45);
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Display toggles
  const [showStateLabels, setShowStateLabels] = useState<boolean>(true);
  const [showPhaseLabels, setShowPhaseLabels] = useState<boolean>(false);

  // Hovered node state for tooltip
  const [hoveredNode, setHoveredNode] = useState<{
    state: string;
    prob: number;
    magnitude: number;
    phase_rad: number;
    phase_deg: number;
    screenX: number;
    screenY: number;
  } | null>(null);

  // Reset rotation to default isometric angle
  const handleResetOrientation = () => {
    setRotX(-0.35);
    setRotY(0.45);
  };

  // Group and arrange basis states on the sphere
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

    // Group states by Hamming weight
    const byWeight: Record<number, number[]> = {};
    for (let w = 0; w <= numQubits; w++) {
      byWeight[w] = [];
    }

    for (let idx = 0; idx < totalStates; idx++) {
      const bitstr = idx.toString(2).padStart(numQubits, '0');
      const w = getHammingWeight(bitstr);
      byWeight[w].push(idx);
    }

    // Build 3D coordinates on unit sphere
    for (let w = 0; w <= numQubits; w++) {
      const list = byWeight[w];
      const count = list.length;
      // Latitude angle: 0 (North Pole) to PI (South Pole)
      const theta = (Math.PI * w) / numQubits;

      list.forEach((idx, orderInLevel) => {
        const bitstr = idx.toString(2).padStart(numQubits, '0');
        // Longitude angle: evenly distributed in this latitude level
        const phi = (2 * Math.PI * orderInLevel) / count;

        let x = Math.sin(theta) * Math.cos(phi);
        let y = Math.cos(theta); // y is UP
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

  // Main 3D Rendering Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI displays
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const sphereRadius = Math.min(width, height) * 0.36;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // 3D rotation transform function
    const project = (p: Point3D): { x: number; y: number; z: number; scale: number } => {
      // Rotate around Y axis (rotY)
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const x1 = p.x * cosY + p.z * sinY;
      const y1 = p.y;
      const z1 = -p.x * sinY + p.z * cosY;

      // Rotate around X axis (rotX)
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const x2 = x1;
      const y2 = y1 * cosX - z1 * sinX;
      const z2 = y1 * sinX + z1 * cosX;

      // Weak perspective scale
      const cameraDist = 3.2;
      const scale = cameraDist / (cameraDist - z2 * 0.6);

      return {
        x: centerX + x2 * sphereRadius * scale,
        y: centerY - y2 * sphereRadius * scale, // invert Y for screen
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
    grad.addColorStop(0, 'rgba(38, 46, 56, 0.45)');
    grad.addColorStop(0.7, 'rgba(22, 28, 36, 0.6)');
    grad.addColorStop(1, 'rgba(15, 20, 26, 0.85)');

    ctx.beginPath();
    ctx.arc(centerX, centerY, sphereRadius, 0, 2 * Math.PI);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(74, 85, 104, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 2. Draw Latitude Rings (Hamming Weight Bands)
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
            ? 'rgba(129, 140, 248, 0.35)'
            : 'rgba(100, 116, 139, 0.2)';
        ctx.lineWidth = w === numQubits / 2 ? 1.2 : 0.8;
        ctx.stroke();
      }
    }

    // 3. Draw Longitude Meridian Line (Prime Meridian)
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
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.15)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // 4. Project and Sort Nodes (Depth Sorting by Z)
    const projectedNodes = sphereNodes.map((n) => {
      const proj = project(n.p3);
      return {
        ...n,
        proj,
      };
    });

    // Sort back-to-front
    projectedNodes.sort((a, b) => a.proj.z - b.proj.z);

    // 5. Draw Inactive State Wireframe Dots
    projectedNodes.forEach((node) => {
      if (node.prob < 0.001) {
        ctx.beginPath();
        ctx.arc(node.proj.x, node.proj.y, 2 * node.proj.scale, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(100, 116, 139, 0.35)';
        ctx.fill();
      }
    });

    // 6. Draw Active State Rays and Spherical Nodes
    projectedNodes.forEach((node) => {
      if (node.prob >= 0.001) {
        const origin = project({ x: 0, y: 0, z: 0 });
        const { hex } = getPhaseColor(node.phase_rad);

        // Ray line from origin to node
        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);
        ctx.lineTo(node.proj.x, node.proj.y);
        ctx.strokeStyle = hex;
        ctx.lineWidth = Math.max(1.5, 2.5 * node.magnitude * node.proj.scale);
        ctx.stroke();

        // Node sphere radius proportional to magnitude
        const baseRadius = 8 + 18 * Math.sqrt(node.prob);
        const nodeR = Math.max(4, baseRadius * node.proj.scale);

        // 3D Shaded Node Sphere
        const nodeGrad = ctx.createRadialGradient(
          node.proj.x - nodeR * 0.3,
          node.proj.y - nodeR * 0.3,
          nodeR * 0.1,
          node.proj.x,
          node.proj.y,
          nodeR
        );
        nodeGrad.addColorStop(0, '#ffffff');
        nodeGrad.addColorStop(0.3, hex);
        nodeGrad.addColorStop(1, 'rgba(15, 20, 26, 0.95)');

        ctx.beginPath();
        ctx.arc(node.proj.x, node.proj.y, nodeR, 0, 2 * Math.PI);
        ctx.fillStyle = nodeGrad;
        ctx.fill();
        ctx.strokeStyle = hex;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Glowing outer halo
        ctx.beginPath();
        ctx.arc(node.proj.x, node.proj.y, nodeR + 3, 0, 2 * Math.PI);
        ctx.strokeStyle = `${hex}44`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Text Labels
        if (showStateLabels) {
          ctx.font = 'bold 11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
          ctx.fillStyle = '#f3f4f6';
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

  // Mouse / Touch Drag Orbit Controls
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) {
      // Check node hover for tooltip
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Project nodes and find closest
      const width = rect.width;
      const height = rect.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const sphereRadius = Math.min(width, height) * 0.36;

      let found = null;
      for (const n of sphereNodes) {
        if (n.prob >= 0.001) {
          // Quick project
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
    <div className="relative w-full h-full flex flex-col justify-between bg-[#161616] rounded-lg border border-[#393939] select-none overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#262626] bg-[#121619]/60">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-200 uppercase tracking-wider">
            Q-sphere
          </span>
          <span className="text-[10px] text-gray-400 font-mono">({numQubits} Qubits)</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleResetOrientation}
            className="p-1 rounded text-gray-400 hover:text-gray-200 hover:bg-[#262626] transition-colors cursor-pointer"
            title="Reset 3D View Orientation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        className="relative flex-1 w-full h-[280px] min-h-[260px] cursor-grab active:cursor-grabbing flex items-center justify-center"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{ width: '100%', height: '100%' }}
        />

        {/* Hover Tooltip */}
        {hoveredNode && (
          <div
            className="absolute z-20 pointer-events-none p-2.5 rounded-md bg-[#1f242b] border border-[#393939] shadow-2xl text-xs font-mono text-gray-200 flex flex-col gap-1"
            style={{
              left: Math.min(hoveredNode.screenX - 100, 220),
              top: Math.min(hoveredNode.screenY - 140, 160),
            }}
          >
            <div className="text-sm font-bold text-indigo-300">|{hoveredNode.state}⟩</div>
            <div className="text-emerald-400">Prob: {(hoveredNode.prob * 100).toFixed(2)}%</div>
            <div className="text-gray-300">Amp: {hoveredNode.magnitude.toFixed(4)}</div>
            <div className="text-purple-300">Phase: {hoveredNode.phase_rad.toFixed(3)} rad ({hoveredNode.phase_deg.toFixed(1)}°)</div>
          </div>
        )}

        {/* Phase Color Wheel Legend (Bottom Left) */}
        <div className="absolute bottom-3 left-3 p-2 rounded-lg bg-[#121619]/90 border border-[#262626] flex items-center gap-2.5 shadow-lg backdrop-blur-sm pointer-events-none">
          <div className="relative w-9 h-9 flex items-center justify-center">
            {/* Circular Color Gradient */}
            <div
              className="w-8 h-8 rounded-full border border-gray-700 shadow-inner"
              style={{
                background:
                  'conic-gradient(from 0deg, hsl(260, 85%, 60%), hsl(200, 85%, 60%), hsl(140, 85%, 60%), hsl(35, 85%, 60%), hsl(260, 85%, 60%))',
              }}
            />
            {/* Center Label */}
            <div className="absolute inset-0 m-auto w-4 h-4 rounded-full bg-[#121619] flex items-center justify-center text-[7px] font-bold text-gray-300">
              Phase
            </div>
          </div>

          <div className="flex flex-col text-[8px] font-mono text-gray-400 leading-tight">
            <span>π/2</span>
            <div className="flex justify-between gap-2">
              <span>π</span>
              <span>0</span>
            </div>
            <span>3π/2</span>
          </div>
        </div>

        {/* State / Phase Labels Controls (Bottom Right) */}
        <div className="absolute bottom-3 right-3 p-2 rounded-lg bg-[#121619]/90 border border-[#262626] flex flex-col gap-1.5 shadow-lg backdrop-blur-sm">
          <span className="text-[9px] font-semibold uppercase text-gray-400 tracking-wider">Labels</span>
          <label className="flex items-center gap-1.5 text-[11px] text-gray-300 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={showStateLabels}
              onChange={(e) => setShowStateLabels(e.target.checked)}
              className="w-3 h-3 rounded bg-gray-800 border-gray-600 text-indigo-600 focus:ring-0 cursor-pointer"
            />
            <span>State</span>
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-gray-300 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={showPhaseLabels}
              onChange={(e) => setShowPhaseLabels(e.target.checked)}
              className="w-3 h-3 rounded bg-gray-800 border-gray-600 text-indigo-600 focus:ring-0 cursor-pointer"
            />
            <span>Phase angle</span>
          </label>
        </div>
      </div>
    </div>
  );
};
