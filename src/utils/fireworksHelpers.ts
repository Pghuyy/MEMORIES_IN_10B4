export const PASTEL_FIREWORKS_COLORS: readonly string[] = [
  '#FFB3C6', // Pastel Rose Pink
  '#FFD1A9', // Pastel Peach
  '#FFF0A8', // Pastel Buttercup Yellow
  '#B8F2CE', // Pastel Mint Green
  '#AEE2FF', // Pastel Sky Blue
  '#D4BFFF', // Pastel Lavender
  '#F7B8EA', // Pastel Lilac Pearl
] as const;

export interface FireworkBurstSpec {
  xRatio: number;
  yRatio: number;
  delayMs: number;
  particleCount: number;
  maxSpeed: number;
}

export interface FireworkParticle {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  alpha: number;
  decay: number;
  gravity: number;
  drag: number;
  twinkleSpeed: number;
  twinklePhase: number;
  kind: 'petal' | 'spark';
}

export const DEFAULT_CELEBRATION_BURSTS: readonly FireworkBurstSpec[] = [
  { xRatio: 0.17, yRatio: 0.26, delayMs: 0, particleCount: 49, maxSpeed: 6.8 },
  { xRatio: 0.83, yRatio: 0.24, delayMs: 140, particleCount: 49, maxSpeed: 7.0 },
  { xRatio: 0.5, yRatio: 0.16, delayMs: 320, particleCount: 56, maxSpeed: 7.5 },
  { xRatio: 0.24, yRatio: 0.52, delayMs: 560, particleCount: 42, maxSpeed: 6.2 },
  { xRatio: 0.76, yRatio: 0.5, delayMs: 740, particleCount: 42, maxSpeed: 6.2 },
] as const;

export function spawnBurstParticles(
  width: number,
  height: number,
  spec: FireworkBurstSpec,
  rng: () => number = Math.random
): FireworkParticle[] {
  const originX = width * spec.xRatio;
  const originY = height * spec.yRatio;
  const scaleFactor = Math.max(0.76, Math.min(1.3, Math.min(width, height) / 700));
  const particles: FireworkParticle[] = [];

  for (let i = 0; i < spec.particleCount; i++) {
    const color = PASTEL_FIREWORKS_COLORS[i % PASTEL_FIREWORKS_COLORS.length];
    const baseAngle = (i / spec.particleCount) * Math.PI * 2;
    const angle = baseAngle + (rng() - 0.5) * 0.22;
    const isOuterPetal = i % 3 !== 0;
    const speed =
      (isOuterPetal ? 0.58 + rng() * 0.44 : 0.28 + rng() * 0.36) *
      spec.maxSpeed *
      scaleFactor;

    particles.push({
      x: originX,
      y: originY,
      prevX: originX,
      prevY: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.55 * scaleFactor,
      color,
      radius: isOuterPetal ? 2.5 + rng() * 1.6 : 1.7 + rng() * 1.15,
      alpha: 1,
      decay: isOuterPetal ? 0.0105 + rng() * 0.0045 : 0.013 + rng() * 0.005,
      gravity: 0.064 * scaleFactor,
      drag: 0.968,
      twinkleSpeed: 0.14 + rng() * 0.16,
      twinklePhase: rng() * Math.PI * 2,
      kind: isOuterPetal ? 'petal' : 'spark',
    });
  }

  return particles;
}

export function stepFireworkParticles(
  particles: FireworkParticle[],
  dtScale = 1
): FireworkParticle[] {
  const clampedScale = Math.max(0.25, Math.min(2.5, dtScale));
  const next: FireworkParticle[] = [];

  for (const p of particles) {
    const prevX = p.x;
    const prevY = p.y;
    const dragPow = Math.pow(p.drag, clampedScale);
    const vx = p.vx * dragPow;
    const vy = p.vy * dragPow + p.gravity * clampedScale;
    const x = prevX + vx * clampedScale;
    const y = prevY + vy * clampedScale;
    const alpha = p.alpha - p.decay * clampedScale;

    if (alpha > 0.015) {
      next.push({
        ...p,
        prevX,
        prevY,
        x,
        y,
        vx,
        vy,
        alpha,
        twinklePhase: p.twinklePhase + p.twinkleSpeed * clampedScale,
      });
    }
  }

  return next;
}
