import React, { useState } from 'react';
import {
  Search,
  ChevronDown,
  ArrowRight,
  X,
  FileText,
  Check,
  Copy,
  SlidersHorizontal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ModelInfo } from '../../types';

interface ModelsViewProps {
  models: ModelInfo[];
  selectedModel: ModelInfo;
  onSelectModel: (model: ModelInfo) => void;
  onNavigateToChat: () => void;
}

export const ModelsView: React.FC<ModelsViewProps> = ({
  models,
  onSelectModel,
  onNavigateToChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [inspectingModel, setInspectingModel] = useState<any | null>(null);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [sortOption, setSortOption] = useState('Newest');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [copiedModelId, setCopiedModelId] = useState<string | null>(null);

  const inputOptions = [
    { label: 'Text', id: 'text' },
    { label: 'Embedding', id: 'embedding' },
    { label: 'Image', id: 'image' },
    { label: 'File', id: 'file' },
    { label: 'Audio', id: 'audio' },
    { label: 'Video', id: 'video' },
  ];

  const capabilityOptions = [
    { label: 'Reasoning', id: 'reasoning' },
    { label: 'Tool calling', id: 'tool_calling' },
    { label: 'Vision', id: 'vision' },
    { label: 'Voice', id: 'voice' },
  ];

  const providerCounts = [
    { name: 'Anthropic', count: 7 },
    { name: 'Automate AI', count: 1 },
    { name: 'Deepgram', count: 1 },
    { name: 'DeepSeek', count: 3 },
    { name: 'ElevenLabs', count: 1 },
    { name: 'Google', count: 12 },
    { name: 'Meta', count: 8 },
    { name: 'OpenAI', count: 24 },
  ];

  const catalogModels = [
    {
      id: 'gpt-6-1-terra',
      name: 'GPT 6.1 Terra',
      provider: 'OpenAI',
      badges: ['Reasoning', 'Vision'],
      description: 'GPT 6.1 Terra is the fast GPT-6.1 model for visual reasoning, computer use, writing, and high-volume agent work.',
      pricing: { origInput: '$1.2', input: '$0.843/M', origOutput: '$6.02', output: '$4.22/M' },
      iconType: 'openai',
      inputOutput: 'Text, Image',
      cachedInput: '$0.12 / 1M',
      contextWindow: '1M Tokens',
      regions: 'us-east-1, eu-central-1',
      released: 'Oct 26, 2026',
    },
    {
      id: 'gpt-6-1-sol',
      name: 'GPT 6.1 Sol',
      provider: 'OpenAI',
      badges: ['Reasoning', 'Vision'],
      description: 'GPT 6.1 Sol delivers near-Astra performance at lower cost for complex coding, computer use, professional work, and agentic workflows.',
      pricing: { origInput: '$2.41', input: '$1.69/M', origOutput: '$12.05', output: '$8.43/M' },
      iconType: 'openai',
      inputOutput: 'Text, Image',
      cachedInput: '$0.24 / 1M',
      contextWindow: '1M Tokens',
      regions: 'us-east-1, eu-central-1',
      released: 'Sep 29, 2026',
    },
    {
      id: 'gpt-6-luna',
      name: 'GPT 6 Luna',
      provider: 'OpenAI',
      badges: ['Reasoning', 'Vision'],
      description: 'GPT 6 Luna is the fastest GPT-6 variant for high-volume chat, extraction, routing, and lightweight tools.',
      pricing: { origInput: '$0.12', input: '$0.084/M', origOutput: '$0.602', output: '$0.422/M' },
      iconType: 'openai',
      inputOutput: 'Text, Image',
      cachedInput: '$0.012 / 1M',
      contextWindow: '512k Tokens',
      regions: 'us-east-1, eu-central-1',
      released: 'Sep 22, 2026',
    },
    {
      id: 'gpt-6-sol',
      name: 'GPT 6 Sol',
      provider: 'OpenAI',
      badges: ['Reasoning', 'Vision'],
      description: 'GPT 6 Sol balances GPT-6 reasoning quality with lower latency and cost for production agent workloads.',
      pricing: { origInput: '$2.41', input: '$1.69/M', origOutput: '$12.05', output: '$8.43/M' },
      iconType: 'openai',
      inputOutput: 'Text, Image',
      cachedInput: '$0.24 / 1M',
      contextWindow: '1M Tokens',
      regions: 'us-east-1, eu-central-1',
      released: 'Aug 14, 2026',
    },
    {
      id: 'deepseek-v4-1-flash',
      name: 'DeepSeek V4.1 Flash',
      provider: 'DeepSeek',
      badges: ['Vision', 'Web'],
      description: 'DeepSeek V4.1 Flash combines a one-million-token context window with configurable thinking and vision input.',
      pricing: { origInput: '$0.361', input: '$0.253/M', origOutput: '$1.45', output: '$1.01/M' },
      iconType: 'deepseek',
      inputOutput: 'Text, Image',
      cachedInput: '$0.05 / 1M',
      contextWindow: '1M Tokens',
      regions: 'ap-east-1, us-west-2',
      released: 'Oct 12, 2026',
    },
    {
      id: 'gpt-6-astra',
      name: 'GPT 6 Astra',
      provider: 'OpenAI',
      badges: ['Reasoning', 'Vision'],
      description: "GPT 6 Astra is OpenAI's flagship GPT-6 model for complex reasoning, coding, research, and long-running agents.",
      pricing: { origInput: '$12.05', input: '$8.43/M', origOutput: '$60.24', output: '$42.17/M' },
      iconType: 'openai',
      inputOutput: 'Text, Image, File, Audio',
      cachedInput: '$1.20 / 1M',
      contextWindow: '2M Tokens',
      regions: 'us-east-1, us-west-2',
      released: 'Oct 01, 2026',
    },
    {
      id: 'claude-opus-4-5',
      name: 'Claude Opus 4.5',
      provider: 'Anthropic',
      badges: ['Reasoning', 'Vision', 'Web'],
      description: "Claude Opus 4.5 is Anthropic's high-capability frontier model for demanding coding, research, writing, and agent workflows.",
      pricing: { origInput: '$6.02', input: '$4.22/M', origOutput: '$30.12', output: '$21.08/M' },
      iconType: 'anthropic',
      inputOutput: 'Text, Image',
      cachedInput: '$0.602 / 1M',
      contextWindow: '200k Tokens',
      regions: 'us-east-1, eu-central-1, ap-south-1',
      released: 'Nov 24, 2025',
    },
    {
      id: 'opus-5',
      name: 'Opus 5',
      provider: 'Anthropic',
      badges: ['Vision', 'Web'],
      description: "Claude Opus 5 is Anthropic's flagship model, offering state-of-the-art reasoning, code analysis, and multilingual synthesis.",
      pricing: { origInput: '$15.00', input: '$10.50/M', origOutput: '$75.00', output: '$52.50/M' },
      iconType: 'anthropic',
      inputOutput: 'Text, Image, PDF',
      cachedInput: '$1.50 / 1M',
      contextWindow: '500k Tokens',
      regions: 'us-east-1, eu-central-1',
      released: 'Dec 02, 2025',
    },
    {
      id: 'gemini-4-hydrogen',
      name: 'Gemini 4 Hydrogen XHigh',
      provider: 'Google DeepMind',
      badges: ['XHigh Thinking', 'Reasoning', 'Multimodal'],
      description: "Google's flagship Gemini 4 Hydrogen engine configured at XHIGH thinking depth for deep reasoning, 1M context window, vision, audio, video, and tool calling.",
      pricing: { origInput: '$0.60', input: '$0.00/M', origOutput: '$2.40', output: '$0.00/M' },
      iconType: 'google',
      inputOutput: 'Text, Image, Audio, Video',
      cachedInput: 'Native Free Tier',
      contextWindow: '1M Tokens',
      regions: 'global',
      released: 'Nov 2026',
    },
    {
      id: 'automate-x1',
      name: 'Automate-X1',
      provider: 'Automate AI',
      badges: ['Gemini 4 XHigh', 'Assistant', 'Flagship'],
      description: 'Default Automate AI reasoning model powered natively by Gemini 4 Hydrogen XHigh for deep thinking, code generation, and workspace automation.',
      pricing: { origInput: '$0.60', input: '$0.00/M', origOutput: '$2.40', output: '$0.00/M' },
      iconType: 'automate',
      inputOutput: 'Text, Image, Audio, Video',
      cachedInput: 'Native Free Tier',
      contextWindow: '1M Tokens',
      regions: 'global',
      released: 'Nov 2026',
    },
    {
      id: 'mercury-2-model',
      name: 'Mercury 2',
      provider: 'Inception',
      badges: ['Diffusion', 'Reasoning'],
      description: 'Diffusion-based language model offering rapid parallel sampling, structured JSON output, and robust tool use.',
      pricing: { origInput: '$0.50', input: '$0.35/M', origOutput: '$2.00', output: '$1.40/M' },
      iconType: 'inception',
      inputOutput: 'Text, Image',
      cachedInput: '$0.05 / 1M',
      contextWindow: '128k Tokens',
      regions: 'us-west-1',
      released: 'Feb 2026',
    },
  ];

  const filtered = catalogModels.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProv =
      !selectedProvider ||
      m.provider === selectedProvider ||
      m.provider.toLowerCase().startsWith(selectedProvider.toLowerCase());
    return matchesSearch && matchesProv;
  });

  const renderProviderIcon = (type: string) => {
    if (type === 'deepseek') {
      return (
        <div className="w-9 h-9 rounded-[14px] liquid-glass-orb text-blue-500 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
          🐳
        </div>
      );
    }
    if (type === 'anthropic') {
      return (
        <div className="w-9 h-9 rounded-[14px] liquid-glass-orb text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
          ✽
        </div>
      );
    }
    if (type === 'google') {
      return (
        <div className="w-9 h-9 rounded-[14px] liquid-glass-orb text-amber-500 flex items-center justify-center font-bold text-sm shrink-0">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
          </svg>
        </div>
      );
    }
    if (type === 'automate') {
      return (
        <div className="w-9 h-9 rounded-[14px] liquid-glass-orb text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-sm shrink-0">
          ✱
        </div>
      );
    }
    if (type === 'inception') {
      return (
        <div className="w-9 h-9 rounded-[14px] liquid-glass-orb text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
          ◎
        </div>
      );
    }
    return (
      <div className="w-9 h-9 rounded-[14px] liquid-glass-orb flex items-center justify-center text-slate-800 dark:text-slate-100 shrink-0">
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
          <path d="M22.28 10.37a5.45 5.45 0 0 0-.44-4.25 5.56 5.56 0 0 0-4.08-2.77 5.6 5.6 0 0 0-4.6 1.05A5.5 5.5 0 0 0 9.2 3.12a5.55 5.55 0 0 0-4.32 2.4 5.5 5.5 0 0 0-.82 4.2 5.54 5.54 0 0 0-2.4 4.3 5.52 5.52 0 0 0 1.63 4.25 5.57 5.57 0 0 0 4.1 1.65c.16 0 .32 0 .48-.02a5.52 5.52 0 0 0 3.96 1.98c1.6 0 3.06-.68 4.1-1.78a5.5 5.5 0 0 0 4.34-2.4 5.5 5.5 0 0 0 .8-4.22 5.52 5.52 0 0 0 2.4-4.32c0-.52-.07-1.03-.2-1.52zM12 13.88l-2.6-1.5 2.6-1.5 2.6 1.5-2.6 1.5z" />
        </svg>
      </div>
    );
  };

  const renderFiltersContent = () => (
    <>
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60 dark:border-white/10">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900 dark:text-white text-xs">Filters</h3>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tabular-nums">{catalogModels.length} models</span>
        </div>
        {selectedProvider && (
          <button
            onClick={() => setSelectedProvider('')}
            className="text-[10px] text-violet-600 dark:text-violet-400 hover:underline font-semibold cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* INPUT Section */}
      <div className="mb-4">
        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
          INPUT
        </h4>
        <div className="space-y-1.5">
          {inputOptions.map((opt) => (
            <div
              key={opt.id}
              className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 py-0.5 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <span>{opt.label}</span>
              <span className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600" />
            </div>
          ))}
        </div>
      </div>

      {/* CAPABILITIES Section */}
      <div className="mb-4">
        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
          CAPABILITIES
        </h4>
        <div className="space-y-1.5">
          {capabilityOptions.map((opt) => (
            <div
              key={opt.id}
              className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 py-0.5 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <span>{opt.label}</span>
              <span className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600" />
            </div>
          ))}
        </div>
      </div>

      {/* PROVIDERS Section */}
      <div className="mb-4">
        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
          PROVIDERS
        </h4>
        <div className="space-y-1.5">
          {providerCounts.map((p) => (
            <div
              key={p.name}
              onClick={() => setSelectedProvider(selectedProvider === p.name ? '' : p.name)}
              className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 py-0.5 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <span>{p.name}</span>
              <div className="flex items-center gap-1.5 tabular-nums">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">{p.count}</span>
                <span
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    selectedProvider === p.name
                      ? 'border-violet-600 bg-violet-600 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {selectedProvider === p.name && (
                    <span className="text-[8px] font-bold">✓</span>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-transparent text-slate-900 dark:text-white select-none relative transition-colors min-w-0 w-full gap-2.5 p-2 sm:p-3">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex w-56 rounded-[24px] liquid-glass flex-col p-4 shrink-0 overflow-y-auto">
        {renderFiltersContent()}
      </aside>

      {/* Mobile Slide-Over Filters Drawer */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFiltersOpen(false)}
              className="fixed inset-0 bg-slate-950/45 backdrop-blur-md z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 520, damping: 38, mass: 0.5 }}
              className="fixed inset-y-2.5 left-2.5 w-72 max-w-[85vw] z-50 lg:hidden liquid-glass-elevated rounded-[28px] flex flex-col p-4 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Filter Models</span>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-7 h-7 rounded-full liquid-glass-orb text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {renderFiltersContent()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Model Discovery */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden px-2 sm:px-4 lg:px-5 py-2 sm:py-3 bg-transparent transition-colors min-w-0">
        <div className="max-w-[1200px] w-full mx-auto space-y-5 min-w-0">
          {/* Top Title & Search / Sort row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Models</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Explore and compare AI models and capabilities.
              </p>
            </div>

            <div className="flex items-center gap-2 relative flex-wrap sm:flex-nowrap w-full sm:w-auto">
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-2 liquid-glass-orb rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 shrink-0 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters{selectedProvider ? ' • 1' : ''}</span>
              </motion.button>

              <div className="relative flex-1 sm:w-64 min-w-[150px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs liquid-glass-input rounded-full text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              {/* Newest Dropdown */}
              <div className="relative shrink-0">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                  className="flex items-center gap-1.5 px-3.5 py-2 liquid-glass-orb rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <span>{sortOption}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.button>

                {sortDropdownOpen && (
                  <div className="absolute right-0 top-10 z-30 liquid-glass-elevated text-slate-900 dark:text-white rounded-2xl p-1.5 w-36 text-xs">
                    {['Newest', 'Recommended', 'Name A-Z', 'Name Z-A'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setSortOption(opt);
                          setSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                          sortOption === opt
                            ? 'liquid-glass-droplet text-violet-700 dark:text-white font-bold'
                            : 'hover:bg-black/5 dark:hover:bg-white/10'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Models Section */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2.5">Recent Models</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'automate-x1', name: 'Automate-X1', date: 'Nov 2026', provider: 'Automate AI', iconType: 'automate' },
                { id: 'gemini-4-hydrogen', name: 'Gemini 4 Hydrogen XHigh', date: 'Nov 2026', provider: 'Google DeepMind', iconType: 'google' },
                { id: 'gpt-6-1-terra', name: 'GPT 6.1 Terra', date: 'Oct 26', provider: 'OpenAI', iconType: 'openai' },
                { id: 'opus-5', name: 'Opus 5', date: 'Dec 02', provider: 'Anthropic', iconType: 'anthropic' },
              ].map((m, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const match = models.find((x) => x.id === m.id) || models[0];
                    onSelectModel(match);
                    onNavigateToChat();
                  }}
                  className="p-3 rounded-[22px] liquid-glass-card cursor-pointer flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {renderProviderIcon(m.iconType)}
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-900 dark:text-white text-xs truncate">{m.name}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{m.provider}</p>
                    </div>
                  </div>
                  {m.date && (
                    <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 liquid-glass-subtle px-1.5 py-0.5 rounded-full shrink-0">
                      {m.date}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* 2-Column Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ y: -2 }}
                onClick={() => setInspectingModel(item)}
                className="p-4 rounded-[24px] liquid-glass-card cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3 mb-2.5">
                    {renderProviderIcon(item.iconType)}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">{item.name}</h3>
                        {item.badges.map((b) => (
                          <span
                            key={b}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full liquid-glass-subtle text-slate-700 dark:text-slate-200"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-2.5 border-t border-slate-200/60 dark:border-white/10 tabular-nums">
                  <span>by {item.provider}</span>

                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <div className="flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="line-through text-slate-400">{item.pricing.origInput}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{item.pricing.input}</span>
                      <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        30% off
                      </span>
                    </div>

                    <span className="text-slate-300 dark:text-slate-600">|</span>

                    <div className="flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="line-through text-slate-400">{item.pricing.origOutput}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{item.pricing.output}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Slide-Over Right-Hand Specification Drawer */}
      <AnimatePresence>
        {inspectingModel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInspectingModel(null)}
              className="fixed inset-0 bg-slate-950/45 backdrop-blur-md z-40"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              className="fixed inset-y-2.5 right-2.5 z-50 w-[calc(100%-20px)] sm:w-[420px] max-w-full liquid-glass-elevated rounded-[30px] text-slate-900 dark:text-white p-5 sm:p-6 flex flex-col justify-between overflow-y-auto"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-white/10 mb-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {renderProviderIcon(inspectingModel.iconType)}
                    <div className="min-w-0">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">{inspectingModel.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">By {inspectingModel.provider}</p>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setInspectingModel(null)}
                    className="w-8 h-8 rounded-full liquid-glass-orb text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {inspectingModel.badges.map((b: string) => (
                    <span
                      key={b}
                      className="text-[10px] liquid-glass-subtle text-violet-700 dark:text-violet-300 font-semibold px-2.5 py-0.5 rounded-full"
                    >
                      {b}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
                  {inspectingModel.description}
                </p>

                <div className="space-y-2 text-xs p-3.5 rounded-2xl liquid-glass-subtle tabular-nums">
                  <div className="flex justify-between gap-2 py-1 border-b border-slate-200/50 dark:border-white/10">
                    <span className="text-slate-500 dark:text-slate-400">Input / Output</span>
                    <span className="font-medium text-slate-900 dark:text-white text-right">{inspectingModel.inputOutput}</span>
                  </div>
                  <div className="flex justify-between gap-2 py-1 border-b border-slate-200/50 dark:border-white/10">
                    <span className="text-slate-500 dark:text-slate-400">Input Tokens</span>
                    <div className="flex items-center gap-1.5">
                      <span className="line-through text-slate-400">{inspectingModel.pricing.origInput}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{inspectingModel.pricing.input}</span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-1.5 rounded-full">30% off</span>
                    </div>
                  </div>
                  <div className="flex justify-between gap-2 py-1 border-b border-slate-200/50 dark:border-white/10">
                    <span className="text-slate-500 dark:text-slate-400">Output Tokens</span>
                    <div className="flex items-center gap-1.5">
                      <span className="line-through text-slate-400">{inspectingModel.pricing.origOutput}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{inspectingModel.pricing.output}</span>
                    </div>
                  </div>
                  <div className="flex justify-between gap-2 py-1 border-b border-slate-200/50 dark:border-white/10">
                    <span className="text-slate-500 dark:text-slate-400">Cached input</span>
                    <span className="font-medium text-slate-900 dark:text-white">{inspectingModel.cachedInput}</span>
                  </div>
                  <div className="flex justify-between gap-2 py-1 border-b border-slate-200/50 dark:border-white/10">
                    <span className="text-slate-500 dark:text-slate-400">Context window</span>
                    <span className="font-semibold text-violet-600 dark:text-violet-400">{inspectingModel.contextWindow}</span>
                  </div>
                  <div className="flex justify-between gap-2 py-1 border-b border-slate-200/50 dark:border-white/10">
                    <span className="text-slate-500 dark:text-slate-400">Hosted regions</span>
                    <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 text-right">{inspectingModel.regions}</span>
                  </div>
                  <div className="flex justify-between gap-2 py-1 border-b border-slate-200/50 dark:border-white/10">
                    <span className="text-slate-500 dark:text-slate-400">Released</span>
                    <span className="text-slate-700 dark:text-slate-300">{inspectingModel.released}</span>
                  </div>
                  <div className="flex justify-between gap-2 py-1">
                    <span className="text-slate-500 dark:text-slate-400">Available on Automate AI</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Supported</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-200/60 dark:border-white/10 space-y-2.5 mt-4">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    const match =
                      models.find((x) => x.id === inspectingModel.id) ||
                      models.find((x) => x.name.toLowerCase() === inspectingModel.name.toLowerCase()) || {
                        id: inspectingModel.id,
                        name: inspectingModel.name,
                        provider: inspectingModel.provider,
                        providerId: inspectingModel.iconType || 'google',
                        description: inspectingModel.description,
                        pricing: {
                          inputPer1M: inspectingModel.pricing.input.replace('/M', ''),
                          outputPer1M: inspectingModel.pricing.output.replace('/M', ''),
                        },
                        contextWindow: inspectingModel.contextWindow,
                        maxOutput: '16,384 Tokens',
                        inputModalities: ['text', 'image'],
                        capabilities: ['reasoning', 'vision', 'code'],
                        benchmarkScore: 95.0,
                        latency: '140ms',
                      };
                    onSelectModel(match);
                    onNavigateToChat();
                  }}
                  className="w-full py-2.5 rounded-full liquid-glass-cta font-bold text-xs cursor-pointer"
                >
                  Try this model in Chat
                </motion.button>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      navigator.clipboard?.writeText(inspectingModel.id);
                      setCopiedModelId(inspectingModel.id);
                      setTimeout(() => setCopiedModelId(null), 1800);
                    }}
                    className="py-2 liquid-glass-orb rounded-full text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedModelId === inspectingModel.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Copied ID</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy ID</span>
                      </>
                    )}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setInspectingModel(null)}
                    className="py-2 liquid-glass-orb rounded-full text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Close specs</span>
                  </motion.button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
