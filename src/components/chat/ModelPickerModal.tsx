import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Plus, Compass, Lock } from 'lucide-react';
import { ModelInfo } from '../../types';
import { ALL_AGENTS, AgentItem } from '../../data/agentsData';
import { MODELS_CATALOG } from '../../data/models';

interface ModelPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: ModelInfo;
  onSelectModel: (model: ModelInfo) => void;
  onNavigateToModels: () => void;
  onNavigateToAgents: () => void;
  onOpenUpgrade: () => void;
}

export const ModelPickerModal: React.FC<ModelPickerModalProps> = ({
  isOpen,
  onClose,
  selectedModel: _selectedModel,
  onSelectModel,
  onNavigateToModels,
  onNavigateToAgents,
  onOpenUpgrade,
}) => {
  const [search, setSearch] = useState('');

  const filtered = ALL_AGENTS.filter((agent) =>
    agent.name.toLowerCase().includes(search.toLowerCase()) ||
    agent.provider.toLowerCase().includes(search.toLowerCase()) ||
    agent.category.toLowerCase().includes(search.toLowerCase())
  );

  const renderIcon = (type: AgentItem['logoType']) => {
    switch (type) {
      case 'automate':
        return (
          <div className="w-6 h-6 rounded-md flex items-center justify-center p-0.5">
            <img
              src="/assets/aistudio/automate_ai_logo_transparent.png"
              alt="Automate"
              className="w-5 h-5 object-contain"
            />
          </div>
        );
      case 'inception':
        return (
          <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-300">
            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none stroke-2">
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
          </div>
        );
      case 'google':
        return (
          <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
            </svg>
          </div>
        );
      case 'anthropic':
        return (
          <div className="w-6 h-6 rounded-md bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
              <path d="M12 2L14 8L20 9L15 13L17 19L12 15L7 19L9 13L4 9L10 8L12 2Z" />
            </svg>
          </div>
        );
      case 'mistral':
        return (
          <div className="w-6 h-6 rounded-md bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 font-extrabold text-[10px]">
            M
          </div>
        );
      case 'moonshot':
        return (
          <div className="w-6 h-6 rounded-md bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 font-extrabold text-[10px]">
            K
          </div>
        );
      case 'zhipu':
        return (
          <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 font-extrabold text-[10px]">
            Z
          </div>
        );
      case 'nvidia':
        return (
          <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 font-bold text-[9px]">
            NV
          </div>
        );
      case 'openai':
      default:
        return (
          <div className="w-6 h-6 rounded-md bg-gray-200 dark:bg-white/10 flex items-center justify-center text-gray-800 dark:text-gray-200">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
              <path d="M22.28 10.37a5.45 5.45 0 0 0-.44-4.25 5.56 5.56 0 0 0-4.08-2.77 5.6 5.6 0 0 0-4.6 1.05A5.5 5.5 0 0 0 9.2 3.12a5.55 5.55 0 0 0-4.32 2.4 5.5 5.5 0 0 0-.82 4.2 5.54 5.54 0 0 0-2.4 4.3 5.52 5.52 0 0 0 1.63 4.25 5.57 5.57 0 0 0 4.1 1.65c.16 0 .32 0 .48-.02a5.52 5.52 0 0 0 3.96 1.98c1.6 0 3.06-.68 4.1-1.78a5.5 5.5 0 0 0 4.34-2.4 5.5 5.5 0 0 0 .8-4.22 5.52 5.52 0 0 0 2.4-4.32c0-.52-.07-1.03-.2-1.52zM12 13.88l-2.6-1.5 2.6-1.5 2.6 1.5-2.6 1.5z" />
            </svg>
          </div>
        );
    }
  };

  const handleSelect = (agent: AgentItem) => {
    if (agent.isIncluded) {
      const catalogMatch = MODELS_CATALOG.find((m) => m.id === agent.id);
      if (catalogMatch) {
        onSelectModel(catalogMatch);
      } else {
        const isFreeGoogle = agent.logoType === 'google' || agent.logoType === 'automate';
        onSelectModel({
          id: agent.id,
          name: agent.name,
          provider: agent.provider,
          providerId: (agent.logoType === 'automate' ? 'automate' : agent.logoType === 'google' ? 'google' : 'openai') as any,
          description: agent.description,
          pricing: isFreeGoogle ? { inputPer1M: '$0.00', outputPer1M: '$0.00' } : { inputPer1M: '$0.075', outputPer1M: '$0.30' },
          contextWindow: '1M Tokens',
          maxOutput: '16,384 Tokens',
          inputModalities: ['text', 'image'],
          capabilities: ['reasoning', 'code', 'tool_calling'],
          benchmarkScore: 94.5,
          latency: '140ms',
        });
      }
      onClose();
    } else {
      onOpenUpgrade();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-md select-none"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
            onClick={(e) => e.stopPropagation()}
            className="liquid-glass-elevated text-slate-900 dark:text-white rounded-[30px] max-w-2xl w-full p-4 sm:p-5 relative max-h-[86vh] flex flex-col transition-colors"
          >
            {/* Top Header */}
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-900/10 dark:border-white/10 gap-2.5">
              <div className="relative flex-1 min-w-[160px] sm:max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search models..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs liquid-glass-input rounded-full text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    onClose();
                    onNavigateToModels();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 liquid-glass-orb rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Explore</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    onClose();
                    onNavigateToAgents();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 liquid-glass-orb rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span className="hidden sm:inline">Create agent</span>
                  <span className="sm:hidden">Agent</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-8 h-8 rounded-full liquid-glass-orb flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Upgrade Plan Alert Banner */}
            <div className="my-3 p-3 rounded-2xl liquid-glass-subtle flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="pr-2 min-w-0">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Needs a higher plan: <span className="text-slate-500 dark:text-slate-400 font-normal">GPT 6.1 Sol, GPT 6.1 Terra, GPT 6 Astra...</span>
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onClose();
                  onOpenUpgrade();
                }}
                className="text-violet-600 dark:text-violet-300 font-semibold hover:underline shrink-0 cursor-pointer"
              >
                View all plans
              </motion.button>
            </div>

            {/* Favorites Section */}
            <div className="mb-2">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                FAVORITES
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  ALL_AGENTS.find((a) => a.id === 'automate-x1'),
                  ALL_AGENTS.find((a) => a.id === 'gemini-4-hydrogen'),
                  ALL_AGENTS.find((a) => a.id === 'gpt-6.1-terra'),
                  ALL_AGENTS.find((a) => a.id === 'claude-sonnet-4.5'),
                ]
                  .filter((x): x is AgentItem => Boolean(x))
                  .map((fav) => (
                    <motion.div
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      key={fav.id}
                      onClick={() => handleSelect(fav)}
                      className="p-2.5 rounded-2xl liquid-glass-card flex items-center justify-between cursor-pointer gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {renderIcon(fav.logoType)}
                        <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">{fav.name}</span>
                      </div>
                      {fav.isIncluded ? (
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-400/35 px-2 py-0.5 rounded-full shrink-0">
                          INCLUDED
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-400/35 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                          <Lock className="w-2.5 h-2.5" />
                          <span>UPGRADE</span>
                        </span>
                      )}
                    </motion.div>
                  ))}
              </div>
            </div>

            {/* All Agents List */}
            <div className="flex-1 overflow-y-auto pr-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                ALL AGENTS ({filtered.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filtered.map((agent) => (
                  <motion.div
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    key={agent.id}
                    onClick={() => handleSelect(agent)}
                    className="p-2.5 rounded-2xl liquid-glass-card flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {renderIcon(agent.logoType)}
                      <span className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate">
                        {agent.name}
                      </span>
                    </div>

                    {agent.isIncluded ? (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-400/35 px-2 py-0.5 rounded-full shrink-0">
                        INCLUDED
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-400/35 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                        <Lock className="w-2.5 h-2.5" />
                        <span>UPGRADE</span>
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
