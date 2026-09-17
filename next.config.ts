import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build mandiri untuk Docker: menghasilkan .next/standalone berisi server.js
  // beserta node_modules minimal, sehingga image runtime tidak perlu dependency penuh.
  output: "standalone",

  // Jangan bocorkan stack teknologi lewat header X-Powered-By.
  poweredByHeader: false,

  // Aplikasi berada di belakang Cloudflare Tunnel (cloudflared -> app:3000).
  // Kompresi sudah ditangani oleh edge Cloudflare, jadi gzip di Node hanya
  // membuang CPU container.
  compress: false,

  allowedDevOrigins: [
    "192.168.1.19",
    "192.168.1.*",
    "10.254.19.161",
    "10.64.226.161",
    "localhost",
    "127.0.0.1",
  ],
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  turbopack: {
    resolveAlias: {
      canvas: "./src/app/components/empty.js",
    },
  },
  async rewrites() {
    return [
      {
        source: "/login",
        destination: "/backoffice/login",
      },
      {
        source: "/admin/:path*",
        destination: "/backoffice/admin/:path*",
      },
      {
        source: "/admin",
        destination: "/backoffice/admin",
      },
      {
        source: "/mentor/:path*",
        destination: "/backoffice/mentor/:path*",
      },
      {
        source: "/mentor",
        destination: "/backoffice/mentor",
      },
      {
        source: "/maba/:path*",
        destination: "/backoffice/maba/:path*",
      },
      {
        source: "/maba",
        destination: "/backoffice/maba",
      },
      {
        source: "/api/:path*",
        destination: "/backoffice/api/:path*",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/backoffice",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/bakcoffice",
        destination: "/login",
        permanent: false,
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

export default nextConfig;
