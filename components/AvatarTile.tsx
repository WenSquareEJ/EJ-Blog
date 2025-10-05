/* eslint-disable @next/next/no-img-element */

type AvatarTileProps = {
  username: string;
  avatarUrl?: string | null;
  className?: string;
};

export default function AvatarTile({
  username,
  avatarUrl,
  className,
}: AvatarTileProps) {
  const classes = [
    "avatar-tile flex flex-col items-center justify-start text-center",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <div
        className="avatar-tile__frame bg-[url('/ui/wood-bg.png')] bg-cover bg-center rounded-lg border-[4px] border-[#5a3d1a] shadow-[0_3px_0_#2a1c0a] overflow-hidden flex items-center justify-center w-[110px] h-[110px] sm:w-[130px] sm:h-[130px]"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`${username}'s avatar`}
            className="w-full h-full object-contain p-1"
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