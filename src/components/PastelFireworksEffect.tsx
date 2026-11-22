import React, { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_CELEBRATION_BURSTS,
  FireworkParticle,
  spawnBurstParticles,
  stepFireworkParticles,
} from '../utils/fireworksHelpers';

interface PastelFireworksEffectProps {
  /** Incrementing numeric trigger key; values > 0 fire a celebration burst sequence. */
  triggerKey: number;
}

export const PastelFireworksEffect: React.FC<PastelFireworksEffectProps> = ({
  triggerKey,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (triggerKey <= 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);
    setActive(true);

    let particles: FireworkParticle[] = [];
    const timeouts: number[] = [];

    if (reducedMotion) {
      particles = spawnBurstParticles(width, height, DEFAULT_CELEBRATION_BURSTS[2]);
    } else {
      DEFAULT_CELEBRATION_BURSTS.forEach((spec) => {
        const timerId = window.setTimeout(() => {
          particles = [...particles, ...spawnBurstParticles(width, height, spec)];
        }, spec.delayMs);
        timeouts.push(timerId);
      });
    }

    let rafId = 0;
    let lastTime = performance.now();
    const startTime = lastTime;

    const drawParticle = (p: FireworkParticle) => {
      const twinkle = 0.76 + 0.24 * Math.sin(p.twinklePhase);
      const alpha = Math.max(0, Math.min(1, p.alpha * twinkle));

      // Luminous soft pastel ribbon trail (visible over both dark twilight & warm modal paper)
      const tailX = p.x - (p.x - p.prevX) * 2.6;
      const tailY = p.y - (p.y - p.prevY) * 2.6;
      ctx.save();
      ctx.strokeStyle = p.color;
      ctx.globalAlpha = alpha * 0.62;
      ctx.lineWidth = Math.max(1.4, p.radius * 1.05);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      // Soft outer pastel aura
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha * 0.26;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 2.6, 0, Math.PI * 2);
      ctx.fill();

      // Crisp pastel core or tiny 4-point star sparkle
      ctx.globalAlpha = alpha * 0.98;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      if (p.kind === 'spark') {
        const r = p.radius * 1.55;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - r);
        ctx.lineTo(p.x + r * 0.35, p.y - r * 0.35);
        ctx.lineTo(p.x + r, p.y);
        ctx.lineTo(p.x + r * 0.35, p.y + r * 0.35);
        ctx.lineTo(p.x, p.y + r);
        ctx.lineTo(p.x - r * 0.35, p.y + r * 0.35);
        ctx.lineTo(p.x - r, p.y);
        ctx.lineTo(p.x - r * 0.35, p.y - r * 0.35);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const tick = (now: number) => {
      const dtMs = now - lastTime;
      lastTime = now;
      const dtScale = dtMs / 16.6667;

      ctx.clearRect(0, 0, width, height);
      particles = stepFireworkParticles(particles, reducedMotion ? dtScale * 1.4 : dtScale);
      for (const p of particles) {
        drawParticle(p);
      }

      const elapsed = now - startTime;
      const allBurstsScheduled = reducedMotion || elapsed > 1250;
      if (particles.length === 0 && allBurstsScheduled) {
        setActive(false);
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resize);
      timeouts.forEach((id) => window.clearTimeout(id));
      window.cancelAnimationFrame(rafId);
      ctx.clearRect(0, 0, width, height);
      setActive(false);
    };
  }, [triggerKey]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="pastel-fireworks-canvas"
      data-active={active ? 'true' : 'false'}
      aria-hidden="true"
      className={`no-print pointer-events-none fixed inset-0 z-[100] h-full w-full transition-opacity duration-300 ${
        active ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
};
