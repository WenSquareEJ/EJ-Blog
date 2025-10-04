type XPBarProps = {
  currentXP: number;
  nextLevelXP: number;
  className?: string;
};

export default function XPBar({ currentXP, nextLevelXP, className }: XPBarProps) {
  const clampedXP = Math.max(0, currentXP);
  const maxXP = Math.max(clampedXP, nextLevelXP > 0 ? nextLevelXP : 0);
  const progress = maxXP === 0 ? 0 : Math.min(1, clampedXP / maxXP);

  const wrapperClass = ['xp-bar-wrapper', className].filter(Boolean).join(' ');

  return (
    <div className={wrapperClass}>
      <div className="xp-bar-label font-mc text-xs uppercase tracking-[0.2em] text-mc-stone">
        XP: {clampedXP} / {maxXP}
      </div>
      <div
        className="xp-bar-track"
        role="progressbar"
        aria-valuenow={clampedXP}
        aria-valuemin={0}
        aria-valuemax={maxXP}
      >
        <span className="sr-only">Experience progress</span>
        <div
          className="xp-bar-fill"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
