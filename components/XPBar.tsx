type XPBarProps = {
  currentXP: number;
  nextLevelXP: number;
  className?: string;
};

export default function XPBar({ currentXP, nextLevelXP, className }: XPBarProps) {
  const clampedXP = Math.max(0, currentXP);
  const maxXP = Math.max(clampedXP, nextLevelXP > 0 ? nextLevelXP : 0);
  const progress = maxXP === 0 ? 0 : Math.min(1, clampedXP / maxXP);

  const wrapperClass = ["xp-bar", className].filter(Boolean).join(" ");

  return (
    <div className={wrapperClass}>
      <div
        className="xp-bar__track"
        role="progressbar"
        aria-valuenow={clampedXP}
        aria-valuemin={0}
        aria-valuemax={maxXP}
        aria-label="Experience progress"
      >
        <span className="sr-only">Experience progress</span>
        <div className="xp-bar__fill" style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="xp-bar__badge" aria-hidden="true">
        {clampedXP} XP
      </div>
      <div className="xp-bar__meta">Next level at {maxXP} XP</div>
    </div>
  );
}
