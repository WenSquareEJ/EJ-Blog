import Link from "next/link";

type Props = {
  isLoggedIn: boolean;
  isAdmin: boolean;
};

export default function MainNav({ isLoggedIn, isAdmin }: Props) {
  return (
    <nav className="mx-auto max-w-5xl px-3 py-2 flex items-center gap-2">
      {/* Brand */}
      <Link
        href="/"
        className="shrink-0 font-mc text-sm md:text-base leading-none hover:opacity-90"
      >
        EJ
      </Link>

      {/* Primary tabs: horizontally scrollable on mobile */}
      <ul className="flex-1 flex items-center gap-1 overflow-x-auto whitespace-nowrap pr-2">
        <li><Link className="btn-mc" href="/">Home</Link></li>
        <li><Link className="btn-mc" href="/blog">Blog</Link></li>
        <li><Link className="btn-mc" href="/minecraft-zone">Minecraft Zone</Link></li>
        <li><Link className="btn-mc" href="/scratch-board">Scratch Board</Link></li>
        <li><Link className="btn-mc" href="/ai">Ask Ebot</Link></li>

        {/* Secondary in a dropdown */}
        <li className="ml-1">
          <details className="relative">
            <summary className="btn-mc select-none cursor-pointer list-none">
              More ▾
            </summary>
            <ul className="absolute left-0 mt-1 min-w-40 bg-white text-black border border-black rounded shadow-lg z-50 p-1 space-y-1">
              <li><Link className="btn-mc w-full block text-left" href="/tags">Tags</Link></li>
              <li><Link className="btn-mc w-full block text-left" href="/milestones">Milestones</Link></li>
              <li><Link className="btn-mc w-full block text-left" href="/badger">Badger</Link></li>

              {/* Logged-in only */}
              {isLoggedIn && (
                <li><Link className="btn-mc w-full block text-left" href="/post/new">New Post</Link></li>
              )}

              {/* Admin only */}
              {isAdmin && (
                <>
                  <li><Link className="btn-mc w-full block text-left" href="/parent">Parent Zone</Link></li>
                  <li><Link className="btn-mc w-full block text-left" href="/moderation">Moderation</Link></li>
                </>
              )}
            </ul>
          </details>
        </li>
      </ul>
    </nav>
  );
}
