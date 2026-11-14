import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bot, Wrench } from 'lucide-react';
import { Agent, ModelInfo } from '../../types';

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAgent: (agent: Partial<Agent>) => void;
  availableModels: ModelInfo[];
}

export const CreateAgentModal: React.FC<CreateAgentModalProps> = ({
  isOpen,
  onClose,
  onCreateAgent,
  availableModels,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Productivity');
  const [model, setModel] = useState(availableModels[0]?.id || 'automate-x1');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [tools, setTools] = useState<string[]>(['Web Search']);

  const categories = [
    'Productivity',
    'Coding & Dev',
    'Research & Data',
    'Creative & Design',
    'Marketing',
    'Finance & Legal',
  ];

  const availableToolsList = [
    'Web Search',
    'Code Execution',
    'File Reader',
    'Data Analyzer',
    'API Connector',
    'Terminal Emulator',
  ];

  const toggleTool = (tool: string) => {
    setTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    onCreateAgent({
      name,
      description,
      category,
      model,
      systemPrompt:
        systemPrompt.trim() ||
        `You are ${name}, a dedicated AI agent specialized in ${category}.`,
      tools,
      badge: 'CUSTOM',
      creator: 'You',
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
                <Bot className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold truncate">Create New AI Agent</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Configure persona, foundation model, and tool access</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  Agent Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Security Auditor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs liquid-glass-input rounded-2xl text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  Short Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Audits smart contracts and detects vulnerabilities..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs liquid-glass-input rounded-2xl text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs liquid-glass-input rounded-2xl text-slate-900 dark:text-white focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c} className="bg-white dark:bg-[#181826]">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Foundation Model
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
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

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  System Instructions & Persona
                </label>
                <textarea
                  rows={3}
                  placeholder="Define rules, tone of voice, output format, and operational guardrails..."
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs liquid-glass-input rounded-2xl text-slate-900 dark:text-white focus:outline-none leading-relaxed resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                  <span>Enabled Tools & Integrations</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableToolsList.map((tool) => {
                    const active = tools.includes(tool);
                    return (
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        key={tool}
                        onClick={() => toggleTool(tool)}
                        className={`px-3 py-2 rounded-2xl text-xs font-medium text-left transition-all cursor-pointer ${
                          active
                            ? 'liquid-glass-droplet text-violet-700 dark:text-white font-semibold'
                            : 'liquid-glass-subtle text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {tool}
                      </motion.button>
                    );
                  })}
                </div>
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
                  Create Agent
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
