import path from "path";
import { config } from "dotenv";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";
import webpack from "webpack";

// モノレポルートの .env.local を明示ロード（アプリ内 .env.local 不要）
config({ path: path.resolve(__dirname, "../../.env.local") });

// 最初に初期化を呼び出す（開発環境で必須）
// persist.path を wrangler.toml の persist_to と一致させ、
// pull:d1 スクリプトと dev server が同じ D1/R2 データを参照するようにする
try {
  initOpenNextCloudflareForDev({
    persist: { path: "../../.local/d1" },
  });
} catch (error) {
  // 初期化が不要な環境ではエラーを無視
  // 開発サーバーでは正常に初期化される
}

// Cloudflare Workersビルド時の判定
const isCloudflareWorkers = process.env.CLOUDFLARE_WORKERS === "true";

const nextConfig: NextConfig = {
  /* config options here */
  // OpenNextの要件: standalone出力を有効化
  output: "standalone",
  // trailing slash を統一（/ranking/ → /ranking にリダイレクト）
  trailingSlash: false,
  typescript: {
    // ビルド時にTypeScriptエラーチェックを実行する
    ignoreBuildErrors: false,
  },
  eslint: {
    // ビルド時にESLintエラーを無視する（警告は表示される）
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.stats47.jp",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // 静的ページ生成のタイムアウトを延長（デフォルト: 60秒）
  // ブログページの生成に時間がかかる場合があるため、180秒に設定
  staticPageGenerationTimeout: 180,

  // monorepo内のパッケージをトランスパイル対象に追加
  // Next.js 15 monorepo構成でのESM/Client Componentの適切なチャンク分割に必要
  transpilePackages: [
    "@stats47/ai-content",
    "@stats47/area",
    "@stats47/area-profile",
    "@stats47/category",
    "@stats47/components",
    "@stats47/database",
    "@stats47/estat-api",
    "@stats47/gis",
    "@stats47/logger",
    // "@stats47/mock", // テスト専用、本番ビルドには不要（stats-data/*.json が gitignore のため CI で失敗する）
    "@stats47/r2-storage",
    "@stats47/ranking",
    "@stats47/types",
    "@stats47/utils",
    "@stats47/visualization",
    "d3",
    "topojson-client",
    "react-leaflet",
    "leaflet",
  ],

  // サーバーサイドで外部化するパッケージ
  // Cloudflare Workersビルド時は空配列（Workers runtime用ビルドのため）
  serverExternalPackages: isCloudflareWorkers
    ? [] // Workers環境では外部化しない
    : ["better-sqlite3", "jsdom", "canvas"],

  // 本番ビルドではモックデータを除外
  webpack: (config, { dev, isServer }) => {
    const isProduction = process.env.NODE_ENV === "production";
    const path = require("path");

    // @/features/images/types を types/index.ts に解決するエイリアスを追加
    // types.ts を削除したため、types/index.ts を明示的に指定
    config.resolve.alias = {
      ...config.resolve.alias,
      "@/features/images/types": path.resolve(__dirname, "src", "features", "images", "types", "index.ts"),
    };

    if (isServer) {
      // サーバーサイドで不要な Next.js ファイルを除外
      // 開発ツールを除外（SSRでwindowオブジェクトアクセスエラーを防ぐ）
      // Next.js 15.5.9で "Cannot find module next-devtools" エラーが発生するため
      // resolve.alias を使用してダミーモジュールにリダイレクト
      const stubPath = path.resolve(__dirname, "src", "lib", "next-devtools-stub.ts");

      config.resolve.alias = {
        ...config.resolve.alias,
        // next-devtools 関連のすべてのモジュールをダミーにリダイレクト
        "next-devtools": stubPath,
        "@next/devtools": stubPath,
      };

      // NormalModuleReplacementPlugin を使用して next-devtools への参照をスタブに置き換える
      // 正規表現を厳密化（広範囲すぎるとハングの原因になる）
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^(@next\/devtools|next-devtools|.*next\/dist\/compiled\/next-devtools.*)$/,
          stubPath
        )
      );

      // terser、crypto-browserify、compression を一括除外（外部ライブラリのみ）
      // 注意: Next.js内部モジュール（next/dist/...）は絶対にIgnoreしない
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(terser-webpack-plugin|crypto-browserify|compression)$/,
        })
      );

      // fontkit を除外（必要な場合のみ）
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /@next\/font\/dist\/fontkit/,
        })
      );
    }

    if (isProduction && !isServer) {
      // 本番ビルド時にモックデータへの参照を削除
      config.resolve.alias = {
        ...config.resolve.alias,
        "@/data/mock": false,
      // __mocks__ディレクトリを除外
      "@/features/database/__mocks__": false,
      "@/features/r2-storage/__mocks__": false,
      "@/features/auth/__mocks__": false,
      "@/features/estat-api/__mocks__": false,
      };

      // __mocks__ディレクトリを含むJSONファイルを除外（モックデータはpublic/mock/に移動済み）
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /__mocks__\/.*\.json$/,
        })
      );
      
      // 注意: public/mockディレクトリはwebpackの処理対象外（public/は静的ファイル配信）
      // 本番環境でモックデータを配信しない場合は、.gitignoreやデプロイ設定で除外する

      // .local, local-r2, docsディレクトリ全体を除外
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /(\.local|local-r2|docs)\/.*/,
        })
      );
    }

    // Cloudflare Workersビルド時はexternals設定をスキップ（Workers runtime用ビルドのため）
    // commonjs形式の外部化がNode.js runtime前提のビルドを生成するため
    if (!isCloudflareWorkers) {
      // Edge Runtimeではbetter-sqlite3を使用できないため、外部化
      // better-sqlite3はNode.js環境でのみ使用される
      // serverExternalPackagesで設定済みのため、webpackのexternalsへの手動追加は不要
      // ただし、明示的に除外が必要な場合のためにコメントを残しておく
      /*
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push({
          "better-sqlite3": "commonjs better-sqlite3",
          bindings: "commonjs bindings",
        });
      }
      */

      // サーバーサイドでAWS SDKを外部化（Cloudflare Workersでは使用しない）
      if (isServer) {
        if (Array.isArray(config.externals)) {
          config.externals.push({
            "@aws-sdk/client-s3": "commonjs @aws-sdk/client-s3",
            "@aws-sdk/client-sso": "commonjs @aws-sdk/client-sso",
            "@smithy/node-http-handler": "commonjs @smithy/node-http-handler",
            "https-proxy-agent": "commonjs https-proxy-agent",
          });
        }
      }
    }

    // Edge Runtimeではfs/pathを使用できないため、外部化
    // これらはNode.js環境でのみ使用される（ローカル開発時のみ）
    // Edge Runtimeでも使用される場合があるため、すべての環境で設定
    // Cloudflare Workers runtimeではNode.js組み込みモジュールが使用できないため、すべて外部化
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      "fs/promises": false,
      path: false,
      // Node.jsの組み込みモジュールをクライアント側で外部化
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      http: false,
      https: false,
      http2: false, // AWS SDK の @smithy/node-http-handler 対応
      zlib: false,
      url: false,
      util: false,
      // Cloudflare Workers runtimeで使用できない追加のNode.js組み込みモジュール
      os: false,
      process: false,
      child_process: false,
      tty: false,
      vm: false,
      async_hooks: false,
      assert: false,
    };

    // クライアント側でNode.js専用パッケージを外部化
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Node.js専用のパッケージをクライアント側で無効化
        "https-proxy-agent": false,
        "agent-base": false,
        "@aws-sdk/client-s3": false,
        "@smithy/node-http-handler": false,
      };

      // Node.js専用パッケージを無視するプラグインを追加
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(https-proxy-agent|agent-base)$/,
        })
      );
    }

    return config;
  },

  // 環境変数で制御
  env: {
    USE_MOCK_DATA: process.env.NODE_ENV === "development" ? "true" : "false",
  },

  // 静的ファイルの最適化
  experimental: {
    optimizePackageImports: ["lucide-react"], // lucide-reactのインポート最適化（必要なアイコンのみバンドル）
    webpackBuildWorker: true, // 並列コンパイルを有効化（コンパイル速度向上）
    // Server Actionsのボディサイズ制限を緩和（デフォルト: 1MB -> 4MB）
    serverActions: {
      bodySizeLimit: "4mb",
    },
    // Edge Runtimeと互換性がないため、useCacheを無効化
    // useCache: true,
    // 注意: serverComponentsExternalPackages は非推奨
    // serverExternalPackages を使用してください（上記で設定済み）
  },

  // Next.js 15以降: outputFileTracingExcludesはトップレベルに配置
  // NFT (Node File Tracing) から開発用パッケージを除外（約52-55MBの削減）
  outputFileTracingExcludes: {
    "*": [
      // ビルドツール（本番実行時は不要）
      "./node_modules/webpack/**/*",
      "./node_modules/terser-webpack-plugin/**/*",
      "./node_modules/@esbuild/**/*",
      "./node_modules/typescript/**/*",

      // テストツール（本番実行時は不要）
      "./node_modules/vitest/**/*",
      "./node_modules/@vitest/**/*",
      "./node_modules/jsdom/**/*",

      // 型定義ファイル（実行時は不要）
      "./node_modules/@types/**/*",

      // Next.js の不要な機能
      "./node_modules/@img/**/*",
      "./node_modules/next/dist/compiled/next-devtools/**/*",
      "./node_modules/next/dist/compiled/@edge-runtime/**/*",
      "./node_modules/next/dist/compiled/@next/font/dist/fontkit/**/*",

      // 開発時のみ使用するツール
      "./node_modules/eslint/**/*",
      "./node_modules/@eslint/**/*",
      "./node_modules/prettier/**/*",
    ],
  },

  // Next.js 16ではTurbopackがデフォルトのため、webpack設定がある場合はturbopack設定が必要
  // package.jsonのスクリプトで--webpackフラグを使用してwebpackを明示的に指定
  // turbopack設定は不要（webpackを使用するため）
};

export default nextConfig;
