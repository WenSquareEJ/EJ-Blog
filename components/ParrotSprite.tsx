type ParrotSpriteProps = {
  className?: string;
};

export default function ParrotSprite({ className }: ParrotSpriteProps) {
  const classes = ["parrot-sprite", className].filter(Boolean).join(" ");

  return (
    <div className={classes} aria-hidden="true">
      <svg
        width={72}
        height={96}
        viewBox="0 0 24 32"
        role="presentation"
        focusable="false"
        shapeRendering="crispEdges"
      >
        <rect width="24" height="32" fill="none" />
        <rect x="9" y="2" width="4" height="2" fill="#f9d05b" />
        <rect x="13" y="4" width="2" height="2" fill="#f9d05b" />
        <rect x="7" y="4" width="10" height="2" fill="#e4302b" />
        <rect x="6" y="6" width="12" height="2" fill="#e4302b" />
        <rect x="6" y="8" width="10" height="2" fill="#db2426" />
        <rect x="8" y="10" width="8" height="2" fill="#db2426" />
        <rect x="8" y="12" width="8" height="6" fill="#c92024" />
        <rect x="6" y="18" width="12" height="4" fill="#2f90de" />
        <rect x="6" y="22" width="8" height="2" fill="#1b70c8" />
        <rect x="8" y="24" width="4" height="2" fill="#2f90de" />
        <rect x="12" y="24" width="4" height="2" fill="#1b70c8" />
        <rect x="10" y="26" width="4" height="2" fill="#f9d05b" />
        <rect x="10" y="28" width="4" height="2" fill="#f5a623" />
        <rect x="4" y="12" width="4" height="6" fill="#33a45e" />
        <rect x="16" y="12" width="4" height="6" fill="#33a45e" />
        <rect x="10" y="6" width="2" height="2" fill="#31160d" />
        <rect x="9" y="6" width="1" height="1" fill="#ffffff" />
      </svg>
    </div>
  );
}
