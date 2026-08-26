import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright は常設の :4747 と並行起動するため、E2E だけ別の build 出力を使う。
  // 同じ .next を共有すると片方の dev server が page.js を失い Runtime Error になる。
  distDir: process.env.NEXT_DIST_DIR?.trim() || ".next",
  transpilePackages: ["@stats47/components"],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
