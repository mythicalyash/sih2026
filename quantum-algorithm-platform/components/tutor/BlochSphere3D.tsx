'use client'

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { RotateCcw, Play, Zap, Info, Sparkles, Layers } from 'lucide-react'

export interface BlochSphere3DProps {
  initialTheta?: number // 0 to PI
  initialPhi?: number   // 0 to 2PI
  targetVector?: { x: number; y: number; z: number; theta?: number; phi?: number; r?: number }
  activeQubit?: number
  numQubits?: number
  noiseDecoherence?: number // 0.0 (pure) to 1.0 (fully mixed)
  onSelectQubit?: (q: number) => void
  onStateChange?: (state: { theta: number; phi: number; x: number; y: number; z: number }) => void
}

interface Point3D {
  x: number
  y: number
  z: number
}

export function BlochSphere3D({
  initialTheta = Math.PI / 2, // Default to |+> state
  initialPhi = 0,
  targetVector,
  activeQubit = 0,
  numQubits = 1,
  noiseDecoherence = 0,
  onSelectQubit,
  onStateChange,
}: BlochSphere3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Spherical state angles
  const [theta, setTheta] = useState<number>(initialTheta)
  const [phi, setPhi] = useState<number>(initialPhi)

  // Camera Orbit Rotation
  const [rotX, setRotX] = useState<number>(-0.35)
  const [rotY, setRotY] = useState<number>(0.45)
  const isDraggingRef = useRef<boolean>(false)
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Synchronize when targetVector prop changes from external stepper
  useEffect(() => {
    if (targetVector) {
      if (typeof targetVector.theta === 'number' && typeof targetVector.phi === 'number') {
        setTheta(targetVector.theta)
        setPhi(targetVector.phi)
      } else {
        const r = targetVector.r ?? Math.sqrt(targetVector.x ** 2 + targetVector.y ** 2 + targetVector.z ** 2)
        if (r > 1e-6) {
          const cosTheta = Math.max(-1, Math.min(1, targetVector.z / r))
          const newTheta = Math.acos(cosTheta)
          let newPhi = Math.atan2(targetVector.y, targetVector.x)
          if (newPhi < 0) newPhi += 2 * Math.PI
          setTheta(newTheta)
          setPhi(newPhi)
        }
      }
    }
  }, [targetVector])

  // Calculate Cartesian vector (x, y, z) with NISQ decoherence contraction
  const vec = useMemo(() => {
    const decoherenceFactor = Math.max(0.05, 1.0 - (noiseDecoherence || 0) * 0.9)
    if (targetVector && typeof targetVector.r === 'number' && targetVector.r < 0.99) {
      // Mixed state from partial trace
      const baseR = targetVector.r * decoherenceFactor
      return {
        x: targetVector.x * decoherenceFactor,
        y: targetVector.y * decoherenceFactor,
        z: targetVector.z * decoherenceFactor,
        r: baseR,
      }
    }
    const baseR = 1.0 * decoherenceFactor
    const x = Math.sin(theta) * Math.cos(phi) * decoherenceFactor
    const y = Math.sin(theta) * Math.sin(phi) * decoherenceFactor
    const z = Math.cos(theta) * decoherenceFactor
    return { x, y, z, r: baseR }
  }, [theta, phi, targetVector, noiseDecoherence])

  useEffect(() => {
    onStateChange?.({ theta, phi, x: vec.x, y: vec.y, z: vec.z })
  }, [theta, phi, vec, onStateChange])

  // Gate Transformations on Bloch Sphere
  const applyGate = (gate: 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'Rx' | 'Ry' | 'Reset') => {
    switch (gate) {
      case 'Reset':
        setTheta(0) // |0>
        setPhi(0)
        break
      case 'H':
        if (Math.abs(theta) < 0.05) {
          setTheta(Math.PI / 2)
          setPhi(0)
        } else if (Math.abs(theta - Math.PI / 2) < 0.05 && Math.abs(phi) < 0.05) {
          setTheta(0)
          setPhi(0)
        } else {
          const newVec = { x: vec.z, y: -vec.y, z: vec.x }
          const newTheta = Math.acos(Math.max(-1, Math.min(1, newVec.z)))
          let newPhi = Math.atan2(newVec.y, newVec.x)
          if (newPhi < 0) newPhi += 2 * Math.PI
          setTheta(newTheta)
          setPhi(newPhi)
        }
        break
      case 'X':
        setTheta(Math.PI - theta)
        setPhi((2 * Math.PI - phi) % (2 * Math.PI))
        break
      case 'Y':
        setTheta(Math.PI - theta)
        setPhi((Math.PI - phi + 2 * Math.PI) % (2 * Math.PI))
        break
      case 'Z':
        setPhi((phi + Math.PI) % (2 * Math.PI))
        break
      case 'S':
        setPhi((phi + Math.PI / 2) % (2 * Math.PI))
        break
      case 'T':
        setPhi((phi + Math.PI / 4) % (2 * Math.PI))
        break
      case 'Rx':
        setTheta((theta + Math.PI / 4) % Math.PI)
        break
      case 'Ry':
        setTheta((theta + Math.PI / 4) % Math.PI)
        setPhi((phi + Math.PI / 4) % (2 * Math.PI))
        break
    }
  }

  // Draw 3D Bloch Sphere Canvas
  const draw = useCallback(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = container.clientWidth
    const height = container.clientHeight
    if (width === 0 || height === 0) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const centerX = width / 2
    const centerY = height / 2
    const sphereRadius = Math.min(width, height) * 0.36

    ctx.clearRect(0, 0, width, height)

    // 3D Perspective Projection
    const project = (p: Point3D): { x: number; y: number; z: number; scale: number } => {
      const cosY = Math.cos(rotY)
      const sinY = Math.sin(rotY)
      const x1 = p.x * cosY + p.z * sinY
      const y1 = p.y
      const z1 = -p.x * sinY + p.z * cosY

      const cosX = Math.cos(rotX)
      const sinX = Math.sin(rotX)
      const x2 = x1
      const y2 = y1 * cosX - z1 * sinX
      const z2 = y1 * sinX + z1 * cosX

      const cameraDist = 3.4
      const scale = cameraDist / (cameraDist - z2 * 0.55)

      return {
        x: centerX + x2 * sphereRadius * scale,
        y: centerY - y2 * sphereRadius * scale,
        z: z2,
        scale,
      }
    }

    // 1. Draw Sphere Shading Background
    const grad = ctx.createRadialGradient(
      centerX - sphereRadius * 0.35,
      centerY - sphereRadius * 0.35,
      sphereRadius * 0.1,
      centerX,
      centerY,
      sphereRadius
    )
    grad.addColorStop(0, 'rgba(255, 254, 250, 0.98)')
    grad.addColorStop(0.7, 'rgba(242, 238, 230, 0.88)')
    grad.addColorStop(1, 'rgba(224, 217, 204, 0.95)')

    ctx.beginPath()
    ctx.arc(centerX, centerY, sphereRadius, 0, 2 * Math.PI)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.strokeStyle = 'rgba(180, 172, 160, 0.85)'
    ctx.lineWidth = 1.2
    ctx.stroke()

    // 2. Draw Equator Ring (XY Plane)
    ctx.beginPath()
    const equatorSteps = 72
    for (let i = 0; i <= equatorSteps; i++) {
      const angle = (2 * Math.PI * i) / equatorSteps
      const p: Point3D = { x: Math.cos(angle), y: 0, z: Math.sin(angle) }
      const proj = project(p)
      if (i === 0) ctx.moveTo(proj.x, proj.y)
      else ctx.lineTo(proj.x, proj.y)
    }
    ctx.strokeStyle = 'rgba(201, 107, 44, 0.45)'
    ctx.lineWidth = 1.3
    ctx.setLineDash([4, 4])
    ctx.stroke()
    ctx.setLineDash([])

    // 3. Draw Coordinate Axes (X: Red, Y: Green, Z: Blue)
    const axes: Array<{ name: string; pos: Point3D; color: string; offset: { x: number; y: number } }> = [
      { name: '|0⟩ (+Z)', pos: { x: 0, y: 1.08, z: 0 }, color: '#0f62fe', offset: { x: 0, y: -12 } },
      { name: '|1⟩ (-Z)', pos: { x: 0, y: -1.08, z: 0 }, color: '#0f62fe', offset: { x: 0, y: 12 } },
      { name: '|+⟩ (+X)', pos: { x: 1.08, y: 0, z: 0 }, color: '#da1e28', offset: { x: 14, y: 0 } },
      { name: '|-⟩ (-X)', pos: { x: -1.08, y: 0, z: 0 }, color: '#da1e28', offset: { x: -14, y: 0 } },
      { name: '|+i⟩ (+Y)', pos: { x: 0, y: 0, z: 1.08 }, color: '#007d79', offset: { x: 0, y: 10 } },
    ]

    const centerProj = project({ x: 0, y: 0, z: 0 })

    axes.forEach((axis) => {
      const proj = project(axis.pos)
      ctx.beginPath()
      ctx.moveTo(centerProj.x, centerProj.y)
      ctx.lineTo(proj.x, proj.y)
      ctx.strokeStyle = axis.color
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Axis label
      ctx.font = 'bold 10px ui-monospace, SFMono-Regular, monospace'
      ctx.fillStyle = axis.color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(axis.name, proj.x + axis.offset.x, proj.y + axis.offset.y)
    })

    // 4. Draw State Vector Arrow |ψ⟩
    const stateProj = project({ x: vec.x, y: vec.z, z: vec.y }) // Coordinate mapping to 3D canvas

    // Shadow line to equator
    const equatorProj = project({ x: vec.x, y: 0, z: vec.y })
    ctx.beginPath()
    ctx.moveTo(stateProj.x, stateProj.y)
    ctx.lineTo(equatorProj.x, equatorProj.y)
    ctx.strokeStyle = 'rgba(116, 110, 100, 0.45)'
    ctx.lineWidth = 1
    ctx.setLineDash([2, 2])
    ctx.stroke()
    ctx.setLineDash([])

    // Main State Vector Arrow Line
    ctx.beginPath()
    ctx.moveTo(centerProj.x, centerProj.y)
    ctx.lineTo(stateProj.x, stateProj.y)
    ctx.strokeStyle = '#c96b2c'
    ctx.lineWidth = 3.2
    ctx.stroke()

    // State Vector Arrow Tip (Sphere Node)
    ctx.beginPath()
    ctx.arc(stateProj.x, stateProj.y, 6.5 * stateProj.scale, 0, 2 * Math.PI)
    ctx.fillStyle = '#c96b2c'
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2.2
    ctx.stroke()

    // State Vector Label
    ctx.font = 'bold 12px ui-monospace, SFMono-Regular, monospace'
    ctx.fillStyle = '#211f1b'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.fillText(`|ψ_q${activeQubit}⟩`, stateProj.x, stateProj.y - 10)
  }, [vec, rotX, rotY, activeQubit])

  useEffect(() => {
    draw()
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(() => draw())
    ro.observe(container)
    return () => ro.disconnect()
  }, [draw])

  // Mouse Drag Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true
    lastMousePosRef.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return
    const deltaX = e.clientX - lastMousePosRef.current.x
    const deltaY = e.clientY - lastMousePosRef.current.y
    lastMousePosRef.current = { x: e.clientX, y: e.clientY }

    setRotY((prev) => prev + deltaX * 0.008)
    setRotX((prev) => Math.max(-Math.PI / 2, Math.min(Math.PI / 2, prev + deltaY * 0.008)))
  }

  const handleMouseUp = () => {
    isDraggingRef.current = false
  }

  // Amplitude Math Computations for Dirac equation
  const alphaReal = Math.cos(theta / 2)
  const betaMag = Math.sin(theta / 2)
  const betaReal = betaMag * Math.cos(phi)
  const betaImag = betaMag * Math.sin(phi)

  return (
    <div className="bg-[#fffdf9] border border-[#ded7cb] rounded-xl p-4 shadow-xs flex flex-col gap-3">
      {/* Title & Coordinates Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#ded7cb]/60">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#c96b2c]" />
          <span className="text-[11px] font-bold text-[#c96b2c] uppercase tracking-wider">
            3D BLOCH SPHERE (QUBIT {activeQubit})
          </span>
        </div>

        {/* Multi-qubit wire switcher */}
        {numQubits > 1 && onSelectQubit && (
          <div className="flex items-center gap-1 bg-[#f4eee4] p-0.5 rounded-lg border border-[#ded7cb]">
            {Array.from({ length: numQubits }).map((_, qIdx) => (
              <button
                key={qIdx}
                onClick={() => onSelectQubit(qIdx)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  activeQubit === qIdx
                    ? 'bg-[#c96b2c] text-white shadow-2xs'
                    : 'text-[#746e64] hover:text-[#211f1b]'
                }`}
              >
                q[{qIdx}]
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => {
            setRotX(-0.35)
            setRotY(0.45)
          }}
          className="p-1 rounded text-[#746e64] hover:text-[#211f1b] hover:bg-[#eee9df] transition-colors cursor-pointer"
          title="Reset Camera View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3D Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-52 bg-[#fcfbf9] rounded-lg border border-[#ded7cb] cursor-grab active:cursor-grabbing overflow-hidden relative"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        <div className="absolute top-2 left-2 p-1.5 rounded bg-[#fffdf9]/95 border border-[#ded7cb] text-[10px] font-mono text-[#211f1b] shadow-2xs">
          <div>θ: {(theta * (180 / Math.PI)).toFixed(1)}°</div>
          <div>ϕ: {(phi * (180 / Math.PI)).toFixed(1)}°</div>
          {vec.r < 0.99 && <div className="text-[#c96b2c] font-bold">Purity r: {vec.r.toFixed(2)} (Mixed)</div>}
        </div>
      </div>

      {/* Dirac Quantum Equation Banner */}
      <div className="p-2.5 rounded-lg bg-[#f7f4ee] border border-[#ded7cb] font-mono text-[11px] text-[#211f1b] flex flex-col gap-1">
        <div className="text-[10px] font-bold text-[#746e64] uppercase tracking-wider">
          Single-Qubit Statevector:
        </div>
        <div className="font-bold text-[#c96b2c] text-xs">
          |ψ⟩ = {alphaReal.toFixed(3)}|0⟩ + ({betaReal.toFixed(3)}{betaImag >= 0 ? '+' : ''}{betaImag.toFixed(3)}i)|1⟩
        </div>
        <div className="text-[10px] text-[#746e64] flex items-center gap-3 mt-0.5">
          <span>P(|0⟩): {(alphaReal ** 2 * 100).toFixed(1)}%</span>
          <span>P(|1⟩): {(betaMag ** 2 * 100).toFixed(1)}%</span>
          <span>Bloch Vector: ({vec.x.toFixed(2)}, {vec.y.toFixed(2)}, {vec.z.toFixed(2)})</span>
        </div>
      </div>

      {/* Interactive Gate Trigger Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[10px] font-bold text-[#746e64] uppercase tracking-wider mr-1">
          Apply Gate:
        </span>
        {[
          { name: 'H', bg: 'bg-[#da1e28]' },
          { name: 'X', bg: 'bg-[#0f62fe]' },
          { name: 'Y', bg: 'bg-[#007d79]' },
          { name: 'Z', bg: 'bg-[#282522]' },
          { name: 'S', bg: 'bg-[#d12771]' },
          { name: 'T', bg: 'bg-[#8a3800]' },
          { name: 'Rx', bg: 'bg-[#c96b2c]' },
          { name: 'Ry', bg: 'bg-[#c96b2c]' },
        ].map((g) => (
          <button
            key={g.name}
            onClick={() => applyGate(g.name as any)}
            className={`px-2 py-1 rounded text-white text-[10px] font-mono font-bold shadow-xs hover:opacity-90 transition-transform active:scale-95 cursor-pointer ${g.bg}`}
          >
            {g.name}
          </button>
        ))}

        <button
          onClick={() => applyGate('Reset')}
          className="px-2 py-1 rounded bg-[#fffdf9] border border-[#ded7cb] text-[#746e64] hover:text-[#211f1b] text-[10px] font-mono font-bold cursor-pointer"
        >
          Reset (|0⟩)
        </button>
      </div>
    </div>
  )
}

