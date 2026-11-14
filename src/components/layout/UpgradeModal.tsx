import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan?: (planName: string) => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan,
}) => {
  const [periodTab, setPeriodTab] = useState<'Monthly' | 'Annual' | 'Tally Special' | 'Top Up'>('Monthly');

  const features = [
    'Unlimited use of some models, even after your credits are exhausted',
    'Pay ₹1,061 and get benefits of ₹1,799 worth of credit',
    'Access for 1 month',
    'Documents, images, and file analysis',
    'Custom agents you can chat, embed, or schedule',
    'Voice and multimodal tools',
    'Use Gmail, Slack, and research from inside chat',
    '24/7 customer support',
  ];

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
            transition={{ type: 'spring', damping: 34, stiffness: 580, mass: 0.45 }}
            onClick={(e) => e.stopPropagation()}
            className="liquid-glass-elevated text-slate-900 dark:text-white rounded-[30px] max-w-lg w-full p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto"
          >
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full liquid-glass-orb flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </motion.button>

            <h2 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-4">
              Automate AI pricing
            </h2>

            {/* Exclusive Glass Card */}
            <div className="rounded-[24px] liquid-glass-card p-4 sm:p-5 border-violet-400/40 relative mb-4">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300">
                  Exclusive
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="liquid-glass-subtle text-violet-700 dark:text-violet-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    Most popular
                  </span>
                  <span className="bg-violet-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                    SAVE 41%
                  </span>
                </div>
              </div>

              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">
                Unlock every model
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                Pay ₹1,061 and get benefits of ₹1,799 worth of credit.
              </p>

              <div className="flex items-baseline gap-2 mb-4 tabular-nums">
                <span className="text-sm line-through text-slate-400">₹1,799</span>
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">₹1,061</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">/ 1 Month</span>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.01 }}
                onClick={() => {
                  onSelectPlan?.('Unlock Every Model');
                  onClose();
                }}
                className="w-full py-2.5 rounded-full text-xs font-bold liquid-glass-cta mb-5 cursor-pointer"
              >
                Subscribe now
              </motion.button>

              {/* Feature checklist */}
              <div className="border-t border-slate-900/10 dark:border-white/10 pt-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2.5">Everything unlocked:</h4>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  {features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full liquid-glass-orb flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-violet-600 dark:text-violet-300" />
                      </span>
                      <span className="leading-relaxed">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Period Selector Liquid Glass Pills */}
            <div className="flex items-center justify-center flex-wrap gap-1 p-1.5 liquid-glass-subtle rounded-2xl sm:rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300">
              {(['Monthly', 'Annual', 'Tally Special', 'Top Up'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPeriodTab(tab)}
                  className={`relative px-3.5 py-1.5 rounded-full transition-colors cursor-pointer ${
                    periodTab === tab
                      ? 'text-slate-900 dark:text-white font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {periodTab === tab && (
                    <motion.div
                      layoutId="upgrade-period-pill"
                      layout="position"
                      transition={{ type: 'spring', stiffness: 760, damping: 42, mass: 0.42 }}
                      className="absolute inset-0 rounded-full liquid-glass-droplet overflow-hidden"
                    >
                      <span className="absolute inset-x-2 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/55 to-transparent dark:from-white/25 pointer-events-none" />
                    </motion.div>
                  )}
                  <span className="relative z-10">{tab}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
