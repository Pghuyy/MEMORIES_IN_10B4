import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CELEBRATION_BURSTS,
  PASTEL_FIREWORKS_COLORS,
  spawnBurstParticles,
  stepFireworkParticles,
} from './fireworksHelpers';

test('PASTEL_FIREWORKS_COLORS defines exactly 7 distinct pastel hex colors', () => {
  assert.equal(PASTEL_FIREWORKS_COLORS.length, 7);
  const unique = new Set(PASTEL_FIREWORKS_COLORS);
  assert.equal(unique.size, 7);
  for (const color of PASTEL_FIREWORKS_COLORS) {
    assert.match(color, /^#[0-9A-F]{6}$/i);
  }
});

test('spawnBurstParticles distributes all 7 pastel colors with finite velocities', () => {
  const particles = spawnBurstParticles(1440, 900, DEFAULT_CELEBRATION_BURSTS[0], () => 0.5);
  assert.equal(particles.length, DEFAULT_CELEBRATION_BURSTS[0].particleCount);

  const usedColors = new Set(particles.map((p) => p.color));
  assert.equal(usedColors.size, 7);

  for (const p of particles) {
    assert.ok(Number.isFinite(p.vx) && Number.isFinite(p.vy));
    assert.equal(p.alpha, 1);
  }
});

test('stepFireworkParticles advances motion, applies decay, and expires faded particles', () => {
  let particles = spawnBurstParticles(1280, 800, DEFAULT_CELEBRATION_BURSTS[0], () => 0.5);
  const initialCount = particles.length;
  particles = stepFireworkParticles(particles, 1);
  assert.equal(particles.length, initialCount);
  assert.ok(particles.every((p) => p.alpha < 1));

  for (let frame = 0; frame < 140; frame++) {
    particles = stepFireworkParticles(particles, 1);
  }
  assert.equal(particles.length, 0);
});
