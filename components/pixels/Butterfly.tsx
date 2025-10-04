type PixelProps = {
  className?: string;
};

export default function Butterfly({ className }: PixelProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 28 20"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="28" height="20" fill="none" />
      <rect x="4" y="6" width="6" height="8" fill="var(--mc-field-light)" />
      <rect x="6" y="4" width="6" height="8" fill="var(--mc-field)" />
      <rect x="18" y="6" width="6" height="8" fill="var(--mc-sky-light)" />
      <rect x="16" y="4" width="6" height="8" fill="var(--mc-sky-deep)" />
      <rect x="12" y="6" width="4" height="8" fill="var(--mc-tree-dark)" />
      <rect x="12" y="4" width="4" height="2" fill="var(--mc-tree-soft)" />
      <rect x="10" y="8" width="2" height="4" fill="var(--mc-ink)" />
      <rect x="16" y="8" width="2" height="4" fill="var(--mc-ink)" />
      <rect x="6" y="10" width="4" height="2" fill="var(--mc-grass)" />
      <rect x="18" y="10" width="4" height="2" fill="var(--mc-grass)" />
    </svg>
  );
}
