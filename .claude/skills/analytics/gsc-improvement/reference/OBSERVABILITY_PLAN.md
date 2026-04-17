# 観測基盤の導入計画（Sentry + Cloudflare Analytics Engine）

本計画は、施策効果測定と 5xx 原因追跡のための観測基盤を stats47.jp に導入する手順をまとめる。Tier 0 施策（URL 空間整理）を進める上で、「何が起きているか」を見える化することが必須。

## 背景

**現状の観測力の欠如**:
- GSC は週次サンプル（最大 1,000 URL）しか取れない
- Cloudflare Workers Logs は 24 時間保持、手動でしか見られない
- 施策デプロイ後に「どこで 5xx が出ているか」リアルタイムで追えない
- 効果測定は GSC のインデックス反映を 2-4 週間待つしかない

**目指す状態**:
- 本番 5xx を URL パターン別・発生時刻別にダッシュボードで確認できる
- 施策デプロイ前後で 5xx 件数の変化を時系列で追える
- Googlebot からのアクセスと一般ユーザーのアクセスを区別して計測

## A. Sentry 導入（エラートラッキング）

### A-1. 対象

- 本番 `apps/web`（Next.js on Cloudflare Pages）
- 5xx 応答、unhandled exception、critical な warning

### A-2. 必要な作業

1. **Sentry プロジェクト作成**（ユーザー作業）
   - sentry.io でプロジェクト作成（Platform: Next.js）
   - DSN を取得して Cloudflare Pages の環境変数 `SENTRY_DSN` に設定

2. **パッケージ追加**
   ```bash
   npm install @sentry/nextjs --workspace=apps/web
   ```

3. **設定ファイル**:
   - `apps/web/sentry.client.config.ts` — Client Component のエラー捕捉
   - `apps/web/sentry.server.config.ts` — Server Component / API ルートのエラー
   - `apps/web/sentry.edge.config.ts` — Cloudflare Pages (Edge Runtime) 対応
   - `apps/web/next.config.ts` に `withSentryConfig` でラップ

4. **Cloudflare Workers 特殊対応**
   - Cloudflare Pages は Edge Runtime なので `@sentry/nextjs` の `onRequestError` フックを使う
   - Source Maps を Sentry にアップロード（`SENTRY_AUTH_TOKEN` を使った自動アップロード）

5. **フィルタ設定**
   - `beforeSend` フック: 404/410 は除外（既知の 404 は Sentry に送らない）
   - Bot トラフィック（Googlebot 等）は別タグで区別

### A-3. 導入後に見えるもの

- URL 別 5xx 発生件数（時系列グラフ）
- スタックトレース付きのエラー詳細
- Release（デプロイ）ごとの regression 検知
- パフォーマンス（LCP, TTFB）の自動計測

### A-4. コスト

- Sentry Free: 5K error events/month。stats47.jp 規模なら初期は十分
- Team: $26/mo（50K events/month）。将来必要に応じて移行

### A-5. 推定工数

**2〜3 時間**（初期セットアップ + デプロイ + 動作確認）

## B. Cloudflare Analytics Engine（本番リクエスト詳細）

### B-1. 対象

- 全本番リクエスト（Googlebot / ユーザー / Bot の比率、status code 分布）
- URL パターン × status の時系列集計

### B-2. 必要な作業

1. **Analytics Engine データセット作成**（Cloudflare Dashboard）
   - Workers & Pages → Data Sources → Analytics Engine → 新規データセット `stats47_requests`

2. **Worker binding 追加**
   - `apps/web/wrangler.toml` に analytics_engine_datasets を追加:
     ```toml
     [[analytics_engine_datasets]]
     binding = "ANALYTICS"
     dataset = "stats47_requests"
     ```

3. **middleware.ts で events 書き込み**
   ```typescript
   // 各リクエストで以下を記録:
   env.ANALYTICS.writeDataPoint({
     blobs: [request.url, request.headers.get('user-agent') || '', statusCode.toString()],
     doubles: [responseTime],
     indexes: [pathname],
   });
   ```

4. **クエリ・ダッシュボード**
   - Cloudflare Dashboard → Analytics Engine → SQL でクエリ（例: 過去 24h の 5xx を URL 別集計）
   - Grafana Cloud 連携で可視化（optional）

### B-3. 導入後に見えるもの

- URL パターン別の status code 分布（5xx だけでなく全てのリクエスト）
- 施策デプロイ前後 24 時間の比較
- Googlebot vs 一般ユーザーの比率
- リクエスト頻度の高い URL TOP 100

### B-4. コスト

- Analytics Engine: 10M data points/month 無料
- Cloudflare Pro $20/mo に含まれる

### B-5. 推定工数

**4〜6 時間**（binding 設定 + middleware 統合 + 初期ダッシュボード構築）

## C. 統合方針

### C-1. 優先度

1. **Sentry 先**（A）: 即効性が高く、5xx の具体的な原因追跡に直結
2. **Analytics Engine 後**（B）: 全体像の把握と長期的な施策効果測定に使う

### C-2. 導入順序

**Week 1 (2026-W17)**:
- Sentry プロジェクト作成（ユーザー作業）
- パッケージ追加 + 設定ファイル作成（Claude）
- デプロイ後、5xx 発生確認

**Week 2 (2026-W18)**:
- Cloudflare Analytics Engine データセット作成（ユーザー作業）
- middleware への書き込み統合（Claude）
- Dashboard で過去 7d の URL × status を集計

**Week 3-4 (2026-W19-W20)**:
- Sentry の Source Maps 整備
- Analytics Engine の運用 SQL テンプレ化
- `.claude/skills/analytics/` に observability 系スキル追加

### C-3. improvement-log.md との連携

- Sentry 導入後、新たに判明した 5xx パターンは **T0-5xx-02, T0-5xx-03** として Action Log に追加
- Analytics Engine 導入後、`/gsc-improvement observe` を拡張して 5xx 実数を自動取得するフローを検討

### C-4. 既存ツールとの重複回避

- **Cloudflare Workers Logs** は Sentry と役割分担（Workers Logs は 24h 保持のデバッグ用、Sentry は長期トラッキング）
- **GA4** はフロントエンド計測（PV/CV）、Sentry はサーバー側エラー、Analytics Engine は生リクエスト、と役割が重ならない

## D. リスクと緩和策

| リスク | 緩和策 |
|---|---|
| Sentry が Edge Runtime 非対応パターンに触れる | Next.js 14+ + @sentry/nextjs 7.x 以降で対応済み（公式サポート） |
| Cloudflare Pages 環境変数の漏洩 | DSN は `NEXT_PUBLIC_` 付きで client 露出前提（Sentry DSN は公開前提） |
| Analytics Engine の Data points 超過 | middleware でサンプリング（1% sampling 等）可能。初期は 100% で運用 |
| 導入で本番が一時的に不安定化 | ステージング環境で 1 週間運用してから本番デプロイ |

## E. 次のアクション

- ユーザーに Sentry プロジェクト作成を依頼
- DSN 取得後、Claude 側で `@sentry/nextjs` セットアップを PR として準備
- 並行して Cloudflare Analytics Engine のデータセット作成を依頼

## 参照

- [@sentry/nextjs 公式ドキュメント](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Cloudflare Analytics Engine](https://developers.cloudflare.com/analytics/analytics-engine/)
- `.claude/skills/analytics/gsc-improvement/SKILL.md`
- `.claude/skills/analytics/gsc-improvement/reference/improvement-log.md`
