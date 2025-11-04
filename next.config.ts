import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // OpenNextの要件: standalone出力を有効化
  output: "standalone",
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

    // Edge Runtimeではbetter-sqlite3を使用できないため、外部化
    // better-sqlite3はNode.js環境でのみ使用される
    config.externals = config.externals || [];
    if (Array.isArray(config.externals)) {
      config.externals.push({
        "better-sqlite3": "commonjs better-sqlite3",
        bindings: "commonjs bindings",
      });
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
    // Edge Runtimeと互換性がないため、useCacheを無効化
    // useCache: true,
  },
};

export default nextConfig;
