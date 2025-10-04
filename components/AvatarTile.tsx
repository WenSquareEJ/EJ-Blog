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
  const classes = ["avatar-tile", className].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      <div className="avatar-tile__frame">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`${username}'s avatar`}
            className="avatar-tile__image"
            decoding="async"
            loading="lazy"
          />
        ) : (
          <div className="avatar-tile__placeholder" aria-hidden="true">
            <span className="avatar-tile__eye avatar-tile__eye--left" />
            <span className="avatar-tile__eye avatar-tile__eye--right" />
            <span className="avatar-tile__smile" />
          </div>
        )}
      </div>
      <div className="avatar-tile__nameplate">
        <span className="avatar-tile__name" aria-hidden="true">
          {username}
        </span>
        <span className="sr-only">{username}</span>
      </div>
    </div>
  );
}
