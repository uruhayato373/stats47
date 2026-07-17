import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@stats47/components"],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
