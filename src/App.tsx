import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NavTab, ModelInfo, Agent, ScheduledTask, LibraryAsset, IntegrationConnector, UserProfile, WorkflowDefinition } from './types';
import { MODELS_CATALOG } from './data/models';
import { NavigationRail } from './components/layout/NavigationRail';
import { TopBar } from './components/layout/TopBar';
import { UpgradeModal } from './components/layout/UpgradeModal';
import { GiftModal } from './components/layout/GiftModal';
import { ChatView } from './components/chat/ChatView';
import { AgentsView } from './components/agents/AgentsView';
import { TasksView } from './components/tasks/TasksView';
import { LibraryView } from './components/library/LibraryView';
import { IntegrationsView } from './components/integrations/IntegrationsView';
import { ModelsView } from './components/models/ModelsView';
import { SettingsView } from './components/settings/SettingsView';
import { AuthView } from './components/auth/AuthView';
import { AdminView } from './components/admin/AdminView';
import { LiquidSearchOverlay } from './components/common/LiquidSearchOverlay';
import { LiveConversationModal } from './components/chat/LiveConversationModal';
import { LiquidGlassCardRefraction } from './components/common/LiquidGlassPrimitives';
import { triggerHaptic, getGlassHapticStyle } from './utils/haptics';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('chat');
  const [selectedModel, setSelectedModel] = useState<ModelInfo>(MODELS_CATALOG[0]);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isGiftOpen, setIsGiftOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickLiveOpen, setIsQuickLiveOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [themePulseKey, setThemePulseKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );

  // Authentication State with localStorage session persistence
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('automate_auth_user');
      return !!stored;
    } catch {
      return false;
    }
  });
  const [authNotice, setAuthNotice] = useState<{ type: 'info' | 'warning' | 'success'; message: string } | null>(null);

  // Application Data States
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [libraryAssets, setLibraryAssets] = useState<LibraryAsset[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationConnector[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    let initialTheme: 'light' | 'dark' | 'system' = 'dark';
    try {
      const storedTheme = localStorage.getItem('automate_theme');
      if (storedTheme === 'light' || storedTheme === 'dark') {
        initialTheme = storedTheme;
      }
    } catch {}

    try {
      const storedUser = localStorage.getItem('automate_auth_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        return {
          ...parsed,
          theme: initialTheme,
        };
      }
    } catch {}

    return {
      id: 'usr-guest-00',
      name: 'User',
      email: '',
      role: 'user',
      isAdmin: false,
      organization: '',
      timezone: 'UTC',
      plan: 'Free Member',
      theme: initialTheme,
      dailyLimit: 15,
      messagesToday: 0,
      imagesToday: 0,
      referralCode: 'REF' + Math.floor(1000 + Math.random() * 9000),
      referralCount: 0,
      referralCredits: 0,
      areasOfInterest: ['AI Chat', 'Automation'],
    };
  });

  // Fetch initial data from server
  useEffect(() => {
    fetch('/api/agents')
      .then((res) => res.json())
      .then((data) => setAgents(data))
      .catch((err) => console.error('Failed to load agents:', err));

    fetch('/api/tasks')
      .then((res) => res.json())
      .then((data) => setTasks(data))
      .catch((err) => console.error('Failed to load tasks:', err));

    fetch('/api/library')
      .then((res) => res.json())
      .then((data) => setLibraryAssets(data))
      .catch((err) => console.error('Failed to load library:', err));

    fetch('/api/integrations')
      .then((res) => res.json())
      .then((data) => setIntegrations(data))
      .catch((err) => console.error('Failed to load integrations:', err));

    // Only sync /api/user if authenticated
    if (localStorage.getItem('automate_auth_user')) {
      fetch('/api/user')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.email) {
            setUserProfile((prev) => ({
              ...prev,
              ...data,
            }));
          }
        })
        .catch((err) => console.error('Failed to load user:', err));
    }
  }, []);

  // Synchronize documentElement class whenever theme changes
  useEffect(() => {
    const isDark =
      userProfile.theme === 'dark' ||
      (userProfile.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [userProfile.theme]);

  // Subtle tactile haptic feedback on all interactive button & glass UI clicks
  useEffect(() => {
    const handleInteractiveClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const interactiveEl = target.closest<HTMLElement>(
        'button, [role="button"], .cursor-pointer.liquid-glass-orb, .cursor-pointer.liquid-glass-cta, .cursor-pointer.liquid-glass-droplet, .cursor-pointer.liquid-glass-card'
      );
      if (!interactiveEl) return;

      if (
        (interactiveEl as HTMLButtonElement).disabled ||
        interactiveEl.getAttribute('aria-disabled') === 'true' ||
        interactiveEl.classList.contains('cursor-not-allowed')
      ) {
        return;
      }

      triggerHaptic(getGlassHapticStyle(interactiveEl));
    };

    document.addEventListener('click', handleInteractiveClick, true);
    return () => {
      document.removeEventListener('click', handleInteractiveClick, true);
    };
  }, []);

  // Unified animated Light/Dark theme transition handler
  const handleToggleTheme = () => {
    const currentTheme = userProfile.theme || 'dark';
    const nextTheme: 'dark' | 'light' = currentTheme === 'dark' ? 'light' : 'dark';

    setThemePulseKey((k) => k + 1);

    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    try {
      localStorage.setItem('automate_theme', nextTheme);
    } catch {}

    setUserProfile((prev) => ({ ...prev, theme: nextTheme }));
    handleUpdateUser({ theme: nextTheme });
  };

  // Handlers
  const handleCreateAgent = async (newAgent: Partial<Agent>) => {
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAgent),
      });
      const created = await res.json();
      setAgents((prev) => [created, ...prev]);
    } catch (err) {
      console.error('Agent creation failed:', err);
    }
  };

  const handleSelectAgentForChat = (agent: Agent) => {
    // Look up model matching agent
    const matchingModel =
      MODELS_CATALOG.find((m) => m.id === agent.model) || selectedModel;
    setSelectedModel(matchingModel);
    setActiveTab('chat');
  };

  const handleCreateTask = async (newTask: Partial<ScheduledTask>) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });
      const created = await res.json();
      setTasks((prev) => [created, ...prev]);
    } catch (err) {
      console.error('Task creation failed:', err);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/toggle`, { method: 'PATCH' });
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err) {
      console.error('Task toggle failed:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error('Task delete failed:', err);
    }
  };

  const handleAddLibraryAsset = async (newAsset: Partial<LibraryAsset>) => {
    try {
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAsset),
      });
      const created = await res.json();
      setLibraryAssets((prev) => [created, ...prev]);
    } catch (err) {
      console.error('Library add failed:', err);
    }
  };

  const handleDeleteLibraryAsset = async (id: string) => {
    try {
      await fetch(`/api/library/${id}`, { method: 'DELETE' });
      setLibraryAssets((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Library delete failed:', err);
    }
  };

  const handleToggleIntegration = async (id: string) => {
    try {
      const res = await fetch(`/api/integrations/${id}/toggle`, { method: 'POST' });
      const updated = await res.json();
      setIntegrations((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch (err) {
      console.error('Integration toggle failed:', err);
    }
  };

  const handleUpdateUser = async (updated: Partial<UserProfile>) => {
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      setUserProfile(data);
    } catch (err) {
      console.error('User update failed:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Sign out failed:', err);
    }
    try {
      localStorage.removeItem('automate_auth_user');
    } catch {}
    setIsAuthenticated(false);
    setAuthNotice({
      type: 'info',
      message: 'You have been signed out successfully. Sign back in anytime to continue.',
    });
  };

  const handleDeleteAccount = async () => {
    try {
      await fetch('/api/user', { method: 'DELETE' });
    } catch (err) {
      console.error('Account deletion request failed:', err);
    }
    try {
      localStorage.removeItem('automate_auth_user');
    } catch {}

    const resetUser: UserProfile = {
      name: 'User',
      email: '',
      role: 'user',
      isAdmin: false,
      organization: '',
      timezone: 'UTC',
      plan: 'Free Member',
      theme: userProfile.theme || 'dark',
      dailyLimit: 15,
      messagesToday: 0,
      imagesToday: 0,
      referralCode: 'REF100',
      referralCount: 0,
      referralCredits: 0,
      areasOfInterest: ['AI Chat', 'Automation'],
    };

    setUserProfile(resetUser);
    setActiveTab('chat');
    setIsAuthenticated(false);
    setAuthNotice({
      type: 'warning',
      message: 'Your account and workspace data have been deleted. You can create a new account or sign in below.',
    });
  };

  const handleLogin = (profileData: Partial<UserProfile>) => {
    const isAdmin = profileData.role === 'admin' || profileData.isAdmin || profileData.email?.toLowerCase() === 'iamrz100@gmail.com';
    const updatedUser: UserProfile = {
      ...userProfile,
      ...profileData,
      name: profileData.name || (isAdmin ? 'Admin' : 'Member'),
      email: profileData.email || (isAdmin ? 'iamrz100@gmail.com' : 'user@example.com'),
      role: isAdmin ? 'admin' : (profileData.role || 'user'),
      isAdmin,
      dailyLimit: profileData.dailyLimit ?? (isAdmin ? 999999 : 15),
    };
    setUserProfile(updatedUser);
    try {
      localStorage.setItem('automate_auth_user', JSON.stringify(updatedUser));
    } catch {}
    handleUpdateUser(updatedUser);
    setIsAuthenticated(true);
    setAuthNotice(null);
  };

  // If user is not authenticated, render the full AuthView (Login & Sign Up screen)
  if (!isAuthenticated) {
    return (
      <AuthView
        onLogin={handleLogin}
        notice={authNotice}
        theme={userProfile.theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  return (
    <div className="liquid-ambient-canvas flex h-[100dvh] w-full max-w-full overflow-hidden text-slate-900 dark:text-slate-50 select-none md:p-2.5 md:gap-2.5 relative">
      {/* Animated Cursor-Tracking Radial Liquid Light Refraction across all .liquid-glass-card elements */}
      <LiquidGlassCardRefraction />

      {/* Subtle Radial Atmospheric Wash on Light <-> Dark Transition */}
      <AnimatePresence mode="popLayout">
        {themePulseKey > 0 && (
          <motion.div
            key={themePulseKey}
            initial={{ opacity: 0.42, scale: 0.7 }}
            animate={{ opacity: 0, scale: 1.45 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none fixed inset-0 z-50 bg-radial from-white/55 via-violet-400/15 to-transparent dark:from-indigo-500/35 dark:via-slate-950/30 dark:to-transparent"
          />
        )}
      </AnimatePresence>

      {/* 1. Primary Navigation Rail (Reorderable via long press + mobile quick-action '+' orb) */}
      <NavigationRail
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenUpgrade={() => setIsUpgradeOpen(true)}
        onOpenGift={() => setIsGiftOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        theme={userProfile.theme || 'dark'}
        onToggleTheme={handleToggleTheme}
        currentUser={userProfile}
      />

      {/* 2. Main Content Boundary */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 md:rounded-[28px] md:liquid-glass md:overflow-hidden relative">
        {/* Top Bar with Sidebar toggle, Automate AI logo, morphing search, theme switch, and upgrade */}
        <TopBar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
          onOpenUpgrade={() => setIsUpgradeOpen(true)}
          onOpenGift={() => setIsGiftOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          isSearchOpen={isSearchOpen}
          selectedModel={selectedModel}
          onSelectModelClick={() => setActiveTab('models')}
          theme={userProfile.theme || 'dark'}
          onToggleTheme={handleToggleTheme}
          currentUser={userProfile}
          onNavigateToAdmin={() => setActiveTab('admin')}
        />

        {/* 3. Screen View Routing with smooth open/close transitions */}
        <div className="flex-1 flex overflow-hidden pb-[74px] md:pb-0 min-w-0 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.995 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 flex overflow-hidden w-full min-w-0"
            >
              {activeTab === 'chat' && (
                <ChatView
                  selectedModel={selectedModel}
                  onSelectModel={(model) => setSelectedModel(model)}
                  onNavigateToModels={() => setActiveTab('models')}
                  onNavigateToAgents={() => setActiveTab('agents')}
                  onOpenUpgrade={() => setIsUpgradeOpen(true)}
                  userName={userProfile.name}
                  theme={userProfile.theme}
                  onToggleTheme={handleToggleTheme}
                  sidebarOpen={sidebarOpen}
                  onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                  externalPrompt={pendingPrompt}
                  onClearExternalPrompt={() => setPendingPrompt(null)}
                />
              )}

              {activeTab === 'agents' && (
                <AgentsView
                  agents={agents}
                  onCreateAgent={handleCreateAgent}
                  onSelectAgentForChat={handleSelectAgentForChat}
                  availableModels={MODELS_CATALOG}
                />
              )}

              {activeTab === 'tasks' && (
                <TasksView
                  tasks={tasks}
                  onToggleTask={handleToggleTask}
                  onDeleteTask={handleDeleteTask}
                  onCreateTask={handleCreateTask}
                  availableModels={MODELS_CATALOG}
                  availableAgents={agents}
                />
              )}

              {activeTab === 'library' && (
                <LibraryView
                  assets={libraryAssets}
                  onAddAsset={handleAddLibraryAsset}
                  onDeleteAsset={handleDeleteLibraryAsset}
                />
              )}

              {activeTab === 'integrations' && (
                <IntegrationsView
                  integrations={integrations}
                  onToggleIntegration={handleToggleIntegration}
                />
              )}

              {activeTab === 'models' && (
                <ModelsView
                  models={MODELS_CATALOG}
                  selectedModel={selectedModel}
                  onSelectModel={(model) => setSelectedModel(model)}
                  onNavigateToChat={() => setActiveTab('chat')}
                />
              )}

              {activeTab === 'admin' && (
                <AdminView
                  currentUser={userProfile}
                  onUpdateUserRole={handleUpdateUser}
                  onNavigateToChat={() => setActiveTab('chat')}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  user={userProfile}
                  onUpdateUser={handleUpdateUser}
                  onOpenUpgrade={() => setIsUpgradeOpen(true)}
                  onSignOut={handleSignOut}
                  onDeleteAccount={handleDeleteAccount}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Modals */}
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        onSelectPlan={(plan) => handleUpdateUser({ plan })}
      />

      <GiftModal
        isOpen={isGiftOpen}
        onClose={() => setIsGiftOpen(false)}
        referralCode={userProfile.referralCode}
        credits={userProfile.referralCredits}
      />

      <LiquidSearchOverlay
        isOpen={isSearchOpen}
        onOpen={() => setIsSearchOpen(true)}
        onClose={() => setIsSearchOpen(false)}
        renderTrigger={false}
        models={MODELS_CATALOG}
        agents={agents}
        libraryAssets={libraryAssets}
        onSelectModel={(model) => setSelectedModel(model)}
        onSelectAgent={handleSelectAgentForChat}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onQuickPrompt={(prompt) => {
          setPendingPrompt(prompt);
          setActiveTab('chat');
        }}
        onOpenLiveVoice={() => setIsQuickLiveOpen(true)}
      />

      <LiveConversationModal
        isOpen={isQuickLiveOpen}
        onClose={() => setIsQuickLiveOpen(false)}
        onSaveExchange={() => {}}
        theme={userProfile.theme}
        activeModelName={selectedModel.name}
      />
    </div>
  );
}
