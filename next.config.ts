import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // ビルド時にESLintエラーを無視する（警告は表示される）
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ビルド時にTypeScriptエラーチェックを実行する
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
