/* eslint-disable @next/next/no-img-element */

type AvatarTileProps = {
  username: string;
  avatarUrl?: string | null;
  className?: string;
  /** Emerald hover glow (default: true) */
  glowOnHover?: boolean;
  /** Always-on pulsing glow (default: false) */
  pulse?: boolean;
};

export default function AvatarTile({
  username,
  avatarUrl,
  className,
  glowOnHover = true,
  pulse = false,
}: AvatarTileProps) {
  const base = "avatar-tile flex flex-col items-center justify-start text-center";
  const classes = [base, className].filter(Boolean).join(" ");

  const frameClasses = [
    "avatar-tile__frame",
    "rounded-lg border-[4px] border-[#5a3d1a] shadow-[0_3px_0_#2a1c0a]",
    "overflow-hidden flex items-center justify-center",
    "w-[110px] h-[110px] sm:w-[130px] sm:h-[130px]",
    "transition-all duration-200",
    glowOnHover
      ? "hover:brightness-105 hover:ring-4 hover:ring-[#2f6f32]/40 hover:shadow-[0_0_12px_#2f6f32aa]"
      : "",
    pulse ? "ring-4 ring-[#2f6f32]/60 glow-emerald emerald-pulse" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <div className={frameClasses}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`${username}'s avatar`}
            className="w-full h-full object-contain"
            style={{ imageRendering: "pixelated", padding: "4px" }}
            decoding="async"
            loading="lazy"
          />
        ) : (
          <div
            className="flex items-center justify-center text-[#5a3d1a] text-sm"
            aria-hidden="true"
          >
            No Avatar
          </div>
        )}
      </div>

      <div className="avatar-tile__nameplate mt-2 bg-[#5a3d1a] text-[#f4d68e] px-4 py-1 rounded-md text-[13px] sm:text-[14px] font-mc shadow-[0_2px_0_#2a1c0a] whitespace-nowrap">
        {username.toUpperCase()}
      </div>
    </div>
  );
}