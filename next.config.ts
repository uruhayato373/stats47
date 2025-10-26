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

  // 本番ビルドではモックデータを除外
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // 本番ビルド時にモックデータへの参照を削除
      config.resolve.alias = {
        ...config.resolve.alias,
        "@/data/mock": false,
      };
    }
    return config;
  },

  // 環境変数で制御
  env: {
    USE_MOCK_DATA: process.env.NODE_ENV === "development" ? "true" : "false",
  },

  // 静的ファイルの最適化
  experimental: {
    optimizePackageImports: ["@/infrastructure/mock-data"],
  },
};

export default nextConfig;
