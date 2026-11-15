import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useMotionTemplate,
} from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

interface LiquidGlassSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel?: string;
  accent?: 'emerald' | 'violet';
  size?: 'sm' | 'md';
}

/**
 * iOS 26/27 Liquid Glass Toggle Switch
 * Features a transparent crystal glass capsule thumb that lifts and elongates
 * under touch/drag while letting the track glow refract underneath.
 */
export const LiquidGlassSwitch: React.FC<LiquidGlassSwitchProps> = ({
  checked,
  onChange,
  ariaLabel = 'Toggle setting',
  accent = 'emerald',
  size = 'md',
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const dragStartXRef = useRef<number | null>(null);
  const didDragRef = useRef(false);

  const trackWidth = size === 'sm' ? 'w-12 h-7' : 'w-14 h-8';
  const knobTravel = size === 'sm' ? 20 : 24;
  const knobSize = size === 'sm' ? 'w-6 h-5.5' : 'w-7 h-6.5';

  const activeTrackClass =
    accent === 'emerald'
      ? 'bg-emerald-500/85 border-emerald-300/60 shadow-[inset_0_2px_6px_rgba(6,78,59,0.22),0_0_16px_rgba(16,185,129,0.3)]'
      : 'bg-violet-600/85 border-violet-300/60 shadow-[inset_0_2px_6px_rgba(46,16,101,0.28),0_0_16px_rgba(139,92,246,0.34)]';

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    setIsPressed(true);
    dragStartXRef.current = e.clientX;
    didDragRef.current = false;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isPressed || dragStartXRef.current === null) return;
    const deltaX = e.clientX - dragStartXRef.current;
    if (Math.abs(deltaX) > 10) {
      didDragRef.current = true;
      if (deltaX > 12 && !checked) {
        triggerHaptic('selection');
        onChange(true);
        dragStartXRef.current = e.clientX;
      } else if (deltaX < -12 && checked) {
        triggerHaptic('selection');
        onChange(false);
        dragStartXRef.current = e.clientX;
      }
    }
  };

  const handlePointerUp = () => {
    setIsPressed(false);
    dragStartXRef.current = null;
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={() => {
        if (didDragRef.current) {
          didDragRef.current = false;
          return;
        }
        triggerHaptic('selection');
        onChange(!checked);
      }}
      className={`relative ${trackWidth} rounded-full p-0.5 border transition-colors duration-300 cursor-pointer shrink-0 select-none touch-none focus-visible:outline-2 focus-visible:outline-violet-400 ${
        checked
          ? activeTrackClass
          : 'bg-slate-900/12 dark:bg-white/12 border-white/50 dark:border-white/15 shadow-inner'
      }`}
    >
      {/* Translucent Crystal Lens Thumb */}
      <motion.span
        animate={{
          x: checked ? knobTravel : 0,
          scaleX: isPressed ? 1.2 : 1,
          scaleY: isPressed ? 1.14 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 740,
          damping: 38,
          mass: 0.45,
        }}
        className={`block ${knobSize} rounded-full liquid-glass-lens origin-center pointer-events-none relative overflow-hidden will-change-transform`}
      >
        <span className="absolute inset-0 bg-gradient-to-br from-white/55 via-transparent to-transparent pointer-events-none" />
      </motion.span>
    </button>
  );
};

interface LiquidThemeSwitchProps {
  theme: 'light' | 'dark' | 'system';
  onToggle: () => void;
  compact?: boolean;
}

/**
 * iOS 26/27 Liquid Glass Light/Dark Theme Switch
 * Recreates the reference pill where the track reveals "Dark"/"Light"
 * while a gleaming refractive crystal orb containing Sun/Moon slides across.
 */
export const LiquidThemeSwitch: React.FC<LiquidThemeSwitchProps> = ({
  theme,
  onToggle,
  compact = false,
}) => {
  const isDark = theme === 'dark';
  const [isPressed, setIsPressed] = useState(false);

  if (compact) {
    return (
      <motion.button
        type="button"
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          triggerHaptic('selection');
          onToggle();
        }}
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full liquid-glass-orb text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors shrink-0 cursor-pointer relative overflow-hidden"
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        <motion.div
          key={isDark ? 'sun' : 'moon'}
          initial={{ rotate: -55, scale: 0.72, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 640, damping: 32 }}
        >
          {isDark ? (
            <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
          ) : (
            <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-600" />
          )}
        </motion.div>
      </motion.button>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
      onClick={() => {
        triggerHaptic('selection');
        onToggle();
      }}
      className={`relative w-[78px] h-8 rounded-full p-0.5 border cursor-pointer select-none overflow-hidden transition-colors duration-250 flex items-center ${
        isDark
          ? 'bg-white/10 border-white/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)]'
          : 'bg-slate-900/8 border-white/80 shadow-[inset_0_1px_3px_rgba(15,23,42,0.08)]'
      }`}
    >
      {/* Mode Label inside the track (opposite the sliding crystal lens) */}
      <span
        className={`absolute text-[10px] font-semibold tracking-tight transition-opacity duration-200 pointer-events-none ${
          isDark
            ? 'left-2.5 text-slate-200/90 opacity-100'
            : 'right-2.5 text-slate-700/90 opacity-100'
        }`}
      >
        {isDark ? 'Dark' : 'Light'}
      </span>

      {/* Sliding Crystal Lens Orb containing Sun/Moon */}
      <motion.span
        animate={{
          x: isDark ? 42 : 0,
          scale: isPressed ? 1.14 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 760,
          damping: 38,
          mass: 0.45,
        }}
        className="w-8 h-7 rounded-full liquid-glass-lens flex items-center justify-center relative z-10 pointer-events-none will-change-transform"
      >
        <motion.span
          key={isDark ? 'sun-orb' : 'moon-orb'}
          initial={{ rotate: -40, scale: 0.75, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 0.18 }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <Sun className="w-3.5 h-3.5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.65)]" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-violet-700 fill-violet-600/20" />
          )}
        </motion.span>
      </motion.span>
    </button>
  );
};

interface LiquidSpecularItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  active?: boolean;
}

/**
 * Interactive glass row/button wrapper that creates a soft radial specular
 * illumination right under the user's pointer using zero-re-render motion values.
 */
export const LiquidSpecularItem: React.FC<LiquidSpecularItemProps> = ({
  children,
  active = false,
  className = '',
  onPointerMove,
  onPointerLeave,
  ...rest
}) => {
  const spotX = useMotionValue(50);
  const spotY = useMotionValue(50);
  const spotOpacity = useMotionValue(active ? 0.35 : 0);

  useEffect(() => {
    spotOpacity.set(active ? 0.35 : 0);
  }, [active, spotOpacity]);

  const spotBackground = useMotionTemplate`radial-gradient(120px circle at ${spotX}% ${spotY}%, rgba(255,255,255,0.42), transparent 72%)`;

  return (
    <div
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        spotX.set(((e.clientX - rect.left) / Math.max(rect.width, 1)) * 100);
        spotY.set(((e.clientY - rect.top) / Math.max(rect.height, 1)) * 100);
        spotOpacity.set(1);
        onPointerMove?.(e);
      }}
      onPointerLeave={(e) => {
        spotOpacity.set(active ? 0.35 : 0);
        onPointerLeave?.(e);
      }}
      className={`relative overflow-hidden ${className}`}
      {...rest}
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: spotBackground,
          opacity: spotOpacity,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

/**
 * Global Liquid Light Refraction Overlay for all `.liquid-glass-card` elements.
 * Renders an animated `motion.div` with a smooth cursor-tracking `radial-gradient`
 * inside the currently hovered `.liquid-glass-card` to mimic real glass light refraction.
 */
export const LiquidGlassCardRefraction: React.FC = () => {
  const [hoveredCard, setHoveredCard] = useState<HTMLElement | null>(null);
  const hoveredCardRef = useRef<HTMLElement | null>(null);
  const hoveredRectRef = useRef<DOMRect | null>(null);
  const rafRef = useRef<number>(0);

  const rawX = useMotionValue(-300);
  const rawY = useMotionValue(-300);
  const smoothX = useSpring(rawX, { stiffness: 520, damping: 36, mass: 0.25 });
  const smoothY = useSpring(rawY, { stiffness: 520, damping: 36, mass: 0.25 });

  const liquidLightBackground = useMotionTemplate`radial-gradient(280px circle at ${smoothX}px ${smoothY}px, rgba(255, 255, 255, 0.28) 0%, rgba(167, 139, 250, 0.13) 34%, rgba(56, 189, 248, 0.06) 56%, transparent 76%)`;

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const clientX = e.clientX;
      const clientY = e.clientY;
      const target = e.target as HTMLElement | null;

      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = 0;
        const card = target?.closest('.liquid-glass-card') as HTMLElement | null;

        if (!card) {
          if (hoveredCardRef.current) {
            hoveredCardRef.current = null;
            hoveredRectRef.current = null;
            setHoveredCard(null);
          }
          return;
        }

        if (card !== hoveredCardRef.current || !hoveredRectRef.current) {
          const rect = card.getBoundingClientRect();
          hoveredCardRef.current = card;
          hoveredRectRef.current = rect;
          const x = clientX - rect.left;
          const y = clientY - rect.top;
          rawX.jump(x);
          rawY.jump(y);
          smoothX.jump(x);
          smoothY.jump(y);
          setHoveredCard(card);
        } else {
          const rect = hoveredRectRef.current;
          rawX.set(clientX - rect.left);
          rawY.set(clientY - rect.top);
        }
      });
    };

    const invalidateRect = () => {
      hoveredRectRef.current = null;
    };

    const clearHover = () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      if (hoveredCardRef.current) {
        hoveredCardRef.current = null;
        hoveredRectRef.current = null;
        setHoveredCard(null);
      }
    };

    document.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('scroll', invalidateRect, { passive: true, capture: true });
    document.addEventListener('pointerleave', clearHover);
    window.addEventListener('blur', clearHover);

    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('scroll', invalidateRect, true);
      document.removeEventListener('pointerleave', clearHover);
      window.removeEventListener('blur', clearHover);
    };
  }, [rawX, rawY, smoothX, smoothY]);

  if (!hoveredCard || !hoveredCard.isConnected) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="liquid-card-light-overlay"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        className="pointer-events-none absolute inset-0 rounded-[inherit] z-20"
        style={{ background: liquidLightBackground }}
      />
    </AnimatePresence>,
    hoveredCard
  );
};

interface LiquidGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Standalone Liquid Glass Card with built-in animated `motion.div` radial light refraction.
 */
export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  className = '',
  onMouseMove,
  onMouseEnter,
  onMouseLeave,
  ...rest
}) => {
  const [hovered, setHovered] = useState(false);
  const rawX = useMotionValue(-200);
  const rawY = useMotionValue(-200);
  const smoothX = useSpring(rawX, { stiffness: 520, damping: 36, mass: 0.25 });
  const smoothY = useSpring(rawY, { stiffness: 520, damping: 36, mass: 0.25 });

  const liquidLightBackground = useMotionTemplate`radial-gradient(280px circle at ${smoothX}px ${smoothY}px, rgba(255, 255, 255, 0.28) 0%, rgba(167, 139, 250, 0.13) 34%, rgba(56, 189, 248, 0.06) 56%, transparent 76%)`;

  return (
    <div
      onMouseEnter={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        rawX.jump(x);
        rawY.jump(y);
        smoothX.jump(x);
        smoothY.jump(y);
        setHovered(true);
        onMouseEnter?.(e);
      }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        rawX.set(e.clientX - rect.left);
        rawY.set(e.clientY - rect.top);
        onMouseMove?.(e);
      }}
      onMouseLeave={(e) => {
        setHovered(false);
        onMouseLeave?.(e);
      }}
      className={`liquid-glass-card relative overflow-hidden ${className}`}
      {...rest}
    >
      <motion.div
        aria-hidden="true"
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        className="pointer-events-none absolute inset-0 rounded-[inherit] z-20"
        style={{ background: liquidLightBackground }}
      />
      {children}
    </div>
  );
};

/**
 * Global Liquid Ripple Feedback Layer.
 * Spawns zero-re-render GPU liquid/ripple effects on interactive buttons, orbs, and glass cards.
 */
export const LiquidInteractionFeedback: React.FC = () => {
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button > 0) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactiveEl = target.closest<HTMLElement>(
        'button, [role="button"], .liquid-glass-orb, .liquid-glass-cta, .liquid-glass-card'
      );
      if (!interactiveEl) return;
      if (
        (interactiveEl as HTMLButtonElement).disabled ||
        interactiveEl.getAttribute('aria-disabled') === 'true' ||
        interactiveEl.classList.contains('cursor-not-allowed')
      ) {
        return;
      }

      const style = window.getComputedStyle(interactiveEl);
      const canContainRipple =
        (style.position === 'relative' || style.position === 'absolute') &&
        style.overflow === 'hidden';

      if (canContainRipple) {
        const rect = interactiveEl.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height, 44) * 1.15;
        const ripple = document.createElement('span');
        ripple.className = 'liquid-ripple-wave';
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left}px`;
        ripple.style.top = `${e.clientY - rect.top}px`;
        interactiveEl.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
        window.setTimeout(() => {
          if (ripple.isConnected) ripple.remove();
        }, 600);
      } else {
        const ring = document.createElement('span');
        ring.className = 'liquid-ripple-viewport-ring';
        ring.style.left = `${e.clientX}px`;
        ring.style.top = `${e.clientY}px`;
        document.body.appendChild(ring);
        ring.addEventListener('animationend', () => ring.remove(), { once: true });
        window.setTimeout(() => {
          if (ring.isConnected) ring.remove();
        }, 520);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, { passive: true, capture: true });
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, []);

  return null;
};

interface AiProcessingCoreProps {
  compact?: boolean;
  label?: string;
}

/**
 * Minimalist Frosted Liquid Glass "Pulsing Core + Fluid Waveform" micro-animation
 * for AI thinking/processing and live voice listening states.
 */
export const AiProcessingCore: React.FC<AiProcessingCoreProps> = ({
  compact = false,
  label = 'Thinking',
}) => {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-300">
        <span className="relative flex h-3 w-3 items-center justify-center shrink-0">
          <span className="ai-core-halo absolute inset-0 rounded-full bg-violet-400/50" />
          <span className="ai-core-orb relative h-2 w-2 rounded-full bg-gradient-to-tr from-violet-500 to-sky-400 shadow-[0_0_8px_rgba(139,92,246,0.65)]" />
        </span>
        <div className="flex items-center gap-[2.5px] h-3" aria-hidden="true">
          {[0, 0.14, 0.28, 0.42].map((delay, idx) => (
            <span
              key={idx}
              style={{ animationDelay: `${delay}s` }}
              className="ai-wave-bar w-[2px] h-3 rounded-full bg-gradient-to-t from-violet-500/80 to-sky-400/90"
            />
          ))}
        </div>
        <span className="text-[11px] font-medium">{label}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3.5 py-2.5 select-none">
      {/* Pulsing Concentric Frosted Core */}
      <div className="relative flex h-9 w-9 items-center justify-center shrink-0">
        <span className="ai-core-halo absolute inset-0 rounded-full border border-violet-400/45 bg-violet-400/15" />
        <span
          className="ai-core-halo absolute inset-1 rounded-full bg-sky-400/20"
          style={{ animationDelay: '0.45s' }}
        />
        <span className="ai-core-orb relative flex h-5 w-5 items-center justify-center rounded-full liquid-glass-droplet">
          <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-500 to-sky-400 shadow-[0_0_12px_rgba(139,92,246,0.7)]" />
        </span>
      </div>

      {/* Organic Fluid Harmonic Waveform */}
      <div className="flex items-center gap-1 h-5 px-3 py-1 rounded-full liquid-glass-subtle">
        {[
          { delay: '0s', h: 'h-2.5' },
          { delay: '0.12s', h: 'h-3.5' },
          { delay: '0.24s', h: 'h-4' },
          { delay: '0.36s', h: 'h-3' },
          { delay: '0.48s', h: 'h-2' },
        ].map((bar, idx) => (
          <span
            key={idx}
            style={{ animationDelay: bar.delay }}
            className={`ai-wave-bar w-[3px] ${bar.h} rounded-full bg-gradient-to-t from-violet-500 via-indigo-400 to-sky-400`}
          />
        ))}
        <span className="ml-2 text-xs font-medium text-slate-600 dark:text-slate-300">
          {label}…
        </span>
      </div>
    </div>
  );
};

