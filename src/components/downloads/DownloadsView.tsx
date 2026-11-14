import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Download,
  Smartphone,
  Monitor,
  Apple,
  Terminal,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileArchive,
  Laptop,
  ArrowLeft,
} from 'lucide-react';
import {
  apiUrl,
  detectClientOS,
  DEFAULT_GITHUB_REPO,
  getRuntimeHost,
  openExternalUrl,
  DetectedOS,
} from '../../utils/platform';

interface ReleaseAssetInfo {
  name: string;
  size: number;
  downloadCount: number;
  downloadUrl: string;
  updatedAt?: string;
}

interface LatestReleaseResponse {
  repo: string;
  releasesPageUrl: string;
  actionsPageUrl: string;
  hasRelease: boolean;
  error?: string;
  release: {
    tagName: string;
    name: string;
    publishedAt: string;
    htmlUrl: string;
    prerelease: boolean;
    body: string;
  } | null;
  platforms: {
    androidApk?: ReleaseAssetInfo | null;
    androidAab?: ReleaseAssetInfo | null;
    windowsExe?: ReleaseAssetInfo | null;
    windowsMsi?: ReleaseAssetInfo | null;
    iosIpa?: ReleaseAssetInfo | null;
    macosDmg?: ReleaseAssetInfo | null;
    macosPkg?: ReleaseAssetInfo | null;
    linuxAppImage?: ReleaseAssetInfo | null;
    linuxDeb?: ReleaseAssetInfo | null;
    linuxRpm?: ReleaseAssetInfo | null;
    checksums?: ReleaseAssetInfo | null;
  };
}

interface DownloadsViewProps {
  onBack?: () => void;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const DownloadsView: React.FC<DownloadsViewProps> = ({ onBack }) => {
  const detected = detectClientOS();
  const runtimeHost = getRuntimeHost();

  const [releaseData, setReleaseData] = useState<LatestReleaseResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOS, setSelectedOS] = useState<DetectedOS>(
    detected.os === 'unknown' ? 'windows' : detected.os
  );
  const [isExportingZip, setIsExportingZip] = useState(false);

  const fetchLatestRelease = useCallback(async () => {
    setIsLoading(true);
    try {
      const resp = await fetch(
        apiUrl(`/api/releases/latest?repo=${encodeURIComponent(DEFAULT_GITHUB_REPO)}`)
      );
      if (resp.ok) {
        const json = (await resp.json()) as LatestReleaseResponse;
        setReleaseData(json);
      }
    } catch {
      // Leave releaseData nullable if offline
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLatestRelease();
  }, [fetchLatestRelease]);

  const handleDownloadSourceZip = async () => {
    if (isExportingZip) return;
    setIsExportingZip(true);
    try {
      const response = await fetch(apiUrl('/api/export-zip'));
      if (!response.ok) return;
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'automate-ai-chatbot.zip';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsExportingZip(false);
    }
  };

  const platforms = releaseData?.platforms || {};
  const releasesPageUrl =
    releaseData?.releasesPageUrl || `https://github.com/${DEFAULT_GITHUB_REPO}/releases`;
  const actionsPageUrl =
    releaseData?.actionsPageUrl || `https://github.com/${DEFAULT_GITHUB_REPO}/actions`;

  const recommendedAsset: { label: string; format: string; asset?: ReleaseAssetInfo | null } = (() => {
    switch (detected.os) {
      case 'android':
        return { label: 'Android APK Installer', format: '.apk', asset: platforms.androidApk };
      case 'ios':
        return { label: 'iOS App Store / TestFlight Build', format: '.ipa', asset: platforms.iosIpa };
      case 'windows':
        return { label: 'Windows 64-bit Setup', format: '.exe', asset: platforms.windowsExe };
      case 'macos':
        return { label: 'macOS Universal Disk Image', format: '.dmg', asset: platforms.macosDmg };
      case 'linux':
        return { label: 'Linux Portable AppImage', format: '.AppImage', asset: platforms.linuxAppImage };
      default:
        return { label: 'Windows 64-bit Setup', format: '.exe', asset: platforms.windowsExe };
    }
  })();

  const distributionRows: Array<{
    id: DetectedOS;
    platform: string;
    channel: string;
    extension: string;
    notes: string;
    asset?: ReleaseAssetInfo | null;
  }> = [
    {
      id: 'android',
      platform: 'Android',
      channel: 'Direct Install (Phones & Tablets)',
      extension: '.apk',
      notes: 'Android 7.0+ with native haptics, camera, voice & downloads',
      asset: platforms.androidApk,
    },
    {
      id: 'android',
      platform: 'Android Play Store',
      channel: 'Google Play Distribution Bundle',
      extension: '.aab',
      notes: 'Signed Android App Bundle formatted for Google Play Console',
      asset: platforms.androidAab,
    },
    {
      id: 'ios',
      platform: 'iOS (iPhone & iPad)',
      channel: 'App Store / TestFlight Distribution',
      extension: '.ipa',
      notes: 'Safe-area layout, native haptics & Voice/Camera support (requires Apple signing)',
      asset: platforms.iosIpa,
    },
    {
      id: 'windows',
      platform: 'Windows',
      channel: 'Standard Setup Installer',
      extension: '.exe',
      notes: 'NSIS setup wizard with Start Menu shortcut, auto-proxy & uninstaller',
      asset: platforms.windowsExe,
    },
    {
      id: 'windows',
      platform: 'Windows Enterprise',
      channel: 'Microsoft Installer Package',
      extension: '.msi',
      notes: 'Per-machine MSI installer for enterprise deployment',
      asset: platforms.windowsMsi,
    },
    {
      id: 'macos',
      platform: 'macOS Universal',
      channel: 'Apple Silicon & Intel Disk Image',
      extension: '.dmg',
      notes: 'Universal M-series + Intel build with macOS vibrancy & Hardened Runtime',
      asset: platforms.macosDmg,
    },
    {
      id: 'macos',
      platform: 'macOS Package',
      channel: 'Standard Apple Installer',
      extension: '.pkg',
      notes: 'Direct /Applications installer package for macOS',
      asset: platforms.macosPkg,
    },
    {
      id: 'linux',
      platform: 'Linux Portable',
      channel: 'Universal AppImage',
      extension: '.AppImage',
      notes: 'Run immediately on Ubuntu, Arch, Fedora, or Debian after chmod +x',
      asset: platforms.linuxAppImage,
    },
    {
      id: 'linux',
      platform: 'Linux Debian / Ubuntu',
      channel: 'APT Package',
      extension: '.deb',
      notes: 'System package for Ubuntu, Debian, Linux Mint, and Pop!_OS',
      asset: platforms.linuxDeb,
    },
    {
      id: 'linux',
      platform: 'Linux Fedora / RHEL',
      channel: 'RPM Package',
      extension: '.rpm',
      notes: 'System package for Fedora, Rocky Linux, and openSUSE',
      asset: platforms.linuxRpm,
    },
  ];

  const osTabs: Array<{ id: DetectedOS; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'android', label: 'Android', icon: Smartphone },
    { id: 'ios', label: 'iOS', icon: Apple },
    { id: 'windows', label: 'Windows', icon: Monitor },
    { id: 'macos', label: 'macOS', icon: Laptop },
    { id: 'linux', label: 'Linux', icon: Terminal },
  ];

  const filteredRows = distributionRows.filter((row) => row.id === selectedOS);

  return (
    <div className="flex-1 flex flex-col h-full w-full min-w-0 overflow-y-auto p-3 sm:p-5 md:p-6">
      <div className="max-w-5xl w-full mx-auto space-y-5 pb-8">
        {/* Top Header */}
        <div className="rounded-[26px] liquid-glass-elevated p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2.5">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="w-8 h-8 rounded-full liquid-glass-orb flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer shrink-0"
                  title="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                Automate AI Download Center
              </h1>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300/85">
              Native installers for mobile and desktop devices synced directly from verified GitHub Releases.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
              <span>Detected system: <strong className="text-slate-800 dark:text-slate-200">{detected.label}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Runtime: <strong className="text-slate-800 dark:text-slate-200">{runtimeHost}</strong></span>
              {releaseData?.release && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Latest release: <strong className="text-violet-600 dark:text-violet-300">{releaseData.release.tagName}</strong></span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={fetchLatestRelease}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-full liquid-glass-orb text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Check Releases</span>
            </button>
            <button
              type="button"
              onClick={() => openExternalUrl(releasesPageUrl)}
              className="px-4 py-2 rounded-full liquid-glass-cta text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>GitHub Releases</span>
            </button>
          </div>
        </div>

        {/* Recommended Download Spotlight */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[26px] liquid-glass-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="space-y-1.5 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300">
              Recommended for {detected.label}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {recommendedAsset.label} ({recommendedAsset.format})
            </h2>
            {recommendedAsset.asset ? (
              <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  Verified release asset <strong>{recommendedAsset.asset.name}</strong> ({formatBytes(recommendedAsset.asset.size)}) is ready to install.
                </span>
              </p>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  No published {recommendedAsset.format} release binary was returned from GitHub Releases yet. Trigger the Cross-Platform Release workflow in GitHub Actions to publish verified installers.
                </span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {recommendedAsset.asset ? (
              <button
                type="button"
                onClick={() => openExternalUrl(recommendedAsset.asset!.downloadUrl)}
                className="px-5 py-2.5 rounded-full liquid-glass-cta text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download {recommendedAsset.format}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openExternalUrl(actionsPageUrl)}
                className="px-4 py-2.5 rounded-full liquid-glass-orb text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open CI Build Workflows</span>
              </button>
            )}
          </div>
        </motion.div>

        {/* Platform Switcher & Packages */}
        <div className="rounded-[26px] liquid-glass-card p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Platform Installers & Packages
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select an operating system to inspect available installers or App Store distributions.
              </p>
            </div>

            <div className="inline-flex items-center gap-1 p-1 rounded-full liquid-glass-subtle overflow-x-auto scrollbar-none">
              {osTabs.map((tab) => {
                const Icon = tab.icon;
                const active = selectedOS === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedOS(tab.id)}
                    className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                      active
                        ? 'text-slate-950 dark:text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="downloads-os-pill"
                        transition={{ type: 'spring', stiffness: 680, damping: 38, mass: 0.4 }}
                        className="absolute inset-0 rounded-full liquid-glass-droplet"
                      />
                    )}
                    <Icon className="w-3.5 h-3.5 relative z-10" />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clean hairline list for the active OS */}
          <div className="divide-y divide-slate-900/10 dark:divide-white/10">
            {filteredRows.map((row) => (
              <div
                key={`${row.platform}-${row.extension}`}
                className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                    <span>{row.platform}</span>
                    <span className="text-slate-400 font-normal">·</span>
                    <span className="font-mono text-violet-600 dark:text-violet-300">{row.extension}</span>
                    <span className="text-slate-400 font-normal">·</span>
                    <span className="font-medium text-slate-600 dark:text-slate-300">{row.channel}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {row.notes}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {row.asset ? (
                    <button
                      type="button"
                      onClick={() => openExternalUrl(row.asset!.downloadUrl)}
                      className="px-4 py-2 rounded-full liquid-glass-cta text-xs font-bold flex items-center gap-1.5 cursor-pointer tabular-nums"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download ({formatBytes(row.asset.size)})</span>
                    </button>
                  ) : (
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Pending CI Release</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Complete Overview Table */}
          <div className="pt-4 border-t border-slate-900/10 dark:border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Complete Cross-Platform Release Matrix
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-900/10 dark:border-white/10 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-2 pr-4">Platform</th>
                    <th className="py-2 pr-4">Package</th>
                    <th className="py-2 pr-4">Release Asset Status</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/5 dark:divide-white/5">
                  {distributionRows.map((row) => (
                    <tr key={`matrix-${row.platform}-${row.extension}`}>
                      <td className="py-2.5 pr-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {row.platform}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-violet-600 dark:text-violet-300 whitespace-nowrap">
                        {row.extension}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-300">
                        {row.asset ? `${row.asset.name} · ${formatBytes(row.asset.size)}` : 'Build via GitHub Actions Release'}
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        {row.asset ? (
                          <button
                            type="button"
                            onClick={() => openExternalUrl(row.asset!.downloadUrl)}
                            className="text-violet-600 dark:text-violet-300 font-bold hover:underline cursor-pointer"
                          >
                            Download
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openExternalUrl(releasesPageUrl)}
                            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          >
                            View Releases
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Verification Checksums & Source Export */}
        <div className="rounded-[24px] liquid-glass-subtle p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              All GitHub Release binaries include verified <code className="font-mono">SHA256SUMS.txt</code> integrity manifests. Zero placeholder files or synthetic installers are served.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {platforms.checksums && (
              <button
                type="button"
                onClick={() => openExternalUrl(platforms.checksums!.downloadUrl)}
                className="px-3.5 py-2 rounded-full liquid-glass-orb text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                SHA256SUMS.txt
              </button>
            )}
            <button
              type="button"
              onClick={handleDownloadSourceZip}
              disabled={isExportingZip}
              className="px-3.5 py-2 rounded-full liquid-glass-orb text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <FileArchive className="w-3.5 h-3.5" />
              <span>{isExportingZip ? 'Packaging...' : 'Source Archive (.zip)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
