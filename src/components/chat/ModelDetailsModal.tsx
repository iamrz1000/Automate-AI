import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Cpu, Zap, Layers, DollarSign, CheckCircle2, ShieldCheck, Globe } from 'lucide-react';
import { ModelInfo } from '../../types';

interface ModelDetailsModalProps {
  model: ModelInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectForChat?: (model: ModelInfo) => void;
}

export const ModelDetailsModal: React.FC<ModelDetailsModalProps> = ({
  model,
  isOpen,
  onClose,
  onSelectForChat,
}) => {
  return (
    <AnimatePresence>
      {isOpen && model && (
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
            className="liquid-glass-elevated text-slate-900 dark:text-white rounded-[30px] max-w-xl w-full p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto"
          >
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full liquid-glass-orb flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </motion.button>

            {/* Header */}
            <div className="flex items-center gap-3.5 mb-5 pr-8">
              <div className="w-12 h-12 rounded-2xl liquid-glass-orb flex items-center justify-center text-violet-600 dark:text-violet-300 shrink-0">
                <Cpu className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold truncate">{model.name}</h2>
                  {model.badge && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full liquid-glass-droplet text-violet-700 dark:text-violet-200 uppercase">
                      {model.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Provider: {model.provider} &bull; 250.1K 👍</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-5 leading-relaxed liquid-glass-subtle p-3.5 rounded-2xl">
              {model.description}
            </p>

            {/* Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5 tabular-nums">
              <div className="p-3 liquid-glass-card rounded-2xl">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  <Layers className="w-3.5 h-3.5 text-violet-500" />
                  <span>Context</span>
                </div>
                <p className="text-xs font-bold">{model.contextWindow}</p>
              </div>

              <div className="p-3 liquid-glass-card rounded-2xl">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Latency</span>
                </div>
                <p className="text-xs font-bold">{model.latency}</p>
              </div>

              <div className="p-3 liquid-glass-card rounded-2xl">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Input</span>
                </div>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{model.pricing.inputPer1M} / 1M</p>
              </div>

              <div className="p-3 liquid-glass-card rounded-2xl">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-sky-500" />
                  <span>Output</span>
                </div>
                <p className="text-xs font-bold">{model.pricing.outputPer1M} / 1M</p>
              </div>
            </div>

            {/* Modalities & Capabilities */}
            <div className="space-y-3 mb-6 text-xs">
              <div>
                <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider block mb-1.5">
                  Input Modalities
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {model.inputModalities.map((m) => (
                    <span
                      key={m}
                      className="px-2.5 py-1 rounded-full liquid-glass-orb text-slate-700 dark:text-slate-200 font-medium capitalize"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider block mb-1.5">
                  Engine Capabilities
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {model.capabilities.map((c) => (
                    <span
                      key={c}
                      className="px-2.5 py-1 rounded-full liquid-glass-droplet text-violet-700 dark:text-violet-200 font-medium capitalize flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-violet-600 dark:text-violet-300" />
                      {c.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider block mb-1.5">
                  Hosted Regions
                </span>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-[11px]">US East (N. Virginia), US West (Oregon), Europe West (Frankfurt)</span>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-900/10 dark:border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Active & Operational</span>
              </div>

              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={onClose}
                  className="px-4 py-2 rounded-full text-xs font-semibold liquid-glass-orb text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Close
                </motion.button>
                {onSelectForChat && (
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      onSelectForChat(model);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-full text-xs font-semibold liquid-glass-cta cursor-pointer"
                  >
                    Use in Chat
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
