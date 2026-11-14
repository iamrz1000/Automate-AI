import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Users,
  MessageSquare,
  Activity,
  Search,
  RefreshCw,
  UserCheck,
  UserX,
  Trash2,
  Sliders,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Lock,
  Eye,
  AlertTriangle,
  Crown,
  Copy,
  Check,
  X,
} from 'lucide-react';
import { UserProfile, AuthAuditLog, AdminUserData } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import { apiUrl } from '../../utils/platform';

interface AdminViewProps {
  currentUser: UserProfile;
  onUpdateUserRole?: (updatedUser: Partial<UserProfile>) => void;
  onNavigateToChat?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  currentUser,
  onUpdateUserRole,
  onNavigateToChat,
}) => {
  const isAdmin = currentUser.role === 'admin' || currentUser.isAdmin === true;

  const [activeTab, setActiveTab] = useState<'users' | 'conversations' | 'audit'>('users');
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuthAuditLog[]>([]);
  const [stats, setStats] = useState<{
    totalUsers: number;
    adminCount: number;
    activeToday: number;
    totalConversations: number;
    totalUserMessages: number;
    systemUptime: string;
    modelStatus: string;
  }>({
    totalUsers: 5,
    adminCount: 1,
    activeToday: 4,
    totalConversations: 28,
    totalUserMessages: 142,
    systemUptime: '99.98%',
    modelStatus: 'Operational',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user' | 'suspended'>('all');
  const [auditFilter, setAuditFilter] = useState<string>('all');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Chat Inspector State
  const [selectedUserForChat, setSelectedUserForChat] = useState<AdminUserData | null>(null);
  const [userConversations, setUserConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoadingConvs, setIsLoadingConvs] = useState(false);

  // Confirmation Modals
  const [roleChangeTarget, setRoleChangeTarget] = useState<{
    user: AdminUserData;
    targetRole: 'admin' | 'user';
  } | null>(null);

  const [editingLimitUser, setEditingLimitUser] = useState<AdminUserData | null>(null);
  const [customLimitValue, setCustomLimitValue] = useState<number>(15);

  const [suspendTarget, setSuspendTarget] = useState<AdminUserData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserData | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  // Fetch Admin Data
  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, logsRes, statsRes] = await Promise.all([
        fetch(apiUrl('/api/admin/users')),
        fetch(apiUrl('/api/admin/audit-logs')),
        fetch(apiUrl('/api/admin/stats')),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setAuditLogs(logsData);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  // Execute Role Change after Confirmation Dialog
  const handleConfirmRoleChange = async () => {
    if (!roleChangeTarget) return;
    const { user, targetRole } = roleChangeTarget;

    try {
      const res = await fetch(apiUrl(`/api/admin/users/${user.id}/role`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole }),
      });

      if (res.ok) {
        showToast(
          targetRole === 'admin'
            ? `Successfully promoted ${user.name} to Administrator`
            : `Successfully demoted ${user.name} to Standard Member`
        );
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id
              ? {
                  ...u,
                  role: targetRole,
                  plan: targetRole === 'admin' ? 'Enterprise SuperAdmin' : 'Free Member',
                  dailyLimit: targetRole === 'admin' ? 999999 : 15,
                }
              : u
          )
        );

        if (currentUser.id === user.id && onUpdateUserRole) {
          onUpdateUserRole({ role: targetRole, isAdmin: targetRole === 'admin' });
        }

        fetch(apiUrl('/api/admin/audit-logs'))
          .then((r) => r.json())
          .then(setAuditLogs);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update user role.');
      }
    } catch (err) {
      console.error('Role update failed:', err);
    } finally {
      setRoleChangeTarget(null);
    }
  };

  // Save Daily Limit after Confirmation
  const handleSaveLimit = async () => {
    if (!editingLimitUser) return;
    try {
      const res = await fetch(apiUrl(`/api/admin/users/${editingLimitUser.id}/limit`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyLimit: Number(customLimitValue) }),
      });
      if (res.ok) {
        showToast(`Updated daily message quota to ${customLimitValue >= 99999 ? 'Unlimited' : customLimitValue} for ${editingLimitUser.name}`);
        setUsers((prev) =>
          prev.map((u) => (u.id === editingLimitUser.id ? { ...u, dailyLimit: Number(customLimitValue) } : u))
        );
        setEditingLimitUser(null);
        fetch(apiUrl('/api/admin/audit-logs'))
          .then((r) => r.json())
          .then(setAuditLogs);
      }
    } catch (err) {
      console.error('Limit update failed:', err);
    }
  };

  // Toggle User Status (Active / Suspended)
  const handleConfirmStatusToggle = async () => {
    if (!suspendTarget) return;
    const nextStatus = suspendTarget.status === 'suspended' ? 'active' : 'suspended';

    try {
      const res = await fetch(apiUrl(`/api/admin/users/${suspendTarget.id}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        showToast(`Account for ${suspendTarget.name} has been set to ${nextStatus.toUpperCase()}`);
        setUsers((prev) => prev.map((u) => (u.id === suspendTarget.id ? { ...u, status: nextStatus } : u)));
      }
    } catch (err) {
      console.error('Status toggle failed:', err);
    } finally {
      setSuspendTarget(null);
    }
  };

  // Delete User Confirmation
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(apiUrl(`/api/admin/users/${deleteTarget.id}`), { method: 'DELETE' });
      if (res.ok) {
        showToast(`User ${deleteTarget.name} (${deleteTarget.email}) removed.`);
        setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to delete user.');
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleteTarget(null);
    }
  };

  // Inspect User Chat History
  const handleInspectChat = async (user: AdminUserData) => {
    setSelectedUserForChat(user);
    setIsLoadingConvs(true);
    setActiveTab('conversations');
    try {
      const res = await fetch(apiUrl(`/api/admin/users/${user.id}/conversations`));
      if (res.ok) {
        const convs = await res.json();
        setUserConversations(convs);
        if (convs.length > 0) {
          setActiveConversationId(convs[0].id);
        } else {
          setActiveConversationId(null);
        }
      }
    } catch (err) {
      console.error('Failed to load user conversations:', err);
    } finally {
      setIsLoadingConvs(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());

    if (roleFilter === 'admin') return matchesSearch && u.role === 'admin';
    if (roleFilter === 'user') return matchesSearch && u.role === 'user';
    if (roleFilter === 'suspended') return matchesSearch && u.status === 'suspended';
    return matchesSearch;
  });

  const filteredLogs = auditLogs.filter((log) => {
    if (auditFilter === 'all') return true;
    return log.action === auditFilter;
  });

  const activeConversation = userConversations.find((c) => c.id === activeConversationId);

  // Security Barrier: Only authorized admins can view this page
  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-transparent text-slate-900 dark:text-white">
        <div className="liquid-glass-elevated rounded-[30px] p-8 max-w-md w-full flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-red-500/15 border border-red-500/25 text-red-500 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Restricted Access</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            The administrative control center is restricted to authorized platform administrators. If you believe this is an error, please contact your workspace administrator.
          </p>
          {onNavigateToChat && (
            <button
              onClick={onNavigateToChat}
              className="px-5 py-2.5 rounded-full liquid-glass-cta font-semibold text-xs cursor-pointer"
            >
              Return to Workspace
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full w-full min-w-0 overflow-hidden bg-transparent text-slate-900 dark:text-slate-100 transition-colors p-2 sm:p-3 gap-2.5">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-full liquid-glass-elevated text-slate-900 dark:text-white font-medium text-xs flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Liquid Glass Executive Header */}
      <header className="px-4 sm:px-5 py-3.5 rounded-[24px] liquid-glass flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl liquid-glass-cta flex items-center justify-center text-white shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate">
                Admin Management Console
              </h1>
              <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                SuperAdmin
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              User governance, role elevations, and real-time security audit trails
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={fetchAdminData}
            disabled={isLoading}
            className="p-2 sm:px-3.5 sm:py-2 rounded-full liquid-glass-orb text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </motion.button>

          {onNavigateToChat && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onNavigateToChat}
              className="px-3.5 py-2 rounded-full liquid-glass-cta text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Workspace</span>
            </motion.button>
          )}
        </div>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0 tabular-nums">
        <div className="p-3.5 rounded-[22px] liquid-glass-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl liquid-glass-orb text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
              {stats.totalUsers}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              Total Users ({stats.adminCount} Admins)
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-[22px] liquid-glass-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl liquid-glass-orb text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
              {stats.activeToday}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              Active Sessions Today
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-[22px] liquid-glass-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl liquid-glass-orb text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
              {stats.totalUserMessages}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              Messages Processed
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-[22px] liquid-glass-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl liquid-glass-orb text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
              Unlimited
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              Admin Quota (vs 15/day member)
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="inline-flex items-center gap-1 p-1 rounded-full liquid-glass-subtle shrink-0 overflow-x-auto max-w-full scrollbar-none self-start">
        {[
          { id: 'users' as const, label: 'User Directory & Roles', icon: Users, badge: String(users.length) },
          {
            id: 'conversations' as const,
            label: 'User Chat Inspector',
            icon: MessageSquare,
            badge: selectedUserForChat ? selectedUserForChat.name.split(' ')[0] : undefined,
          },
          { id: 'audit' as const, label: 'Security Audit Trail', icon: Clock, badge: 'Live' },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                active
                  ? 'text-slate-950 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="admin-active-tab"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  className="absolute inset-0 rounded-full liquid-glass-droplet"
                />
              )}
              <Icon className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">{tab.label}</span>
              {tab.badge && (
                <span className="relative z-10 px-2 py-0.5 rounded-full text-[10px] liquid-glass-subtle font-bold tabular-nums">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto px-1 sm:px-2 py-2">
        {/* TAB 1: USERS DIRECTORY */}
        {activeTab === 'users' && (
          <div className="space-y-4 max-w-7xl mx-auto">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by user name or Gmail address..."
                  className="w-full pl-10 pr-4 py-2 rounded-full liquid-glass-input text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div className="inline-flex items-center gap-1 p-1 rounded-full liquid-glass-subtle overflow-x-auto scrollbar-none">
                {(['all', 'admin', 'user', 'suspended'] as const).map((r) => {
                  const active = roleFilter === r;
                  const label =
                    r === 'all'
                      ? `All (${users.length})`
                      : r === 'admin'
                      ? `Admins (${users.filter((u) => u.role === 'admin').length})`
                      : r === 'user'
                      ? `Members (${users.filter((u) => u.role === 'user').length})`
                      : `Suspended (${users.filter((u) => u.status === 'suspended').length})`;
                  return (
                    <button
                      key={r}
                      onClick={() => setRoleFilter(r)}
                      className={`relative px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer tabular-nums ${
                        active
                          ? 'text-slate-950 dark:text-white font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="admin-role-filter"
                          transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                          className="absolute inset-0 rounded-full liquid-glass-droplet"
                        />
                      )}
                      <span className="relative z-10">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-[24px] liquid-glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="liquid-glass-subtle border-b border-slate-200/60 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Gmail Address</th>
                      <th className="py-3 px-4">Role & Permissions</th>
                      <th className="py-3 px-4">Daily Quota</th>
                      <th className="py-3 px-4">Today's Inferences</th>
                      <th className="py-3 px-4">History</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-white/5">
                    {filteredUsers.map((u) => {
                      const isRootAdmin = u.email === 'iamrz100@gmail.com';
                      const isTargetAdmin = u.role === 'admin';

                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-white/30 dark:hover:bg-white/[0.04] transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <UserAvatar name={u.name} email={u.email} size="sm" showOnlineStatus />
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>{u.name}</span>
                                  {isRootAdmin && (
                                    <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 tabular-nums">
                                  Joined {new Date(u.joinedAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <span>{u.email}</span>
                              <button
                                onClick={() => handleCopyEmail(u.email)}
                                className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                                title="Copy Email"
                              >
                                {copiedEmail === u.email ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              {isTargetAdmin ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                                  <Crown className="w-3 h-3 text-amber-400" />
                                  ADMIN
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium liquid-glass-subtle text-violet-600 dark:text-violet-300">
                                  MEMBER
                                </span>
                              )}

                              <span
                                className={`w-2 h-2 rounded-full ${
                                  u.status === 'suspended' ? 'bg-red-500' : 'bg-emerald-500'
                                }`}
                                title={u.status === 'suspended' ? 'Suspended' : 'Active'}
                              />
                            </div>
                          </td>

                          <td className="py-3.5 px-4 tabular-nums">
                            <div className="flex items-center gap-1.5">
                              {isTargetAdmin || u.dailyLimit >= 99999 ? (
                                <span className="font-bold text-amber-500 dark:text-amber-300 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-amber-400" />
                                  Unlimited (&infin;)
                                </span>
                              ) : (
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {u.dailyLimit} msgs / day
                                </span>
                              )}

                              {!isRootAdmin && (
                                <button
                                  onClick={() => {
                                    setEditingLimitUser(u);
                                    setCustomLimitValue(u.dailyLimit);
                                  }}
                                  className="w-6 h-6 rounded-full liquid-glass-orb flex items-center justify-center text-slate-400 hover:text-violet-500 transition-colors cursor-pointer"
                                  title="Adjust daily limit"
                                >
                                  <Sliders className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 tabular-nums">
                            <div className="flex flex-col gap-1 w-24">
                              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                                <span>{u.messagesToday} msgs</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-white/10 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    u.messagesToday >= u.dailyLimit && !isTargetAdmin
                                      ? 'bg-red-500'
                                      : 'bg-violet-500'
                                  }`}
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      (u.messagesToday / (u.dailyLimit >= 99999 ? 100 : u.dailyLimit || 15)) * 100
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleInspectChat(u)}
                              className="px-2.5 py-1 rounded-full liquid-glass-orb text-slate-700 hover:text-violet-600 dark:text-slate-200 dark:hover:text-violet-300 font-medium text-[11px] flex items-center gap-1 transition-colors cursor-pointer tabular-nums"
                            >
                              <Eye className="w-3 h-3" />
                              <span>{u.conversationsCount || 0} Chats</span>
                            </button>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isRootAdmin && (
                                <button
                                  onClick={() =>
                                    setRoleChangeTarget({
                                      user: u,
                                      targetRole: isTargetAdmin ? 'user' : 'admin',
                                    })
                                  }
                                  className={`px-3 py-1 rounded-full font-semibold text-[11px] transition-colors cursor-pointer ${
                                    isTargetAdmin
                                      ? 'bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300 hover:bg-amber-500/25'
                                      : 'liquid-glass-cta'
                                  }`}
                                >
                                  {isTargetAdmin ? 'Demote to User' : 'Make Admin'}
                                </button>
                              )}

                              {!isRootAdmin && (
                                <button
                                  onClick={() => setSuspendTarget(u)}
                                  className="w-7 h-7 rounded-full liquid-glass-orb flex items-center justify-center text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                                  title={u.status === 'suspended' ? 'Reactivate User' : 'Suspend User'}
                                >
                                  {u.status === 'suspended' ? (
                                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <UserX className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}

                              {!isRootAdmin && (
                                <button
                                  onClick={() => setDeleteTarget(u)}
                                  className="w-7 h-7 rounded-full liquid-glass-orb flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {isRootAdmin && (
                                <span className="text-[10px] font-bold text-amber-500 uppercase px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">
                                  Primary Root Admin
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredUsers.map((u) => {
                const isRootAdmin = u.email === 'iamrz100@gmail.com';
                const isTargetAdmin = u.role === 'admin';

                return (
                  <div
                    key={u.id}
                    className="p-4 rounded-[22px] liquid-glass-card space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar name={u.name} email={u.email} size="sm" showOnlineStatus />
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-900 dark:text-white truncate flex items-center gap-1">
                            <span>{u.name}</span>
                            {isRootAdmin && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                          </div>
                          <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {u.email}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        {isTargetAdmin ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                            ADMIN
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium liquid-glass-subtle text-violet-500 dark:text-violet-300">
                            MEMBER
                          </span>
                        )}
                        <span
                          className={`w-2 h-2 rounded-full ${
                            u.status === 'suspended' ? 'bg-red-500' : 'bg-emerald-500'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-300 tabular-nums">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Quota:</span>
                        <span className="font-semibold">
                          {isTargetAdmin || u.dailyLimit >= 99999 ? 'Unlimited' : `${u.dailyLimit} msgs/day`}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Today:</span>
                        <span className="font-semibold">{u.messagesToday} msgs used</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleInspectChat(u)}
                        className="px-3 py-1.5 rounded-full liquid-glass-orb text-xs text-slate-700 dark:text-slate-200 font-medium flex items-center gap-1 cursor-pointer tabular-nums"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Chats ({u.conversationsCount || 0})</span>
                      </button>

                      {!isRootAdmin && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              setRoleChangeTarget({
                                user: u,
                                targetRole: isTargetAdmin ? 'user' : 'admin',
                              })
                            }
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                              isTargetAdmin
                                ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                                : 'liquid-glass-cta'
                            }`}
                          >
                            {isTargetAdmin ? 'Demote' : 'Make Admin'}
                          </button>

                          <button
                            onClick={() => {
                              setEditingLimitUser(u);
                              setCustomLimitValue(u.dailyLimit);
                            }}
                            className="w-8 h-8 rounded-full liquid-glass-orb text-slate-400 flex items-center justify-center cursor-pointer"
                            title="Quota"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: USER CHAT INSPECTOR */}
        {activeTab === 'conversations' && (
          <div className="max-w-7xl mx-auto h-full flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-[24px] liquid-glass-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl liquid-glass-orb text-violet-500 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Inspecting Member Conversations
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Audit user queries, generation requests, and AI responses.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedUserForChat?.id || ''}
                  onChange={(e) => {
                    const u = users.find((x) => x.id === e.target.value);
                    if (u) handleInspectChat(u);
                  }}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-2xl liquid-glass-input text-xs text-slate-900 dark:text-white font-medium focus:outline-none"
                >
                  <option value="" disabled className="bg-white dark:bg-[#181826]">
                    Select User to Inspect...
                  </option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id} className="bg-white dark:bg-[#181826]">
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[440px]">
              {/* Thread List */}
              <div className="p-4 rounded-[24px] liquid-glass-card flex flex-col gap-2 overflow-y-auto">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-2 flex items-center justify-between tabular-nums">
                  <span>Chat Threads</span>
                  <span>{userConversations.length}</span>
                </div>

                {isLoadingConvs ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-violet-500" />
                    Loading threads...
                  </div>
                ) : userConversations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                    No recorded chat sessions for this user yet.
                  </div>
                ) : (
                  userConversations.map((conv) => {
                    const isSelected = conv.id === activeConversationId;
                    return (
                      <button
                        key={conv.id}
                        onClick={() => setActiveConversationId(conv.id)}
                        className={`p-3 rounded-2xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'liquid-glass-droplet text-slate-950 dark:text-white'
                            : 'liquid-glass-subtle text-slate-700 dark:text-slate-300 hover:border-violet-400/40'
                        }`}
                      >
                        <div className="font-semibold text-xs truncate mb-1">
                          {conv.title || 'Untitled Conversation'}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between tabular-nums">
                          <span>{conv.messages?.length || 0} messages</span>
                          <span>{conv.timestamp ? new Date(conv.timestamp).toLocaleDateString() : 'Recent'}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Message History Content */}
              <div className="md:col-span-2 p-4 sm:p-5 rounded-[24px] liquid-glass-card flex flex-col overflow-y-auto">
                {activeConversation ? (
                  <div className="space-y-4">
                    <div className="pb-3 border-b border-slate-200/60 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {activeConversation.title}
                        </h4>
                        <span className="text-[11px] text-slate-500 break-all">
                          {selectedUserForChat?.name} &bull; {selectedUserForChat?.email}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold liquid-glass-subtle text-violet-600 dark:text-violet-300 shrink-0 tabular-nums">
                        Thread ID: {activeConversation.id}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {activeConversation.messages?.map((msg: any, idx: number) => {
                        const isUser = msg.role === 'user';
                        return (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                              isUser
                                ? 'liquid-glass-bubble-user text-white ml-2 sm:ml-6'
                                : 'liquid-glass-subtle text-slate-800 dark:text-slate-200 mr-2 sm:mr-6'
                            }`}
                          >
                            <div className="font-bold text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                              {isUser ? (
                                <span className="text-white/90">
                                  👤 {selectedUserForChat?.name || 'User'}
                                </span>
                              ) : (
                                <span className="text-violet-600 dark:text-violet-400 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  <span>Automate AI Assistant</span>
                                </span>
                              )}
                            </div>
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="m-auto text-center text-xs text-slate-400 max-w-sm p-4">
                    <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No Thread Selected</p>
                    <p className="text-slate-500 mt-1">Select a conversation thread to inspect its prompt dialogue.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="space-y-4 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Real-Time Authentication & Security Audit Trail
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Immutable record of sign-ins, account creations, role changes, and IP addresses.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={auditFilter}
                  onChange={(e) => setAuditFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-2xl liquid-glass-input text-xs text-slate-900 dark:text-white font-medium focus:outline-none"
                >
                  <option value="all" className="bg-white dark:bg-[#181826]">All Events ({auditLogs.length})</option>
                  <option value="SIGN_IN" className="bg-white dark:bg-[#181826]">Sign In Only</option>
                  <option value="SIGN_UP" className="bg-white dark:bg-[#181826]">Sign Up Only</option>
                  <option value="ROLE_CHANGED" className="bg-white dark:bg-[#181826]">Role Changes</option>
                  <option value="LIMIT_UPDATED" className="bg-white dark:bg-[#181826]">Limit Updates</option>
                </select>
              </div>
            </div>

            <div className="rounded-[24px] liquid-glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="liquid-glass-subtle border-b border-slate-200/60 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Event</th>
                      <th className="py-3 px-4">Account Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">IP Address</th>
                      <th className="py-3 px-4">User Agent / Client</th>
                      <th className="py-3 px-4 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-white/5 font-mono text-[11px] tabular-nums">
                    {filteredLogs.map((log) => {
                      const isSuccess = log.status === 'SUCCESS';
                      const isSignUp = log.action === 'SIGN_UP';
                      const isSignIn = log.action === 'SIGN_IN';
                      const isRole = log.action === 'ROLE_CHANGED';

                      return (
                        <tr
                          key={log.id}
                          className="hover:bg-white/30 dark:hover:bg-white/[0.04] transition-colors"
                        >
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-sans font-bold whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] tracking-wide ${
                                isSignUp
                                  ? 'bg-blue-500/15 text-blue-500'
                                  : isSignIn
                                  ? 'bg-violet-500/15 text-violet-500 dark:text-violet-300'
                                  : isRole
                                  ? 'bg-amber-500/15 text-amber-500 dark:text-amber-300'
                                  : 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-300'
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                            {log.email}
                          </td>
                          <td className="py-3 px-4 uppercase text-[10px]">
                            <span
                              className={
                                log.role === 'admin'
                                  ? 'text-amber-500 font-bold'
                                  : 'text-slate-400'
                              }
                            >
                              {log.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                            {log.ip}
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                            {log.userAgent}
                          </td>
                          <td className="py-3 px-4 text-right font-sans font-bold">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] ${
                                isSuccess
                                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-red-500/20 text-red-500'
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CONFIRMATION DIALOG: ROLE PROMOTION / DEMOTION */}
      <AnimatePresence>
        {roleChangeTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md p-6 rounded-[30px] liquid-glass-elevated space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl liquid-glass-orb flex items-center justify-center ${
                      roleChangeTarget.targetRole === 'admin'
                        ? 'text-amber-500'
                        : 'text-violet-500'
                    }`}
                  >
                    {roleChangeTarget.targetRole === 'admin' ? (
                      <Crown className="w-5 h-5 text-amber-400" />
                    ) : (
                      <Users className="w-5 h-5 text-violet-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {roleChangeTarget.targetRole === 'admin'
                        ? 'Promote User to Administrator?'
                        : 'Demote Administrator to Member?'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Security Clearance Action</p>
                  </div>
                </div>
                <button
                  onClick={() => setRoleChangeTarget(null)}
                  className="w-8 h-8 rounded-full liquid-glass-orb text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl liquid-glass-subtle text-xs text-slate-700 dark:text-slate-300 space-y-2">
                <div className="font-semibold text-slate-900 dark:text-white">
                  Target Account: {roleChangeTarget.user.name} ({roleChangeTarget.user.email})
                </div>
                {roleChangeTarget.targetRole === 'admin' ? (
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    Promoting this account to <strong>Administrator</strong> will grant them full access to the admin management dashboard, ability to inspect user chat logs, modify user daily limits, and provide unlimited daily AI inferences.
                  </p>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    Demoting this account to <strong>Standard Member</strong> will revoke all administrator privileges, block access to the admin console, and reinstate the standard 15 messages/day limit.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRoleChangeTarget(null)}
                  className="px-4 py-2 rounded-full text-xs font-semibold liquid-glass-orb text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRoleChange}
                  className={`px-4 py-2 rounded-full text-xs font-bold text-white shadow-md transition-all cursor-pointer ${
                    roleChangeTarget.targetRole === 'admin'
                      ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                      : 'liquid-glass-cta'
                  }`}
                >
                  {roleChangeTarget.targetRole === 'admin' ? 'Confirm Promotion' : 'Confirm Demotion'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION DIALOG: ADJUST DAILY LIMIT */}
      <AnimatePresence>
        {editingLimitUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-[30px] liquid-glass-elevated space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-violet-500" />
                  <span>Adjust User Daily Limit</span>
                </h3>
                <button
                  onClick={() => setEditingLimitUser(null)}
                  className="w-8 h-8 rounded-full liquid-glass-orb text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Set maximum messages per 24h for <strong className="text-violet-600 dark:text-violet-400">{editingLimitUser.name}</strong> ({editingLimitUser.email}).
              </p>

              <div className="space-y-3">
                <input
                  type="number"
                  min="1"
                  max="999999"
                  value={customLimitValue}
                  onChange={(e) => setCustomLimitValue(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl liquid-glass-input text-sm text-slate-900 dark:text-white focus:outline-none tabular-nums"
                />

                <div className="flex flex-wrap gap-2">
                  {[15, 50, 100, 500, 999999].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCustomLimitValue(val)}
                      className={`flex-1 min-w-[56px] py-1.5 px-2 rounded-full text-xs font-semibold transition-all cursor-pointer tabular-nums ${
                        customLimitValue === val
                          ? 'liquid-glass-droplet text-slate-950 dark:text-white'
                          : 'liquid-glass-subtle text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {val >= 99999 ? '∞ Max' : val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingLimitUser(null)}
                  className="px-4 py-2 rounded-full text-xs font-semibold liquid-glass-orb text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveLimit}
                  className="px-4 py-2 rounded-full liquid-glass-cta text-xs font-bold cursor-pointer"
                >
                  Apply Limit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION DIALOG: SUSPEND / REACTIVATE */}
      <AnimatePresence>
        {suspendTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-[30px] liquid-glass-elevated space-y-4"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>
                  {suspendTarget.status === 'suspended' ? 'Reactivate Account?' : 'Suspend Account?'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {suspendTarget.status === 'suspended'
                  ? `Reactivate ${suspendTarget.name}'s account and allow them to sign in and interact with Automate AI.`
                  : `Suspending will block ${suspendTarget.name} (${suspendTarget.email}) from logging in and accessing AI models until reactivated.`}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setSuspendTarget(null)}
                  className="px-4 py-2 rounded-full text-xs font-semibold liquid-glass-orb text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmStatusToggle}
                  className="px-4 py-2 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/30 cursor-pointer"
                >
                  {suspendTarget.status === 'suspended' ? 'Reactivate' : 'Suspend User'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION DIALOG: DELETE USER */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-[30px] liquid-glass-elevated border-red-500/30 space-y-4"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                <span>Permanently Delete User?</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                This will permanently delete <strong className="text-red-500 dark:text-red-400">{deleteTarget.name}</strong> ({deleteTarget.email}) and all their conversations, tasks, and agents. This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 rounded-full text-xs font-semibold liquid-glass-orb text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30 cursor-pointer"
                >
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
