export type HapticIntensity = 'light' | 'selection' | 'medium' | 'success';

const PATTERNS: Record<HapticIntensity, number | number[]> = {
  light: 8,
  selection: 12,
  medium: 18,
  success: [10, 32, 14],
};

/**
 * Triggers native device haptic feedback when supported (Android / PWA / mobile browsers)
 * and fails silently on unsupported desktop browsers.
 */
export function triggerHaptic(intensity: HapticIntensity = 'light'): void {
  try {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(PATTERNS[intensity]);
    }
  } catch {
    // Silently ignore browsers blocking vibration before user gesture
  }
}
