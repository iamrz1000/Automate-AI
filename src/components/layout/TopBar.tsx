import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PanelLeft,
  Sparkles,
  Crown,
  Search,
  WifiOff,
  CloudOff,
  CheckCircle2,
  RefreshCw,
  X,
} from 'lucide-react';
import { ModelInfo, UserProfile } from '../../types';
import { LiquidThemeSwitch } from '../common/LiquidGlassPrimitives';

interface TopBarProps {
  onToggleSidebar?: () => void;
  onOpenUpgrade: () => void;
  onOpenGift: () => void;
  onOpenSearch?: () => void;
  isSearchOpen?: boolean;
  selectedModel: ModelInfo;
  onSelectModelClick?: () => void;
  sidebarOpen?: boolean;
  theme?: 'light' | 'system' | 'dark';
  onToggleTheme?: () => void;
  currentUser?: UserProfile;
  onNavigateToAdmin?: () => void;
  isOffline?: boolean;
  onRecheckConnection?: () => Promise<boolean> | void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleSidebar,
  onOpenUpgrade,
  onOpenGift,
  onOpenSearch,
  isSearchOpen = false,
  theme = 'dark',
  onToggleTheme,
  currentUser,
  onNavigateToAdmin,
  isOffline = false,
  onRecheckConnection,
}) => {
  const [showOfflineDetails, setShowOfflineDetails] = useState(false);
  const [isRechecking, setIsRechecking] = useState(false);

  useEffect(() => {
    if (!isOffline) {
      setShowOfflineDetails(false);
      setIsRechecking(false);
    }
  }, [isOffline]);

  const handleRetryConnection = async () => {
    if (isRechecking) return;
    setIsRechecking(true);
    try {
      await onRecheckConnection?.();
    } finally {
      setTimeout(() => setIsRechecking(false), 350);
    }
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.isAdmin;
  const messagesUsed = currentUser?.messagesToday || 0;
  const dailyLimit = currentUser?.dailyLimit ?? 15;

  return (
    <>
      <header className="h-[48px] sm:h-[52px] mx-2 mt-1.5 md:mx-0 md:mt-0 rounded-[20px] md:rounded-none liquid-glass md:border-0 md:border-b md:border-slate-900/10 md:dark:border-white/10 md:bg-white/35 md:dark:bg-white/[0.04] md:shadow-none px-2 sm:px-4 flex items-center justify-between gap-1 sm:gap-2 sticky top-1.5 md:top-0 z-20 pointer-events-auto transition-colors overflow-hidden shrink-0 max-w-[calc(100%-16px)] md:max-w-none">
        {/* Left: Sidebar toggle orb + Automate AI Brand Logo */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-1 min-w-0">
          {onToggleSidebar && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={onToggleSidebar}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full liquid-glass-orb text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Toggle Sidebar"
            >
              <PanelLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </motion.button>
          )}

          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg overflow-hidden shadow-xs shrink-0">
              <img
                src="/assets/aistudio/Gemini_Generated_Image_ee5hycee5hycee5h_050d414c.png"
                alt="Automate AI"
                className="w-full h-full object-cover scale-[1.55]"
              />
            </div>
            <span className="font-bold text-xs sm:text-sm tracking-tight text-slate-900 dark:text-white whitespace-nowrap truncate">
              Automate <span className="text-violet-600 dark:text-violet-300">AI</span>
            </span>
          </div>
        </div>

        {/* Center: Morphing Liquid Search Pill + Offline Mode + Admin/Quota + Crystal Upgrade CTA */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {onOpenSearch && !isSearchOpen && (
            <motion.button
              layoutId="liquid-search-morph"
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenSearch}
              className="hidden lg:flex h-8 px-3 rounded-full liquid-glass-orb items-center gap-2 text-xs text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              title="Quick Search (⌘K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300 shrink-0" />
              <span className="text-[11px] font-medium">Search...</span>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400 ml-1">⌘K</span>
            </motion.button>
          )}

          <AnimatePresence>
            {isOffline && (
              <motion.button
                key="offline-mode-indicator"
                type="button"
                data-testid="offline-mode-indicator"
                initial={{ opacity: 0, scale: 0.9, y: -2 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -2 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setShowOfflineDetails((prev) => !prev)}
                aria-expanded={showOfflineDetails}
                aria-label="Offline mode active — click to view cloud feature availability"
                title="Offline mode: Cloud AI & Firestore sync paused"
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full liquid-glass-subtle border border-amber-400/40 bg-amber-500/10 text-amber-800 dark:text-amber-200 text-[10px] sm:text-[11px] font-semibold cursor-pointer shrink-0 hover:border-amber-400/65 transition-colors"
              >
                <WifiOff className="w-3 h-3 text-amber-600 dark:text-amber-300 shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">Offline</span>
              </motion.button>
            )}
          </AnimatePresence>

          {isAdmin ? (
            <motion.button
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: 1.03 }}
              onClick={onNavigateToAdmin}
              className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-400/40 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.45)] transition-colors duration-150 cursor-pointer shrink-0"
              title="Open Admin Governance Center"
            >
              <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 dark:text-amber-300 fill-amber-400 shrink-0" />
              <span className="hidden sm:inline">Admin Center</span>
              <span className="sm:hidden text-[10px]">Admin</span>
              <span className="hidden md:inline text-[10px] bg-amber-500/20 px-1.5 py-0.2 rounded-full font-mono font-normal tabular-nums">
                &infin;
              </span>
            </motion.button>
          ) : (
            <div className="flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium liquid-glass-orb text-slate-700 dark:text-slate-200 shrink-0">
              <span className="hidden sm:inline text-[11px] text-slate-500 dark:text-slate-400">Daily:</span>
              <span className="font-bold text-violet-700 dark:text-violet-300 font-mono tabular-nums text-[10px] sm:text-xs">
                {messagesUsed}/{dailyLimit}
              </span>
              <span className="hidden sm:inline text-[10px] text-slate-500 dark:text-slate-400">msgs</span>
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.03 }}
            onClick={onOpenUpgrade}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-xs font-semibold liquid-glass-cta cursor-pointer shrink-0"
          >
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-violet-200 shrink-0" />
            <span className="hidden sm:inline">Upgrade</span>
            <span className="sm:hidden text-[10px]">Pro</span>
          </motion.button>
        </div>

        {/* Right: Liquid Glass Theme Switch (Full Sliding Pill on sm+, Compact Orb on xs) + Gift */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {onOpenSearch && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={onOpenSearch}
              className="lg:hidden w-7 h-7 sm:w-8 sm:h-8 rounded-full liquid-glass-orb text-slate-600 dark:text-slate-200 flex items-center justify-center shrink-0 cursor-pointer"
              title="Search (⌘K)"
            >
              <Search className="w-3.5 h-3.5" />
            </motion.button>
          )}

          {onToggleTheme && (
            <>
              <div className="hidden sm:block">
                <LiquidThemeSwitch theme={theme} onToggle={onToggleTheme} />
              </div>
              <div className="sm:hidden">
                <LiquidThemeSwitch theme={theme} onToggle={onToggleTheme} compact />
              </div>
            </>
          )}

          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.06 }}
            onClick={onOpenGift}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full liquid-glass-orb flex items-center justify-center text-[11px] sm:text-sm transition-transform shrink-0 cursor-pointer"
            title="Referral & Rewards"
          >
            <span>🎁</span>
          </motion.button>
        </div>
      </header>

      {/* Transparent Offline-Mode Details Popover */}
      <AnimatePresence>
        {isOffline && showOfflineDetails && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowOfflineDetails(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 580, damping: 36, mass: 0.45 }}
              className="fixed top-[58px] sm:top-[64px] right-3 sm:right-6 z-50 w-[min(340px,calc(100vw-24px))] rounded-[24px] liquid-glass-elevated p-4 text-xs text-slate-900 dark:text-white space-y-3"
            >
              <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-900/10 dark:border-white/10">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-400/35 flex items-center justify-center text-amber-600 dark:text-amber-300 shrink-0">
                    <WifiOff className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 dark:text-white">Offline Mode Active</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Waiting for network connection
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOfflineDetails(false)}
                  className="w-6 h-6 rounded-full liquid-glass-orb flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 rounded-2xl liquid-glass-subtle space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-200 text-[11px]">
                    <CloudOff className="w-3.5 h-3.5 shrink-0" />
                    <span>Paused Until Reconnected</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Live AI model streaming, Gemini Live Voice & Vision, image generation, and cloud Firestore profile syncing require internet access.
                  </p>
                </div>

                <div className="p-2.5 rounded-2xl liquid-glass-subtle space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Available Offline</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Review active chats, draft prompts locally, and browse model specs. Sync resumes automatically once online.
                  </p>
                </div>
              </div>

              {onRecheckConnection && (
                <button
                  type="button"
                  onClick={handleRetryConnection}
                  disabled={isRechecking}
                  className="w-full py-2 px-3 rounded-full liquid-glass-orb text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRechecking ? 'animate-spin' : ''}`} />
                  <span>{isRechecking ? 'Checking connection...' : 'Retry Connection'}</span>
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
