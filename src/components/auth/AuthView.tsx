import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  Mail,
  User,
  Building,
  Briefcase,
  ArrowRight,
  Eye,
  EyeOff,
  AlertTriangle,
  Info,
  CheckCircle2,
  Shield,
  Download,
} from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import {
  auth,
  googleProvider,
  githubProvider,
  getFirebaseAuthErrorMessage,
  savePendingSignupMetadata,
} from '../../firebase';
import { UserProfile } from '../../types';
import { LiquidThemeSwitch } from '../common/LiquidGlassPrimitives';

interface AuthViewProps {
  onLogin?: (profileData: Partial<UserProfile>) => void;
  notice?: { type: 'info' | 'warning' | 'success'; message: string } | null;
  theme?: 'light' | 'system' | 'dark';
  onToggleTheme?: () => void;
  onOpenDownloads?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onLogin,
  notice,
  theme = 'dark',
  onToggleTheme,
  onOpenDownloads,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Sign In Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up Form States
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState('Software Engineer');
  const [signupOrg, setSignupOrg] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const applyPersistence = async () => {
    await setPersistence(
      auth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence
    );
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setInfoMessage('');
    setIsLoading(true);
    try {
      await applyPersistence();
      const credential = await signInWithPopup(auth, googleProvider);
      if (onLogin) {
        onLogin({
          uid: credential.user.uid,
          id: credential.user.uid,
          name: credential.user.displayName || credential.user.email?.split('@')[0] || 'Member',
          email: credential.user.email || '',
          emailVerified: credential.user.emailVerified,
          avatarUrl: credential.user.photoURL || undefined,
          jobTitle: 'Developer',
        });
      }
    } catch (error) {
      setErrorMessage(getFirebaseAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setErrorMessage('');
    setInfoMessage('');
    setIsLoading(true);
    try {
      await applyPersistence();
      const credential = await signInWithPopup(auth, githubProvider);
      if (onLogin) {
        onLogin({
          uid: credential.user.uid,
          id: credential.user.uid,
          name: credential.user.displayName || credential.user.email?.split('@')[0] || 'GitHub User',
          email: credential.user.email || '',
          emailVerified: credential.user.emailVerified,
          avatarUrl: credential.user.photoURL || undefined,
          jobTitle: 'Software Engineer',
        });
      }
    } catch (error) {
      setErrorMessage(getFirebaseAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMessage('');
    setInfoMessage('');
    const targetEmail = loginEmail.trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setErrorMessage('Enter your email address above first to receive a password reset link.');
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      setInfoMessage(`Password reset instructions sent to ${targetEmail}. Please check your inbox.`);
    } catch (error) {
      setErrorMessage(getFirebaseAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    const normalizedEmail = loginEmail.trim();
    if (!normalizedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      await applyPersistence();
      const credential = await signInWithEmailAndPassword(auth, normalizedEmail, loginPassword);
      if (onLogin) {
        onLogin({
          uid: credential.user.uid,
          id: credential.user.uid,
          name: credential.user.displayName || normalizedEmail.split('@')[0],
          email: credential.user.email || normalizedEmail,
          emailVerified: credential.user.emailVerified,
        });
      }
    } catch (error) {
      setErrorMessage(getFirebaseAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    const trimmedName = signupName.trim();
    const normalizedEmail = signupEmail.trim();
    const trimmedOrg = signupOrg.trim() || 'Personal';

    if (!trimmedName) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!signupPassword || signupPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('Please agree to the Terms of Service to continue.');
      return;
    }

    setIsLoading(true);
    try {
      await applyPersistence();
      const credential = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        signupPassword
      );

      savePendingSignupMetadata(credential.user.uid, {
        name: trimmedName,
        jobTitle: signupRole,
        organization: trimmedOrg,
      });

      await updateProfile(credential.user, {
        displayName: trimmedName.slice(0, 100),
      });

      try {
        await sendEmailVerification(credential.user);
      } catch (verifyErr) {
        console.warn('Could not send initial verification email:', verifyErr);
      }

      if (onLogin) {
        onLogin({
          uid: credential.user.uid,
          id: credential.user.uid,
          name: trimmedName,
          email: credential.user.email || normalizedEmail,
          emailVerified: credential.user.emailVerified,
          jobTitle: signupRole,
          organization: trimmedOrg,
        });
      }
    } catch (error) {
      setErrorMessage(getFirebaseAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="liquid-ambient-canvas min-h-screen w-full overflow-x-hidden flex flex-col justify-between text-slate-900 dark:text-white selection:bg-violet-500/30 overflow-y-auto relative">
      {/* Top Floating Liquid Glass Bar */}
      <header className="mx-3 mt-3 sm:mx-6 sm:mt-4 rounded-full liquid-glass h-14 px-4 sm:px-6 flex items-center justify-between sticky top-3 z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src="/assets/aistudio/automate_ai_logo_transparent.png"
            alt="Automate AI"
            className="h-7 w-auto object-contain drop-shadow-sm shrink-0"
          />
          <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white truncate">
            Automate <span className="text-violet-600 dark:text-violet-300">AI</span>
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full liquid-glass-subtle text-violet-700 dark:text-violet-300 shrink-0">
            Studio
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenDownloads && (
            <button
              type="button"
              onClick={onOpenDownloads}
              className="px-3 py-1.5 rounded-full liquid-glass-orb text-[11px] font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer"
              title="Install Desktop & Mobile Apps"
            >
              <Download className="w-3.5 h-3.5 text-violet-600 dark:text-violet-300" />
              <span className="hidden sm:inline">Get Apps</span>
            </button>
          )}
          {onToggleTheme && (
            <LiquidThemeSwitch theme={theme} onToggle={onToggleTheme} />
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-3.5 sm:p-8 relative">
        <div className="w-full max-w-[460px] relative z-10 space-y-4 my-auto">
          {/* Status / Notice Banner */}
          {notice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3.5 rounded-[22px] liquid-glass flex items-start gap-3 ${
                notice.type === 'warning'
                  ? 'border-amber-400/50 text-amber-900 dark:text-amber-200'
                  : notice.type === 'success'
                  ? 'border-emerald-400/50 text-emerald-900 dark:text-emerald-200'
                  : 'border-violet-400/50 text-violet-900 dark:text-violet-200'
              }`}
            >
              {notice.type === 'warning' ? (
                <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
              ) : notice.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-5 h-5 text-violet-500 dark:text-violet-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs leading-relaxed font-medium">{notice.message}</div>
            </motion.div>
          )}

          {/* Crystal Auth Card */}
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="rounded-[32px] liquid-glass-elevated p-5 sm:p-8"
          >
            <div className="text-center space-y-2 mb-6 flex flex-col items-center">
              <div className="w-16 h-16 rounded-[22px] liquid-glass-orb flex items-center justify-center p-2 mb-1">
                <img
                  src="/assets/aistudio/automate_ai_logo_transparent.png"
                  alt="Automate AI"
                  className="w-12 h-12 object-contain drop-shadow-md"
                />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {mode === 'signin' ? 'Welcome back to Automate AI' : 'Create your account'}
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-300/80">
                {mode === 'signin'
                  ? 'Sign in to access your agents, models, and automated workflows'
                  : 'Get started with powerful multi-agent systems and no-code tools'}
              </p>
            </div>

            {/* Liquid Glass Segmented Switch with Convex Droplet */}
            <div className="grid grid-cols-2 rounded-full liquid-glass-subtle p-1 mb-5 relative">
              {(['signin', 'signup'] as const).map((tabMode) => {
                const isActive = mode === tabMode;
                return (
                  <button
                    key={tabMode}
                    type="button"
                    onClick={() => {
                      setMode(tabMode);
                      setErrorMessage('');
                      setInfoMessage('');
                    }}
                    className={`relative py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="auth-mode-droplet"
                        layout="position"
                        transition={{ type: 'spring', stiffness: 760, damping: 42, mass: 0.42 }}
                        className="absolute inset-0 rounded-full liquid-glass-droplet overflow-hidden"
                      >
                        <span className="absolute inset-x-3 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/55 to-transparent dark:from-white/25 pointer-events-none" />
                      </motion.div>
                    )}
                    <span className="relative z-10">
                      {tabMode === 'signin' ? 'Sign In' : 'Create Account'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.01 }}
                type="button"
                disabled={isLoading}
                onClick={handleGoogleSignIn}
                className="py-2.5 px-3 rounded-2xl liquid-glass-card text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 12s.7 2.3 1.9 4.7l3.7-1.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                  />
                </svg>
                <span>Google</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.01 }}
                type="button"
                disabled={isLoading}
                onClick={handleGithubSignIn}
                className="py-2.5 px-3 rounded-2xl liquid-glass-card text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 fill-slate-900 dark:fill-white shrink-0" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>GitHub</span>
              </motion.button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-900/10 dark:border-white/10 w-full" />
              <span className="px-3 text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400 liquid-glass-subtle rounded-full py-0.5 absolute">
                or continue with email
              </span>
            </div>

            {/* Form Validation Error / Inline Info */}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-400/40 text-red-700 dark:text-red-200 text-xs mb-4 flex items-center gap-2 backdrop-blur-md">
                <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {infoMessage && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-400/40 text-emerald-700 dark:text-emerald-200 text-xs mb-4 flex items-center gap-2 backdrop-blur-md">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span>{infoMessage}</span>
              </div>
            )}

            <AnimatePresence mode="wait">
              {mode === 'signin' ? (
                <motion.form
                  key="signin"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.16 }}
                  onSubmit={handleSignInSubmit}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl liquid-glass-input outline-none text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Password
                      </label>
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={handleForgotPassword}
                        className="text-[11px] text-violet-600 dark:text-violet-300 hover:underline transition-colors cursor-pointer disabled:opacity-60"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-2xl liquid-glass-input outline-none text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-violet-600 cursor-pointer"
                    />
                    <label htmlFor="rememberMe" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                      Remember me on this browser
                    </label>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-full liquid-glass-cta text-xs font-bold flex items-center justify-center gap-2 mt-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </motion.form>
              ) : (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.16 }}
                  onSubmit={handleSignUpSubmit}
                  className="space-y-3.5"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="e.g. Sarah Connor"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl liquid-glass-input outline-none text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                      Work or Personal Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="sarah@agency.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl liquid-glass-input outline-none text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                        Role
                      </label>
                      <div className="relative">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        <select
                          value={signupRole}
                          onChange={(e) => setSignupRole(e.target.value)}
                          className="w-full pl-8 pr-2 py-2.5 rounded-2xl liquid-glass-input outline-none text-xs text-slate-900 dark:text-white cursor-pointer"
                        >
                          <option value="Student" className="bg-white dark:bg-[#1a1928]">Student</option>
                          <option value="Software Engineer" className="bg-white dark:bg-[#1a1928]">Software Engineer</option>
                          <option value="AI Researcher" className="bg-white dark:bg-[#1a1928]">AI Researcher</option>
                          <option value="Product Manager" className="bg-white dark:bg-[#1a1928]">Product Manager</option>
                          <option value="Founder / CEO" className="bg-white dark:bg-[#1a1928]">Founder / CEO</option>
                          <option value="Designer" className="bg-white dark:bg-[#1a1928]">Designer</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                        Organization
                      </label>
                      <div className="relative">
                        <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={signupOrg}
                          onChange={(e) => setSignupOrg(e.target.value)}
                          placeholder="e.g. Acme Inc"
                          className="w-full pl-8 pr-3 py-2.5 rounded-2xl liquid-glass-input outline-none text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full pl-10 pr-10 py-2.5 rounded-2xl liquid-glass-input outline-none text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="agreeTerms"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-3.5 h-3.5 mt-0.5 rounded accent-violet-600 cursor-pointer"
                    />
                    <label htmlFor="agreeTerms" className="text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer select-none leading-relaxed">
                      I agree to the{' '}
                      <span className="text-violet-600 dark:text-violet-300 hover:underline">Terms of Service</span> and{' '}
                      <span className="text-violet-600 dark:text-violet-300 hover:underline">Privacy Policy</span>.
                    </label>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-full liquid-glass-cta text-xs font-bold flex items-center justify-center gap-2 mt-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Create Account & Start</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Bottom Security Note */}
            <div className="mt-6 pt-4 border-t border-slate-900/10 dark:border-white/10 flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
              <Shield className="w-3.5 h-3.5 text-violet-500 dark:text-violet-300 shrink-0" />
              <span>Encrypted with TLS 1.3 & enterprise-grade MCP sandboxes</span>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <span>Automate AI Platform &bull; Autonomous Multi-Agent Workflows &bull; 2026</span>
      </footer>
    </div>
  );
};
