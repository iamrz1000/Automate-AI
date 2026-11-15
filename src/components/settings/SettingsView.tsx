import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Brain,
  CreditCard,
  Receipt,
  BarChart2,
  Link2,
  Plug,
  Key,
  Wrench,
  Clock,
  Trash2,
  Pencil,
  Mail,
  Calendar,
  Gift,
  Copy,
  Check,
  X,
  ChevronDown,
  Sparkles,
  Eye,
  EyeOff,
  LogOut,
  Plus,
  AlertTriangle,
  Menu,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { updatePassword, updateProfile } from 'firebase/auth';
import { auth, getFirebaseAuthErrorMessage } from '../../firebase';
import { UserProfile } from '../../types';
import { ALL_CONNECTORS, ALL_MCP_SERVERS } from '../../data/integrationsData';
import { UserAvatar } from '../common/UserAvatar';
import { LiquidGlassSwitch } from '../common/LiquidGlassPrimitives';

interface SettingsViewProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onOpenUpgrade: () => void;
  onSignOut: () => void;
  onDeleteAccount: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onUpdateUser,
  onOpenUpgrade,
  onSignOut,
  onDeleteAccount,
}) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [photoType, setPhotoType] = useState<'photo' | 'avatar'>('photo');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [displayName, setDisplayName] = useState(user.name || 'Member');
  const [email, setEmail] = useState(user.email || 'user@example.com');
  const [phoneNumber, setPhoneNumber] = useState(user.phone || '');
  const [dob] = useState(user.dob || '');
  const [role, setRole] = useState(user.jobTitle || (user.role === 'admin' ? 'Administrator' : 'Member'));
  const [organization, setOrganization] = useState(user.organization || '');
  const [colorMode, setColorMode] = useState<'light' | 'system' | 'dark'>(user.theme || 'dark');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [settingsToast, setSettingsToast] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(user.name || 'Member');
    setEmail(user.email || 'user@example.com');
    setPhoneNumber(user.phone || '');
    setRole(user.jobTitle || (user.role === 'admin' ? 'Administrator' : 'Member'));
    setOrganization(user.organization || '');
    setColorMode(user.theme || 'dark');
  }, [user.name, user.email, user.phone, user.jobTitle, user.role, user.organization, user.theme]);

  const triggerToast = (msg: string) => {
    setSettingsToast(msg);
    setTimeout(() => setSettingsToast(null), 2600);
  };

  const handleSaveProfile = async () => {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      triggerToast('Display name cannot be empty.');
      return;
    }
    setIsSavingProfile(true);
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: trimmedName.slice(0, 100),
        }).catch(() => {});
      }
      onUpdateUser({
        name: trimmedName,
        phone: phoneNumber.trim(),
        jobTitle: role,
        organization: organization.trim(),
      });
      triggerToast('Profile changes saved to cloud.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Security Form States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordToast, setPasswordToast] = useState(false);

  // File Retention States
  const [chatRetention, setChatRetention] = useState('7 days');
  const [agentRetention, setAgentRetention] = useState('6 months');
  const [generatedRetention, setGeneratedRetention] = useState('6 months');

  // Usages Date Filter
  const [usagePeriod, setUsagePeriod] = useState('7D');
  const [timeMode, setTimeMode] = useState<'UTC' | 'Local'>('Local');

  // Connectors & MCP Filter States
  const [settingsConnSearch, setSettingsConnSearch] = useState('');
  const [settingsMcpSearch, setSettingsMcpSearch] = useState('');
  const [settingsConnectedList, setSettingsConnectedList] = useState<string[]>(['github', 'slack', 'notion']);

  // Memory Tab States
  const [memories, setMemories] = useState<{ id: string; content: string; date: string }[]>([
    { id: 'm-1', content: 'Prefers TypeScript, modern React hooks, and Tailwind CSS.', date: 'Oct 28' },
    { id: 'm-2', content: 'Always include concise executive summaries before code blocks.', date: 'Oct 29' },
    { id: 'm-3', content: 'Preferred LLM model: Automate-X1 and Claude Opus 4.5.', date: 'Oct 31' },
  ]);
  const [newMemoryText, setNewMemoryText] = useState('');
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [autoSaveMemory, setAutoSaveMemory] = useState(true);

  const selectedInterests = [
    { label: 'Projects', icon: '📄' },
    { label: 'Development', icon: '💻' },
    { label: 'Content', icon: '🍰' },
    { label: 'AI & Auto', icon: '🤖' },
  ];

  const handleCopyCode = () => {
    navigator.clipboard.writeText('YR790F');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://app.automate.ai/signup?referral_code=YR790F');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      triggerToast('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerToast('Passwords do not match.');
      return;
    }
    if (!auth.currentUser) {
      triggerToast('Please sign in first to update your password.');
      return;
    }
    try {
      await updatePassword(auth.currentUser, newPassword);
      setPasswordToast(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordToast(false), 3000);
    } catch (error) {
      triggerToast(getFirebaseAuthErrorMessage(error));
    }
  };

  const mobileSettingsTabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'memory', label: 'Memory', icon: Brain },
    { id: 'subscription', label: 'Plans', icon: CreditCard },
    { id: 'billing', label: 'Billing', icon: Receipt },
    { id: 'usages', label: 'Usage', icon: BarChart2 },
    { id: 'connectors', label: 'Connectors', icon: Link2 },
    { id: 'mcp', label: 'MCP', icon: Plug },
    { id: 'api', label: 'API', icon: Key },
    { id: 'custom-tools', label: 'Tools', icon: Wrench },
    { id: 'file-retention', label: 'Privacy', icon: Clock },
  ];

  const renderNavItem = (
    item: { id: string; label: string; icon: React.ComponentType<{ className?: string }> },
    onSelectCloseDrawer?: () => void
  ) => {
    const Icon = item.icon;
    const active = activeTab === item.id;
    return (
      <motion.button
        key={item.id}
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          setActiveTab(item.id);
          onSelectCloseDrawer?.();
        }}
        className={`relative w-full flex items-center justify-between px-3 py-2 rounded-full text-xs transition-colors cursor-pointer ${
          active
            ? 'text-slate-950 dark:text-white font-semibold'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white font-medium'
        }`}
      >
        {active && (
          <motion.span
            layoutId="settings-active-tab"
            layout="position"
            transition={{ type: 'spring', stiffness: 760, damping: 42, mass: 0.42 }}
            className="absolute inset-0 rounded-full liquid-glass-droplet overflow-hidden"
          >
            <span className="absolute inset-x-2 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/55 to-transparent dark:from-white/25 pointer-events-none" />
          </motion.span>
        )}
        <div className="relative z-10 flex items-center gap-2.5">
          <Icon className={`w-3.5 h-3.5 ${active ? 'text-violet-600 dark:text-violet-300' : ''}`} />
          <span>{item.label}</span>
        </div>
      </motion.button>
    );
  };

  const renderSidebarNavContent = (onSelectCloseDrawer?: () => void) => (
    <>
      {/* User Card */}
      <div className="flex flex-col items-center text-center pb-4 mb-3 border-b border-slate-200/60 dark:border-white/10">
        <div className="mb-2.5">
          <UserAvatar
            name={displayName}
            role={role}
            size="lg"
            showStatusBadge={true}
          />
        </div>
        <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate max-w-full">{displayName}</h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[175px]">{email}</p>

        <div className="mt-2 flex items-center gap-1 px-2.5 py-0.5 rounded-full liquid-glass-subtle text-[10px] text-slate-700 dark:text-slate-200 font-semibold">
          <Sparkles className="w-2.5 h-2.5 text-violet-600 dark:text-violet-400" />
          <span>{user.plan || (user.role === 'admin' ? 'Enterprise Admin' : 'Free Plan')}</span>
        </div>
      </div>

      {/* Group: ACCOUNT */}
      <div className="mb-3">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase block mb-1.5 px-2.5">
          ACCOUNT
        </span>
        <div className="space-y-1">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'memory', label: 'Memory', icon: Brain },
          ].map((item) => renderNavItem(item, onSelectCloseDrawer))}
        </div>
      </div>

      {/* Group: BILLING */}
      <div className="mb-3">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase block mb-1.5 px-2.5">
          BILLING
        </span>
        <div className="space-y-1">
          {[
            { id: 'subscription', label: 'Subscription', icon: CreditCard },
            { id: 'billing', label: 'Billing', icon: Receipt },
            { id: 'usages', label: 'Usages', icon: BarChart2 },
          ].map((item) => renderNavItem(item, onSelectCloseDrawer))}
        </div>
      </div>

      {/* Group: INTEGRATIONS */}
      <div className="mb-3">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase block mb-1.5 px-2.5">
          INTEGRATIONS
        </span>
        <div className="space-y-1">
          {[
            { id: 'connectors', label: 'Connectors', icon: Link2 },
            { id: 'mcp', label: 'MCP (Beta)', icon: Plug },
            { id: 'api', label: 'API', icon: Key },
            { id: 'custom-tools', label: 'Custom Tools', icon: Wrench },
          ].map((item) => renderNavItem(item, onSelectCloseDrawer))}
        </div>
      </div>

      {/* Group: PRIVACY */}
      <div>
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase block mb-1.5 px-2.5">
          PRIVACY
        </span>
        <div className="space-y-1">
          {renderNavItem({ id: 'file-retention', label: 'File retention', icon: Clock }, onSelectCloseDrawer)}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setActiveTab('delete-account');
              setShowDeleteModal(true);
              onSelectCloseDrawer?.();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'delete-account'
                ? 'bg-red-500/15 text-red-600 dark:text-red-400 font-semibold border border-red-500/25'
                : 'text-red-600 dark:text-red-400 hover:bg-red-500/10'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete account</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setShowSignOutModal(true);
              onSelectCloseDrawer?.();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-full text-xs font-medium text-slate-500 hover:bg-black/5 dark:text-slate-400 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </motion.button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-transparent text-slate-900 dark:text-white select-none transition-colors min-w-0 w-full relative gap-2.5 p-2 sm:p-3">
      <AnimatePresence>
        {settingsToast && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full liquid-glass-elevated text-xs font-semibold flex items-center gap-2 max-w-[90vw]"
          >
            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">{settingsToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Translucent Liquid Glass Navigation Sidebar (Reference #6) */}
      <aside className="hidden md:flex w-60 rounded-[26px] liquid-glass flex-col p-4 shrink-0 overflow-y-auto">
        {renderSidebarNavContent()}
      </aside>

      {/* Mobile Settings Header & Horizontal Section Tabs */}
      <div className="md:hidden shrink-0 rounded-[22px] liquid-glass px-3 py-2.5 space-y-2 w-full">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setMobileMenuOpen(true)}
              className="w-8 h-8 rounded-full liquid-glass-orb text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 cursor-pointer"
              title="Open settings menu"
            >
              <Menu className="w-4 h-4" />
            </motion.button>
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
              Settings · {activeTab.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowSignOutModal(true)}
              className="px-3 py-1 rounded-full liquid-glass-orb text-slate-600 dark:text-slate-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign out</span>
            </motion.button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {mobileSettingsTabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <motion.button
                key={t.id}
                whileTap={{ scale: 0.94 }}
                onClick={() => setActiveTab(t.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'liquid-glass-droplet text-slate-950 dark:text-white'
                    : 'liquid-glass-subtle text-slate-600 dark:text-slate-300'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{t.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Mobile Slide-Over Settings Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/45 backdrop-blur-md z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 520, damping: 38, mass: 0.5 }}
              className="fixed inset-y-2.5 left-2.5 w-72 max-w-[85vw] z-50 md:hidden liquid-glass-elevated rounded-[28px] flex flex-col p-4 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Account Settings
                </span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-7 h-7 rounded-full liquid-glass-orb text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
              {renderSidebarNavContent(() => setMobileMenuOpen(false))}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Form Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden px-2 sm:px-4 md:px-6 py-2 sm:py-3 bg-transparent text-slate-900 dark:text-white transition-colors min-w-0">
        <div className="max-w-[1200px] w-full mx-auto space-y-5 min-w-0">
          {/* Breadcrumb */}
          <span className="hidden md:block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            ACCOUNT / {activeTab.replace('-', ' ').toUpperCase()}
          </span>

          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6 liquid-glass-card rounded-[28px] p-5 sm:p-6">
                {/* Photo / Avatar selector */}
                <div className="flex flex-col items-center">
                  <div className="mb-3">
                    <UserAvatar
                      name={displayName}
                      role={role}
                      size="xl"
                      showStatusBadge={true}
                    />
                  </div>

                  <div className="flex items-center p-1 liquid-glass-subtle rounded-full">
                    <button
                      onClick={() => setPhotoType('photo')}
                      className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                        photoType === 'photo'
                          ? 'liquid-glass-droplet text-slate-950 dark:text-white'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      Photo
                    </button>
                    <button
                      onClick={() => setPhotoType('avatar')}
                      className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                        photoType === 'avatar'
                          ? 'liquid-glass-droplet text-slate-950 dark:text-white'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      Avatar
                    </button>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                        DISPLAY NAME
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs liquid-glass-input rounded-2xl text-slate-900 dark:text-white focus:outline-none"
                        />
                        <Pencil className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                        EMAIL
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={email}
                          readOnly
                          className="w-full pl-9 pr-3.5 py-2.5 text-xs liquid-glass-input rounded-2xl text-slate-700 dark:text-slate-300 focus:outline-none"
                        />
                        <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                        PHONE NUMBER
                      </label>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1 px-3 py-2.5 liquid-glass-input rounded-2xl text-xs font-medium text-slate-700 dark:text-slate-300 shrink-0 tabular-nums">
                          <span>IN +91</span>
                          <ChevronDown className="w-3 h-3 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="flex-1 min-w-0 px-3.5 py-2.5 text-xs liquid-glass-input rounded-2xl text-slate-900 dark:text-white focus:outline-none tabular-nums"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                        DATE OF BIRTH
                      </label>
                      <div className="flex items-center gap-2 w-full px-3.5 py-2.5 text-xs liquid-glass-input rounded-2xl text-slate-900 dark:text-white tabular-nums">
                        <Calendar className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                        <span className="flex-1">{dob || 'Not specified'}</span>
                        <X className="w-3 h-3 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                        ROLE / PROFESSION <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={role}
                        onChange={(e) => {
                          setRole(e.target.value);
                          onUpdateUser({ jobTitle: e.target.value });
                        }}
                        className="w-full px-3.5 py-2.5 text-xs liquid-glass-input rounded-2xl text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="Student" className="bg-white dark:bg-[#181826]">Student</option>
                        <option value="Software Engineer" className="bg-white dark:bg-[#181826]">Software Engineer</option>
                        <option value="Researcher" className="bg-white dark:bg-[#181826]">Researcher</option>
                        <option value="Member" className="bg-white dark:bg-[#181826]">Member</option>
                        {user.isAdmin && (
                          <option value="Administrator" className="bg-white dark:bg-[#181826]">Administrator</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                        ORGANIZATION <span className="text-[10px] text-slate-400 font-normal lowercase">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs liquid-glass-input rounded-2xl text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Areas of Interest */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        AREAS OF INTEREST <span className="text-slate-400 font-normal lowercase text-[10px] tabular-nums">4 selected</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile}
                        className="px-4 py-1.5 rounded-full liquid-glass-cta text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isSavingProfile ? 'Saving...' : 'Save Profile'}</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedInterests.map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full liquid-glass-subtle text-xs font-medium text-slate-800 dark:text-slate-200"
                        >
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Referral & Appearance */}
              <div className="space-y-5">
                <div className="p-5 rounded-[28px] liquid-glass-card space-y-3.5">
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-2xl liquid-glass-orb flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                      <Gift className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">Referral invite</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Share with friends to get extra credit.</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Your code</span>
                    <div className="flex items-center justify-between px-3 py-2 liquid-glass-input rounded-2xl">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white tabular-nums">YR790F</span>
                      <button onClick={handleCopyCode} className="text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer">
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Share this link</span>
                    <div className="flex items-center justify-between gap-2 px-3 py-2 liquid-glass-input rounded-2xl min-w-0">
                      <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate min-w-0 flex-1">
                        https://app.automate.ai/signup?referral_code=YR790F
                      </span>
                      <button onClick={handleCopyLink} className="text-slate-400 hover:text-slate-800 dark:hover:text-white shrink-0 cursor-pointer">
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Appearance */}
                <div className="p-5 rounded-[28px] liquid-glass-card space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">Appearance</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Choose your Liquid Glass color mode</p>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div
                      onClick={() => {
                        setColorMode('light');
                        onUpdateUser({ theme: 'light' });
                      }}
                      className={`cursor-pointer rounded-2xl p-2 transition-all ${
                        colorMode === 'light'
                          ? 'liquid-glass-droplet ring-2 ring-violet-500/40'
                          : 'liquid-glass-subtle opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className="h-14 rounded-xl bg-[#eef3fb] p-1.5 border border-white/80 flex flex-col justify-between">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-6 rounded-full bg-slate-300" />
                          <div className="flex-1 space-y-1">
                            <div className="w-8 h-1 bg-slate-300 rounded" />
                            <div className="w-12 h-1 bg-slate-200 rounded" />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <div className="w-2.5 h-2.5 rounded-full bg-violet-600" />
                        </div>
                      </div>
                      <span className={`text-[11px] text-center block mt-1.5 font-medium ${colorMode === 'light' ? 'text-violet-600 dark:text-violet-300 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                        Light
                      </span>
                    </div>

                    <div
                      onClick={() => {
                        setColorMode('system');
                        onUpdateUser({ theme: 'system' });
                      }}
                      className={`cursor-pointer rounded-2xl p-2 transition-all ${
                        colorMode === 'system'
                          ? 'liquid-glass-droplet ring-2 ring-violet-500/40'
                          : 'liquid-glass-subtle opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className="h-14 rounded-xl overflow-hidden border border-slate-300/60 dark:border-white/15 flex">
                        <div className="w-1/2 bg-[#eef3fb] p-1 flex flex-col justify-between">
                          <div className="w-4 h-1 bg-slate-300 rounded" />
                        </div>
                        <div className="w-1/2 bg-[#090a14] p-1 flex flex-col justify-end items-end">
                          <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                        </div>
                      </div>
                      <span className={`text-[11px] text-center block mt-1.5 font-medium ${colorMode === 'system' ? 'text-violet-600 dark:text-violet-300 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                        System
                      </span>
                    </div>

                    <div
                      onClick={() => {
                        setColorMode('dark');
                        onUpdateUser({ theme: 'dark' });
                      }}
                      className={`cursor-pointer rounded-2xl p-2 transition-all ${
                        colorMode === 'dark'
                          ? 'liquid-glass-droplet ring-2 ring-violet-500/40'
                          : 'liquid-glass-subtle opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className="h-14 rounded-xl bg-[#090a14] p-1.5 border border-white/15 flex flex-col justify-between">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-6 rounded-full bg-slate-700" />
                          <div className="flex-1 space-y-1">
                            <div className="w-8 h-1 bg-slate-700 rounded" />
                            <div className="w-12 h-1 bg-slate-800 rounded" />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                        </div>
                      </div>
                      <span className={`text-[11px] text-center block mt-1.5 font-medium ${colorMode === 'dark' ? 'text-violet-600 dark:text-violet-300 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                        Dark
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SECURITY */}
          {activeTab === 'security' && (
            <div className="max-w-lg space-y-6 liquid-glass-card rounded-[28px] p-5 sm:p-6">
              {passwordToast && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs rounded-2xl flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Password updated securely.</span>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <Key className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  <h3>Change password</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Secure your account with a strong password.</p>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    NEW PASSWORD
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 text-xs liquid-glass-input rounded-2xl text-slate-900 dark:text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    CONFIRM PASSWORD
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 text-xs liquid-glass-input rounded-2xl text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 liquid-glass-cta font-semibold rounded-full text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Update password</span>
                </button>
              </form>

              <div className="pt-6 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Account access</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Sign out securely from this device.</p>
                </div>
                <button
                  onClick={() => setShowSignOutModal(true)}
                  className="px-3.5 py-2 liquid-glass-orb rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: MEMORY */}
          {activeTab === 'memory' && (
            <div className="max-w-xl space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Memory</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Add memories that Automate should remember across chats.</p>
                </div>
                <button
                  onClick={() => setIsAddingMemory(!isAddingMemory)}
                  className="px-4 py-2 liquid-glass-cta rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingMemory ? 'Cancel' : 'Add memory'}</span>
                </button>
              </div>

              {/* Auto-Save Toggle */}
              <div className="p-4 rounded-[22px] liquid-glass-card flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">Adaptive Learning</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Automatically capture preferences, tech stack choices, and formatting guidelines.</p>
                </div>
                <LiquidGlassSwitch
                  checked={autoSaveMemory}
                  onChange={setAutoSaveMemory}
                  accent="violet"
                  ariaLabel="Toggle Adaptive Learning Memory"
                />
              </div>

              {/* Add Memory Input Form */}
              {isAddingMemory && (
                <div className="p-4 rounded-[22px] liquid-glass-elevated space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    NEW MEMORY INSTRUCTION
                  </label>
                  <textarea
                    rows={2}
                    value={newMemoryText}
                    onChange={(e) => setNewMemoryText(e.target.value)}
                    placeholder="e.g. Always respond in TypeScript and include Jest test suites..."
                    className="w-full p-3 liquid-glass-input rounded-2xl text-xs text-slate-900 dark:text-white outline-none resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setIsAddingMemory(false);
                        setNewMemoryText('');
                      }}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold liquid-glass-orb text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (!newMemoryText.trim()) return;
                        setMemories((prev) => [
                          { id: `m-${Date.now()}`, content: newMemoryText.trim(), date: 'Just now' },
                          ...prev,
                        ]);
                        setNewMemoryText('');
                        setIsAddingMemory(false);
                      }}
                      className="px-4 py-1.5 liquid-glass-cta rounded-full text-xs font-bold cursor-pointer"
                    >
                      Save Memory
                    </button>
                  </div>
                </div>
              )}

              {/* Memory List */}
              <div className="space-y-2.5">
                {memories.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-[22px] liquid-glass-card flex items-center justify-between group"
                  >
                    <div className="flex items-start gap-2.5 pr-2">
                      <Brain className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-800 dark:text-slate-100 font-medium leading-relaxed">
                          {m.content}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-0.5 block tabular-nums">{m.date}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setMemories((prev) => prev.filter((item) => item.id !== m.id))}
                      className="w-8 h-8 rounded-full liquid-glass-orb text-slate-400 hover:text-red-500 transition-colors opacity-80 group-hover:opacity-100 shrink-0 flex items-center justify-center cursor-pointer"
                      title="Delete memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {memories.length === 0 && (
                  <div className="py-16 text-center text-xs text-slate-500 liquid-glass-card rounded-[24px]">
                    No memories saved yet. Click "Add memory" above.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SUBSCRIPTION */}
          {activeTab === 'subscription' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1 p-1 rounded-full liquid-glass-subtle text-xs font-medium overflow-x-auto max-w-full scrollbar-none">
                  {['Live', 'Not started', 'Included', 'Auto-pay'].map((t, i) => (
                    <span
                      key={t}
                      className={`px-3 py-1 rounded-full whitespace-nowrap shrink-0 ${
                        i === 0 ? 'liquid-glass-droplet text-slate-950 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <button
                  onClick={onOpenUpgrade}
                  className="px-4 py-2 liquid-glass-cta rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Upgrade plan</span>
                </button>
              </div>

              <div className="p-5 rounded-[24px] liquid-glass-card flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{user.plan || 'Free Plan'}</h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ongoing Access</p>
                  <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active</span>
                    <span>•</span>
                    <span>Free tier</span>
                    <span>•</span>
                    <span>No expiry</span>
                  </div>
                </div>

                <div className="text-right tabular-nums">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Credits left</span>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white">0.75 <span className="text-xs font-normal text-slate-400">USD</span></p>
                </div>
              </div>

              <div className="p-4 rounded-[22px] liquid-glass-card flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">Need Invoices?</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">View official GST tax invoices, past transactions, and payment history.</p>
                </div>
                <button
                  onClick={() => setActiveTab('billing')}
                  className="text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <span>View Invoices</span>
                  <span>&gt;</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: BILLING */}
          {activeTab === 'billing' && (
            <div className="space-y-5">
              <div className="p-4 rounded-[22px] liquid-glass-card flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{user.plan || 'Free Plan'}</span>
                </div>
                <span className="text-xs text-violet-600 dark:text-violet-400 font-bold">Free</span>
              </div>

              <div className="p-6 rounded-[24px] liquid-glass-card">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Invoices</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-6">What you have paid for.</p>

                <div className="py-12 text-center text-xs text-slate-500">
                  <Receipt className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">No invoices yet</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Invoices and payment receipts will appear here after your first paid purchase or renewal.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: USAGES */}
          {activeTab === 'usages' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="inline-flex items-center gap-1 p-1 rounded-full liquid-glass-subtle text-xs font-semibold overflow-x-auto max-w-full scrollbar-none">
                  {['1D', '3D', '7D', '30D', '90D', 'MTD', 'Last month'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setUsagePeriod(p)}
                      className={`px-3 py-1 rounded-full transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        usagePeriod === p
                          ? 'liquid-glass-droplet text-slate-950 dark:text-white font-bold'
                          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 p-1 liquid-glass-subtle rounded-full text-xs">
                  <button
                    onClick={() => setTimeMode('UTC')}
                    className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                      timeMode === 'UTC' ? 'liquid-glass-droplet text-slate-950 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    UTC
                  </button>
                  <button
                    onClick={() => setTimeMode('Local')}
                    className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                      timeMode === 'Local' ? 'liquid-glass-droplet text-slate-950 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Local
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 tabular-nums">
                <div className="p-4 rounded-[22px] liquid-glass-card">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">TOTAL TOKEN</span>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">0</p>
                </div>
                <div className="p-4 rounded-[22px] liquid-glass-card">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">TOTAL COST</span>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">--</p>
                </div>
              </div>

              <div className="p-5 rounded-[24px] liquid-glass-card">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Daily usage</span>
                </div>
                <div className="h-28 flex items-end justify-between gap-2 px-4 border-b border-slate-200/60 dark:border-white/10 pb-2">
                  {['26 Oct', '27 Oct', '28 Oct', '29 Oct', '30 Oct', '31 Oct'].map((d) => (
                    <div key={d} className="flex flex-col items-center gap-1 flex-1">
                      <div className="w-full bg-violet-500/35 rounded-t h-1 hover:h-6 transition-all" />
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 tabular-nums">{d}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-[24px] liquid-glass-card">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Usage events</span>
                  <button
                    onClick={() => triggerToast('No usage events available to export.')}
                    className="px-3.5 py-1.5 liquid-glass-orb text-slate-700 dark:text-slate-200 rounded-full text-xs font-semibold cursor-pointer"
                  >
                    Export CSV
                  </button>
                </div>
                <div className="py-10 text-center text-xs text-slate-500">
                  No usage yet
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: FILE RETENTION */}
          {activeTab === 'file-retention' && (
            <div className="max-w-xl space-y-6">
              <div className="p-4 rounded-[22px] liquid-glass-card flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">File retention</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">These are the default periods. A paid plan lets you change them.</p>
                </div>
                <button
                  onClick={onOpenUpgrade}
                  className="px-4 py-2 liquid-glass-cta rounded-full text-xs font-bold shrink-0 cursor-pointer"
                >
                  See plans
                </button>
              </div>

              <div className="space-y-4 text-xs p-5 rounded-[24px] liquid-glass-card">
                <div>
                  <label className="font-bold text-slate-900 dark:text-white block mb-1">Chat uploads</label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">Files you attach in a chat.</p>
                  <div className="flex flex-wrap gap-2">
                    {['7 days', '30 days', '6 months', '1 year', '2 years', 'Unlimited'].map((p) => (
                      <button
                        key={p}
                        onClick={() => setChatRetention(p)}
                        className={`px-3 py-1.5 rounded-full font-semibold transition-colors duration-150 cursor-pointer ${
                          chatRetention === p
                            ? 'liquid-glass-droplet text-slate-950 dark:text-white'
                            : 'liquid-glass-subtle text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-900 dark:text-white block mb-1">Agent data sources</label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">Files you add to an agent.</p>
                  <div className="flex flex-wrap gap-2">
                    {['7 days', '30 days', '6 months', '1 year', '2 years', 'Unlimited'].map((p) => (
                      <button
                        key={p}
                        onClick={() => setAgentRetention(p)}
                        className={`px-3 py-1.5 rounded-full font-semibold transition-colors duration-150 cursor-pointer ${
                          agentRetention === p
                            ? 'liquid-glass-droplet text-slate-950 dark:text-white'
                            : 'liquid-glass-subtle text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-900 dark:text-white block mb-1">Generated files</label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">Images, videos, PPT, docs, and other files Automate creates.</p>
                  <div className="flex flex-wrap gap-2">
                    {['7 days', '30 days', '6 months', '1 year', '2 years', 'Unlimited'].map((p) => (
                      <button
                        key={p}
                        onClick={() => setGeneratedRetention(p)}
                        className={`px-3 py-1.5 rounded-full font-semibold transition-colors duration-150 cursor-pointer ${
                          generatedRetention === p
                            ? 'liquid-glass-droplet text-slate-950 dark:text-white'
                            : 'liquid-glass-subtle text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CONNECTORS */}
          {activeTab === 'connectors' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Connectors</h3>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full liquid-glass-subtle text-violet-700 dark:text-violet-300 tabular-nums">
                      {ALL_CONNECTORS.length} Available
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Connect third-party workspaces to ground agents in real enterprise context.</p>
                </div>
                <input
                  type="text"
                  placeholder="Search connectors..."
                  value={settingsConnSearch}
                  onChange={(e) => setSettingsConnSearch(e.target.value)}
                  className="px-3.5 py-2 liquid-glass-input rounded-full text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none w-full sm:w-56"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[560px] overflow-y-auto pr-1">
                {ALL_CONNECTORS.filter((c) =>
                  c.name.toLowerCase().includes(settingsConnSearch.toLowerCase()) ||
                  c.description.toLowerCase().includes(settingsConnSearch.toLowerCase())
                ).map((c) => {
                  const isConn = settingsConnectedList.includes(c.id);
                  return (
                    <div
                      key={c.id}
                      className="p-4 rounded-[22px] liquid-glass-card flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl liquid-glass-orb flex items-center justify-center font-bold text-xs text-violet-600 dark:text-violet-400 shrink-0">
                            {c.logo.slice(0, 2)}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                              {c.name}
                            </h4>
                            <span className="text-[10px] text-slate-400 capitalize">{c.category || 'Productivity'}</span>
                          </div>
                        </div>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isConn
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                              : c.badgeType === 'desktop'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                              : 'liquid-glass-subtle text-slate-500 dark:text-slate-300'
                          }`}
                        >
                          {isConn ? 'Connected' : c.badge}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                        {c.description}
                      </p>

                      {c.errorNotice && (
                        <p className="text-[10px] text-red-500 dark:text-red-400 mb-2 font-medium">
                          ⚠ {c.errorNotice}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-white/10">
                        <span className="text-[10px] text-slate-400">
                          {c.id.includes('api') ? 'API Secret' : 'OAuth 2.0'}
                        </span>
                        <button
                          onClick={() => {
                            if (isConn) {
                              setSettingsConnectedList((prev) => prev.filter((id) => id !== c.id));
                            } else {
                              setSettingsConnectedList((prev) => [...prev, c.id]);
                            }
                          }}
                          className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-colors cursor-pointer ${
                            isConn
                              ? 'bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/25'
                              : 'liquid-glass-cta'
                          }`}
                        >
                          {isConn ? 'Disconnect' : 'Connect'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: MCP (Beta) */}
          {activeTab === 'mcp' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Model Context Protocol (MCP)</h3>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full liquid-glass-subtle text-violet-700 dark:text-violet-300 tabular-nums">
                      {ALL_MCP_SERVERS.length} Servers
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Standardized protocol enabling AI models to directly discover and call your enterprise tools.</p>
                </div>
                <input
                  type="text"
                  placeholder="Search MCP servers..."
                  value={settingsMcpSearch}
                  onChange={(e) => setSettingsMcpSearch(e.target.value)}
                  className="px-3.5 py-2 liquid-glass-input rounded-full text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none w-full sm:w-56"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[560px] overflow-y-auto pr-1">
                {ALL_MCP_SERVERS.filter((s) =>
                  s.name.toLowerCase().includes(settingsMcpSearch.toLowerCase()) ||
                  s.description.toLowerCase().includes(settingsMcpSearch.toLowerCase())
                ).map((s) => {
                  const isConn = settingsConnectedList.includes(`mcp-${s.id}`);
                  return (
                    <div
                      key={s.id}
                      className="p-4 rounded-[22px] liquid-glass-card flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl liquid-glass-orb flex items-center justify-center font-bold text-xs text-violet-600 dark:text-violet-400 shrink-0">
                            {s.logo.slice(0, 2)}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white">{s.name}</h4>
                            <span className="text-[10px] text-slate-400 font-mono">MCP Tool Server</span>
                          </div>
                        </div>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isConn
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                              : 'liquid-glass-subtle text-slate-500 dark:text-slate-300'
                          }`}
                        >
                          {isConn ? 'Connected' : s.badge}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                        {s.description}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-white/10">
                        <span className="text-[10px] text-violet-600 dark:text-violet-400 font-medium">
                          {s.oauthUrl ? 'Remote MCP' : 'Local Protocol'}
                        </span>
                        <button
                          onClick={() => {
                            if (isConn) {
                              setSettingsConnectedList((prev) => prev.filter((id) => id !== `mcp-${s.id}`));
                            } else {
                              setSettingsConnectedList((prev) => [...prev, `mcp-${s.id}`]);
                            }
                          }}
                          className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-colors cursor-pointer ${
                            isConn
                              ? 'bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/25'
                              : 'liquid-glass-cta'
                          }`}
                        >
                          {isConn ? 'Disconnect' : 'Connect'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: API (BYOK) */}
          {activeTab === 'api' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Bring Your Own Key (BYOK)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Supply your own API credentials to run unlimited inferences at direct provider cost.</p>
              </div>

              <div className="space-y-3">
                {[
                  { provider: 'OpenAI Provider', placeholder: 'Configured on server', hasKey: true },
                  { provider: 'Anthropic Provider', placeholder: 'Configured on server', hasKey: true },
                  { provider: 'Google Gemini Engine', placeholder: 'Managed via environment secret', hasKey: true },
                  { provider: 'DeepSeek Provider', placeholder: 'Not configured', hasKey: false },
                  { provider: 'Groq Cloud Provider', placeholder: 'Not configured', hasKey: false },
                ].map((k) => (
                  <div key={k.provider} className="p-4 rounded-[22px] liquid-glass-card flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{k.provider}</h4>
                      <p className="font-mono text-[11px] text-slate-400 mt-0.5">{k.hasKey ? '••••••••••••••••••••••••' : k.placeholder}</p>
                    </div>
                    <button
                      onClick={() => triggerToast(`Saved configuration for ${k.provider}`)}
                      className="px-3.5 py-1.5 liquid-glass-orb rounded-full text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      {k.hasKey ? 'Update' : 'Configure'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: CUSTOM TOOLS */}
          {activeTab === 'custom-tools' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Custom Webhooks & REST Tools</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Expose custom HTTP endpoints for autonomous agents to call with schema validation.</p>
                </div>
                <button
                  onClick={() => triggerToast('Custom Tool editor available inside the Integrate tab.')}
                  className="px-4 py-2 liquid-glass-cta rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Custom Tool</span>
                </button>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'Internal Vector Search Hook', method: 'POST', endpoint: 'https://api.internal.org/v1/search', status: 'Healthy' },
                  { name: 'Slack Announcement Dispatcher', method: 'POST', endpoint: 'https://hooks.slack.com/services/...', status: 'Healthy' },
                ].map((t) => (
                  <div key={t.name} className="p-4 rounded-[22px] liquid-glass-card flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full liquid-glass-subtle text-violet-700 dark:text-violet-300">
                          {t.method}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">{t.name}</h4>
                      </div>
                      <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">{t.endpoint}</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">{t.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: DELETE ACCOUNT */}
          {activeTab === 'delete-account' && (
            <div className="max-w-2xl space-y-6">
              <div className="p-6 rounded-[28px] liquid-glass-card border-red-500/30 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Danger Zone: Permanent Account Deletion</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Once you delete your account, there is no going back. Please be certain. All data linked to your email ({user.email}) will be permanently removed.
                    </p>
                  </div>
                </div>

                <div className="liquid-glass-subtle p-4 rounded-2xl text-xs text-slate-700 dark:text-slate-300 space-y-2">
                  <div className="font-semibold text-red-600 dark:text-red-400">The following data will be permanently erased:</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-500 dark:text-slate-400">
                    <li>All custom AI agents and agent chat session histories</li>
                    <li>Scheduled recurring cron tasks and automation runners</li>
                    <li>Library designs, saved workflows, prompts, and assets</li>
                    <li>Third-party integrations, OAuth tokens, and custom API keys</li>
                    <li>Active subscription plan, referral code ({user.referralCode || 'YR790F'}), and bonus credits</li>
                  </ul>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200/60 dark:border-white/10">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Deletion starts immediately upon confirmation.
                  </span>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold rounded-full text-xs flex items-center gap-1.5 shadow-md shadow-red-600/20 transition-all cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete account</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL 1: PERMANENT ACCOUNT DELETION CONFIRMATION */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md"
            onClick={() => {
              setShowDeleteModal(false);
              setDeleteConfirmText('');
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-[30px] liquid-glass-elevated p-6 space-y-5 text-slate-900 dark:text-white"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-500/15 flex items-center justify-center text-red-500">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Account?</h3>
                    <p className="text-xs text-red-500 font-medium">This action cannot be undone.</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                  }}
                  className="w-8 h-8 rounded-full liquid-glass-orb text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                You are about to permanently delete your Automate AI profile (<strong className="text-slate-900 dark:text-white">{user.name}</strong> &bull; {user.email}) and all associated agents and workflows.
              </p>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  To confirm deletion, please type <span className="font-mono text-red-500 font-bold">DELETE</span>:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3.5 py-2.5 rounded-2xl liquid-glass-input focus:outline-none text-xs text-slate-900 dark:text-white font-mono uppercase tracking-wider"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200/60 dark:border-white/10">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                  }}
                  className="px-4 py-2 rounded-full text-xs font-semibold liquid-glass-orb text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  disabled={deleteConfirmText.trim() !== 'DELETE' || isDeleting}
                  onClick={() => {
                    setIsDeleting(true);
                    setTimeout(() => {
                      setIsDeleting(false);
                      setShowDeleteModal(false);
                      onDeleteAccount();
                    }, 800);
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-md ${
                    deleteConfirmText.trim() === 'DELETE'
                      ? 'bg-red-600 hover:bg-red-700 cursor-pointer shadow-red-600/30'
                      : 'bg-red-950/40 text-red-300/40 cursor-not-allowed border border-red-500/20'
                  }`}
                >
                  {isDeleting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Deleting account...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Permanently Delete</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 2: SIGN OUT CONFIRMATION */}
      <AnimatePresence>
        {showSignOutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md"
            onClick={() => setShowSignOutModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-[30px] liquid-glass-elevated p-6 space-y-4 text-slate-900 dark:text-white"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl liquid-glass-orb flex items-center justify-center text-violet-600 dark:text-violet-400">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Sign out?</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Ready to end your current session?</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                You will be signed out from this browser. You can sign back in anytime with your account credentials.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200/60 dark:border-white/10">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => setShowSignOutModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold liquid-glass-orb text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Stay signed in
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => {
                    setShowSignOutModal(false);
                    onSignOut();
                  }}
                  className="px-4 py-2 liquid-glass-cta font-bold rounded-full text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
