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
  '#FF4B7E', // Birthday Magenta Rose
  '#FFB074', // Shimmering Peach
  '#FFD152', // Birthday Celebration Gold
  '#FFE680', // Champagne Shimmer
  '#F85E87', // Bright Berry Pink
  '#9BE7FF', // Festive Sky Sparkle
  '#FFF5EB', // Birthday Frosting White
];

export function CelebrationConfetti({ trigger }: { trigger?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const spawnBurst = (count = 50) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;

    // Half of all particles are romantic celebration hearts
    const types: Particle['type'][] = ['heart', 'heart', 'star', 'circle', 'rect'];
    const newParticles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      newParticles.push({
        x: Math.random() * w,
        y: -10 - Math.random() * 40,
        size: type === 'heart' ? 12 + Math.random() * 14 : 7 + Math.random() * 10,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        type,
        rotation: Math.random() * 360,
        vx: (Math.random() - 0.5) * 2.4,
        vy: 2.0 + Math.random() * 3.4,
        vRot: (Math.random() - 0.5) * 5,
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

// Lightweight Ambient Floating Balloons (Desktop only)
export function AmbientFloatingBalloons() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-10 overflow-hidden hidden md:block"
      aria-hidden="true"
    >
      {/* Left side gentle floating balloon - Birthday Rose */}
      <div className="absolute -left-5 top-[25vh] w-24 h-32 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-gradient-to-tr from-[#FF4B7E]/30 via-[#FFB074]/35 to-[#FFF5EB]/30 border border-[#FF4B7E]/35 shadow-lg opacity-50 animate-[float_10s_ease-in-out_infinite]">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2.5 h-2 bg-[#FF4B7E] rounded-xs" />
        <div className="absolute top-full left-1/2 w-0.5 h-24 bg-gradient-to-b from-[#FF4B7E]/40 to-transparent" />
      </div>

      {/* Right side floating champagne gold balloon */}
      <div className="absolute -right-6 top-[55vh] w-26 h-34 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-gradient-to-tr from-[#FFD152]/30 via-[#FFE680]/35 to-[#FFF5EB]/30 border border-[#FFD152]/35 shadow-lg opacity-50 animate-[float_12s_ease-in-out_infinite_alternate_1.5s]">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2.5 h-2 bg-[#FFD152] rounded-xs" />
        <div className="absolute top-full left-1/2 w-0.5 h-24 bg-gradient-to-b from-[#FFD152]/40 to-transparent" />
      </div>

      {/* Top right floating warm peach celebration balloon */}
      <div className="absolute right-[12%] top-[8vh] w-18 h-24 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-gradient-to-tr from-[#FFB074]/25 via-[#F85E87]/25 to-[#FFF]/25 border border-[#FFB074]/30 shadow-md opacity-40 animate-[float_9s_ease-in-out_infinite_alternate_3s]">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-1.5 bg-[#FFB074] rounded-xs" />
        <div className="absolute top-full left-1/2 w-0.5 h-16 bg-gradient-to-b from-[#FFB074]/35 to-transparent" />
      </div>
    </div>
  );
}
