import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // 静的エクスポート for Cloudflare Pages
  images: {
    unoptimized: true, // Cloudflare Pages用
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    mdxRs: true,
    optimizeCss: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
