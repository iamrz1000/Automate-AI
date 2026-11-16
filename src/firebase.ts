import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  AuthProvider,
  User,
  UserCredential,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  query,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { UserProfile, AdminUserData } from './types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const githubProvider = new GithubAuthProvider();

export const BOOTSTRAPPED_ADMIN_EMAILS = [
  'faqruddin00000@gmail.com',
  'iamrz100@gmail.com',
];

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate Firestore connection on application boot
export async function testConnection(): Promise<{ online: boolean; message?: string }> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return { online: true };
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return { online: false, message: 'Firestore is offline. Please verify Firebase configuration.' };
    }
    return { online: true };
  }
}
testConnection();

export function isBootstrappedAdminUser(firebaseUser: User | null): boolean {
  if (!firebaseUser || !firebaseUser.email || !firebaseUser.emailVerified) {
    return false;
  }
  return BOOTSTRAPPED_ADMIN_EMAILS.includes(firebaseUser.email.toLowerCase());
}

export interface PendingSignupMetadata {
  name?: string;
  jobTitle?: string;
  organization?: string;
}

const PENDING_PROFILE_KEY_PREFIX = 'automate_pending_profile_';
const PENDING_EMAIL_KEY_PREFIX = 'automate_pending_email_';

export function savePendingSignupMetadata(
  uid: string,
  meta: PendingSignupMetadata,
  email?: string
) {
  try {
    localStorage.setItem(`${PENDING_PROFILE_KEY_PREFIX}${uid}`, JSON.stringify(meta));
    if (email) {
      localStorage.setItem(
        `${PENDING_EMAIL_KEY_PREFIX}${email.trim().toLowerCase()}`,
        JSON.stringify(meta)
      );
    }
  } catch {
    // Ignore storage errors
  }
}

export function savePendingSignupMetadataByEmail(email: string, meta: PendingSignupMetadata) {
  try {
    localStorage.setItem(
      `${PENDING_EMAIL_KEY_PREFIX}${email.trim().toLowerCase()}`,
      JSON.stringify(meta)
    );
  } catch {
    // Ignore storage errors
  }
}

export function readPendingSignupMetadata(
  uid: string,
  email?: string | null
): PendingSignupMetadata | null {
  try {
    const raw = localStorage.getItem(`${PENDING_PROFILE_KEY_PREFIX}${uid}`);
    if (raw) return JSON.parse(raw) as PendingSignupMetadata;
    if (email) {
      const byEmail = localStorage.getItem(
        `${PENDING_EMAIL_KEY_PREFIX}${email.trim().toLowerCase()}`
      );
      if (byEmail) return JSON.parse(byEmail) as PendingSignupMetadata;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearPendingSignupMetadata(uid: string, email?: string | null) {
  try {
    localStorage.removeItem(`${PENDING_PROFILE_KEY_PREFIX}${uid}`);
    if (email) {
      localStorage.removeItem(`${PENDING_EMAIL_KEY_PREFIX}${email.trim().toLowerCase()}`);
    }
  } catch {
    // Ignore storage errors
  }
}

function sanitizeString(value: unknown, fallback: string, maxLen: number): string {
  const str = typeof value === 'string' ? value.trim() : '';
  return (str || fallback).slice(0, maxLen);
}

/**
 * Primary signInWithPopup with automatic signInWithRedirect fallback only when
 * running in a top-level window (never inside an iframe, where X-Frame-Options
 * blocks accounts.google.com redirects).
 * Note: Call directly from a user click handler without prior async `await`
 * so the browser keeps the user-activation gesture intact.
 */
export async function signInWithProviderSmart(
  provider: AuthProvider
): Promise<UserCredential | null> {
  try {
    return await signInWithPopup(auth, provider);
  } catch (error) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: unknown }).code)
        : '';

    const isInIframe =
      typeof window !== 'undefined' &&
      (() => {
        try {
          return window.self !== window.top;
        } catch {
          return true;
        }
      })();

    if (
      !isInIframe &&
      (code === 'auth/popup-blocked' ||
        code === 'auth/operation-not-supported-in-this-environment')
    ) {
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw error;
  }
}

export async function resolvePendingAuthRedirect(): Promise<UserCredential | null> {
  try {
    return await getRedirectResult(auth);
  } catch (error) {
    throw error;
  }
}

export function buildUserProfileFromAuth(
  firebaseUser: User,
  overrides?: PendingSignupMetadata & { theme?: 'light' | 'system' | 'dark' }
): UserProfile {
  const resolvedEmail =
    firebaseUser.email ||
    firebaseUser.providerData?.find((p) => p.email)?.email ||
    `${firebaseUser.uid}@users.automate.ai`;
  const isAdmin = isBootstrappedAdminUser(firebaseUser);
  const storedTheme = (() => {
    try {
      const t = localStorage.getItem('automate_theme');
      if (t === 'light' || t === 'dark' || t === 'system') return t;
    } catch {}
    return 'dark' as const;
  })();

  const defaultName =
    overrides?.name ||
    firebaseUser.displayName ||
    resolvedEmail.split('@')[0] ||
    'Member';

  const uidSuffix = firebaseUser.uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || '1000';

  return {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    name: sanitizeString(defaultName, 'Member', 100),
    email: sanitizeString(resolvedEmail, 'user@automate.ai', 254),
    emailVerified: firebaseUser.emailVerified,
    role: isAdmin ? 'admin' : 'user',
    jobTitle: sanitizeString(overrides?.jobTitle, isAdmin ? 'Administrator' : 'Member', 100),
    isAdmin,
    organization: sanitizeString(overrides?.organization, isAdmin ? 'Automate AI Global' : 'Personal', 120),
    avatarUrl: firebaseUser.photoURL ? firebaseUser.photoURL.slice(0, 1000) : undefined,
    timezone: 'UTC',
    plan: isAdmin ? 'Enterprise SuperAdmin' : 'Free Member',
    theme: overrides?.theme || storedTheme,
    dailyLimit: isAdmin ? 999999 : 15,
    messagesToday: 0,
    imagesToday: 0,
    referralCode: `REF${uidSuffix}`.slice(0, 32),
    referralCount: 0,
    referralCredits: 0,
    areasOfInterest: ['AI Chat', 'Automation'],
    status: 'active',
    joinedAt: firebaseUser.metadata?.creationTime || new Date().toISOString(),
    lastLogin: firebaseUser.metadata?.lastSignInTime || new Date().toISOString(),
  };
}

export async function syncUserProfileToFirestore(
  firebaseUser: User,
  overrides?: PendingSignupMetadata & { theme?: 'light' | 'system' | 'dark' }
): Promise<UserProfile> {
  const baseProfile = buildUserProfileFromAuth(firebaseUser, overrides);

  // Security rules strictly enforce email_verified == true on Firestore writes
  if (!firebaseUser.emailVerified) {
    return baseProfile;
  }

  const userPath = `users/${firebaseUser.uid}`;
  const userRef = doc(db, 'users', firebaseUser.uid);

  let existingSnap;
  try {
    existingSnap = await getDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }

  if (existingSnap && existingSnap.exists()) {
    const data = existingSnap.data();
    const bootstrapped = isBootstrappedAdminUser(firebaseUser);
    const isAdmin = data.role === 'admin' || bootstrapped;

    // Ensure bootstrapped admin role stays upgraded in Firestore
    if (bootstrapped && data.role !== 'admin') {
      try {
        await updateDoc(userRef, {
          role: 'admin',
          plan: 'Enterprise SuperAdmin',
          dailyLimit: 999999,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('Could not upgrade bootstrapped admin doc:', err);
      }
    }

    clearPendingSignupMetadata(firebaseUser.uid, firebaseUser.email);
    return {
      ...baseProfile,
      name: typeof data.name === 'string' ? data.name : baseProfile.name,
      email: typeof data.email === 'string' ? data.email : baseProfile.email,
      emailVerified: firebaseUser.emailVerified,
      role: isAdmin ? 'admin' : 'user',
      jobTitle: typeof data.jobTitle === 'string' ? data.jobTitle : baseProfile.jobTitle,
      isAdmin,
      organization: typeof data.organization === 'string' ? data.organization : baseProfile.organization,
      timezone: typeof data.timezone === 'string' ? data.timezone : baseProfile.timezone,
      plan: isAdmin && data.role !== 'admin'
        ? 'Enterprise SuperAdmin'
        : typeof data.plan === 'string'
        ? data.plan
        : baseProfile.plan,
      theme: data.theme === 'light' || data.theme === 'dark' || data.theme === 'system' ? data.theme : baseProfile.theme,
      dailyLimit: isAdmin && data.role !== 'admin'
        ? 999999
        : typeof data.dailyLimit === 'number'
        ? data.dailyLimit
        : baseProfile.dailyLimit,
      messagesToday: typeof data.messagesToday === 'number' ? data.messagesToday : 0,
      imagesToday: typeof data.imagesToday === 'number' ? data.imagesToday : 0,
      referralCode: typeof data.referralCode === 'string' ? data.referralCode : baseProfile.referralCode,
      referralCount: typeof data.referralCount === 'number' ? data.referralCount : 0,
      referralCredits: typeof data.referralCredits === 'number' ? data.referralCredits : 0,
      areasOfInterest: Array.isArray(data.areasOfInterest) ? data.areasOfInterest : baseProfile.areasOfInterest,
      status: data.status === 'suspended' ? 'suspended' : 'active',
      phone: typeof data.phone === 'string' ? data.phone : undefined,
      avatarUrl: typeof data.avatarUrl === 'string' ? data.avatarUrl : baseProfile.avatarUrl,
    };
  }

  const newDoc: Record<string, unknown> = {
    uid: firebaseUser.uid,
    name: baseProfile.name,
    email: baseProfile.email,
    jobTitle: baseProfile.jobTitle || 'Member',
    role: baseProfile.isAdmin ? 'admin' : 'user',
    organization: baseProfile.organization || 'Personal',
    timezone: baseProfile.timezone || 'UTC',
    plan: baseProfile.isAdmin ? 'Enterprise SuperAdmin' : 'Free Member',
    theme: baseProfile.theme || 'dark',
    dailyLimit: baseProfile.isAdmin ? 999999 : 15,
    messagesToday: 0,
    imagesToday: 0,
    referralCode: baseProfile.referralCode,
    referralCount: 0,
    referralCredits: 0,
    areasOfInterest: baseProfile.areasOfInterest.slice(0, 20),
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (baseProfile.avatarUrl) {
    newDoc.avatarUrl = baseProfile.avatarUrl;
  }

  try {
    await setDoc(userRef, newDoc);
    clearPendingSignupMetadata(firebaseUser.uid, firebaseUser.email);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, userPath);
  }

  return baseProfile;
}

export async function updateFirestoreUserProfile(
  uid: string,
  updates: Partial<UserProfile>,
  isAdminCaller: boolean
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) {
    return;
  }

  const userPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  // Guarantee the target document exists before running updateDoc
  if (uid === currentUser.uid) {
    try {
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await syncUserProfileToFirestore(currentUser);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, userPath);
    }
  }

  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (typeof updates.name === 'string' && updates.name.trim()) {
    payload.name = updates.name.trim().slice(0, 100);
  }
  if (typeof updates.jobTitle === 'string' && updates.jobTitle.trim()) {
    payload.jobTitle = updates.jobTitle.trim().slice(0, 100);
  }
  if (typeof updates.organization === 'string') {
    payload.organization = updates.organization.trim().slice(0, 120);
  }
  if (typeof updates.timezone === 'string' && updates.timezone.trim()) {
    payload.timezone = updates.timezone.trim().slice(0, 80);
  }
  if (updates.theme === 'light' || updates.theme === 'dark' || updates.theme === 'system') {
    payload.theme = updates.theme;
  }
  if (Array.isArray(updates.areasOfInterest)) {
    payload.areasOfInterest = updates.areasOfInterest
      .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
      .slice(0, 20)
      .map((x) => x.trim().slice(0, 64));
  }
  if (typeof updates.phone === 'string') {
    payload.phone = updates.phone.trim().slice(0, 32);
  }
  if (typeof updates.avatarUrl === 'string' && updates.avatarUrl.trim()) {
    payload.avatarUrl = updates.avatarUrl.trim().slice(0, 1000);
  }

  if (isAdminCaller) {
    if (updates.role === 'admin' || updates.role === 'user') {
      payload.role = updates.role;
    }
    if (
      updates.plan === 'Free Member' ||
      updates.plan === 'Unlock Every Model' ||
      updates.plan === 'Enterprise SuperAdmin'
    ) {
      payload.plan = updates.plan;
    }
    if (typeof updates.dailyLimit === 'number' && Number.isInteger(updates.dailyLimit) && updates.dailyLimit >= 0) {
      payload.dailyLimit = Math.min(updates.dailyLimit, 999999);
    }
    if (updates.status === 'active' || updates.status === 'suspended') {
      payload.status = updates.status;
    }
  }

  if (Object.keys(payload).length <= 1) {
    return;
  }

  try {
    await updateDoc(userRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export async function incrementFirestoreUsageCounters(
  uid: string,
  nextMessagesToday: number,
  nextImagesToday: number
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) {
    return;
  }

  const userPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  try {
    await updateDoc(userRef, {
      messagesToday: Math.min(1000000, Math.max(0, Math.floor(nextMessagesToday))),
      imagesToday: Math.min(1000000, Math.max(0, Math.floor(nextImagesToday))),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn(`Could not sync daily usage counter at ${userPath}:`, error);
  }
}

export async function deleteFirestoreUserProfile(uid: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) {
    return;
  }
  const userPath = `users/${uid}`;
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, userPath);
  }
}

export async function fetchFirestoreUsers(): Promise<AdminUserData[]> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) {
    return [];
  }

  const usersPath = 'users';
  try {
    const q = query(collection(db, usersPath), orderBy('updatedAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      const createdAtIso =
        typeof data.createdAt?.toDate === 'function'
          ? data.createdAt.toDate().toISOString()
          : new Date().toISOString();
      const updatedAtIso =
        typeof data.updatedAt?.toDate === 'function'
          ? data.updatedAt.toDate().toISOString()
          : createdAtIso;

      return {
        id: d.id,
        name: typeof data.name === 'string' ? data.name : 'Member',
        email: typeof data.email === 'string' ? data.email : '',
        role: data.role === 'admin' ? 'admin' : 'user',
        plan: typeof data.plan === 'string' ? data.plan : 'Free Member',
        dailyLimit: typeof data.dailyLimit === 'number' ? data.dailyLimit : 15,
        messagesToday: typeof data.messagesToday === 'number' ? data.messagesToday : 0,
        imagesToday: typeof data.imagesToday === 'number' ? data.imagesToday : 0,
        status: data.status === 'suspended' ? 'suspended' : 'active',
        joinedAt: createdAtIso,
        lastLogin: updatedAtIso,
        conversationsCount: 0,
        conversations: [],
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, usersPath);
  }
}

export async function setFirestoreAdminGrant(
  targetUid: string,
  targetEmail: string,
  grant: boolean
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) {
    return;
  }

  const adminPath = `admins/${targetUid}`;
  const adminRef = doc(db, 'admins', targetUid);

  try {
    if (grant) {
      await setDoc(adminRef, {
        uid: targetUid,
        email: targetEmail.slice(0, 254),
        grantedBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await deleteDoc(adminRef);
    }
  } catch (error) {
    handleFirestoreError(error, grant ? OperationType.CREATE : OperationType.DELETE, adminPath);
  }
}

export interface FirebaseAuthDiagnostics {
  projectId: string;
  firestoreDatabaseId: string;
  currentHost: string;
  isAuthorizedDomain: boolean | null;
  authorizedDomains: string[];
  isInIframe: boolean;
  firestoreOnline: boolean;
  googleProviderConfigured: boolean;
  emailPasswordKnownDisabled: boolean;
}

export async function fetchFirebaseAuthDiagnostics(
  emailPasswordKnownDisabled = false
): Promise<FirebaseAuthDiagnostics> {
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const isInIframe =
    typeof window !== 'undefined' &&
    (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();

  let authorizedDomains: string[] = [];
  let isAuthorizedDomain: boolean | null = null;

  try {
    const resp = await fetch(
      `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=${encodeURIComponent(
        firebaseConfig.apiKey
      )}`
    );
    if (resp.ok) {
      const json = (await resp.json()) as { authorizedDomains?: unknown };
      if (Array.isArray(json.authorizedDomains)) {
        authorizedDomains = json.authorizedDomains.filter(
          (d): d is string => typeof d === 'string'
        );
        if (currentHost) {
          const lowerHost = currentHost.toLowerCase();
          isAuthorizedDomain = authorizedDomains.some((d) => {
            const lowerD = d.toLowerCase();
            return lowerHost === lowerD || lowerHost.endsWith(`.${lowerD}`);
          });
        }
      }
    }
  } catch {
    // Keep null if network fails
  }

  const conn = await testConnection();

  return {
    projectId: firebaseConfig.projectId,
    firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
    currentHost: currentHost || 'unknown',
    isAuthorizedDomain,
    authorizedDomains,
    isInIframe,
    firestoreOnline: conn.online,
    googleProviderConfigured: true,
    emailPasswordKnownDisabled,
  };
}

export function extractFirebaseAuthCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String((error as { code?: unknown }).code || '');
  }
  const msg = error instanceof Error ? error.message : String(error || '');
  if (msg.includes('PASSWORD_LOGIN_DISABLED') || msg.includes('OPERATION_NOT_ALLOWED')) {
    return 'auth/operation-not-allowed';
  }
  if (msg.includes('UNAUTHORIZED_DOMAIN')) {
    return 'auth/unauthorized-domain';
  }
  return '';
}

export function getFirebaseAuthErrorMessage(error: unknown): string {
  const code = extractFirebaseAuthCode(error);
  const host = typeof window !== 'undefined' ? window.location.hostname : '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. If you originally registered with Google, click "Continue with Google" above.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead, or click "Continue with Google".';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/too-many-requests':
      return 'Too many authentication attempts. Please wait a moment and try again.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in popup was closed before finishing. Please try again or open the app in a new tab.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Allow popups for this site or open the app in a new tab.';
    case 'auth/operation-not-supported-in-this-environment':
      return 'Popup sign-in is restricted in this embedded view. Open the app in a new browser tab to sign in with Google.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using Google Sign-In. Please click "Continue with Google".';
    case 'auth/operation-not-allowed':
    case 'auth/admin-restricted-operation':
      return `Email/Password sign-in is currently disabled in Firebase Console for project "${firebaseConfig.projectId}". Enable it under Authentication -> Sign-in method -> Email/Password, or click "Continue with Google" above.`;
    case 'auth/unauthorized-domain':
      return `Domain "${host || 'current origin'}" is not listed in Firebase Console -> Authentication -> Settings -> Authorized domains.`;
    case 'auth/unauthorized-continue-uri':
      return 'Verification redirect domain is not authorized in Firebase Console.';
    case 'auth/requires-recent-login':
      return 'Please sign out and sign back in recently before completing this sensitive action.';
    case 'auth/network-request-failed':
      return 'Network error while contacting Firebase Authentication. Please check your connection.';
    case 'auth/internal-error':
      return 'Firebase Auth encountered a browser popup/storage restriction. Try opening the app in a new tab and signing in again.';
    default:
      return error instanceof Error && error.message
        ? error.message
        : 'Authentication failed. Please try again.';
  }
}
