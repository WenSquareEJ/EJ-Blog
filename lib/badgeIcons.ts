const ICON_MAP: Record<string, string> = {
  diamond: '💎',
  emerald: '🟢',
  gold: '🏆',
  creeper: '💥',
  sword: '🗡️',
  shield: '🛡️',
};

export function resolveBadgeIcon(icon: string | null | undefined) {
  if (!icon) return '🏅';
  const trimmed = icon.trim();
  if (!trimmed) return '🏅';

  const normalized = trimmed.toLowerCase();
  return ICON_MAP[normalized] ?? trimmed;
}

