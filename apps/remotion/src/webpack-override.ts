import type { WebpackOverrideFn } from "@remotion/bundler";
import { enableTailwind } from "@remotion/tailwind-v4";

/**
 * Studio / CLI (remotion.config.ts) と bundle() を呼ぶスクリプトが共有する webpack の設定。
 * `@` を src へ向け、Tailwind (src/index.css が読む @stats47/ui-theme と共有部品のクラス) を有効にする。
 * srcPath は呼び元が渡す (CJS と ESM のスクリプトが混在し、config は esbuild で書き出されて読まれるため __dirname に頼らない)。
 */
export const makeWebpackOverride =
  (srcPath: string): WebpackOverrideFn =>
  (config) =>
    enableTailwind({
      ...config,
      resolve: {
        ...config.resolve,
        alias: { ...(config.resolve?.alias ?? {}), "@": srcPath },
      },
    });
