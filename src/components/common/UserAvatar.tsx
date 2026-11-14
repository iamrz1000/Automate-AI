import React from 'react';

interface UserAvatarProps {
  name?: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showOnlineStatus?: boolean;
  showStatusBadge?: boolean;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name = 'User',
  email = '',
  role,
  avatarUrl,
  size = 'md',
  showOnlineStatus = false,
  showStatusBadge,
  className = '',
}) => {
  const displayStatus = showStatusBadge !== undefined ? showStatusBadge : showOnlineStatus;
  // Compute clean initials
  const cleanName = (name || email || 'User').trim();
  const parts = cleanName.split(/\s+/).filter(Boolean);
  let initials = 'U';
  if (parts.length >= 2) {
    initials = `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  } else if (cleanName.length > 0) {
    initials = cleanName.slice(0, 2).toUpperCase();
  }

  // Deterministic pleasant color gradient based on string hash
  const gradients = [
    'from-purple-600 to-indigo-600',
    'from-indigo-600 to-blue-600',
    'from-violet-600 to-fuchsia-600',
    'from-cyan-600 to-blue-700',
    'from-emerald-600 to-teal-700',
    'from-rose-600 to-purple-700',
  ];
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const gradientClass = gradients[Math.abs(hash) % gradients.length];

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-16 h-16 text-lg font-bold',
  };

  const statusSizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  };

  const hasCustomAvatar = avatarUrl && !avatarUrl.includes('ai8_50cac82f.png');

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {hasCustomAvatar ? (
        <img
          src={avatarUrl}
          alt={cleanName}
          className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-white/60 dark:ring-white/25 shadow-sm`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-tr ${gradientClass} text-white font-bold flex items-center justify-center ring-2 ring-white/55 dark:ring-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_4px_12px_rgba(0,0,0,0.2)] select-none tracking-tight`}
        >
          {initials}
        </div>
      )}

      {displayStatus && (
        <span
          className={`absolute bottom-0 right-0 ${statusSizeClasses[size]} bg-emerald-400 ring-2 ring-white dark:ring-[#121322] rounded-full shadow-xs`}
        />
      )}
    </div>
  );
};
