import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // O driver nativo do SQLite precisa ficar fora do bundle do servidor.
  serverExternalPackages: ["@libsql/client", "libsql", "pg"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
