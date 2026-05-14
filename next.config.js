/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
/** Extra pattern from env (optional); pathname omitted so all /storage/* paths match */
let supabaseImagePatternFromEnv = null;
if (supabaseUrl) {
  try {
    const { hostname, protocol } = new URL(supabaseUrl.trim());
    supabaseImagePatternFromEnv = {
      protocol: protocol.replace(":", ""),
      hostname,
    };
  } catch {
    /* ignore */
  }
}

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      { source: "/sign-in", destination: "/login", permanent: true },
      { source: "/sign-up", destination: "/login", permanent: true },
      { source: "/home", destination: "/dashboard", permanent: false },
      { source: "/my-businesses", destination: "/dashboard", permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "graph.microsoft.com",
      },
      // Any Supabase project ref (*.supabase.co) — works even if env was missing at config eval time
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      ...(supabaseImagePatternFromEnv ? [supabaseImagePatternFromEnv] : []),
    ],
  },
};

module.exports = nextConfig;
