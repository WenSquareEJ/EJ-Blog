type PixelProps = {
  className?: string;
};

export default function Bird({ className }: PixelProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 18"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="24" height="18" fill="none" />
      <rect x="2" y="8" width="6" height="6" fill="var(--mc-sky-light)" />
      <rect x="4" y="6" width="10" height="6" fill="var(--mc-sky-light)" />
      <rect x="12" y="6" width="6" height="6" fill="var(--mc-sky-deep)" />
      <rect x="10" y="8" width="8" height="6" fill="var(--mc-sky-deep)" />
      <rect x="6" y="10" width="10" height="4" fill="var(--mc-cloud)" />
      <rect x="14" y="8" width="2" height="2" fill="var(--mc-ink)" />
      <rect x="16" y="10" width="4" height="2" fill="var(--mc-field-light)" />
      <rect x="4" y="12" width="6" height="2" fill="var(--mc-field-light)" />
      <rect x="12" y="12" width="3" height="3" fill="var(--mc-tree-dark)" />
      <rect x="5" y="14" width="4" height="1" fill="var(--mc-tree-dark)" />
    </svg>
  );
}
