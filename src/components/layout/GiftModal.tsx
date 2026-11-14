import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gift, Copy, Check, Users, Sparkles, Award } from 'lucide-react';

interface GiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralCode?: string;
  credits?: number;
}

export const GiftModal: React.FC<GiftModalProps> = ({
  isOpen,
  onClose,
  referralCode = 'AUTOMATE-FAQ-9281',
  credits = 80,
}) => {
  const [copied, setCopied] = useState(false);

  const referralUrl = `https://app.automate.ai/join?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
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

            <div className="text-center mb-6">
              <div className="w-12 h-12 liquid-glass-orb text-violet-600 dark:text-violet-300 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Gift className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Invite Colleagues & Earn Credits
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                Give $20 to friends for their Automate AI workspace, and get $20 in computation credits for every teammate who signs up.
              </p>
            </div>

            {/* Current Balance */}
            <div className="liquid-glass-card rounded-2xl p-4 flex items-center justify-between gap-2 mb-6">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl liquid-glass-cta flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-violet-600 dark:text-violet-300 font-semibold uppercase tracking-wider">
                    Available Credits
                  </p>
                  <p className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">${credits}.00 USD</p>
                </div>
              </div>
              <span className="text-xs liquid-glass-subtle text-violet-700 dark:text-violet-200 px-3 py-1 rounded-full font-semibold shrink-0">
                Auto-Applied
              </span>
            </div>

            {/* Referral Link Box */}
            <div className="space-y-1.5 mb-6">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Your Personal Referral Link
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralUrl}
                  className="flex-1 min-w-0 liquid-glass-input text-slate-700 dark:text-slate-200 text-xs rounded-2xl px-3.5 py-2.5 font-mono focus:outline-none select-all"
                />
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-1.5 liquid-glass-cta px-4 py-2.5 rounded-full text-xs font-semibold shrink-0 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Link</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            {/* Perks list */}
            <div className="space-y-2 border-t border-slate-900/10 dark:border-white/10 pt-4 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-300 shrink-0" />
                <span>Credits apply automatically to frontier model inference & workflows</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-300 shrink-0" />
                <span>No limit on successful referral rewards</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
