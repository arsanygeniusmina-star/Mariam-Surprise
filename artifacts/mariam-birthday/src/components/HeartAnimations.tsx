import React, { useEffect, useState, useRef, useCallback } from 'react';

interface FloatingHeartItem {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
  wobbleSpeed: number;
  rotation: number;
  opacity: number;
  scale: number;
}

interface ClickHeartItem {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  opacity: number;
  scale: number;
}

const HEART_COLORS = [
  '#FF4B7E', // Radiant celebration rose
  '#FFB074', // Warm peach
  '#FFD152', // Birthday star gold
  '#F85E87', // Berry pink
  '#FF7A9E', // Soft carnation
  '#FFE680', // Champagne shimmer
];

// SVG Heart icon component for crisp vector rendering at any scale
export function HeartIcon({
  className = '',
  color = '#FF4B7E',
  size = 24,
  fill = 'currentColor',
}: {
  className?: string;
  color?: string;
  size?: number;
  fill?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill === 'currentColor' ? color : fill}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
      aria-hidden="true"
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

// 1. Ambient Floating Hearts System (Canvas-based for 60fps performance, disabled on mobile for zero lag)
export function AmbientFloatingHearts({ active = true }: { active?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const heartsRef = useRef<FloatingHeartItem[]>([]);
  const animIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    // Don't run ambient canvas loop on mobile phones to preserve battery and 60fps scrolling
    if (window.innerWidth < 768) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      if (!canvasRef.current) return;
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });

    // Seed 14 initial ambient floating hearts on desktop
    const count = 14;
    const initialHearts: FloatingHeartItem[] = [];
    for (let i = 0; i < count; i++) {
      initialHearts.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 10 + Math.random() * 18,
        color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
        speed: 0.4 + Math.random() * 0.8,
        wobbleSpeed: 0.015 + Math.random() * 0.02,
        rotation: (Math.random() - 0.5) * 30,
        opacity: 0.25 + Math.random() * 0.45,
        scale: 0.8 + Math.random() * 0.4,
      });
    }
    heartsRef.current = initialHearts;

    let time = 0;
    const render = () => {
      time += 1;
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext('2d');
      if (!ctx) return;

      const w = c.width;
      const h = c.height;

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < heartsRef.current.length; i++) {
        const item = heartsRef.current[i];
        item.y -= item.speed;
        item.x += Math.sin(time * item.wobbleSpeed + item.id) * 0.6;
        item.rotation += Math.sin(time * 0.02 + item.id) * 0.15;

        // Reset to bottom if floated past top
        if (item.y < -40) {
          item.y = h + 20 + Math.random() * 50;
          item.x = Math.random() * w;
        }

        // Pulse heartbeat scale slightly
        const pulse = 1 + Math.sin(time * 0.04 + item.id * 2) * 0.12;
        const currentSize = item.size * pulse;

        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate((item.rotation * Math.PI) / 180);
        ctx.globalAlpha = item.opacity;
        ctx.fillStyle = item.color;

        // Draw smooth vector heart path
        const s = currentSize * 0.5;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.35);
        ctx.bezierCurveTo(-s * 0.85, -s * 0.65, -s * 1.1, s * 0.45, 0, s * 1.1);
        ctx.bezierCurveTo(s * 1.1, s * 0.45, s * 0.85, -s * 0.65, 0, s * 0.35);
        ctx.fill();

        // Soft inner glow highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.arc(-s * 0.3, -s * 0.1, s * 0.22, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      animIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
  }, [active]);

  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[12] select-none hidden md:block"
      aria-hidden="true"
    />
  );
}

// 2. Interactive Click / Tap Heart Burst System
export function ClickHeartExplosion() {
  const [clickHearts, setClickHearts] = useState<ClickHeartItem[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const heartsStateRef = useRef<ClickHeartItem[]>([]);

  const spawnBurst = useCallback((clientX: number, clientY: number, count = 7) => {
    const newItems: ClickHeartItem[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 2.5 + Math.random() * 4.5;
      newItems.push({
        id: Date.now() + Math.random(),
        x: clientX,
        y: clientY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.8, // upward bias
        size: 14 + Math.random() * 16,
        color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
        rotation: (Math.random() - 0.5) * 45,
        vRot: (Math.random() - 0.5) * 8,
        opacity: 1,
        scale: 0.6 + Math.random() * 0.6,
      });
    }

    heartsStateRef.current = [...heartsStateRef.current.slice(-35), ...newItems];
    setClickHearts([...heartsStateRef.current]);
  }, []);

  // Global pointer/click listener (respects ignore tags if needed)
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      // Disable tap bursts on mobile to prevent re-render lag
      if (window.innerWidth < 768) return;
      if ('pointerType' in e && (e as any).pointerType === 'touch') return;

      let x = 0;
      let y = 0;
      if ('clientX' in e) {
        x = e.clientX;
        y = e.clientY;
      } else {
        return;
      }

      // Spawn gentle hearts on desktop click
      spawnBurst(x, y, 5);
    };

    window.addEventListener('click', handlePointerDown, { passive: true });
    return () => window.removeEventListener('click', handlePointerDown);
  }, [spawnBurst]);

  // Animation Loop for bursting click hearts
  useEffect(() => {
    if (clickHearts.length === 0) return;

    let running = true;
    const loop = () => {
      if (!running) return;

      const updated: ClickHeartItem[] = [];
      for (const h of heartsStateRef.current) {
        h.x += h.vx;
        h.y += h.vy;
        h.vy += 0.12; // gravity
        h.vx *= 0.96; // drag
        h.rotation += h.vRot;
        h.opacity -= 0.024;
        h.scale = Math.max(0.2, h.scale - 0.008);

        if (h.opacity > 0.04) {
          updated.push(h);
        }
      }

      heartsStateRef.current = updated;
      setClickHearts(updated);

      if (updated.length > 0) {
        animFrameRef.current = requestAnimationFrame(loop);
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [clickHearts.length > 0]);

  if (clickHearts.length === 0) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[160] overflow-hidden select-none"
      aria-hidden="true"
    >
      {clickHearts.map((h) => (
        <div
          key={h.id}
          className="fixed pointer-events-none"
          style={{
            left: `${h.x}px`,
            top: `${h.y}px`,
            transform: `translate(-50%, -50%) rotate(${h.rotation}deg) scale(${h.scale})`,
            opacity: h.opacity,
            color: h.color,
            filter: `drop-shadow(0 0 6px ${h.color}88)`,
          }}
        >
          <HeartIcon size={h.size} color={h.color} />
        </div>
      ))}
    </div>
  );
}
