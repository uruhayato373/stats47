import react from '@vitejs/plugin-react';
import path from 'path';
import { configDefaults, defineConfig } from 'vitest/config';
import {
  DETERMINISTIC_RENDER_ENV,
  renderTestExcludes,
} from './src/shared/__tests__/helpers/render-test-contract';

/**
 * ★環境依存のレンダリングテスト (2026-07-31)。
 *
 * golden PNG 比較は sharp でラスタライズしてピクセル差分を取るため、**インストール
 * されているフォントに依存**する。golden を生成したマシン以外では 500px の許容差を
 * 超えて落ちる (このコンテナで実測 11 件)。`Scatterplot.test.tsx` は幅を props で
 * 渡さない経路で jsdom の clientWidth が 0 になり circle が 1 つも描かれない。
 *
 * これらは packages/* のテストが CI にも pre-commit にも配線されていなかった間、
 * 誰にも実行されないまま赤で放置されていた。CI 配線にあたり、環境非依存のテストだけを
 * 既定で走らせ、これらは `RUN_RENDER_TESTS=1` の明示 opt-in に分ける。
 * (goldenの再生成は `UPDATE_GOLDEN=true RUN_RENDER_TESTS=1` )
 */
const runRenderTests = process.env.RUN_RENDER_TESTS === '1';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/__tests__/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      ...configDefaults.exclude,
      ...renderTestExcludes(runRenderTests),
    ],
    setupFiles: ['./vitest.setup.ts'],
    env: runRenderTests
      ? {
          TZ: DETERMINISTIC_RENDER_ENV.timezone,
          LANG: DETERMINISTIC_RENDER_ENV.language,
          LC_ALL: DETERMINISTIC_RENDER_ENV.language,
        }
      : {},
    environmentOptions: {
      jsdom: {
        pretendToBeVisual: true,
        url: 'https://stats47.test/',
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/__tests__/**', 'src/**/index.ts', 'src/**/types/**', '**/*.stories.tsx'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
