import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // 静的エクスポート for Cloudflare Pages
  images: {
    unoptimized: true, // Cloudflare Pages用
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    mdxRs: true,
    // optimizeCss: true, // PostCSS最適化を無効化
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // PostCSS設定の最適化
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;
