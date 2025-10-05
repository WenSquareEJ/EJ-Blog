import AvatarPageClient from "./AvatarPageClient";

export const dynamic = "force-dynamic";   // opt out of SSG
export const revalidate = 0;              // disable caching

export default function Page() {
  return <AvatarPageClient />;
}
