'use client'

import { useEffect, useRef, useState } from "react";
import { Atom, ArrowRight } from "lucide-react";

const SKY_GRADIENT =
  "linear-gradient(to bottom, #06070a 0%, #101c34 16%, #2c4372 36%, #8ca0c4 54%, #ede9e2 68%, #f3b878 84%, #e8863c 100%)";

const HEADLINE = "Why afraid of Quantum?";
const ACCENT_FROM = "Why afraid of ".length;

function spawnBurst(x, y) {
  const count = 7 + Math.floor(Math.random() * 4);
  const colors = ["#c4b5fd", "#fcd34d", "#5eead4", "#fda4af"];
  return Array.from({ length: count }).map((_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 90 + Math.random() * 160;
    return {
      id: `${Date.now()}-${i}-${Math.random()}`,
      x,
      y,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      size: 3 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 60,
    };
  });
}

/* Faint triangular node-grid + drifting particles + a constellation
   that radiates from the cursor — the ambient background from qbraid.com */
function BackgroundField({ mouseRef }) {
  const canvasRef = useRef(null);
  const nodesRef = useRef([]);
  const edgesRef = useRef([]);
  const cometsRef = useRef([]);
  const rafRef = useRef(null);

  const spawnComet = (w, h, dpr) => {
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    if (edge === 0) { x = Math.random() * w; y = -20; }
    else if (edge === 1) { x = w + 20; y = Math.random() * h; }
    else if (edge === 2) { x = Math.random() * w; y = h + 20; }
    else { x = -20; y = Math.random() * h; }
    const speed = 0.12 + Math.random() * 0.2;
    const angle = Math.random() * Math.PI * 2;
    return {
      x: x * dpr,
      y: y * dpr,
      vx: Math.cos(angle) * speed * dpr,
      vy: Math.sin(angle) * speed * dpr,
    };
  };

  const setup = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    const spacing = 92;
    const nodes = [];
    let row = 0;
    for (let y = -spacing; y < h + spacing; y += spacing * 0.87) {
      const offset = row % 2 === 0 ? 0 : spacing / 2;
      for (let x = -spacing; x < w + spacing; x += spacing) {
        nodes.push({ x: (x + offset) * dpr, y: y * dpr });
      }
      row++;
    }
    nodesRef.current = nodes;

    const edges = [];
    const threshold = spacing * dpr * 1.05;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < threshold) edges.push([i, j]);
      }
    }
    edgesRef.current = edges;

    if (cometsRef.current.length === 0) {
      cometsRef.current = Array.from({ length: 7 }).map(() => spawnComet(w, h, dpr));
    }
  };

  useEffect(() => {
    setup();
    window.addEventListener("resize", setup);

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const [i, j] of edgesRef.current) {
        const a = nodesRef.current[i];
        const b = nodesRef.current[j];
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.16)";
      for (const n of nodesRef.current) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.3 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      const mouse = mouseRef.current;
      const radius = 170 * dpr;
      if (mouse.x > -1000) {
        for (const n of nodesRef.current) {
          const dx = n.x - mouse.x;
          const dy = n.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < radius) {
            const alpha = (1 - dist / radius) * 0.6;
            ctx.strokeStyle = `rgba(196,181,253,${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(n.x, n.y);
            ctx.stroke();
            ctx.fillStyle = `rgba(221,214,254,${Math.min(1, alpha + 0.35)})`;
            ctx.beginPath();
            ctx.arc(n.x, n.y, 2 * dpr, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.strokeStyle = "rgba(196,181,253,0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 36 * dpr, 0, Math.PI * 2);
        ctx.stroke();
      }

      const w = window.innerWidth;
      const h = window.innerHeight;
      for (const c of cometsRef.current) {
        const tailX = c.x - c.vx * 16;
        const tailY = c.y - c.vy * 16;
        const grad = ctx.createLinearGradient(tailX, tailY, c.x, c.y);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(1, "rgba(255,255,255,0.65)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(c.x, c.y);
        ctx.stroke();

        c.x += c.vx;
        c.y += c.vy;
        if (c.x < -60 || c.x > canvas.width + 60 || c.y < -60 || c.y > canvas.height + 60) {
          Object.assign(c, spawnComet(w, h, dpr));
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", setup);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" />;
}

/* The headline rendered as a dot-matrix; dots sit at rest until the
   cursor comes near, then push outward away from it and spring back */
function QuantumDotHeadline() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const dotsRef = useRef([]);
  const mouseRef = useRef({ x: -99999, y: -99999 });
  const rafRef = useRef(null);

  const buildDots = () => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = wrap.clientWidth;
    const cssHeight = Math.max(110, Math.round(cssWidth * 0.2));

    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    canvas.style.width = cssWidth + "px";
    canvas.style.height = cssHeight + "px";

    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    let fontSize = Math.min(92, Math.max(34, cssWidth * 0.068)) * dpr;
    ctx.font = `800 ${fontSize}px Inter, sans-serif`;
    let full = ctx.measureText(HEADLINE).width;
    while (full > W - 24 * dpr && fontSize > 12 * dpr) {
      fontSize -= 1;
      ctx.font = `800 ${fontSize}px Inter, sans-serif`;
      full = ctx.measureText(HEADLINE).width;
    }

    const prefixWidth = ctx.measureText(HEADLINE.slice(0, ACCENT_FROM)).width;
    const startX = (W - full) / 2;
    const baseline = H / 2 + fontSize * 0.35;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    ctx.fillText(HEADLINE, startX, baseline);

    const img = ctx.getImageData(0, 0, W, H).data;
    const step = Math.max(3, Math.round(fontSize / 11));
    const dots = [];
    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        const alpha = img[(y * W + x) * 4 + 3];
        if (alpha > 120) {
          const isAccent = x >= startX + prefixWidth;
          dots.push({
            ox: x,
            oy: y,
            x,
            y,
            size: step * 0.42,
            color: isAccent ? "#a78bfa" : "#f5f5f7",
          });
        }
      }
    }
    dotsRef.current = dots;
    ctx.clearRect(0, 0, W, H);
  };

  useEffect(() => {
    buildDots();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(buildDots);
    }
    window.addEventListener("resize", buildDots);

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dpr = window.devicePixelRatio || 1;
      const radius = 70 * dpr;
      const maxPush = 22 * dpr;
      const mouse = mouseRef.current;
      for (const d of dotsRef.current) {
        const dx = d.ox - mouse.x;
        const dy = d.oy - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let targetX = d.ox;
        let targetY = d.oy;
        if (dist < radius) {
          const force = (radius - dist) / radius;
          const angle = Math.atan2(dy, dx);
          targetX = d.ox + Math.cos(angle) * force * maxPush;
          targetY = d.oy + Math.sin(angle) * force * maxPush;
        }
        d.x += (targetX - d.x) * 0.2;
        d.y += (targetY - d.y) * 0.2;
        ctx.fillStyle = d.color;
        const s = d.size;
        ctx.fillRect(d.x - s / 2, d.y - s / 2, s, s);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", buildDots);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    mouseRef.current = {
      x: (e.clientX - rect.left) * dpr,
      y: (e.clientY - rect.top) * dpr,
    };
  };
  const handleLeave = () => {
    mouseRef.current = { x: -99999, y: -99999 };
  };

  return (
    <div ref={wrapRef} className="mx-auto w-full max-w-4xl">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className="block w-full"
      />
    </div>
  );
}

export default function LandingPage({ onGetStarted }) {
  const [bursts, setBursts] = useState([]);
  const bgMouseRef = useRef({ x: -99999, y: -99999 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    bgMouseRef.current = {
      x: (e.clientX - rect.left) * dpr,
      y: (e.clientY - rect.top) * dpr,
    };
  };
  const handleMouseLeave = () => {
    bgMouseRef.current = { x: -99999, y: -99999 };
  };

  const handleDoubleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const stars = spawnBurst(x, y);
    setBursts((prev) => [...prev, ...stars]);
    const ids = stars.map((s) => s.id);
    setTimeout(() => {
      setBursts((prev) => prev.filter((s) => !ids.includes(s.id)));
    }, 950);
  };

  return (
    <div
      onDoubleClick={handleDoubleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ background: SKY_GRADIENT }}
      className="relative min-h-screen w-full select-none overflow-hidden"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .font-display { font-family: 'Inter', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        @keyframes shoot {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0.2); opacity: 0; }
        }
        .shooting-star {
          position: absolute;
          border-radius: 9999px;
          animation: shoot 900ms ease-out forwards;
        }
      `}</style>

      <BackgroundField mouseRef={bgMouseRef} />

      {/* double-click star burst layer */}
      {bursts.map((s) => (
        <span
          key={s.id}
          className="shooting-star pointer-events-none"
          style={{
            left: s.x,
            top: s.y,
            width: s.size,
            height: s.size,
            background: s.color,
            boxShadow: `0 0 10px 2px ${s.color}80`,
            "--dx": `${s.dx}px`,
            "--dy": `${s.dy}px`,
            animationDelay: `${s.delay}ms`,
          }}
        />
      ))}

      {/* top-left logo & top-right sign in */}
      <div className="absolute left-6 top-6 flex items-center gap-2 sm:left-10 sm:top-8 z-20">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
          <Atom className="h-4 w-4 text-white" />
        </div>
        <span className="font-display text-lg font-bold text-white">
          QubitLab
        </span>
      </div>

      <div className="absolute right-6 top-6 flex items-center gap-3 sm:right-10 sm:top-8 z-20">
        <button
          onClick={onGetStarted}
          className="rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2 text-xs font-semibold text-white backdrop-blur transition-all cursor-pointer hover:scale-105 active:scale-95"
        >
          Sign In
        </button>
      </div>

      {/* hero */}
      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center font-body">
        <QuantumDotHeadline />

        <p className="mt-8 max-w-xl text-lg leading-relaxed text-slate-200">
          Qubits and superposition don't have to stay theory on a slide.
          QubitLab turns them into circuits you can drag, run on a real
          simulator, and watch collapse in real time — with an AI tutor
          beside you from your first gate to your first algorithm.
        </p>

        <button
          onClick={onGetStarted}
          className="mt-10 flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-900 hover:bg-slate-100 cursor-pointer shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          Get Started
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-white opacity-60">
        move your cursor over the headline ✦
      </p>
    </div>
  );
}