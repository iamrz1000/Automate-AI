import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Bot,
  Calendar,
  BookOpen,
  Link2,
  Flower2,
  Gauge,
  Moon,
  Sun,
  HelpCircle,
  X,
  ExternalLink,
  Crown,
  Plus,
  Search,
  Sparkles,
  Radio,
  Download,
} from 'lucide-react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react';
import { NavTab, UserProfile } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import { triggerHaptic } from '../../utils/haptics';

interface NavigationRailProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenUpgrade: () => void;
  onOpenGift: () => void;
  onOpenSearch?: () => void;
  onOpenDownloads?: () => void;
  theme?: 'light' | 'system' | 'dark';
  onToggleTheme?: () => void;
  currentUser?: UserProfile;
}

interface NavItemConfig {
  id: NavTab;
  label: string;
  mobileLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  isAdminTab?: boolean;
}

const FIXED_DESKTOP_TABS: NavTab[] = [
  'chat',
  'agents',
  'tasks',
  'library',
  'integrations',
  'models',
  'upgrade',
];

const FIXED_MOBILE_TABS: NavTab[] = [
  'chat',
  'agents',
  'integrations',
  'tasks',
  'library',
  'settings',
];

const DESKTOP_ITEM_HEIGHT = 50;
const DESKTOP_ITEM_GAP = 4;
const DESKTOP_STEP = DESKTOP_ITEM_HEIGHT + DESKTOP_ITEM_GAP;

export const NavigationRail: React.FC<NavigationRailProps> = ({
  activeTab,
  onSelectTab,
  onOpenUpgrade,
  onOpenGift,
  onOpenSearch,
  onOpenDownloads,
  theme = 'dark',
  onToggleTheme,
  currentUser,
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.isAdmin;

  const navMeta: Record<string, NavItemConfig> = {
    chat: { id: 'chat', label: 'Chat', mobileLabel: 'Chat', icon: MessageSquare },
    agents: { id: 'agents', label: 'Agent', mobileLabel: 'Agent', icon: Bot },
    tasks: { id: 'tasks', label: 'Tasks', mobileLabel: 'Tasks', icon: Calendar },
    library: { id: 'library', label: 'Library', mobileLabel: 'Library', icon: BookOpen },
    integrations: { id: 'integrations', label: 'Integrate', mobileLabel: 'Apps', icon: Link2 },
    models: { id: 'models', label: 'Models', mobileLabel: 'Models', icon: Flower2 },
    upgrade: { id: 'upgrade', label: 'Upgrade', mobileLabel: 'Pro', icon: Gauge },
    admin: { id: 'admin', label: 'Admin', mobileLabel: 'Admin', icon: Crown, isAdminTab: true },
    settings: { id: 'settings', label: 'Profile', mobileLabel: 'Profile', icon: Crown },
  };

  const desktopTabs = useMemo(
    () => (isAdmin ? [...FIXED_DESKTOP_TABS, 'admin' as NavTab] : FIXED_DESKTOP_TABS),
    [isAdmin]
  );

  // =========================================================================
  // MOBILE HORIZONTAL LIQUID GLASS LENS SCRUBBER (Matches iOS 27 Beta Video)
  // Stationary icons — only the crystal glass capsule glides smoothly.
  // =========================================================================
  const mobileTrackRef = useRef<HTMLDivElement>(null);
  const mobileActiveIndex = Math.max(0, FIXED_MOBILE_TABS.indexOf(activeTab));
  const [isMobileScrubbing, setIsMobileScrubbing] = useState(false);
  const [isMobilePressed, setIsMobilePressed] = useState(false);
  const [mobilePreviewIndex, setMobilePreviewIndex] = useState<number>(mobileActiveIndex);

  const mobileTargetIndex = useMotionValue(mobileActiveIndex);
  const mobileSpringIndex = useSpring(mobileTargetIndex, {
    stiffness: 780,
    damping: 42,
    mass: 0.4,
  });
  const mobileLensX = useTransform(mobileSpringIndex, (v) => `${v * 100}%`);

  const mobileGestureRef = useRef<{
    active: boolean;
    didDrag: boolean;
    startX: number;
    lastPreviewIdx: number;
  }>({
    active: false,
    didDrag: false,
    startX: 0,
    lastPreviewIdx: mobileActiveIndex,
  });

  useEffect(() => {
    if (!isMobileScrubbing) {
      mobileTargetIndex.set(mobileActiveIndex);
      setMobilePreviewIndex(mobileActiveIndex);
    }
  }, [mobileActiveIndex, isMobileScrubbing, mobileTargetIndex]);

  const computeMobileFloatIndex = (clientX: number) => {
    const track = mobileTrackRef.current;
    if (!track) return mobileActiveIndex;
    const rect = track.getBoundingClientRect();
    const count = FIXED_MOBILE_TABS.length;
    const raw = ((clientX - rect.left) / Math.max(rect.width, 1)) * count - 0.5;
    return Math.max(0, Math.min(count - 1, raw));
  };

  const computeMobileTappedIndex = (clientX: number) => {
    const track = mobileTrackRef.current;
    if (!track) return mobileActiveIndex;
    const rect = track.getBoundingClientRect();
    const count = FIXED_MOBILE_TABS.length;
    const idx = Math.floor(((clientX - rect.left) / Math.max(rect.width, 1)) * count);
    return Math.max(0, Math.min(count - 1, idx));
  };

  const handleMobilePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setIsMobilePressed(true);
    mobileGestureRef.current = {
      active: true,
      didDrag: false,
      startX: e.clientX,
      lastPreviewIdx: mobileActiveIndex,
    };
  };

  const handleMobilePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = mobileGestureRef.current;
    if (!g.active) return;

    const dx = Math.abs(e.clientX - g.startX);
    if (!g.didDrag && dx > 5) {
      g.didDrag = true;
      setIsMobileScrubbing(true);
      triggerHaptic('light');
    }

    if (g.didDrag) {
      const floatIdx = computeMobileFloatIndex(e.clientX);
      mobileTargetIndex.set(floatIdx);
      mobileSpringIndex.jump(floatIdx);
      const nearestIdx = Math.round(floatIdx);
      if (nearestIdx !== g.lastPreviewIdx) {
        g.lastPreviewIdx = nearestIdx;
        setMobilePreviewIndex(nearestIdx);
        triggerHaptic('selection');
      }
    }
  };

  const finishMobilePointer = (e: React.PointerEvent<HTMLDivElement>, cancelled = false) => {
    const g = mobileGestureRef.current;
    if (!g.active) return;
    g.active = false;
    setIsMobilePressed(false);
    setIsMobileScrubbing(false);

    if (cancelled) {
      mobileTargetIndex.set(mobileActiveIndex);
      setMobilePreviewIndex(mobileActiveIndex);
      return;
    }

    const targetIdx = g.didDrag
      ? Math.round(computeMobileFloatIndex(e.clientX))
      : computeMobileTappedIndex(e.clientX);

    const chosenTab = FIXED_MOBILE_TABS[targetIdx] || 'chat';
    mobileTargetIndex.set(targetIdx);
    setMobilePreviewIndex(targetIdx);
    if (!g.didDrag) {
      triggerHaptic('selection');
    }
    onSelectTab(chosenTab);
  };

  // =========================================================================
  // DESKTOP VERTICAL LIQUID GLASS LENS SCRUBBER (Stationary Tabs)
  // =========================================================================
  const desktopTrackRef = useRef<HTMLDivElement>(null);
  const desktopActiveIndex = Math.max(0, desktopTabs.indexOf(activeTab));
  const [isDesktopScrubbing, setIsDesktopScrubbing] = useState(false);
  const [isDesktopPressed, setIsDesktopPressed] = useState(false);
  const [desktopPreviewIndex, setDesktopPreviewIndex] = useState<number>(desktopActiveIndex);

  const desktopTargetY = useMotionValue(desktopActiveIndex * DESKTOP_STEP);
  const desktopSpringY = useSpring(desktopTargetY, {
    stiffness: 780,
    damping: 42,
    mass: 0.4,
  });

  const desktopGestureRef = useRef<{
    active: boolean;
    didDrag: boolean;
    startY: number;
    lastPreviewIdx: number;
  }>({
    active: false,
    didDrag: false,
    startY: 0,
    lastPreviewIdx: desktopActiveIndex,
  });

  useEffect(() => {
    if (!isDesktopScrubbing) {
      const idx = desktopTabs.indexOf(activeTab);
      if (idx >= 0) {
        desktopTargetY.set(idx * DESKTOP_STEP);
        setDesktopPreviewIndex(idx);
      }
    }
  }, [activeTab, desktopTabs, isDesktopScrubbing, desktopTargetY]);

  const computeDesktopFloatIndex = (clientY: number) => {
    const track = desktopTrackRef.current;
    if (!track) return desktopActiveIndex;
    const rect = track.getBoundingClientRect();
    const count = desktopTabs.length;
    const localY = clientY - rect.top + track.scrollTop;
    const raw = (localY - DESKTOP_ITEM_HEIGHT / 2) / DESKTOP_STEP;
    return Math.max(0, Math.min(count - 1, raw));
  };

  const computeDesktopTappedIndex = (clientY: number) => {
    const track = desktopTrackRef.current;
    if (!track) return desktopActiveIndex;
    const rect = track.getBoundingClientRect();
    const count = desktopTabs.length;
    const localY = clientY - rect.top + track.scrollTop;
    const idx = Math.floor(localY / DESKTOP_STEP);
    return Math.max(0, Math.min(count - 1, idx));
  };

  const handleDesktopPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setIsDesktopPressed(true);
    desktopGestureRef.current = {
      active: true,
      didDrag: false,
      startY: e.clientY,
      lastPreviewIdx: desktopActiveIndex,
    };
  };

  const handleDesktopPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = desktopGestureRef.current;
    if (!g.active) return;

    const dy = Math.abs(e.clientY - g.startY);
    if (!g.didDrag && dy > 6) {
      g.didDrag = true;
      setIsDesktopScrubbing(true);
      triggerHaptic('light');
    }

    if (g.didDrag) {
      const floatIdx = computeDesktopFloatIndex(e.clientY);
      const yPx = floatIdx * DESKTOP_STEP;
      desktopTargetY.set(yPx);
      desktopSpringY.jump(yPx);
      const nearestIdx = Math.round(floatIdx);
      if (nearestIdx !== g.lastPreviewIdx) {
        g.lastPreviewIdx = nearestIdx;
        setDesktopPreviewIndex(nearestIdx);
        triggerHaptic('selection');
      }
    }
  };

  const finishDesktopPointer = (e: React.PointerEvent<HTMLDivElement>, cancelled = false) => {
    const g = desktopGestureRef.current;
    if (!g.active) return;
    g.active = false;
    setIsDesktopPressed(false);
    setIsDesktopScrubbing(false);

    if (cancelled) {
      desktopTargetY.set(desktopActiveIndex * DESKTOP_STEP);
      setDesktopPreviewIndex(desktopActiveIndex);
      return;
    }

    const targetIdx = g.didDrag
      ? Math.round(computeDesktopFloatIndex(e.clientY))
      : computeDesktopTappedIndex(e.clientY);

    const chosenTab = desktopTabs[targetIdx] || 'chat';
    if (chosenTab === 'upgrade') {
      desktopTargetY.set(desktopActiveIndex * DESKTOP_STEP);
      setDesktopPreviewIndex(desktopActiveIndex);
      onOpenUpgrade();
      return;
    }

    desktopTargetY.set(targetIdx * DESKTOP_STEP);
    setDesktopPreviewIndex(targetIdx);
    if (!g.didDrag) {
      triggerHaptic('selection');
    }
    onSelectTab(chosenTab);
  };

  const quickGridActions = [
    {
      id: 'quick-chat',
      label: 'Chat',
      icon: MessageSquare,
      onClick: () => onSelectTab('chat'),
    },
    {
      id: 'quick-search',
      label: 'Search',
      icon: Search,
      onClick: () => onOpenSearch?.(),
    },
    {
      id: 'quick-agents',
      label: 'Agents',
      icon: Bot,
      onClick: () => onSelectTab('agents'),
    },
    {
      id: 'quick-tasks',
      label: 'Tasks',
      icon: Calendar,
      onClick: () => onSelectTab('tasks'),
    },
    {
      id: 'quick-models',
      label: 'Models',
      icon: Sparkles,
      onClick: () => onSelectTab('models'),
    },
    {
      id: 'quick-upgrade',
      label: 'Upgrade',
      icon: Radio,
      onClick: () => onOpenUpgrade(),
    },
  ];

  const highlightedMobileIdx = isMobileScrubbing ? mobilePreviewIndex : mobileActiveIndex;
  const highlightedDesktopIdx = isDesktopScrubbing ? desktopPreviewIndex : desktopActiveIndex;
  const isDesktopHighlightAdmin = desktopTabs[highlightedDesktopIdx] === 'admin';
  const showDesktopLens = (activeTab !== 'settings' && activeTab !== 'downloads') || isDesktopScrubbing;

  return (
    <>
      {/* Desktop Floating Liquid Glass Navigation Dock */}
      <aside className="hidden md:flex w-[76px] h-full rounded-[30px] liquid-glass flex-col items-center py-3 select-none shrink-0 z-30 text-slate-700 dark:text-slate-200 relative">
        {/* Brand Logo Emblem */}
        <motion.button
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => onSelectTab('chat')}
          title="Automate AI Home"
          className="w-11 h-11 rounded-2xl liquid-glass-orb flex items-center justify-center p-1.5 transition-colors duration-150 mb-2.5 relative shrink-0 group cursor-pointer"
        >
          <img
            src="/assets/aistudio/automate_ai_logo_transparent.png"
            alt="Automate AI"
            className="w-7 h-7 object-contain drop-shadow-xs"
          />
        </motion.button>

        {/* Dynamic User Avatar */}
        <motion.button
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => onSelectTab('settings')}
          title={`${currentUser?.name || 'Account'} (Settings & Profile)`}
          className="mb-2.5 relative shrink-0 cursor-pointer group"
        >
          <UserAvatar
            name={currentUser?.name || 'User'}
            role={currentUser?.role}
            size="sm"
            showStatusBadge={true}
          />
        </motion.button>

        {/* Stationary Nav Items with Sliding Liquid Glass Lens */}
        <div
          ref={desktopTrackRef}
          onPointerDown={handleDesktopPointerDown}
          onPointerMove={handleDesktopPointerMove}
          onPointerUp={(e) => finishDesktopPointer(e, false)}
          onPointerCancel={(e) => finishDesktopPointer(e, true)}
          className="flex-1 w-full px-1.5 overflow-y-auto scrollbar-none touch-none select-none"
        >
          <div className="relative flex flex-col items-center gap-[4px] w-full">
            {/* Sliding Crystal Glass Capsule Lens */}
            {showDesktopLens && (
              <motion.div
                aria-hidden="true"
                style={{ y: desktopSpringY, height: DESKTOP_ITEM_HEIGHT }}
                className="pointer-events-none absolute top-0 inset-x-0 z-0 will-change-transform"
              >
                <motion.span
                  animate={{
                    scale: isDesktopScrubbing ? 1.09 : isDesktopPressed ? 1.03 : 1,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 760,
                    damping: 38,
                    mass: 0.38,
                  }}
                  className={`block w-full h-full rounded-2xl relative overflow-hidden ${
                    isDesktopScrubbing
                      ? 'liquid-glass-lens ring-1 ring-white/55 shadow-[0_12px_28px_-6px_rgba(124,58,237,0.36)]'
                      : isDesktopHighlightAdmin
                      ? 'bg-amber-400/22 border border-amber-300/50 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.55),0_6px_16px_-4px_rgba(245,158,11,0.25)]'
                      : 'liquid-glass-droplet'
                  }`}
                >
                  <span className="absolute inset-x-1.5 top-0.5 h-1/2 rounded-xl bg-gradient-to-b from-white/50 to-transparent dark:from-white/22 pointer-events-none" />
                </motion.span>
              </motion.div>
            )}

            {desktopTabs.map((tabId, idx) => {
              const item = navMeta[tabId];
              if (!item) return null;
              const Icon = item.icon;
              const isSelected = highlightedDesktopIdx === idx && (isDesktopScrubbing || activeTab === item.id);
              const isAdminItem = item.isAdminTab;

              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  style={{ height: DESKTOP_ITEM_HEIGHT }}
                  className={`w-full rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-colors relative z-10 group cursor-pointer ${
                    isSelected
                      ? 'text-violet-700 dark:text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300/80 dark:hover:text-white'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 stroke-[1.9] transition-transform duration-150 ${
                      isSelected
                        ? isAdminItem
                          ? 'text-amber-500 dark:text-amber-300 scale-110'
                          : 'text-violet-600 dark:text-violet-300 scale-110'
                        : isAdminItem
                        ? 'text-amber-500 dark:text-amber-400'
                        : 'text-slate-500 dark:text-slate-300/80 group-hover:text-slate-900 dark:group-hover:text-white'
                    }`}
                  />
                  <span
                    className={`text-[10px] tracking-tight leading-none transition-colors ${
                      isSelected
                        ? isAdminItem
                          ? 'text-amber-600 dark:text-amber-300 font-bold'
                          : 'text-violet-700 dark:text-white font-semibold'
                        : isAdminItem
                        ? 'text-amber-600 dark:text-amber-400 font-semibold'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Utility Cluster */}
        <div className="pt-2.5 w-full flex flex-col items-center gap-2 border-t border-slate-900/10 dark:border-white/10">
          {onOpenDownloads && (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              onClick={onOpenDownloads}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                activeTab === 'downloads'
                  ? 'liquid-glass-droplet text-violet-600 dark:text-violet-300'
                  : 'liquid-glass-orb text-slate-600 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white'
              }`}
              title="Install Desktop & Mobile Apps"
            >
              <Download className="w-4 h-4 stroke-[1.9]" />
            </motion.button>
          )}

          {onOpenSearch && (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              onClick={onOpenSearch}
              className="w-9 h-9 rounded-full liquid-glass-orb flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white transition-colors cursor-pointer"
              title="Quick Search (⌘K)"
            >
              <Search className="w-4 h-4 stroke-[1.9]" />
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.88 }}
            onClick={onOpenGift}
            className="w-9 h-9 rounded-full liquid-glass-orb flex items-center justify-center relative group cursor-pointer"
            title="Referral & Bonus Rewards"
          >
            <span className="text-sm">🎁</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            onClick={onToggleTheme}
            className="w-9 h-9 rounded-full liquid-glass-orb flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 stroke-[1.9] text-indigo-200" />
            ) : (
              <Sun className="w-4 h-4 stroke-[1.9] text-amber-500" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowHelp(true)}
            className="w-9 h-9 rounded-full liquid-glass-orb flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer"
            title="Help & Documentation"
          >
            <HelpCircle className="w-4 h-4 stroke-[1.9]" />
          </motion.button>
        </div>
      </aside>

      {/* Mobile Floating iOS 27 Liquid Glass Pill Dock + Separate Circular '+' Orb */}
      <div className="md:hidden fixed bottom-2 inset-x-2 z-40 flex items-center gap-1.5 max-w-[calc(100vw-16px)]">
        {/* Morphing 3x2 Quick Action Grid Popover above Dock */}
        <AnimatePresence>
          {showQuickMenu && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowQuickMenu(false)}
                className="fixed inset-0 bg-slate-950/20 backdrop-blur-[2px] z-30"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 10 }}
                transition={{ type: 'spring', stiffness: 680, damping: 36, mass: 0.5 }}
                className="absolute bottom-14 right-0 left-0 z-40 liquid-glass-elevated rounded-[28px] p-3 space-y-2 text-slate-900 dark:text-white"
              >
                <div className="grid grid-cols-3 gap-2">
                  {quickGridActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <motion.button
                        key={action.id}
                        type="button"
                        whileTap={{ scale: 0.93 }}
                        onClick={() => {
                          setShowQuickMenu(false);
                          action.onClick();
                        }}
                        className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl liquid-glass-subtle hover:bg-white/60 dark:hover:bg-white/15 transition-colors cursor-pointer"
                      >
                        <Icon className="w-5 h-5 text-violet-600 dark:text-violet-300" />
                        <span className="text-[11px] font-semibold">{action.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
                {onOpenDownloads && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setShowQuickMenu(false);
                      onOpenDownloads();
                    }}
                    className="w-full py-2 px-3 rounded-full liquid-glass-cta text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Install Native App (APK / Desktop / iOS)</span>
                  </motion.button>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Stationary Pill Bar with Gliding iOS 27 Crystal Lens */}
        <nav
          aria-label="Primary Mobile Navigation"
          className="flex-1 rounded-full liquid-glass-elevated p-1 flex items-center min-w-0 relative z-40 touch-none select-none overflow-visible"
        >
          <div
            ref={mobileTrackRef}
            onPointerDown={handleMobilePointerDown}
            onPointerMove={handleMobilePointerMove}
            onPointerUp={(e) => finishMobilePointer(e, false)}
            onPointerCancel={(e) => finishMobilePointer(e, true)}
            className="relative flex-1 flex items-center min-w-0 w-full cursor-pointer"
          >
            {/* Gliding Liquid Glass Lens (Moves smoothly on tap or scrub, icons stay fixed) */}
            {(FIXED_MOBILE_TABS.includes(activeTab) || isMobileScrubbing) && (
              <motion.div
                aria-hidden="true"
                style={{
                  width: `${100 / FIXED_MOBILE_TABS.length}%`,
                  x: mobileLensX,
                }}
                className="pointer-events-none absolute inset-y-0 left-0 z-0 will-change-transform"
              >
                <motion.span
                  animate={{
                    scale: isMobileScrubbing ? 1.14 : isMobilePressed ? 1.05 : 1,
                    y: isMobileScrubbing ? -1.5 : 0,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 760,
                    damping: 38,
                    mass: 0.38,
                  }}
                  className={`block w-full h-full rounded-full relative overflow-hidden ${
                    isMobileScrubbing
                      ? 'liquid-glass-lens ring-1 ring-white/60 shadow-[0_10px_28px_-4px_rgba(124,58,237,0.38)]'
                      : 'liquid-glass-droplet'
                  }`}
                >
                  <span className="absolute inset-x-2 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/60 to-transparent dark:from-white/25 pointer-events-none" />
                </motion.span>
              </motion.div>
            )}

            {FIXED_MOBILE_TABS.map((tabId, idx) => {
              const isProfile = tabId === 'settings';
              const meta = navMeta[tabId] || navMeta.chat;
              const Icon = meta.icon;
              const isSelected = highlightedMobileIdx === idx && (isMobileScrubbing || activeTab === tabId);

              return (
                <button
                  key={tabId}
                  type="button"
                  aria-label={meta.label}
                  className={`flex-1 min-w-0 relative z-10 flex flex-col items-center justify-center gap-0.5 py-1.5 px-0.5 rounded-full transition-colors cursor-pointer ${
                    isSelected
                      ? 'text-violet-700 dark:text-white font-bold'
                      : 'text-slate-600 dark:text-slate-300/85 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {isProfile ? (
                    <UserAvatar
                      name={currentUser?.name || 'User'}
                      role={currentUser?.role}
                      size="xs"
                      showStatusBadge={false}
                    />
                  ) : (
                    <Icon
                      className={`w-4 h-4 stroke-[2] shrink-0 transition-transform duration-150 ${
                        isSelected
                          ? 'text-violet-600 dark:text-violet-300 scale-110'
                          : ''
                      }`}
                    />
                  )}
                  <span className="text-[9px] leading-tight whitespace-nowrap tracking-tight">
                    {meta.mobileLabel || meta.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Separate Circular '+' Liquid Glass Orb beside the Pill Dock */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.88 }}
          onClick={() => setShowQuickMenu((prev) => !prev)}
          aria-label={showQuickMenu ? 'Close quick actions' : 'Open quick actions'}
          className="w-11 h-11 rounded-full liquid-glass-elevated flex items-center justify-center text-slate-800 dark:text-white shrink-0 relative z-40 cursor-pointer"
        >
          <motion.span
            animate={{ rotate: showQuickMenu ? 45 : 0 }}
            transition={{ type: 'spring', stiffness: 700, damping: 34 }}
            className="flex items-center justify-center"
          >
            <Plus className="w-5 h-5 stroke-[2.2]" />
          </motion.span>
        </motion.button>
      </div>

      {/* Quick Help Liquid Glass Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setShowHelp(false)}
            className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md liquid-glass-elevated rounded-[30px] p-6 space-y-4 text-slate-900 dark:text-white"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full liquid-glass-orb flex items-center justify-center text-sm">
                    ❓
                  </div>
                  <h3 className="font-bold text-sm">Automate AI Help & Docs</h3>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowHelp(false)}
                  className="w-8 h-8 rounded-full liquid-glass-orb flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="p-3.5 liquid-glass-subtle rounded-2xl">
                  <span className="font-bold text-slate-900 dark:text-white block mb-1.5">Shortcuts & Gestures</span>
                  <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    <div>⌘ + K: Quick Search</div>
                    <div>↵: Send Message</div>
                    <div>Slide Nav: Scrub Tabs</div>
                    <div>Esc: Close Modals</div>
                  </div>
                </div>

                <div className="p-3.5 liquid-glass-subtle rounded-2xl">
                  <span className="font-bold text-slate-900 dark:text-white block mb-1">Support & Documentation</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    Read documentation, submit feature requests, or talk to Automate team support.
                  </p>
                  <a
                    href="https://automate.ai"
                    target="_blank"
                    rel="noreferrer"
                    className="text-violet-600 dark:text-violet-300 font-semibold flex items-center gap-1 hover:underline text-[11px]"
                  >
                    <span>Visit automate.ai</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowHelp(false)}
                className="w-full py-2.5 liquid-glass-cta font-bold rounded-full text-xs cursor-pointer"
              >
                Got it
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
