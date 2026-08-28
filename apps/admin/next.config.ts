import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 常設 dev / Playwright / build は別の出力先を使う。
  // run-next.mjs は通常dev、playwright.config.ts はE2Eの NEXT_DIST_DIR を設定する。
  // 同じ .next を共有すると起動中の webpack runtime が chunk を失い Runtime Error になる。
  distDir: process.env.NEXT_DIST_DIR?.trim() || ".next",
  transpilePackages: ["@stats47/components", "@stats47/data-configs", "@stats47/types"],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
