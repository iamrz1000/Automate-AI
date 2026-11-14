import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Network } from '@capacitor/network';
import { StatusBar, Style as StatusBarStyle } from '@capacitor/status-bar';

export type DetectedOS = 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'unknown';
export type RuntimeHost = 'web' | 'capacitor' | 'electron';

export interface DesktopBridge {
  isElectron?: boolean;
  platform?: string;
  arch?: string;
  getPlatformInfo?: () => Promise<{
    runtime: string;
    os: string;
    arch: string;
    version: string;
    remoteApiOrigin: string;
  }>;
  notify?: (title: string, body: string) => Promise<boolean>;
  saveFile?: (filename: string, base64Data: string) => Promise<{ saved: boolean; filePath?: string }>;
  openExternal?: (url: string) => Promise<boolean>;
}

declare global {
  interface Window {
    automateDesktop?: DesktopBridge;
  }
}

export const DEFAULT_REMOTE_API_ORIGIN =
  import.meta.env.VITE_API_BASE_URL ||
  'https://ais-pre-vtowivipoo5oo4ojwcooaz-190037377446.asia-east1.run.app';

export const DEFAULT_GITHUB_REPO =
  import.meta.env.VITE_GITHUB_REPO || 'iamrz1000/Automate-AI';

export function getRuntimeHost(): RuntimeHost {
  if (typeof window !== 'undefined' && window.automateDesktop?.isElectron) {
    return 'electron';
  }
  if (Capacitor.isNativePlatform()) {
    return 'capacitor';
  }
  return 'web';
}

/**
 * Resolves relative `/api/...` paths so they work seamlessly across:
 * - Browser SPA (same-origin `/api/...`)
 * - Electron desktop app (same-origin `http://127.0.0.1:<port>/api/...` proxied in main process)
 * - Capacitor iOS/Android native apps (routed to live cloud backend origin)
 */
export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (Capacitor.isNativePlatform()) {
    const base = DEFAULT_REMOTE_API_ORIGIN.replace(/\/+$/, '');
    return `${base}${normalized}`;
  }
  return normalized;
}

export function detectClientOS(): { os: DetectedOS; arch: 'arm64' | 'x64' | 'universal' | 'mobile'; label: string } {
  if (typeof navigator === 'undefined') {
    return { os: 'unknown', arch: 'x64', label: 'Unknown Platform' };
  }

  const runtime = getRuntimeHost();
  if (runtime === 'capacitor') {
    const capPlatform = Capacitor.getPlatform();
    if (capPlatform === 'android') {
      return { os: 'android', arch: 'mobile', label: 'Android' };
    }
    if (capPlatform === 'ios') {
      return { os: 'ios', arch: 'mobile', label: 'iOS (iPhone / iPad)' };
    }
  }

  const ua = (navigator.userAgent || '').toLowerCase();
  const navPlatform = ((navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform || navigator.platform || '').toLowerCase();

  if (/android/.test(ua)) {
    return { os: 'android', arch: 'mobile', label: 'Android' };
  }
  if (/iphone|ipad|ipod/.test(ua) || (navPlatform === 'macintel' && navigator.maxTouchPoints > 1)) {
    return { os: 'ios', arch: 'mobile', label: 'iOS / iPadOS' };
  }
  if (/win/.test(navPlatform) || /windows/.test(ua)) {
    return { os: 'windows', arch: 'x64', label: 'Windows (64-bit)' };
  }
  if (/mac/.test(navPlatform) || /macintosh|mac os x/.test(ua)) {
    return { os: 'macos', arch: 'universal', label: 'macOS (Apple Silicon & Intel)' };
  }
  if (/linux|x11/.test(navPlatform) || /linux/.test(ua)) {
    return { os: 'linux', arch: 'x64', label: 'Linux (x86_64)' };
  }

  return { os: 'unknown', arch: 'x64', label: 'Desktop / Web' };
}

export async function initializeNativePlatform(theme: 'light' | 'system' | 'dark' = 'dark'): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const isDark =
      theme === 'dark' ||
      (theme === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    await StatusBar.setStyle({
      style: isDark ? StatusBarStyle.Dark : StatusBarStyle.Light,
    });

    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({
        color: isDark ? '#090a14' : '#eef3fb',
      });
    }
  } catch {
    // Ignore on platforms where StatusBar API is unavailable
  }

  try {
    await CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        CapApp.minimizeApp();
      }
    });
  } catch {
    // Ignore if listener fails
  }
}

export async function syncNativeStatusBarTheme(theme: 'light' | 'system' | 'dark'): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }
  try {
    const isDark =
      theme === 'dark' ||
      (theme === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    await StatusBar.setStyle({
      style: isDark ? StatusBarStyle.Dark : StatusBarStyle.Light,
    });
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({
        color: isDark ? '#090a14' : '#eef3fb',
      });
    }
  } catch {
    // Safe fallback
  }
}

export async function triggerNativeHaptic(style: 'light' | 'medium' | 'selection'): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }
  try {
    if (style === 'selection') {
      await Haptics.selectionChanged();
    } else {
      await Haptics.impact({
        style: style === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light,
      });
    }
    return true;
  } catch {
    return false;
  }
}

export async function sendNativeNotification(title: string, body: string): Promise<void> {
  if (typeof window !== 'undefined' && window.automateDesktop?.notify) {
    await window.automateDesktop.notify(title, body);
    return;
  }

  if (Capacitor.isNativePlatform()) {
    try {
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display === 'granted') {
        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id: Math.floor(Date.now() % 2147483647),
              schedule: { at: new Date(Date.now() + 250) },
            },
          ],
        });
      }
    } catch {
      // Ignore notification errors
    }
    return;
  }

  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}

export function subscribeNetworkStatus(onStatusChange: (connected: boolean) => void): () => void {
  const handleOnline = () => onStatusChange(true);
  const handleOffline = () => onStatusChange(false);

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    onStatusChange(navigator.onLine);
  }

  let capHandle: { remove: () => Promise<void> } | null = null;
  if (Capacitor.isNativePlatform()) {
    Network.getStatus()
      .then((status) => onStatusChange(status.connected))
      .catch(() => {});
    Network.addListener('networkStatusChange', (status) => {
      onStatusChange(status.connected);
    })
      .then((h) => {
        capHandle = h;
      })
      .catch(() => {});
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
    if (capHandle) {
      capHandle.remove().catch(() => {});
    }
  };
}

export function openExternalUrl(url: string): void {
  if (typeof window !== 'undefined' && window.automateDesktop?.openExternal) {
    window.automateDesktop.openExternal(url);
    return;
  }
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
}
