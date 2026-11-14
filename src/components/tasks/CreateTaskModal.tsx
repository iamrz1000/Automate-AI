import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, ShieldAlert } from 'lucide-react';
import { ScheduledTask, ModelInfo, Agent } from '../../types';
import { LiquidGlassSwitch } from '../common/LiquidGlassPrimitives';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (task: Partial<ScheduledTask>) => void;
  availableModels: ModelInfo[];
  availableAgents: Agent[];
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onCreateTask,
  availableModels,
  availableAgents,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAgent, setTargetAgent] = useState(
    availableAgents[0]?.name || 'Deep Research Synthesizer'
  );
  const [targetModel, setTargetModel] = useState(availableModels[0]?.id || 'automate-x1');
  const [frequency, setFrequency] = useState('Daily');
  const [time, setTime] = useState('09:00');
  const [timezone, setTimezone] = useState('UTC');
  const [requiresApproval, setRequiresApproval] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateTask({
      name,
      description: description.trim() || 'Automated background execution pipeline.',
      targetModel,
      targetAgent,
      frequency,
      schedule: `${frequency} at ${time} ${timezone}`,
      timezone,
      requiresApproval,
      status: 'Active',
      lastRun: 'Pending initial run',
      nextRun: `Tomorrow at ${time} ${timezone}`,
      runsCount: 0,
    });

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/45 backdrop-blur-md select-none"
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
              className="absolute top-4 right-4 w-8 h-8 rounded-full liquid-glass-orb text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </motion.button>

            <div className="flex items-center gap-3.5 mb-5 pr-10">
              <div className="w-12 h-12 rounded-[18px] liquid-glass-orb text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold truncate">Schedule New Task</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Configure recurring agent workflows and automated triggers</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  Task Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily Competitive Intelligence Digest"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs liquid-glass-input rounded-2xl text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  Task Instructions & Description
                </label>
                <textarea
                  rows={2}
                  placeholder="What should this task execute every cycle?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs liquid-glass-input rounded-2xl text-slate-900 dark:text-white focus:outline-none leading-relaxed resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Target Agent
                  </label>
                  <select
                    value={targetAgent}
                    onChange={(e) => setTargetAgent(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs liquid-glass-input rounded-2xl text-slate-900 dark:text-white focus:outline-none"
                  >
                    {availableAgents.map((a) => (
                      <option key={a.id} value={a.name} className="bg-white dark:bg-[#181826]">
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Foundation Model
                  </label>
                  <select
                    value={targetModel}
                    onChange={(e) => setTargetModel(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs liquid-glass-input rounded-2xl text-slate-900 dark:text-white focus:outline-none font-mono"
                  >
                    {availableModels.map((m) => (
                      <option key={m.id} value={m.id} className="bg-white dark:bg-[#181826]">
                        {m.name} ({m.provider})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Cadence
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs liquid-glass-input rounded-2xl text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Hourly" className="bg-white dark:bg-[#181826]">Hourly</option>
                    <option value="Daily" className="bg-white dark:bg-[#181826]">Daily</option>
                    <option value="Weekly" className="bg-white dark:bg-[#181826]">Weekly</option>
                    <option value="Bi-Weekly" className="bg-white dark:bg-[#181826]">Bi-Weekly</option>
                    <option value="Monthly" className="bg-white dark:bg-[#181826]">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Run Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs liquid-glass-input rounded-2xl text-slate-900 dark:text-white focus:outline-none tabular-nums"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs liquid-glass-input rounded-2xl text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="UTC" className="bg-white dark:bg-[#181826]">UTC</option>
                    <option value="America/New_York" className="bg-white dark:bg-[#181826]">US Eastern</option>
                    <option value="America/Los_Angeles" className="bg-white dark:bg-[#181826]">US Pacific</option>
                    <option value="Europe/London" className="bg-white dark:bg-[#181826]">London (GMT)</option>
                    <option value="Asia/Tokyo" className="bg-white dark:bg-[#181826]">Tokyo (JST)</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 liquid-glass-subtle rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <ShieldAlert className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                      Require Human Approval
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Holds external tool dispatches until manually approved
                    </p>
                  </div>
                </div>
                <LiquidGlassSwitch
                  checked={requiresApproval}
                  onChange={setRequiresApproval}
                  accent="emerald"
                  size="sm"
                  ariaLabel="Require Human Approval"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200/60 dark:border-white/10">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold liquid-glass-orb rounded-full text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold liquid-glass-cta rounded-full cursor-pointer"
                >
                  Create Task
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
