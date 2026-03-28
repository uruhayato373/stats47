# Barrel Export 分割によるバンドルサイズ削減

**トリガー**: visualization 等のモノレポパッケージで JS バンドルが 1MB 超。dynamic import しても barrel export 経由だと全コンポーネントが 1 チャンクに含まれる。
**対処**: package.json に subpath exports（`"./d3/BarChart": "./src/d3/components/BarChart/index.ts"` 等）を追加し、dynamic import パスを `@stats47/visualization/d3/BarChart` のように個別コンポーネントに変更。static import も `next/dynamic` に変換。`optimizePackageImports` にパッケージを追加。
**根拠**: barrel export (`export * from "./BarChart"`) は webpack が全モジュールを 1 チャンクに含めてしまう。subpath export で解決すると webpack が個別に code split できる。
**確信度**: 0.9
**発見日**: 2026-03-28
**関連**: `packages/visualization/package.json`, `apps/web/next.config.ts` (optimizePackageImports)
