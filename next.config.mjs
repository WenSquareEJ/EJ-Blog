const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

let supabaseHost = null;
if (SUPABASE_URL) {
  try {
    supabaseHost = new URL(SUPABASE_URL).hostname;
  } catch (error) {
    console.warn('[next.config] Failed to parse NEXT_PUBLIC_SUPABASE_URL', error);
  }
}

const remotePatterns = [
  { protocol: 'https', hostname: 'pub-*.supabase.co', pathname: '/storage/v1/object/public/**' }
];

if (supabaseHost) {
  remotePatterns.push({ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' });
} else {
  remotePatterns.push({ protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ["*"] }
  },
  images: {
    remotePatterns
  },
  async redirects() {
    return [
      { source: "/site/avatar", destination: "/avatar-house", permanent: false },
      { source: "/avatar", destination: "/avatar-house", permanent: false },
      { source: "/site/avatar-house", destination: "/avatar-house", permanent: false },
    ];
  }
}

export default nextConfig
