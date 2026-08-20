# Server-Only モジュールの Barrel File 漏洩

**トリガー**: CI ビルドで "You're importing a component that needs server-only" エラー。クライアントコンポーネントが barrel file 経由で server-only モジュールを間接的に import している。
**対処**: barrel file (`index.ts`) から server-only モジュール（`computeYAxisDomain`, `DashboardGridLayout`, `CityListSidebar` 等）を除去し、`server.ts` に移動。import 側も `@/features/xxx/server` に変更。
**根拠**: barrel の `export * from "./utils"` は全モジュールを引き込む。1 つでも server-only があるとクライアントバンドルに含められずビルドエラーになる。
**確信度**: 0.9
**発見日**: 2026-03-28
**関連**: `apps/web/src/features/stat-charts/index.ts`, `server.ts`
