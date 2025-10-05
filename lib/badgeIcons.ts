const ICON_MAP: Record<string, string> = {
  diamond: '💎',
  emerald: '🟢',
  gold: '🏆',
  creeper: '💥',
  sword: '🗡️',
  shield: '🛡️',
};

export function resolveBadgeIcon(icon: string | null | undefined): string | null {
  if (!icon) return null;
  const key = icon.trim().toLowerCase();
  return ICON_MAP[key] ?? null;
}

