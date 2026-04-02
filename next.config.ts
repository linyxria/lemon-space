import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "pub-b1990799b0fb4fd6a1ee43bb3167231e.r2.dev",
      },
    ],
  },
};

export default nextConfig;
