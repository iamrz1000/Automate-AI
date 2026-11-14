import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Plus, ChevronRight, ArrowRight, Bot, Sparkles } from 'lucide-react';
import { Agent, ModelInfo } from '../../types';
import { ALL_AGENTS, AgentItem } from '../../data/agentsData';
import { CreateAgentModal } from './CreateAgentModal';

interface AgentsViewProps {
  agents: Agent[];
  onCreateAgent: (agent: Partial<Agent>) => void;
  onSelectAgentForChat: (agent: Agent) => void;
  availableModels: ModelInfo[];
}

export const AgentsView: React.FC<AgentsViewProps> = ({
  agents,
  onCreateAgent,
  onSelectAgentForChat,
  availableModels,
}) => {
  const [activeTab, setActiveTab] = useState<'explore' | 'my-agents' | 'shared'>('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const categories = [
    'All',
    'Coding',
    'ImageAgents',
    'VideoAgents',
    'Assistant',
    'Education',
    'Developer',
    'Vision',
    'Marketing',
  ];

  const filteredAgents = ALL_AGENTS.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || agent.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderLogo = (type: AgentItem['logoType']) => {
    switch (type) {
      case 'automate':
        return (
          <div className="w-11 h-11 rounded-[16px] liquid-glass-orb flex items-center justify-center p-1.5">
            <img
              src="/assets/aistudio/automate_ai_logo_transparent.png"
              alt="Automate"
              className="w-full h-full object-contain"
            />
          </div>
        );
      case 'inception':
        return (
          <div className="w-11 h-11 rounded-[16px] liquid-glass-orb flex items-center justify-center text-blue-600 dark:text-blue-400">
            <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-current fill-none stroke-[1.8]">
              <circle cx="12" cy="12" r="7" />
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
          </div>
        );
      case 'google':
        return (
          <div className="w-11 h-11 rounded-[16px] liquid-glass-orb flex items-center justify-center text-amber-500">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
            </svg>
          </div>
        );
      case 'anthropic':
        return (
          <div className="w-11 h-11 rounded-[16px] liquid-glass-orb flex items-center justify-center text-orange-600 dark:text-orange-400">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
              <path d="M12 2L14 8L20 9L15 13L17 19L12 15L7 19L9 13L4 9L10 8L12 2Z" />
            </svg>
          </div>
        );
      case 'mistral':
        return (
          <div className="w-11 h-11 rounded-[16px] liquid-glass-orb flex items-center justify-center text-orange-600 dark:text-orange-400 font-extrabold text-sm">
            M
          </div>
        );
      case 'moonshot':
        return (
          <div className="w-11 h-11 rounded-[16px] liquid-glass-orb flex items-center justify-center text-sky-600 dark:text-sky-400 font-extrabold text-sm">
            K
          </div>
        );
      case 'zhipu':
        return (
          <div className="w-11 h-11 rounded-[16px] liquid-glass-orb flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-extrabold text-sm">
            Z
          </div>
        );
      case 'nvidia':
        return (
          <div className="w-11 h-11 rounded-[16px] liquid-glass-orb flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">
            NV
          </div>
        );
      case 'openai':
      default:
        return (
          <div className="w-11 h-11 rounded-[16px] liquid-glass-orb flex items-center justify-center text-slate-800 dark:text-slate-100">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
              <path d="M22.28 10.37a5.45 5.45 0 0 0-.44-4.25 5.56 5.56 0 0 0-4.08-2.77 5.6 5.6 0 0 0-4.6 1.05A5.5 5.5 0 0 0 9.2 3.12a5.55 5.55 0 0 0-4.32 2.4 5.5 5.5 0 0 0-.82 4.2 5.54 5.54 0 0 0-2.4 4.3 5.52 5.52 0 0 0 1.63 4.25 5.57 5.57 0 0 0 4.1 1.65c.16 0 .32 0 .48-.02a5.52 5.52 0 0 0 3.96 1.98c1.6 0 3.06-.68 4.1-1.78a5.5 5.5 0 0 0 4.34-2.4 5.5 5.5 0 0 0 .8-4.22 5.52 5.52 0 0 0 2.4-4.32c0-.52-.07-1.03-.2-1.52zM12 13.88l-2.6-1.5 2.6-1.5 2.6 1.5-2.6 1.5z" />
            </svg>
          </div>
        );
    }
  };

  const handleSelectAgent = (agent: AgentItem) => {
    onSelectAgentForChat({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      category: agent.category,
      model: 'opus-5',
      icon: 'Bot',
      color: 'from-purple-600 to-indigo-600',
      badge: agent.isIncluded ? 'INCLUDED' : 'PRO',
      verified: true,
      creator: agent.provider,
      systemPrompt: agent.systemPrompt,
      tools: ['Web Search', 'Code Execution', 'Tool Calling'],
      shared: true,
      uses: parseInt(agent.usesCount?.replace(/\D/g, '') || '10') * 1000,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full min-w-0 overflow-y-auto overflow-x-hidden bg-transparent text-slate-900 dark:text-white px-4 sm:px-6 lg:px-8 py-4 sm:py-5 select-none transition-colors">
      <div className="max-w-[1400px] w-full min-w-0 mx-auto space-y-5">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Agents</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Specialized AI personas built for coding, research, and multimodal workflows.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none sm:w-64 min-w-[150px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search agents"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs liquid-glass-input rounded-full text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 liquid-glass-cta rounded-full text-xs font-semibold shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create agent</span>
            </motion.button>
          </div>
        </div>

        {/* Explore / My Agents / Shared Tabs */}
        <div className="inline-flex items-center gap-1 p-1 rounded-full liquid-glass-subtle overflow-x-auto max-w-full scrollbar-none">
          {[
            { id: 'explore', label: 'Explore' },
            { id: 'my-agents', label: `My Agents (${agents.length})` },
            { id: 'shared', label: 'Shared' },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors shrink-0 cursor-pointer tabular-nums ${
                activeTab === tab.id
                  ? 'text-slate-950 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {activeTab === tab.id && (
                <motion.span
                  layoutId="agents-active-tab"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  className="absolute inset-0 rounded-full liquid-glass-droplet"
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Promotional Glass Banner */}
        {activeTab === 'explore' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24 }}
            className="w-full rounded-[28px] liquid-glass-card p-5 sm:p-6 flex items-center justify-between relative overflow-hidden"
          >
            <div className="pointer-events-none absolute -right-12 -top-12 w-56 h-56 rounded-full bg-gradient-to-br from-violet-500/25 via-indigo-500/20 to-sky-400/20 blur-2xl" />
            <div className="min-w-0 relative z-10">
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="w-8 h-8 rounded-full liquid-glass-orb text-violet-600 dark:text-violet-300 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">Meet Automate</h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 max-w-lg">
                Fastest and most accurate flagship agent architecture tuned by Automate AI.
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleSelectAgent(ALL_AGENTS[0])}
                className="px-4 py-2 liquid-glass-cta font-semibold rounded-full text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Start chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Categories Bar */}
        {activeTab === 'explore' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <motion.button
                  key={cat}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(cat)}
                  className={`relative px-3.5 py-1.5 rounded-full text-xs shrink-0 transition-colors cursor-pointer ${
                    active
                      ? 'text-slate-950 dark:text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="agents-active-category"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      className="absolute inset-0 rounded-full liquid-glass-droplet"
                    />
                  )}
                  <span className="relative z-10">{cat}</span>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* 3-Column Agent Grid */}
        {activeTab === 'explore' ? (
          filteredAgents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredAgents.map((agent) => (
                <motion.div
                  key={agent.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectAgent(agent)}
                  className="p-4 rounded-[24px] liquid-glass-card cursor-pointer flex items-center justify-between group min-w-0"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="shrink-0">
                      {renderLogo(agent.logoType)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-[13px] truncate">
                          {agent.name}
                        </h3>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {agent.shortDescription || agent.description}
                      </p>
                    </div>
                  </div>

                  <span className="w-7 h-7 rounded-full liquid-glass-orb flex items-center justify-center shrink-0 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center flex flex-col items-center justify-center liquid-glass-card rounded-[28px]">
              <h3 className="text-base font-bold text-violet-600 dark:text-violet-400 mb-1">
                No Agents in this category.
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Try another category or adjust your search filter.
              </p>
            </div>
          )
        ) : activeTab === 'my-agents' ? (
          agents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {agents.map((agent) => (
                <motion.div
                  key={agent.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectAgentForChat(agent)}
                  className="p-4 rounded-[24px] liquid-glass-card cursor-pointer flex items-center justify-between group min-w-0"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-11 h-11 rounded-[16px] liquid-glass-orb flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-[13px] truncate">
                          {agent.name}
                        </h3>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {agent.description}
                      </p>
                    </div>
                  </div>
                  <span className="w-7 h-7 rounded-full liquid-glass-orb flex items-center justify-center shrink-0 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-20 px-6 text-center flex flex-col items-center justify-center liquid-glass-card rounded-[28px]">
              <div className="w-12 h-12 rounded-2xl liquid-glass-orb flex items-center justify-center text-violet-600 dark:text-violet-400 mb-3">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                No custom agents yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-sm">
                Build a tailored AI assistant with custom instructions and tool bindings.
              </p>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2 liquid-glass-cta rounded-full text-xs font-semibold cursor-pointer"
              >
                Create your first agent
              </motion.button>
            </div>
          )
        ) : (
          <div className="py-20 text-center flex flex-col items-center justify-center liquid-glass-card rounded-[28px]">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No agents have been shared with you yet.
            </p>
          </div>
        )}
      </div>

      <CreateAgentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateAgent={onCreateAgent}
        availableModels={availableModels}
      />
    </div>
  );
};
