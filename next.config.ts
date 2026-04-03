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
        hostname: "pub-2120d1f9926946a7ae669453e43211dc.r2.dev",
      },
    ],
  },
};

export default nextConfig;
