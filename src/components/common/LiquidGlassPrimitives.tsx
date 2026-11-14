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
          scaleX: isPressed ? 1.24 : 1,
          scaleY: isPressed ? 1.16 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 520,
          damping: 30,
          mass: 0.7,
        }}
        className={`block ${knobSize} rounded-full liquid-glass-lens origin-center pointer-events-none relative overflow-hidden`}
      >
        <span className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent pointer-events-none" />
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
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full liquid-glass-orb text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all shrink-0 cursor-pointer relative overflow-hidden"
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        <motion.div
          key={isDark ? 'sun' : 'moon'}
          initial={{ rotate: -65, scale: 0.65, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 24 }}
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
      className={`relative w-[78px] h-8 rounded-full p-0.5 border cursor-pointer select-none overflow-hidden transition-colors duration-300 flex items-center ${
        isDark
          ? 'bg-white/10 border-white/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)]'
          : 'bg-slate-900/8 border-white/80 shadow-[inset_0_1px_3px_rgba(15,23,42,0.08)]'
      }`}
    >
      {/* Mode Label inside the track (opposite the sliding crystal lens) */}
      <span
        className={`absolute text-[10px] font-semibold tracking-tight transition-all duration-300 pointer-events-none ${
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
          scale: isPressed ? 1.15 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 460,
          damping: 28,
        }}
        className="w-8 h-7 rounded-full liquid-glass-lens flex items-center justify-center relative z-10 pointer-events-none"
      >
        <motion.span
          key={isDark ? 'sun-orb' : 'moon-orb'}
          initial={{ rotate: -45, scale: 0.7, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
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
 * illumination right under the user's pointer/finger (as seen in reference Video 5).
 */
export const LiquidSpecularItem: React.FC<LiquidSpecularItemProps> = ({
  children,
  active = false,
  className = '',
  onPointerMove,
  onPointerLeave,
  ...rest
}) => {
  const [spot, setSpot] = useState<{ x: number; y: number; visible: boolean }>({
    x: 50,
    y: 50,
    visible: false,
  });

  return (
    <div
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setSpot({ x, y, visible: true });
        onPointerMove?.(e);
      }}
      onPointerLeave={(e) => {
        setSpot((prev) => ({ ...prev, visible: false }));
        onPointerLeave?.(e);
      }}
      className={`relative overflow-hidden ${className}`}
      {...rest}
    >
      {(spot.visible || active) && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-200"
          style={{
            background: `radial-gradient(120px circle at ${spot.x}% ${spot.y}%, rgba(255,255,255,0.42), transparent 72%)`,
            opacity: spot.visible ? 1 : 0.35,
          }}
        />
      )}
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

  const rawX = useMotionValue(-300);
  const rawY = useMotionValue(-300);
  const smoothX = useSpring(rawX, { stiffness: 360, damping: 32, mass: 0.35 });
  const smoothY = useSpring(rawY, { stiffness: 360, damping: 32, mass: 0.35 });

  const liquidLightBackground = useMotionTemplate`radial-gradient(280px circle at ${smoothX}px ${smoothY}px, rgba(255, 255, 255, 0.28) 0%, rgba(167, 139, 250, 0.13) 34%, rgba(56, 189, 248, 0.06) 56%, transparent 76%)`;

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const target = e.target as HTMLElement | null;
      const card = target?.closest('.liquid-glass-card') as HTMLElement | null;

      if (!card) {
        if (hoveredCardRef.current) {
          hoveredCardRef.current = null;
          setHoveredCard(null);
        }
        return;
      }

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (card !== hoveredCardRef.current) {
        hoveredCardRef.current = card;
        rawX.jump(x);
        rawY.jump(y);
        smoothX.jump(x);
        smoothY.jump(y);
        setHoveredCard(card);
      } else {
        rawX.set(x);
        rawY.set(y);
      }
    };

    const clearHover = () => {
      if (hoveredCardRef.current) {
        hoveredCardRef.current = null;
        setHoveredCard(null);
      }
    };

    document.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('pointerleave', clearHover);
    window.addEventListener('blur', clearHover);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
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
        transition={{ duration: 0.2, ease: 'easeOut' }}
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
  const smoothX = useSpring(rawX, { stiffness: 360, damping: 32, mass: 0.35 });
  const smoothY = useSpring(rawY, { stiffness: 360, damping: 32, mass: 0.35 });

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
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="pointer-events-none absolute inset-0 rounded-[inherit] z-20"
        style={{ background: liquidLightBackground }}
      />
      {children}
    </div>
  );
};
