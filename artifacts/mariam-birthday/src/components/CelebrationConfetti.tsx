import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  type: 'rect' | 'circle' | 'star' | 'heart';
  rotation: number;
  vx: number;
  vy: number;
  vRot: number;
  opacity: number;
}

const PALETTE = [
  '#FBB3BF', // Soft Rose
  '#FFD4B2', // Apricot Peach
  '#F2EEB6', // Butter Yellow
  '#FBE1D5', // Alabaster Cream
  '#EDA5A7', // Warm Coral
  '#FFF5EB', // Starlight White
];

export function CelebrationConfetti({ trigger }: { trigger?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const spawnBurst = (count = 50) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;

    const types: Particle['type'][] = ['rect', 'circle', 'star', 'heart'];
    const newParticles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      newParticles.push({
        x: Math.random() * w,
        y: -10 - Math.random() * 40,
        size: 7 + Math.random() * 10,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        type: types[Math.floor(Math.random() * types.length)],
        rotation: Math.random() * 360,
        vx: (Math.random() - 0.5) * 2.2,
        vy: 2.2 + Math.random() * 3.8,
        vRot: (Math.random() - 0.5) * 6,
        opacity: 1,
      });
    }

    particlesRef.current = [...particlesRef.current.slice(-40), ...newParticles];

    // Start RAF loop if not already running
    if (!animFrameRef.current) {
      loop();
    }
  };

  const loop = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      animFrameRef.current = null;
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      animFrameRef.current = null;
      return;
    }

    const h = canvas.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const activeParticles: Particle[] = [];

    for (let i = 0; i < particlesRef.current.length; i++) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vRot;

      if (p.y > h * 0.75) {
        p.opacity -= 0.025;
      }

      if (p.y < h + 20 && p.opacity > 0.02) {
        activeParticles.push(p);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;

        if (p.type === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'heart') {
          // Simple cute heart path
          const s = p.size * 0.5;
          ctx.beginPath();
          ctx.moveTo(0, s * 0.3);
          ctx.bezierCurveTo(-s * 0.8, -s * 0.6, -s * 0.9, s * 0.4, 0, s);
          ctx.bezierCurveTo(s * 0.9, s * 0.4, s * 0.8, -s * 0.6, 0, s * 0.3);
          ctx.fill();
        } else if (p.type === 'star') {
          // 4-pointed sparkle star
          const s = p.size * 0.6;
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.quadraticCurveTo(0, 0, s, 0);
          ctx.quadraticCurveTo(0, 0, 0, s);
          ctx.quadraticCurveTo(0, 0, -s, 0);
          ctx.quadraticCurveTo(0, 0, 0, -s);
          ctx.fill();
        } else {
          // Clean rectangular confetti piece
          ctx.fillRect(-p.size * 0.4, -p.size * 0.3, p.size * 0.8, p.size * 0.6);
        }

        ctx.restore();
      }
    }

    particlesRef.current = activeParticles;

    if (activeParticles.length > 0) {
      animFrameRef.current = requestAnimationFrame(loop);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      animFrameRef.current = null;
    }
  };

  // Sync canvas size to window
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Trigger burst
  useEffect(() => {
    if (trigger && trigger > 0) {
      spawnBurst(55);
    }
  }, [trigger]);

  // Initial welcome burst
  useEffect(() => {
    const t = setTimeout(() => spawnBurst(45), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[100]"
      aria-hidden="true"
    />
  );
}

// Lightweight Ambient Floating Balloons
export function AmbientFloatingBalloons() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-10 overflow-hidden"
      aria-hidden="true"
      style={{ willChange: 'transform' }}
    >
      {/* Left side gentle floating balloon */}
      <div className="absolute -left-6 top-[28vh] w-24 h-32 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-gradient-to-tr from-[#FBB3BF]/25 via-[#FFD4B2]/30 to-[#FFF5EB]/20 border border-[#FBB3BF]/20 shadow-md opacity-40 animate-[float_10s_ease-in-out_infinite]">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-1.5 bg-[#EDA5A7]" />
        <div className="absolute top-full left-1/2 w-0.5 h-20 bg-gradient-to-b from-[#EDA5A7]/30 to-transparent" />
      </div>

      {/* Right side floating apricot balloon */}
      <div className="absolute -right-8 top-[60vh] w-28 h-36 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-gradient-to-tr from-[#FFD4B2]/25 via-[#F2EEB6]/30 to-[#FFF5EB]/20 border border-[#FFD4B2]/20 shadow-md opacity-40 animate-[float_11s_ease-in-out_infinite_alternate_1.5s]">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-1.5 bg-[#FFD4B2]" />
        <div className="absolute top-full left-1/2 w-0.5 h-22 bg-gradient-to-b from-[#FFD4B2]/30 to-transparent" />
      </div>
    </div>
  );
}
