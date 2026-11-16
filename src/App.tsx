import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  onAuthStateChanged,
  signOut,
  deleteUser,
  sendEmailVerification,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  auth,
  resolvePendingAuthRedirect,
  testConnection,
  buildUserProfileFromAuth,
  syncUserProfileToFirestore,
  updateFirestoreUserProfile,
  incrementFirestoreUsageCounters,
  deleteFirestoreUserProfile,
  readPendingSignupMetadata,
  getFirebaseAuthErrorMessage,
} from './firebase';
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
import { LiquidGlassCardRefraction, LiquidInteractionFeedback } from './components/common/LiquidGlassPrimitives';
import { triggerHaptic, getGlassHapticStyle } from './utils/haptics';
import {
  apiUrl,
  initializeNativePlatform,
  syncNativeStatusBarTheme,
  subscribeNetworkStatus,
} from './utils/platform';

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

  // Firebase Authentication State
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isVerificationSending, setIsVerificationSending] = useState<boolean>(false);
  const [authNotice, setAuthNotice] = useState<{ type: 'info' | 'warning' | 'success'; message: string } | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Application Data States
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [libraryAssets, setLibraryAssets] = useState<LibraryAsset[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationConnector[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    let initialTheme: 'light' | 'dark' | 'system' = 'dark';
    try {
      const storedTheme = localStorage.getItem('automate_theme');
      if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
        initialTheme = storedTheme;
      }
    } catch {}

    return {
      id: 'usr-guest-00',
      name: 'User',
      email: '',
      role: 'user',
      jobTitle: 'Member',
      isAdmin: false,
      organization: '',
      timezone: 'UTC',
      plan: 'Free Member',
      theme: initialTheme,
      dailyLimit: 15,
      messagesToday: 0,
      imagesToday: 0,
      referralCode: 'REF1000',
      referralCount: 0,
      referralCredits: 0,
      areasOfInterest: ['AI Chat', 'Automation'],
    };
  });

  // Subscribe to Firebase Authentication state & redirect results cleanly
  useEffect(() => {
    let active = true;
    const authFallbackTimer = window.setTimeout(() => {
      if (active) setAuthReady(true);
    }, 4500);

    resolvePendingAuthRedirect().catch((redirectErr) => {
      if (!active) return;
      setAuthNotice({
        type: 'warning',
        message: getFirebaseAuthErrorMessage(redirectErr),
      });
    });

    testConnection().then((status) => {
      if (!active || status.online) return;
      setAuthNotice({
        type: 'warning',
        message: status.message || 'Unable to reach Firestore. Check your connection or Firebase config.',
      });
    });

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!active) return;
      window.clearTimeout(authFallbackTimer);
      setFirebaseUser(fbUser);
      setIsEmailVerified(Boolean(fbUser?.emailVerified));

      if (!fbUser) {
        setIsAuthenticated(false);
        setAuthReady(true);
        try {
          localStorage.removeItem('automate_auth_user');
        } catch {}
        return;
      }

      const pendingMeta = readPendingSignupMetadata(fbUser.uid, fbUser.email);
      const immediateProfile = buildUserProfileFromAuth(
        fbUser,
        pendingMeta || undefined
      );
      setUserProfile(immediateProfile);
      setIsAuthenticated(true);
      setAuthReady(true);

      try {
        const syncedProfile = await syncUserProfileToFirestore(
          fbUser,
          pendingMeta || undefined
        );
        if (!active) return;
        setUserProfile(syncedProfile);

        // Keep server quota state aligned for chat API endpoints
        fetch(apiUrl('/api/user'), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: syncedProfile.id,
            name: syncedProfile.name,
            email: syncedProfile.email,
            role: syncedProfile.role,
            isAdmin: syncedProfile.isAdmin,
            plan: syncedProfile.plan,
            dailyLimit: syncedProfile.dailyLimit,
          }),
        }).catch(() => {});
      } catch (err) {
        console.error('Failed to sync user profile with Firestore:', err);
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("Quota exceeded for quota metric 'Free daily read units per project (free tier database)'")) {
          setAuthNotice({
            type: 'warning',
            message: 'Firestore daily free quota exceeded. Quota resets tomorrow, or upgrade in Firebase Console.',
          });
        } else if (msg.includes('Quota exceeded')) {
          setAuthNotice({
            type: 'warning',
            message: 'Firestore usage quota exceeded. Free tier quota resets tomorrow.',
          });
        }
      }
    });

    return () => {
      active = false;
      window.clearTimeout(authFallbackTimer);
      unsubscribe();
    };
  }, []);

  // Automatically re-check verification status when returning from email verification link
  useEffect(() => {
    if (!firebaseUser || isEmailVerified) return;

    const checkVerification = async () => {
      try {
        await firebaseUser.reload();
        if (firebaseUser.emailVerified) {
          await firebaseUser.getIdToken(true);
          setIsEmailVerified(true);
          const synced = await syncUserProfileToFirestore(
            firebaseUser,
            readPendingSignupMetadata(firebaseUser.uid, firebaseUser.email) || undefined
          );
          setUserProfile(synced);
          setAuthNotice(null);
        }
      } catch {
        // Ignore transient reload checks
      }
    };

    window.addEventListener('focus', checkVerification);
    return () => {
      window.removeEventListener('focus', checkVerification);
    };
  }, [firebaseUser, isEmailVerified]);

  // Initialize native mobile lifecycle (StatusBar & hardware Back button) + Network listener
  useEffect(() => {
    initializeNativePlatform(userProfile.theme || 'dark');
    const unsubNet = subscribeNetworkStatus((connected) => setIsOnline(connected));
    return () => unsubNet();
  }, []);

  // Fetch initial workspace resources
  useEffect(() => {
    fetch(apiUrl('/api/agents'))
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setAgents(data);
      })
      .catch((err) => console.error('Failed to load agents:', err));

    fetch(apiUrl('/api/tasks'))
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setTasks(data);
      })
      .catch((err) => console.error('Failed to load tasks:', err));

    fetch(apiUrl('/api/library'))
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setLibraryAssets(data);
      })
      .catch((err) => console.error('Failed to load library:', err));

    fetch(apiUrl('/api/integrations'))
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setIntegrations(data);
      })
      .catch((err) => console.error('Failed to load integrations:', err));
  }, []);

  // Synchronize documentElement class & native StatusBar whenever theme changes
  useEffect(() => {
    const isDark =
      userProfile.theme === 'dark' ||
      (userProfile.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    syncNativeStatusBarTheme(userProfile.theme || 'dark');
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
      const res = await fetch(apiUrl('/api/agents'), {
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
      const res = await fetch(apiUrl('/api/tasks'), {
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
      const res = await fetch(apiUrl(`/api/tasks/${taskId}/toggle`), { method: 'PATCH' });
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err) {
      console.error('Task toggle failed:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await fetch(apiUrl(`/api/tasks/${taskId}`), { method: 'DELETE' });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error('Task delete failed:', err);
    }
  };

  const handleAddLibraryAsset = async (newAsset: Partial<LibraryAsset>) => {
    try {
      const res = await fetch(apiUrl('/api/library'), {
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
      await fetch(apiUrl(`/api/library/${id}`), { method: 'DELETE' });
      setLibraryAssets((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Library delete failed:', err);
    }
  };

  const handleToggleIntegration = async (id: string) => {
    try {
      const res = await fetch(apiUrl(`/api/integrations/${id}/toggle`), { method: 'POST' });
      const updated = await res.json();
      setIntegrations((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch (err) {
      console.error('Integration toggle failed:', err);
    }
  };

  const handleUpdateUser = async (updated: Partial<UserProfile>) => {
    const isAdminCaller = !!userProfile.isAdmin;
    const sanitizedUpdates: Partial<UserProfile> = { ...updatesWithoutPrivileges(updated, isAdminCaller) };

    if (sanitizedUpdates.theme) {
      try {
        localStorage.setItem('automate_theme', sanitizedUpdates.theme);
      } catch {}
    }

    setUserProfile((prev) => ({ ...prev, ...sanitizedUpdates }));

    if (firebaseUser) {
      try {
        await updateFirestoreUserProfile(firebaseUser.uid, sanitizedUpdates, isAdminCaller);
      } catch (err) {
        console.error('Firestore user update failed:', err);
      }
    }

    try {
      await fetch(apiUrl('/api/user'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedUpdates),
      });
    } catch (err) {
      console.error('User update failed:', err);
    }
  };

  const handleIncrementUsage = (isImageRequest: boolean) => {
    setUserProfile((prev) => {
      const nextMessages = (prev.messagesToday || 0) + 1;
      const nextImages = (prev.imagesToday || 0) + (isImageRequest ? 1 : 0);
      if (firebaseUser && firebaseUser.emailVerified) {
        incrementFirestoreUsageCounters(firebaseUser.uid, nextMessages, nextImages);
      }
      return {
        ...prev,
        messagesToday: nextMessages,
        imagesToday: nextImages,
      };
    });
  };

  function updatesWithoutPrivileges(
    updated: Partial<UserProfile>,
    allowPrivileged: boolean
  ): Partial<UserProfile> {
    if (allowPrivileged) return updated;
    const {
      role: _role,
      isAdmin: _isAdmin,
      dailyLimit: _dailyLimit,
      plan: _plan,
      status: _status,
      referralCount: _referralCount,
      referralCredits: _referralCredits,
      ...safe
    } = updated;
    return safe;
  }

  const handleResendVerification = async () => {
    if (!auth.currentUser || isVerificationSending) return;
    setIsVerificationSending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setAuthNotice({
        type: 'success',
        message: `Verification email resent to ${auth.currentUser.email}. Check your inbox, then click Refresh Status.`,
      });
    } catch (error) {
      setAuthNotice({
        type: 'warning',
        message: getFirebaseAuthErrorMessage(error),
      });
    } finally {
      setIsVerificationSending(false);
    }
  };

  const handleRefreshVerification = async () => {
    if (!auth.currentUser) return;
    try {
      await auth.currentUser.reload();
      await auth.currentUser.getIdToken(true);
      const refreshedUser = auth.currentUser;
      setFirebaseUser(refreshedUser);
      setIsEmailVerified(Boolean(refreshedUser.emailVerified));
      if (refreshedUser.emailVerified) {
        const synced = await syncUserProfileToFirestore(
          refreshedUser,
          readPendingSignupMetadata(refreshedUser.uid, refreshedUser.email) || undefined
        );
        setUserProfile(synced);
        setAuthNotice(null);
      } else {
        setAuthNotice({
          type: 'info',
          message: 'Email is not verified yet. Please click the verification link in your inbox first.',
        });
      }
    } catch (error) {
      setAuthNotice({
        type: 'warning',
        message: getFirebaseAuthErrorMessage(error),
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      await fetch(apiUrl('/api/auth/logout'), { method: 'POST' });
    } catch (err) {
      console.error('Sign out failed:', err);
    }
    try {
      localStorage.removeItem('automate_auth_user');
    } catch {}
    setIsAuthenticated(false);
    setActiveTab('chat');
    setAuthNotice({
      type: 'info',
      message: 'You have been signed out successfully. Sign back in anytime to continue.',
    });
  };

  const handleDeleteAccount = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        await deleteFirestoreUserProfile(currentUser.uid);
        await deleteUser(currentUser);
      } catch (error) {
        const message = getFirebaseAuthErrorMessage(error);
        try {
          await signOut(auth);
        } catch {}
        setIsAuthenticated(false);
        setAuthNotice({
          type: 'warning',
          message,
        });
        return;
      }
    }

    try {
      await fetch(apiUrl('/api/user'), { method: 'DELETE' });
    } catch (err) {
      console.error('Account deletion request failed:', err);
    }
    try {
      localStorage.removeItem('automate_auth_user');
    } catch {}

    setUserProfile({
      name: 'User',
      email: '',
      role: 'user',
      jobTitle: 'Member',
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
    });
    setActiveTab('chat');
    setIsAuthenticated(false);
    setAuthNotice({
      type: 'warning',
      message: 'Your Firebase account and profile data have been permanently deleted.',
    });
  };

  const handleLogin = (profileData: Partial<UserProfile>) => {
    setAuthNotice(null);
    setUserProfile((prev) => ({
      ...prev,
      ...profileData,
      name: profileData.name || prev.name || 'Member',
      email: profileData.email || prev.email,
    }));
  };

  if (!authReady) {
    return (
      <div className="liquid-ambient-canvas flex app-viewport-height w-full items-center justify-center text-slate-900 dark:text-slate-50">
        <div className="rounded-[28px] liquid-glass-elevated p-6 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl liquid-glass-orb flex items-center justify-center overflow-hidden">
            <img
              src="/assets/aistudio/Gemini_Generated_Image_ee5hycee5hycee5h_050d414c.png"
              alt="Automate AI"
              className="w-full h-full object-cover scale-[1.55] animate-pulse"
            />
          </div>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Restoring session...
          </span>
        </div>
      </div>
    );
  }

  // If user is not authenticated, render full AuthView
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
    <div className="liquid-ambient-canvas flex app-viewport-height w-full max-w-full overflow-hidden text-slate-900 dark:text-slate-50 select-none md:p-2.5 md:gap-2.5 relative">
      {/* Animated Cursor-Tracking Radial Liquid Light Refraction across all .liquid-glass-card elements */}
      <LiquidGlassCardRefraction />
      <LiquidInteractionFeedback />

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
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 md:rounded-[28px] md:liquid-glass md:overflow-hidden relative safe-area-top">
        {/* Top Bar with Sidebar toggle, Automate AI logo, morphing search, offline-mode indicator, theme switch, and upgrade */}
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
          isOffline={!isOnline}
          onRecheckConnection={async () => {
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
              setIsOnline(false);
              return false;
            }
            try {
              const resp = await fetch(apiUrl('/api/user'), { cache: 'no-store' });
              const ok = resp.ok;
              setIsOnline(ok);
              return ok;
            } catch {
              setIsOnline(false);
              return false;
            }
          }}
        />

        {firebaseUser && !isEmailVerified && (
          <div className="mx-3 mt-1 mb-0.5 px-3.5 py-2 rounded-2xl liquid-glass-subtle border border-amber-400/35 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200 shrink-0">
            <span>
              Verify <strong>{firebaseUser.email}</strong> via the link sent to your inbox to enable cloud profile syncing.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isVerificationSending}
                onClick={handleResendVerification}
                className="px-2.5 py-1 rounded-full liquid-glass-orb font-semibold text-[11px] cursor-pointer disabled:opacity-60"
              >
                {isVerificationSending ? 'Sending...' : 'Resend Email'}
              </button>
              <button
                type="button"
                onClick={handleRefreshVerification}
                className="px-2.5 py-1 rounded-full liquid-glass-cta font-semibold text-[11px] cursor-pointer"
              >
                Refresh Status
              </button>
            </div>
          </div>
        )}

        {/* 3. Screen View Routing with instant non-blocking transitions */}
        <div className="flex-1 flex overflow-hidden pb-[74px] md:pb-0 min-w-0 relative">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.09, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex overflow-hidden w-full h-full min-w-0"
            >
              {activeTab === 'chat' && (
                <ChatView
                  selectedModel={selectedModel}
                  onSelectModel={(model) => setSelectedModel(model)}
                  onNavigateToModels={() => setActiveTab('models')}
                  onNavigateToAgents={() => setActiveTab('agents')}
                  onOpenUpgrade={() => setIsUpgradeOpen(true)}
                  userName={userProfile.name}
                  onMessageSent={handleIncrementUsage}
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
