import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { UserProfile } from './types';

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
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
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

export function savePendingSignupMetadata(uid: string, meta: PendingSignupMetadata) {
  try {
    localStorage.setItem(`${PENDING_PROFILE_KEY_PREFIX}${uid}`, JSON.stringify(meta));
  } catch {
    // Ignore storage errors
  }
}

export function readPendingSignupMetadata(uid: string): PendingSignupMetadata | null {
  try {
    const raw = localStorage.getItem(`${PENDING_PROFILE_KEY_PREFIX}${uid}`);
    if (!raw) return null;
    return JSON.parse(raw) as PendingSignupMetadata;
  } catch {
    return null;
  }
}

export function clearPendingSignupMetadata(uid: string) {
  try {
    localStorage.removeItem(`${PENDING_PROFILE_KEY_PREFIX}${uid}`);
  } catch {
    // Ignore storage errors
  }
}

function sanitizeString(value: unknown, fallback: string, maxLen: number): string {
  const str = typeof value === 'string' ? value.trim() : '';
  return (str || fallback).slice(0, maxLen);
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
    const isAdmin = data.role === 'admin' || isBootstrappedAdminUser(firebaseUser);
    clearPendingSignupMetadata(firebaseUser.uid);
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
      plan: typeof data.plan === 'string' ? data.plan : baseProfile.plan,
      theme: data.theme === 'light' || data.theme === 'dark' || data.theme === 'system' ? data.theme : baseProfile.theme,
      dailyLimit: typeof data.dailyLimit === 'number' ? data.dailyLimit : baseProfile.dailyLimit,
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
    clearPendingSignupMetadata(firebaseUser.uid);
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

export function getFirebaseAuthErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead.';
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
      return 'Sign-in popup was closed before finishing. Please try again.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in popup. Please allow popups for this site and try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in provider.';
    case 'auth/operation-not-allowed':
      return 'This sign-in provider is not enabled yet in Firebase Console (Authentication -> Sign-in method). Google Sign-In is enabled by default.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase Console -> Authentication -> Settings -> Authorized domains.';
    case 'auth/requires-recent-login':
      return 'Please sign out and sign back in recently before completing this sensitive action.';
    case 'auth/network-request-failed':
      return 'Network error while contacting Firebase Authentication. Please check your connection.';
    default:
      return error instanceof Error && error.message
        ? error.message
        : 'Authentication failed. Please try again.';
  }
}
