import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Plus, Check } from 'lucide-react';

interface ConnectorsSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectorsSheetModal: React.FC<ConnectorsSheetModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [tab, setTab] = useState<'Connectors' | 'MCP'>('Connectors');
  const [search, setSearch] = useState('');
  const [connectedIds, setConnectedIds] = useState<string[]>([]);

  const connectors = [
    { id: 'bitbucket', name: 'Bitbucket', status: 'Connect', icon: '⎔' },
    { id: 'confluence', name: 'Confluence', status: 'Connect', icon: '▲▼' },
    { id: 'dropbox', name: 'DropBox', status: 'Connect', icon: '❖' },
    { id: 'dynamodb', name: 'DynamoDB', status: 'Connect', icon: '☲' },
    { id: 'facebook', name: 'Facebook', status: 'Coming Soon', icon: 'f' },
    { id: 'github', name: 'GitHub', status: 'Connect', icon: '🐙' },
    { id: 'gitlab', name: 'GitLab', status: 'Connect', icon: '🦊' },
    { id: 'gmail', name: 'Gmail', status: 'Coming Soon', icon: '✉' },
    { id: 'adsense', name: 'Google AdSense', status: 'Connect', icon: '◰' },
    { id: 'gcal', name: 'Google Calendar', status: 'Coming Soon', icon: '📅' },
    { id: 'gdoc', name: 'Google Document', status: 'Coming Soon', icon: '📄' },
    { id: 'gdrive', name: 'Google Drive', status: 'Coming Soon', icon: '📁' },
    { id: 'gforms', name: 'Google Forms', status: 'Coming Soon', icon: '📋' },
    { id: 'gmeet', name: 'Google Meet', status: 'Coming Soon', icon: '📹' },
    { id: 'gsheets', name: 'Google Sheets', status: 'Coming Soon', icon: '📊' },
    { id: 'gslides', name: 'Google Slides', status: 'Coming Soon', icon: '📽️' },
    { id: 'gworkspace', name: 'Google Workspace', status: 'Connect', icon: '🏢' },
    { id: 'jira', name: 'Jira', status: 'Connect', icon: '🔷' },
    { id: 'linkedin', name: 'LinkedIn', status: 'Coming Soon', icon: 'in' },
    { id: 'meta_ads', name: 'Meta Ads Manager', status: 'Coming Soon', icon: '∞' },
    { id: 'm365', name: 'Microsoft365', status: 'Connect', icon: '⊞' },
    { id: 'mongodb', name: 'MongoDB', status: 'Connect', icon: '🍃' },
    { id: 'mysql', name: 'MySQL', status: 'Connect', icon: '🐬' },
    { id: 'notion', name: 'Notion', status: 'Coming Soon', icon: 'N' },
    { id: 'onedrive', name: 'One Drive', status: 'Connect', icon: '☁️' },
    { id: 'outlook', name: 'Outlook', status: 'Connect', icon: '📧' },
    { id: 'redis', name: 'Redis', status: 'Connect', icon: '🔴' },
    { id: 'slack', name: 'Slack', status: 'Connect', icon: '#' },
    { id: 'sqlite', name: 'SQLite', status: 'Connect', icon: '🗄️' },
    { id: 'stripe', name: 'Stripe', status: 'Coming Soon', icon: 'S' },
    { id: 'tg_bot', name: 'Telegram Bot', status: 'Connect', icon: '✈️' },
    { id: 'tg_user', name: 'Telegram User', status: 'Connect', icon: '👤' },
    { id: 'wa_biz', name: 'WhatsApp Business', status: 'Coming Soon', icon: '💬' },
    { id: 'x', name: 'X', status: 'Connect', icon: '𝕏' },
    { id: 'youtube', name: 'YouTube', status: 'Connect', icon: '▶' },
    { id: 'zoho_books', name: 'Zoho Books', status: 'Connect', icon: '📚' },
    { id: 'zoho_crm', name: 'Zoho CRM', status: 'Connect', icon: '👥' },
  ];

  const mcpList = [
    { id: 'asana', name: 'Asana', status: 'Connect', icon: '●●●' },
    { id: 'atlassian', name: 'Atlassian', status: 'Connect', icon: '▲' },
    { id: 'cloudflare', name: 'Cloudflare', status: 'Connect', icon: '☁️' },
    { id: 'github_mcp', name: 'GitHub', status: 'Connect', icon: '🐙' },
    { id: 'higgsfield', name: 'Higgsfield', status: 'Connect', icon: '🌌' },
    { id: 'linear', name: 'Linear', status: 'Connect', icon: '📐' },
    { id: 'notion_mcp', name: 'Notion', status: 'Connect', icon: 'N' },
    { id: 'runway', name: 'Runway', status: 'Connect', icon: '🎬' },
    { id: 'sentry', name: 'Sentry', status: 'Connect', icon: '🛡️' },
    { id: 'slack_mcp', name: 'Slack', status: 'Connect', icon: '#' },
    { id: 'stripe_mcp', name: 'Stripe', status: 'Connect', icon: 'S' },
    { id: 'supabase', name: 'Supabase', status: 'Connect', icon: '⚡' },
    { id: 'x_mcp', name: 'X', status: 'Connect', icon: '𝕏' },
  ];

  const currentList = tab === 'Connectors' ? connectors : mcpList;
  const filtered = currentList.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleConnect = (id: string) => {
    setConnectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
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
            {/* Top Header Row */}
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-900/10 dark:border-white/10 gap-2.5">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[150px] sm:max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={`Search ${tab.toLowerCase()}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs liquid-glass-input rounded-full text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              {/* Center Tabs with Droplet Indicator */}
              <div className="flex items-center gap-1 p-1 liquid-glass-subtle rounded-full text-xs font-semibold relative">
                {(['Connectors', 'MCP'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`relative px-3.5 py-1 rounded-full transition-colors cursor-pointer ${
                      tab === t ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {tab === t && (
                      <motion.div
                        layoutId="connectors-sheet-tab"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                        className="absolute inset-0 rounded-full liquid-glass-droplet"
                      />
                    )}
                    <span className="relative z-10">{t}</span>
                  </button>
                ))}
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-2 ml-auto sm:ml-0">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1 px-3 py-1.5 liquid-glass-orb rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add {tab === 'Connectors' ? 'connector' : 'MCP'}</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-8 h-8 rounded-full liquid-glass-orb flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Section Title */}
            <div className="py-2.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                ALL {tab === 'Connectors' ? 'CONNECTORS' : 'MCP'} ({filtered.length})
              </span>
            </div>

            {/* 2-Column Grid */}
            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filtered.map((item) => {
                const isConnected = connectedIds.includes(item.id);
                const isComingSoon = item.status === 'Coming Soon';

                return (
                  <motion.div
                    whileHover={{ y: -1 }}
                    key={item.id}
                    className="p-2.5 rounded-2xl liquid-glass-card flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl liquid-glass-orb flex items-center justify-center font-bold text-sm shrink-0 text-slate-800 dark:text-slate-100">
                        {item.icon}
                      </div>
                      <span className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate">
                        {item.name}
                      </span>
                    </div>

                    <div>
                      {isComingSoon ? (
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 liquid-glass-subtle px-2.5 py-1 rounded-full shrink-0">
                          Coming Soon
                        </span>
                      ) : (
                        <motion.button
                          whileTap={{ scale: 0.94 }}
                          onClick={() => toggleConnect(item.id)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                            isConnected
                              ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-700 dark:text-emerald-300 flex items-center gap-1'
                              : 'liquid-glass-cta'
                          }`}
                        >
                          {isConnected ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Connected</span>
                            </>
                          ) : (
                            'Connect'
                          )}
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
