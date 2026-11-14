import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  LayoutGrid,
  Tv,
  LayoutTemplate,
  Image as ImageIcon,
  Play,
  FileText,
  X,
  Plus,
  Trash2,
} from 'lucide-react';
import { LibraryAsset } from '../../types';

interface LibraryViewProps {
  assets: LibraryAsset[];
  onAddAsset: (asset: Partial<LibraryAsset>) => void;
  onDeleteAsset: (id: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  assets,
  onAddAsset,
  onDeleteAsset,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Infographics' | 'Designs' | 'Images' | 'Videos' | 'Prompts'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newAssetTitle, setNewAssetTitle] = useState('');
  const [newAssetDesc, setNewAssetDesc] = useState('');

  const filterTabs = [
    { id: 'All', label: 'All', icon: LayoutGrid },
    { id: 'Infographics', label: 'Infographics', icon: Tv },
    { id: 'Designs', label: 'Designs', icon: LayoutTemplate },
    { id: 'Images', label: 'Images', icon: ImageIcon },
    { id: 'Videos', label: 'Videos', icon: Play },
    { id: 'Prompts', label: 'Prompts', icon: FileText },
  ];

  const filteredAssets = assets.filter((asset) => {
    const matchesCategory =
      selectedFilter === 'All' || asset.category === selectedFilter;
    const matchesSearch =
      asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetTitle.trim()) return;
    onAddAsset({
      title: newAssetTitle.trim(),
      category: selectedFilter === 'All' ? 'Prompts' : selectedFilter,
      description: newAssetDesc.trim() || 'Saved workspace prompt asset',
      tags: ['Workspace', selectedFilter],
    });
    setNewAssetTitle('');
    setNewAssetDesc('');
    setIsAddOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full min-w-0 overflow-y-auto overflow-x-hidden bg-transparent text-slate-900 dark:text-white px-4 sm:px-6 lg:px-8 py-4 sm:py-5 select-none transition-colors">
      <div className="max-w-[1400px] w-full min-w-0 mx-auto space-y-5">
        {/* Title */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Library</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Saved visuals, infographics, designs, and reusable prompts.
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold liquid-glass-cta shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add asset</span>
          </motion.button>
        </div>

        {/* Filter Bar + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="inline-flex items-center gap-1 p-1 rounded-full liquid-glass-subtle overflow-x-auto max-w-full scrollbar-none">
            {filterTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedFilter === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedFilter(tab.id as any)}
                  className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs transition-colors shrink-0 cursor-pointer ${
                    isActive
                      ? 'text-slate-950 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="library-filter-droplet"
                      layout="position"
                      transition={{ type: 'spring', stiffness: 760, damping: 42, mass: 0.42 }}
                      className="absolute inset-0 rounded-full liquid-glass-droplet overflow-hidden"
                    >
                      <span className="absolute inset-x-2 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/55 to-transparent dark:from-white/25 pointer-events-none" />
                    </motion.span>
                  )}
                  <Icon className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">{tab.label}</span>
                </motion.button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs liquid-glass-input rounded-full text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Content Area */}
        {filteredAssets.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[320px] sm:min-h-[420px] text-center liquid-glass-card rounded-[28px] p-8">
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal">
              No items for this filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssets.map((asset) => (
              <motion.div
                key={asset.id}
                whileHover={{ y: -2 }}
                className="p-4 rounded-[24px] liquid-glass-card space-y-3 min-w-0 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full liquid-glass-subtle text-violet-700 dark:text-violet-300">
                      {asset.category}
                    </span>
                    <span className="text-[11px] text-slate-400 tabular-nums">{asset.size}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{asset.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{asset.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/60 dark:border-white/10 text-xs">
                  <span className="text-[11px] text-slate-400 tabular-nums">{asset.resolution || 'Asset'}</span>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => onDeleteAsset(asset.id)}
                    className="inline-flex items-center gap-1 text-slate-400 hover:text-red-500 text-xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Asset Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={() => setIsAddOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/45 backdrop-blur-md select-none"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', stiffness: 620, damping: 36, mass: 0.45 }}
              onClick={(e) => e.stopPropagation()}
              className="liquid-glass-elevated text-slate-900 dark:text-white rounded-[30px] max-w-md w-full p-5 sm:p-6 relative"
            >
              <button
                onClick={() => setIsAddOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full liquid-glass-orb text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-base font-bold mb-1 pr-8">Save Library Asset</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Add a reusable prompt or asset to {selectedFilter === 'All' ? 'Prompts' : selectedFilter}.</p>
              <form onSubmit={handleCreateAsset} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Asset Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Executive Summary Prompt"
                    value={newAssetTitle}
                    onChange={(e) => setNewAssetTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs liquid-glass-input rounded-2xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Optional notes or prompt template..."
                    value={newAssetDesc}
                    onChange={(e) => setNewAssetDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs liquid-glass-input rounded-2xl focus:outline-none resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-4 py-2 rounded-full text-xs font-semibold liquid-glass-orb text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full text-xs font-semibold liquid-glass-cta cursor-pointer"
                  >
                    Save Asset
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
