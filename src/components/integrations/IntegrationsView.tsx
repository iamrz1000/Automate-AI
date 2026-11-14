import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Link2,
  Plug,
  Key,
  Wrench,
  Info,
  Check,
  X,
  Plus,
  BookOpen,
  Copy,
  Sparkles,
} from 'lucide-react';
import { ALL_CONNECTORS, ALL_MCP_SERVERS, ConnectorItem, McpServerItem } from '../../data/integrationsData';
import { IntegrationConnector } from '../../types';

interface IntegrationsViewProps {
  integrations?: IntegrationConnector[];
  onToggleIntegration?: (id: string) => void;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({
  onToggleIntegration,
}) => {
  const [activeTab, setActiveTab] = useState<'Connectors' | 'MCP (Beta)' | 'API Keys' | 'Custom Tools'>('Connectors');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 2600);
  };

  // Connection states
  const [connectedIds, setConnectedIds] = useState<string[]>([]);
  const [selectedConnector, setSelectedConnector] = useState<ConnectorItem | McpServerItem | null>(null);
  const [howToConnectItem, setHowToConnectItem] = useState<ConnectorItem | McpServerItem | null>(null);

  // Modals
  const [isAddMcpOpen, setIsAddMcpOpen] = useState(false);
  const [isCreateKeyOpen, setIsCreateKeyOpen] = useState(false);
  const [isCreateToolOpen, setIsCreateToolOpen] = useState(false);

  // New MCP Form
  const [newMcpName, setNewMcpName] = useState('');
  const [newMcpTransport, setNewMcpTransport] = useState<'sse' | 'stdio'>('sse');
  const [newMcpEndpoint, setNewMcpEndpoint] = useState('');

  // Custom MCP servers added by user
  const [customMcpServers, setCustomMcpServers] = useState<McpServerItem[]>([]);

  // Generated Platform API Keys
  const [platformKeys, setPlatformKeys] = useState<{ id: string; name: string; key: string; createdAt: string }[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyGenerated, setNewKeyGenerated] = useState<string | null>(null);

  // Provider Configuration
  const [byokKeys, setByokKeys] = useState<{ [key: string]: string }>({
    OpenAI: '',
    Anthropic: '',
    Gemini: '',
    DeepSeek: '',
    Groq: '',
  });

  // Custom Tools
  const [customTools, setCustomTools] = useState([
    {
      id: 'tool-stock',
      name: 'Stock & Crypto Ticker',
      method: 'GET',
      endpoint: 'https://api.marketdata.app/v1/quotes',
      description: 'Fetches real-time price, 24h change, and volume for symbols.',
      executions: 1240,
    },
    {
      id: 'tool-crm',
      name: 'Internal Lead Sync Webhook',
      method: 'POST',
      endpoint: 'https://internal.rais.co/api/leads',
      description: 'Pushes qualified prospect records into CRM with attribution.',
      executions: 480,
    },
  ]);
  const [newToolName, setNewToolName] = useState('');
  const [newToolMethod, setNewToolMethod] = useState<'GET' | 'POST' | 'PUT'>('POST');
  const [newToolEndpoint, setNewToolEndpoint] = useState('');
  const [newToolDesc, setNewToolDesc] = useState('');

  const toggleConnection = (id: string) => {
    if (onToggleIntegration) {
      onToggleIntegration(id);
    }
    setConnectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAddMcpServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMcpName.trim() || !newMcpEndpoint.trim()) return;
    const newServer: McpServerItem = {
      id: `mcp-${Date.now()}`,
      name: newMcpName,
      badge: 'Connected',
      description: `Custom ${newMcpTransport.toUpperCase()} Model Context Protocol server at ${newMcpEndpoint}`,
      logo: 'MCP',
      oauthUrl: newMcpEndpoint,
      toolsCount: 6,
    };
    setCustomMcpServers((prev) => [newServer, ...prev]);
    setConnectedIds((prev) => [...prev, newServer.id]);
    setIsAddMcpOpen(false);
    setNewMcpName('');
    setNewMcpEndpoint('');
  };

  const handleCreatePlatformKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    const key = `automate_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    setPlatformKeys((prev) => [
      { id: `key-${Date.now()}`, name: newKeyName, key, createdAt: 'Just now' },
      ...prev,
    ]);
    setNewKeyGenerated(key);
    setNewKeyName('');
  };

  const handleCreateCustomTool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToolName.trim() || !newToolEndpoint.trim()) return;
    setCustomTools((prev) => [
      {
        id: `tool-${Date.now()}`,
        name: newToolName,
        method: newToolMethod,
        endpoint: newToolEndpoint,
        description: newToolDesc.trim() || 'Custom REST endpoint tool for Automate AI agents.',
        executions: 0,
      },
      ...prev,
    ]);
    setIsCreateToolOpen(false);
    setNewToolName('');
    setNewToolEndpoint('');
    setNewToolDesc('');
  };

  const filteredConnectors = ALL_CONNECTORS.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allMcpServers = [...customMcpServers, ...ALL_MCP_SERVERS];
  const filteredMcp = allMcpServers.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderLogo = (logo: string) => {
    switch (logo) {
      case 'Tally':
        return <span className="font-serif italic font-black text-red-600 text-sm">Tally</span>;
      case 'Bitbucket':
        return <span className="text-blue-500 text-lg">⎔</span>;
      case 'Confluence':
        return <span className="text-blue-600 font-bold text-sm">▲▼</span>;
      case 'Dropbox':
        return <span className="text-blue-400 text-lg">❖</span>;
      case 'DynamoDB':
        return <span className="text-blue-400 text-sm font-mono font-bold">☲</span>;
      case 'Facebook':
        return <span className="text-blue-600 font-bold text-lg">f</span>;
      case 'GitHub':
        return <span className="text-slate-900 dark:text-white text-lg font-bold">🐙</span>;
      case 'GitLab':
        return <span className="text-orange-500 text-lg">🦊</span>;
      case 'Gmail':
        return <span className="text-red-500 font-bold text-sm">✉</span>;
      case 'AdSense':
        return <span className="text-blue-500 font-bold text-sm">◰</span>;
      case 'Calendar':
        return <span className="text-blue-500 text-sm">📅</span>;
      case 'Document':
        return <span className="text-blue-500 text-sm">📄</span>;
      case 'Drive':
        return <span className="text-amber-500 text-sm">📁</span>;
      case 'Forms':
        return <span className="text-purple-500 text-sm">📋</span>;
      case 'Meet':
        return <span className="text-emerald-500 text-sm">📹</span>;
      case 'Sheets':
        return <span className="text-emerald-500 text-sm">📊</span>;
      case 'Slides':
        return <span className="text-amber-500 text-sm">📽️</span>;
      case 'Workspace':
        return <span className="text-blue-500 text-sm">🏢</span>;
      case 'Jira':
        return <span className="text-blue-500 text-sm font-bold">🔷</span>;
      case 'LinkedIn':
        return <span className="text-blue-600 font-bold text-xs">in</span>;
      case 'Meta':
        return <span className="text-blue-500 text-sm font-bold">∞</span>;
      case 'Microsoft':
        return <span className="text-blue-400 text-sm">⊞</span>;
      case 'MongoDB':
        return <span className="text-emerald-500 text-sm">🍃</span>;
      case 'MySQL':
        return <span className="text-blue-400 text-sm">🐬</span>;
      case 'Notion':
        return <span className="font-bold text-xs text-slate-900 dark:text-white">N</span>;
      case 'Outlook':
        return <span className="text-blue-500 text-sm">📧</span>;
      case 'Redis':
        return <span className="text-red-500 text-sm font-bold">🔴</span>;
      case 'Slack':
        return <span className="text-purple-400 text-sm font-bold">#</span>;
      case 'SQLite':
        return <span className="text-blue-400 text-sm">🗄️</span>;
      case 'Stripe':
        return <span className="text-indigo-400 font-bold text-sm">S</span>;
      case 'Telegram':
        return <span className="text-sky-400 text-sm">✈️</span>;
      case 'WhatsApp':
        return <span className="text-emerald-500 text-sm">💬</span>;
      case 'X':
        return <span className="font-bold text-xs text-slate-900 dark:text-white">𝕏</span>;
      case 'YouTube':
        return <span className="text-red-600 text-sm">▶</span>;
      case 'Zoho':
        return <span className="text-red-500 font-bold text-xs">Y</span>;
      case 'Asana':
        return <span className="text-red-400 text-xs">●●●</span>;
      case 'Atlassian':
        return <span className="text-blue-500 text-sm">▲</span>;
      case 'Cloudflare':
        return <span className="text-amber-500 text-sm">☁️</span>;
      case 'Higgsfield':
        return <span className="text-purple-400 font-bold text-xs">H</span>;
      case 'Linear':
        return <span className="text-indigo-400 text-sm">📐</span>;
      case 'Runway':
        return <span className="text-pink-500 font-bold text-xs">R</span>;
      case 'Sentry':
        return <span className="text-purple-400 text-sm">🛡️</span>;
      case 'Supabase':
        return <span className="text-emerald-400 text-sm">⚡</span>;
      default:
        return <Plug className="w-4 h-4 text-violet-500 dark:text-violet-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full min-w-0 overflow-y-auto overflow-x-hidden bg-transparent text-slate-900 dark:text-white px-4 sm:px-6 lg:px-8 py-4 sm:py-5 select-none transition-colors relative">
      <AnimatePresence>
        {actionToast && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full liquid-glass-elevated text-slate-900 dark:text-white text-xs font-medium flex items-center gap-2 max-w-[90vw]"
          >
            <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <span className="truncate">{actionToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] w-full min-w-0 mx-auto space-y-5">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Integrations</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Connect apps, APIs, and custom tools
            </p>
          </div>

          {/* Segmented Glass Capsule Tabs */}
          <div className="inline-flex items-center gap-1 p-1 rounded-2xl sm:rounded-full liquid-glass-subtle flex-wrap max-w-full">
            {([
              { id: 'Connectors', icon: Link2 },
              { id: 'MCP (Beta)', icon: Plug },
              { id: 'API Keys', icon: Key },
              { id: 'Custom Tools', icon: Wrench },
            ] as const).map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'text-slate-950 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="integrations-active-tab"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      className="absolute inset-0 rounded-full liquid-glass-droplet"
                    />
                  )}
                  <Icon className="w-3.5 h-3.5 relative z-10 shrink-0" />
                  <span className="relative z-10">{tab.id}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Search Field & Tab Actions */}
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          {activeTab === 'API Keys' ? (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => showToast('Model inference endpoints & quotas are active.')}
                className="px-3.5 py-2 liquid-glass-orb text-slate-700 dark:text-slate-200 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                <span>Available models</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsCreateKeyOpen(true)}
                className="px-4 py-2 liquid-glass-cta rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create key</span>
              </motion.button>
            </div>
          ) : activeTab === 'Custom Tools' ? (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none sm:w-64 min-w-[160px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search custom tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs liquid-glass-input rounded-full text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsCreateToolOpen(true)}
                className="px-4 py-2 liquid-glass-cta rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create tool</span>
              </motion.button>
            </div>
          ) : activeTab === 'MCP (Beta)' ? (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none sm:w-64 min-w-[160px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search MCP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs liquid-glass-input rounded-full text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsAddMcpOpen(true)}
                className="px-4 py-2 liquid-glass-cta rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add MCP</span>
              </motion.button>
            </div>
          ) : (
            <div className="relative w-full sm:w-64 min-w-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search connectors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs liquid-glass-input rounded-full text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Tab 1: Connectors */}
        {activeTab === 'Connectors' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4"
          >
            {filteredConnectors.map((c) => {
              const isConnected = connectedIds.includes(c.id);
              const isHovered = hoveredCardId === c.id;

              return (
                <motion.div
                  key={c.id}
                  whileHover={{ y: -1 }}
                  onMouseEnter={() => setHoveredCardId(c.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                  className="p-4 rounded-[24px] liquid-glass-card flex flex-col justify-between relative group min-h-[124px] min-w-0 overflow-hidden"
                >
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-[14px] liquid-glass-orb flex items-center justify-center shrink-0">
                          {renderLogo(c.logo)}
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">{c.name}</h3>

                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium shrink-0 ${
                          isConnected
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            : c.badgeType === 'desktop'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                            : 'liquid-glass-subtle text-slate-600 dark:text-slate-300'
                        }`}>
                          <Link2 className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[90px] sm:max-w-none">{isConnected ? 'Connected' : c.badge}</span>
                        </div>
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSelectedConnector(c)}
                        className="w-7 h-7 rounded-full liquid-glass-orb flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white shrink-0 cursor-pointer"
                        title="View details"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                      {c.description}
                    </p>

                    {c.errorNotice && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">
                        {c.errorNotice}
                      </p>
                    )}

                    {/* Mobile touch-friendly actions */}
                    {c.badgeType !== 'coming_soon' && (
                      <div className="flex md:hidden items-center justify-end gap-2 mt-3 pt-2.5 border-t border-slate-200/60 dark:border-white/10">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setHowToConnectItem(c)}
                          className="px-3 py-1.5 liquid-glass-orb text-slate-800 dark:text-slate-200 rounded-full text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>Guide</span>
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleConnection(c.id)}
                          className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                            isConnected
                              ? 'bg-red-600 text-white'
                              : 'liquid-glass-cta'
                          }`}
                        >
                          <Link2 className="w-3 h-3" />
                          <span>{isConnected ? 'Disconnect' : 'Connect'}</span>
                        </motion.button>
                      </div>
                    )}
                  </div>

                  {/* Desktop Hover Actions Overlay */}
                  <AnimatePresence>
                    {isHovered && c.badgeType !== 'coming_soon' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.14 }}
                        className="hidden md:flex absolute inset-0 liquid-glass-elevated rounded-[24px] items-center justify-end gap-2 px-4"
                      >
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setHowToConnectItem(c)}
                          className="px-3.5 py-1.5 liquid-glass-orb text-slate-800 dark:text-slate-100 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" />
                          <span>How to connect?</span>
                        </motion.button>

                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleConnection(c.id)}
                          className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isConnected
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'liquid-glass-cta'
                          }`}
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          <span>{isConnected ? 'Disconnect' : 'Connect'}</span>
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Tab 2: MCP (Beta) */}
        {activeTab === 'MCP (Beta)' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4"
          >
            {filteredMcp.map((m) => {
              const isConnected = connectedIds.includes(m.id);
              const isHovered = hoveredCardId === m.id;

              return (
                <motion.div
                  key={m.id}
                  whileHover={{ y: -1 }}
                  onMouseEnter={() => setHoveredCardId(m.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                  className="p-4 rounded-[24px] liquid-glass-card flex flex-col justify-between relative group min-h-[124px] min-w-0 overflow-hidden"
                >
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-[14px] liquid-glass-orb flex items-center justify-center shrink-0">
                          {renderLogo(m.logo)}
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">{m.name}</h3>

                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium shrink-0 ${
                          isConnected
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            : 'liquid-glass-subtle text-slate-600 dark:text-slate-300'
                        }`}>
                          <Link2 className="w-3 h-3 shrink-0" />
                          <span>{isConnected ? 'Connected' : 'Not connected'}</span>
                        </div>
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSelectedConnector(m)}
                        className="w-7 h-7 rounded-full liquid-glass-orb flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white shrink-0 cursor-pointer"
                        title="View details"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                      {m.description}
                    </p>

                    <div className="flex md:hidden items-center justify-end gap-2 mt-3 pt-2.5 border-t border-slate-200/60 dark:border-white/10">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setHowToConnectItem(m)}
                        className="px-3 py-1.5 liquid-glass-orb text-slate-800 dark:text-slate-200 rounded-full text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>Guide</span>
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleConnection(m.id)}
                        className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                          isConnected
                            ? 'bg-red-600 text-white'
                            : 'liquid-glass-cta'
                        }`}
                      >
                        <Link2 className="w-3 h-3" />
                        <span>{isConnected ? 'Disconnect' : 'Connect'}</span>
                      </motion.button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.14 }}
                        className="hidden md:flex absolute inset-0 liquid-glass-elevated rounded-[24px] items-center justify-end gap-2 px-4"
                      >
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setHowToConnectItem(m)}
                          className="px-3.5 py-1.5 liquid-glass-orb text-slate-800 dark:text-slate-100 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" />
                          <span>How to connect?</span>
                        </motion.button>

                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleConnection(m.id)}
                          className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isConnected
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'liquid-glass-cta'
                          }`}
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          <span>{isConnected ? 'Disconnect' : 'Connect'}</span>
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Tab 3: API Keys */}
        {activeTab === 'API Keys' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Automate AI Platform API Keys</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Use these keys to access Automate's multi-model routing gateway from your own backend or CLI.</p>
                </div>
              </div>

              {platformKeys.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-500 dark:text-slate-400 rounded-[24px] liquid-glass-card">
                  <div className="w-12 h-12 rounded-2xl liquid-glass-orb flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <Key className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">No API keys found.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Create an API key to access models programmatically.</p>
                  <button
                    onClick={() => setIsCreateKeyOpen(true)}
                    className="mt-4 px-4 py-2 liquid-glass-cta rounded-full text-xs font-bold cursor-pointer"
                  >
                    + Create key
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {platformKeys.map((k) => (
                    <div
                      key={k.id}
                      className="p-4 rounded-[22px] liquid-glass-card flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">{k.name}</h4>
                          <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">Active</span>
                        </div>
                        <p className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-1">{k.key.slice(0, 14)}••••••••••••••••</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(k.key);
                            showToast('Copied API key to clipboard');
                          }}
                          className="w-8 h-8 rounded-full liquid-glass-orb flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer"
                          title="Copy key"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setPlatformKeys((prev) => prev.filter((x) => x.id !== k.id))}
                          className="w-8 h-8 rounded-full liquid-glass-orb flex items-center justify-center text-slate-400 hover:text-red-500 cursor-pointer"
                          title="Revoke key"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BYOK Custom Keys */}
            <div className="pt-4 border-t border-slate-200/60 dark:border-white/10">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Bring Your Own Key (BYOK)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Provide direct foundation model provider credentials to run workloads at direct pass-through pricing.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {Object.entries(byokKeys).map(([provider, val]) => (
                  <div
                    key={provider}
                    className="p-4 rounded-[22px] liquid-glass-card space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{provider} API Key</span>
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                        val
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          : 'liquid-glass-subtle text-slate-500 dark:text-slate-400'
                      }`}>
                        {val ? 'Configured' : 'Not set'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        placeholder={`Enter ${provider} Key...`}
                        value={val}
                        onChange={(e) => setByokKeys({ ...byokKeys, [provider]: e.target.value })}
                        className="flex-1 min-w-0 liquid-glass-input rounded-xl px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-200 focus:outline-none"
                      />
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => showToast(`Saved ${provider} API key securely.`)}
                        className="px-3.5 py-2 liquid-glass-cta rounded-xl text-xs font-semibold shrink-0 cursor-pointer"
                      >
                        Save
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Custom Tools */}
        {activeTab === 'Custom Tools' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customTools.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-[24px] liquid-glass-card space-y-2.5 min-w-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{t.name}</span>
                    <span className="text-[10px] font-mono font-bold liquid-glass-subtle text-violet-700 dark:text-violet-300 px-2.5 py-0.5 rounded-full shrink-0">
                      {t.method}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{t.description}</p>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-300 truncate liquid-glass-subtle p-2.5 rounded-xl">{t.endpoint}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-white/10 text-[11px]">
                    <span className="text-slate-400 tabular-nums">{t.executions.toLocaleString()} calls executed</span>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => showToast(`Test call to ${t.name}: Status 200 OK (24ms)`)}
                      className="text-violet-600 dark:text-violet-400 font-semibold hover:underline cursor-pointer"
                    >
                      Test Endpoint
                    </motion.button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info Details Modal */}
      <AnimatePresence>
        {selectedConnector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={() => setSelectedConnector(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/45 backdrop-blur-md select-none"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="liquid-glass-elevated text-slate-900 dark:text-white rounded-[30px] max-w-lg w-full p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setSelectedConnector(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full liquid-glass-orb text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4 pr-10">
                <div className="w-12 h-12 rounded-[18px] liquid-glass-orb flex items-center justify-center text-xl shrink-0">
                  {renderLogo(selectedConnector.logo)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold truncate">{selectedConnector.name}</h3>
                  <span className="text-xs text-violet-600 dark:text-violet-400 font-semibold">
                    Status: {connectedIds.includes(selectedConnector.id) ? 'Connected' : selectedConnector.badge}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-5 liquid-glass-subtle p-3.5 rounded-2xl">
                {selectedConnector.description}
              </p>

              <div className="space-y-2 mb-6 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-200/60 dark:border-white/10">
                  <span>Security Protocol:</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-right">OAuth 2.0 PKCE</span>
                </div>
                <div className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-200/60 dark:border-white/10">
                  <span>Data Isolation:</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-right">Tenant-isolated</span>
                </div>
              </div>

              <div className="flex justify-end gap-2.5">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedConnector(null)}
                  className="px-4 py-2 rounded-full text-xs font-semibold liquid-glass-orb text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Close
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    toggleConnection(selectedConnector.id);
                    setSelectedConnector(null);
                  }}
                  className={`px-5 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    connectedIds.includes(selectedConnector.id)
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'liquid-glass-cta'
                  }`}
                >
                  {connectedIds.includes(selectedConnector.id) ? 'Disconnect' : 'Connect'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* How to Connect Modal */}
      <AnimatePresence>
        {howToConnectItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={() => setHowToConnectItem(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/45 backdrop-blur-md select-none"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="liquid-glass-elevated text-slate-900 dark:text-white rounded-[30px] max-w-lg w-full p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setHowToConnectItem(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full liquid-glass-orb text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4 pr-10">
                <div className="w-10 h-10 rounded-[14px] liquid-glass-orb text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold truncate">How to connect {howToConnectItem.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Step-by-step authentication guide</p>
                </div>
              </div>

              <div className="space-y-3 mb-6 text-xs text-slate-600 dark:text-slate-300">
                {[
                  {
                    step: '1',
                    title: 'Authenticate through OAuth provider',
                    desc: 'Click "Connect" to open the official authorization flow.',
                  },
                  {
                    step: '2',
                    title: 'Confirm Scope Access',
                    desc: 'Approve permissions requested by Automate AI agents.',
                  },
                  {
                    step: '3',
                    title: 'Instant Context Grounding',
                    desc: 'Active across Chat and autonomous agents.',
                  },
                ].map((item) => (
                  <div key={item.step} className="p-3 rounded-2xl liquid-glass-subtle flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full liquid-glass-cta flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 tabular-nums">
                      {item.step}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2.5">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setHowToConnectItem(null)}
                  className="px-4 py-2 rounded-full text-xs font-semibold liquid-glass-orb text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Close
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    toggleConnection(howToConnectItem.id);
                    setHowToConnectItem(null);
                  }}
                  className="px-5 py-2 rounded-full text-xs font-semibold liquid-glass-cta cursor-pointer"
                >
                  Connect Now
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add MCP Modal */}
      <AnimatePresence>
        {isAddMcpOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={() => setIsAddMcpOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/45 backdrop-blur-md select-none"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="liquid-glass-elevated text-slate-900 dark:text-white rounded-[30px] max-w-md w-full p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsAddMcpOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full liquid-glass-orb text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4 pr-10">
                <div className="w-10 h-10 rounded-[14px] liquid-glass-orb text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <Plug className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Add Custom MCP Server</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Connect via Server-Sent Events (SSE) or stdio</p>
                </div>
              </div>

              <form onSubmit={handleAddMcpServer} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Server Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Production PostgreSQL MCP"
                    value={newMcpName}
                    onChange={(e) => setNewMcpName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs liquid-glass-input rounded-2xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Transport Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewMcpTransport('sse')}
                      className={`px-3 py-2 rounded-2xl text-xs font-semibold cursor-pointer ${
                        newMcpTransport === 'sse'
                          ? 'liquid-glass-droplet text-violet-700 dark:text-white'
                          : 'liquid-glass-subtle text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      SSE (HTTP/HTTPS)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMcpTransport('stdio')}
                      className={`px-3 py-2 rounded-2xl text-xs font-semibold cursor-pointer ${
                        newMcpTransport === 'stdio'
                          ? 'liquid-glass-droplet text-violet-700 dark:text-white'
                          : 'liquid-glass-subtle text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      stdio (Local command)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    {newMcpTransport === 'sse' ? 'SSE Endpoint URL *' : 'Command execution *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={newMcpTransport === 'sse' ? 'https://mcp.yourdomain.com/sse' : 'npx -y @modelcontextprotocol/server-...'}
                    value={newMcpEndpoint}
                    onChange={(e) => setNewMcpEndpoint(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs liquid-glass-input rounded-2xl focus:outline-none font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-200/60 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsAddMcpOpen(false)}
                    className="px-4 py-2 rounded-full text-xs font-semibold liquid-glass-orb text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full text-xs font-semibold liquid-glass-cta cursor-pointer"
                  >
                    Register MCP
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Platform Key Modal */}
      <AnimatePresence>
        {isCreateKeyOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={() => {
              setIsCreateKeyOpen(false);
              setNewKeyGenerated(null);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/45 backdrop-blur-md select-none"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="liquid-glass-elevated text-slate-900 dark:text-white rounded-[30px] max-w-md w-full p-5 sm:p-6 relative"
            >
              <button
                onClick={() => {
                  setIsCreateKeyOpen(false);
                  setNewKeyGenerated(null);
                }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full liquid-glass-orb text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4 pr-10">
                <div className="w-10 h-10 rounded-[14px] liquid-glass-orb text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Generate API Key</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Access Automate AI via programmatic REST API</p>
                </div>
              </div>

              {newKeyGenerated ? (
                <div className="space-y-4">
                  <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs text-emerald-800 dark:text-emerald-200">
                    <p className="font-bold mb-1">Make sure to copy your key now!</p>
                    <p className="text-[11px]">You won't be able to see it again for security reasons.</p>
                  </div>

                  <div className="flex items-center justify-between p-3 liquid-glass-subtle rounded-2xl font-mono text-xs">
                    <span className="truncate pr-2">{newKeyGenerated}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(newKeyGenerated);
                        showToast('Copied to clipboard!');
                      }}
                      className="w-8 h-8 rounded-full liquid-glass-orb flex items-center justify-center text-slate-600 dark:text-slate-200 shrink-0 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setIsCreateKeyOpen(false);
                      setNewKeyGenerated(null);
                    }}
                    className="w-full py-2.5 liquid-glass-cta rounded-full text-xs font-bold cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreatePlatformKey} className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                      Key Name / Identifier *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Next.js Production Backend"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs liquid-glass-input rounded-2xl focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-200/60 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => setIsCreateKeyOpen(false)}
                      className="px-4 py-2 rounded-full text-xs font-semibold liquid-glass-orb text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-full text-xs font-semibold liquid-glass-cta cursor-pointer"
                    >
                      Create Key
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Custom Tool Modal */}
      <AnimatePresence>
        {isCreateToolOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={() => setIsCreateToolOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/45 backdrop-blur-md select-none"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="liquid-glass-elevated text-slate-900 dark:text-white rounded-[30px] max-w-md w-full p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsCreateToolOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full liquid-glass-orb text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4 pr-10">
                <div className="w-10 h-10 rounded-[14px] liquid-glass-orb text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">New Custom REST Tool</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Configure HTTP webhook endpoint for agents</p>
                </div>
              </div>

              <form onSubmit={handleCreateCustomTool} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Tool Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Send SMS Notification"
                    value={newToolName}
                    onChange={(e) => setNewToolName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs liquid-glass-input rounded-2xl focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                      Method
                    </label>
                    <select
                      value={newToolMethod}
                      onChange={(e: any) => setNewToolMethod(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs liquid-glass-input rounded-2xl focus:outline-none"
                    >
                      <option value="GET" className="bg-white dark:bg-[#181826]">GET</option>
                      <option value="POST" className="bg-white dark:bg-[#181826]">POST</option>
                      <option value="PUT" className="bg-white dark:bg-[#181826]">PUT</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                      Endpoint URL *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://api.service.com/webhook"
                      value={newToolEndpoint}
                      onChange={(e) => setNewToolEndpoint(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs liquid-glass-input rounded-2xl focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Tool Purpose / Instruction
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Explain when and how the agent should call this tool..."
                    value={newToolDesc}
                    onChange={(e) => setNewToolDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs liquid-glass-input rounded-2xl focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-200/60 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsCreateToolOpen(false)}
                    className="px-4 py-2 rounded-full text-xs font-semibold liquid-glass-orb text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full text-xs font-semibold liquid-glass-cta cursor-pointer"
                  >
                    Create Tool
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
