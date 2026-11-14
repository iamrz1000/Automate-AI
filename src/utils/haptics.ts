import { triggerNativeHaptic } from './platform';

export type HapticStyle = 'light' | 'medium' | 'selection';

const HAPTIC_PATTERNS: Record<HapticStyle, number> = {
  selection: 8,
  light: 10,
  medium: 14,
};

let lastHapticTimestamp = 0;

/**
 * Triggers subtle tactile haptic feedback via native Capacitor Haptics on iOS/Android
 * or navigator.vibrate() when supported on Web.
 * Includes a short 25ms guard so nested handlers or global listeners never double-fire.
 */
export function triggerHaptic(style: HapticStyle | number = 'light'): void {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (now - lastHapticTimestamp < 25) {
    return;
  }
  lastHapticTimestamp = now;

  const resolvedStyle: HapticStyle = typeof style === 'string' ? style : 'light';
  triggerNativeHaptic(resolvedStyle).then((handled) => {
    if (handled) return;
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
      return;
    }
    const duration = typeof style === 'number' ? style : HAPTIC_PATTERNS[style];
    try {
      navigator.vibrate(duration);
    } catch {
      // Ignore errors in unsupported or restricted browser environments
    }
  });
}

/**
 * Returns the appropriate haptic intensity for a glass-morphism interactive element.
 */
export function getGlassHapticStyle(element: HTMLElement): HapticStyle {
  if (element.classList.contains('liquid-glass-cta')) {
    return 'medium';
  }
  if (element.classList.contains('liquid-glass-droplet')) {
    return 'selection';
  }
  return 'light';
}
