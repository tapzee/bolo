import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Remotion ships ESM that references its own package internals; letting Next
  // transpile it keeps the Player working in both dev and the RSC build.
  transpilePackages: ["remotion", "@remotion/player", "@remotion/captions"],

  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
