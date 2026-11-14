import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  X,
  Plus,
  Sparkles,
  Bot,
  Radio,
  Cpu,
  MessageSquare,
  ArrowUpRight,
  Compass,
} from 'lucide-react';
import { ModelInfo, Agent, LibraryAsset, NavTab } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

interface LiquidSearchOverlayProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  models: ModelInfo[];
  agents: Agent[];
  libraryAssets: LibraryAsset[];
  onSelectModel: (model: ModelInfo) => void;
  onSelectAgent: (agent: Agent) => void;
  onNavigateTab: (tab: NavTab) => void;
  onQuickPrompt: (prompt: string) => void;
  onOpenLiveVoice: () => void;
  renderTrigger?: boolean;
}

export const LiquidSearchOverlay: React.FC<LiquidSearchOverlayProps> = ({
  isOpen,
  onOpen,
  onClose,
  models,
  agents,
  libraryAssets,
  onSelectModel,
  onSelectAgent,
  onNavigateTab,
  onQuickPrompt,
  onOpenLiveVoice,
  renderTrigger = true,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        triggerHaptic('selection');
        if (isOpen) onClose();
        else onOpen();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const normalizedQuery = query.trim().toLowerCase();

  const quickActions = [
    {
      id: 'qa-new-chat',
      label: 'Start a fresh AI conversation',
      sublabel: 'Open a clean Automate-X1 workspace',
      icon: MessageSquare,
      onClick: () => {
        onNavigateTab('chat');
        onClose();
      },
    },
    {
      id: 'qa-voice',
      label: 'Launch Circular Voice & Vision Orb',
      sublabel: 'Real-time speech and live camera vision',
      icon: Radio,
      onClick: () => {
        onClose();
        onOpenLiveVoice();
      },
    },
    {
      id: 'qa-image',
      label: 'Generate studio visual art',
      sublabel: 'Pre-fill /image studio prompt in chat',
      icon: Sparkles,
      onClick: () => {
        onQuickPrompt('/image Cinematic sunlit architectural courtyard with water reflections, 8K');
        onClose();
      },
    },
  ].filter(
    (item) =>
      !normalizedQuery ||
      item.label.toLowerCase().includes(normalizedQuery) ||
      item.sublabel.toLowerCase().includes(normalizedQuery)
  );

  const matchedModels = models
    .filter(
      (m) =>
        !normalizedQuery ||
        m.name.toLowerCase().includes(normalizedQuery) ||
        m.provider.toLowerCase().includes(normalizedQuery) ||
        m.description.toLowerCase().includes(normalizedQuery)
    )
    .slice(0, 4);

  const matchedAgents = agents
    .filter(
      (a) =>
        !normalizedQuery ||
        a.name.toLowerCase().includes(normalizedQuery) ||
        a.category.toLowerCase().includes(normalizedQuery)
    )
    .slice(0, 4);

  const matchedAssets = libraryAssets
    .filter(
      (a) =>
        !normalizedQuery ||
        a.title.toLowerCase().includes(normalizedQuery) ||
        a.category.toLowerCase().includes(normalizedQuery)
    )
    .slice(0, 2);

  return (
    <>
      {/* Morphing Search Pill Trigger */}
      {renderTrigger && !isOpen && (
        <motion.button
          layoutId="liquid-search-morph"
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            triggerHaptic('selection');
            onOpen();
          }}
          className="h-8 px-3 rounded-full liquid-glass-orb flex items-center gap-2 text-xs text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white cursor-pointer max-w-[160px] sm:max-w-[230px]"
          title="Quick Search (⌘K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300 shrink-0" />
          <span className="truncate text-[11px] font-medium">Search...</span>
          <span className="hidden md:inline-block text-[10px] font-mono text-slate-400 dark:text-slate-400 ml-1 shrink-0">
            ⌘K
          </span>
        </motion.button>
      )}

      {/* Expanded Liquid Glass Search Sheet */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xl flex items-start sm:items-center justify-center p-3 sm:p-6 pt-12 sm:pt-6"
          >
            <motion.div
              layoutId="liquid-search-morph"
              initial={{ opacity: 0, scale: 0.94, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -6 }}
              transition={{ type: 'spring', stiffness: 660, damping: 38, mass: 0.45 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl liquid-glass-elevated rounded-[32px] p-4 sm:p-5 text-slate-900 dark:text-white overflow-hidden max-h-[82vh] flex flex-col gap-4"
            >
              {/* Top Search Pill + Glass Close Orb */}
              <div className="flex items-center gap-2.5">
                <div className="flex-1 flex items-center gap-2.5 px-4 py-2.5 rounded-full liquid-glass-input">
                  <Search className="w-4 h-4 text-slate-500 dark:text-slate-300 shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search chats, models, agents, library..."
                    className="w-full bg-transparent border-0 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-10 h-10 rounded-full liquid-glass-orb flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white shrink-0 cursor-pointer"
                  aria-label="Close search"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Scrollable Results Area */}
              <div className="overflow-y-auto space-y-4 pr-0.5 scrollbar-none">
                {/* Start Here Quick Suggestions (like Video 6) */}
                {quickActions.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
                      Start here
                    </div>
                    <div className="space-y-1.5">
                      {quickActions.map((item) => {
                        const Icon = item.icon;
                        return (
                          <motion.button
                            key={item.id}
                            type="button"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={item.onClick}
                            className="w-full flex items-center justify-between gap-3 p-2.5 rounded-2xl hover:bg-white/55 dark:hover:bg-white/10 transition-colors text-left cursor-pointer group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl liquid-glass-orb flex items-center justify-center text-violet-600 dark:text-violet-300 shrink-0">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                                  {item.label}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  {item.sublabel}
                                </div>
                              </div>
                            </div>
                            <span className="w-8 h-8 rounded-full liquid-glass-orb flex items-center justify-center text-slate-500 group-hover:text-violet-600 dark:text-slate-300 dark:group-hover:text-white shrink-0">
                              <Plus className="w-4 h-4" />
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Visual Cards Grid: Models & Agents (like "Recently Explored" in Video 6) */}
                {(matchedModels.length > 0 || matchedAgents.length > 0) && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
                      {normalizedQuery ? 'Matching Models & Agents' : 'Recently Explored'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {matchedModels.slice(0, 2).map((model) => (
                        <motion.button
                          key={model.id}
                          type="button"
                          whileHover={{ y: -2, scale: 1.01 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            onSelectModel(model);
                            onNavigateTab('chat');
                            onClose();
                          }}
                          className="p-3.5 rounded-[22px] liquid-glass-card text-left flex flex-col justify-between gap-2.5 cursor-pointer group"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="w-8 h-8 rounded-xl liquid-glass-orb flex items-center justify-center text-violet-600 dark:text-violet-300">
                              <Cpu className="w-4 h-4" />
                            </span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors" />
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              {model.provider}
                            </div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {model.name}
                            </div>
                          </div>
                        </motion.button>
                      ))}

                      {matchedAgents.slice(0, 2).map((agent) => (
                        <motion.button
                          key={agent.id}
                          type="button"
                          whileHover={{ y: -2, scale: 1.01 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            onSelectAgent(agent);
                            onClose();
                          }}
                          className="p-3.5 rounded-[22px] liquid-glass-card text-left flex flex-col justify-between gap-2.5 cursor-pointer group"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="w-8 h-8 rounded-xl liquid-glass-orb flex items-center justify-center text-emerald-600 dark:text-emerald-300">
                              <Bot className="w-4 h-4" />
                            </span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors" />
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              {agent.category}
                            </div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {agent.name}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Library Assets */}
                {matchedAssets.length > 0 && normalizedQuery && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
                      Library Assets
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {matchedAssets.map((asset) => (
                        <motion.button
                          key={asset.id}
                          type="button"
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            onNavigateTab('library');
                            onClose();
                          }}
                          className="p-3 rounded-2xl liquid-glass-subtle flex items-center gap-3 text-left cursor-pointer hover:bg-white/50 dark:hover:bg-white/10"
                        >
                          <Compass className="w-4 h-4 text-sky-500 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate">{asset.title}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              {asset.category}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {normalizedQuery &&
                  quickActions.length === 0 &&
                  matchedModels.length === 0 &&
                  matchedAgents.length === 0 &&
                  matchedAssets.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                      No matching models, agents, or shortcuts found for “{query}”.
                    </div>
                  )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
