---
name: performance-improvement
description: PSI、Chrome DevTools MCP、Cloudflare MCPでCore Web VitalsとWorkers性能を実測し、改善バックログ・実装・再計測を証拠ベースで進める。Use when user says "PSI改善", "LCP改善", "CLS改善", "パフォーマンス改善", "Core Web Vitals", "Cloudflare性能", or asks for a web performance audit.
primary_agent: performance-auditor
---

# パフォーマンス改善

PSI、Chrome DevTools、Cloudflare Workers の実測値からボトルネックを特定し、最小の変更を実装して再計測する。Performance / LCP / CLS / INP / TBT / TTFB と Workers CPU・Wall time を扱う。

実証ベース判定ルール（`.claude/rules/evidence-based-judgment.md`）に従い、推測ベースの判定を禁止。すべての effect/* ラベルは実測コマンドの結果を根拠とする。

## データの保管場所

| データ | 保管先 |
|---|---|
| 生メトリクス CSV | `reference/snapshots/YYYY-MM-DD/metrics.csv` |
| 目標しきい値設定 | `budgets.json` |
| 改善施策ログ（append-only） | `reference/improvement-log.md` |
| 未完了の施策 | `.claude/todo/improvements.md` |
| PSI Alert（自動起票） | GitHub Issues ラベル `psi-alert,auto-generated` |
| 週次集約 | `.claude/state/metrics/psi/{history.csv,LATEST.md}` |
| Cloudflare機械メトリクス | `.claude/state/metrics/cloudflare/` |

レビュー全文や一時ハンドオフ文書を新規作成しない。未完了策は改善バックログ、実測・実装履歴は本 skill の `reference/improvement-log.md`、再生成可能な機械値は `.claude/state/metrics/` に保存する。

## MCP前提

Claude Code の `/mcp` で次を確認する。

| MCP | 用途 | 必須状態 |
|---|---|---|
| `chrome-devtools` | Performance trace、Network、DOM、Lighthouse | connected |
| `cloudflare-docs` | 現行仕様の確認 | connected |
| `cloudflare-observability` | Workers logs / traces | authenticated |
| `cloudflare-graphql` | CPU・Wall time・request集計 | authenticated |

Observability / GraphQL が `Needs authentication` の場合は `/mcp` から認証する。認証できない場合でもローカル実装と Chrome 監査は進め、Cloudflareの読取・外部設定変更だけを未完了として報告する。

## 標準監査条件

Chrome DevTools MCP のモバイル再現条件を固定する。

- URL: `/`、代表 ranking、代表 area、代表 theme、`/blog`
- viewport: `412x915`、deviceScaleFactor `2.625`、mobile / touch
- network: `Slow 4G`
- CPU: `4x slowdown`
- navigation traceを同一URLで2回取得し、LCP・CLS・LCP要素・request priority・DOM数を比較
- `LCPBreakdown`、`LCPDiscovery`、`DocumentLatency`、`DOMSize`、`RenderBlocking`、`NetworkDependencyTree` を必要なページだけ分析

一度だけのPSI値とChrome再現値が矛盾した場合は、再現値を優先して断定せず、日次PSIとの継続観測へ戻す。

## 2026-08-05 MCP監査からの実装手順

詳細なbefore値と根拠は `reference/improvement-log.md` の `[MCP-PERF-2026-08-05]` を参照する。実装は次の順序を守り、各段階で再計測する。

### 0. 作業前

1. `git status --short --branch` で既存変更を確認する。勝手にpull・resetしない。
2. `.claude/todo/improvements.md` の対象IDと本runbookを読む。
3. `apps/web/wrangler.toml` のobservability設定を確認する。計測量・費用の根拠なしにsamplingを変更しない。
4. 本番deploy、R2 write、Cloudflare Rules変更は実装・検証と分離する。ユーザー承認までは実行しない。

### 1. `PERF-RANKING-LCP-02` — モバイル地図タイルの発見を早める

対象:

- `apps/web/src/features/ranking/components/RankingKeyPage/RankingPageHeadAssets.tsx`
- `apps/web/src/features/ranking/__tests__/ranking-map-performance-contract.test.ts`
- `apps/web/src/app/layout.tsx`

変更:

1. `initialTileUrls[0]` だけは全viewportで `rel=preload`、`as=image`、`fetchPriority=high` にする。
2. 2〜4枚目は `media="(min-width: 1024px)"` を維持し、モバイルで不要な3枚を先読みしない。
3. ベースタイル、`TileSwitcher`、モバイルでh1直後にある地図を削除・遅延しない。
4. 同一origin `/tiles/*` を使う現在実装と不整合な CartoDB のglobal `preconnect` / `dns-prefetch` だけを削除する。`storage.stats47.jp` と広告系hintは別計測なしに触らない。
5. 契約テストに「先頭だけ全viewport・追加3枚はdesktopのみ」を追加する。

完了条件:

- モバイルtraceで先頭タイルがHigh priorityかつ初期documentから発見される
- `LCPDiscovery` の3条件がpassし、5.8秒級のload delayが消える
- 地図背景、都道府県レイヤー、tile switcherが表示される
- LCP目標2.5秒以下。未達でもbefore比改善率と次の遅延区間を記録する

### 2. `PERF-RANKING-PAYLOAD-01` — RSC/HTMLペイロードを削減する

対象:

- `apps/web/src/features/ranking/components/RankingSidebar/RankingSidebarContainer.tsx`
- `apps/web/src/features/ranking/components/RankingSidebar/RankingSidebarClient.tsx`
- `apps/web/src/features/ranking/components/RankingSidebar/__tests__/select-sidebar-items.test.ts`
- `apps/web/src/features/ranking/services/load-ranking-page-model.ts`
- `packages/gis/scripts/generate-prefecture-thumbnail-topology.mjs`

変更:

1. `selectSidebarItems` をReact非依存のpure moduleへ移し、Container側で最大20件へ絞ってからClientへ渡す。
2. 現在のテスト内コピーを廃止し、実関数をimportして現在ページ除外、同group除外、代表選択、安定順序、20件上限を検証する。
3. 上記だけを先に計測し、全137件がRSCへ直列化されないことを確認する。
4. TopoJSONは別コミット単位で扱う。`topojson-simplify` の `presimplify` / `simplify` 後に再度 `topology(..., quantization)` して整数deltaへ戻し、候補を150KB以下にする。開始候補のweightは `0.0003`、quantizationは `100_000` とし、固定値にする前に47県・離島・境界・クリック判定を視覚比較する。
5. 既存R2オブジェクトの上書きはしない。versioned keyの候補生成、hash、byte size、47 geometries、必須propertyを検証し、R2反映前に停止して承認を得る。
6. build時の2,000超fetch回避と「本番アプリはR2 snapshotのみ読む」契約を維持する。

完了条件:

- Clientへ渡すsidebar itemが最大20件
- ranking documentの非圧縮HTMLがbefore 1,287,062 bytesから50%以上減る
- TopoJSON候補が150KB以下、47 geometries、`N03_001` / `N03_007`を保持
- モバイル地図の見た目・選択・tile LCPが悪化しない

### 3. `PERF-AREA-DOM-01` — area railのDOMを制限する

対象:

- `apps/web/src/features/area-profile/components/AreaProfileSidebar.tsx`
- `apps/web/src/app/areas/[areaCode]/page.tsx`
- 関連テスト

変更:

1. sidebarのstrengths / weaknessesを各12件までに制限する。定数を1か所に置き、`map` 前にsliceする。
2. `PageShell` / `ArticleShell` のresponsive rail全体はこの施策で再設計しない。
3. Tooltip、ranking link、全国上位/下位の意味を維持する。
4. 12件超を渡しても描画リンク数が上限を超えないテストを追加する。

完了条件:

- `/areas/13000` のDOM 9,101から70%以上削減
- rail内単一`nav`の873 childrenが再発しない
- LCP・CLS・desktop/mobile配置に回帰がない

### 4. `PERF-STATIC-CACHE-01` — hashed static assetのブラウザ再検証を止める (2026-08-05 実装済)

**Cloudflare Cache Response Rule は使わない。** `apps/web/public/_headers` で解決済み。

`public/` は OpenNext が `.open-next/assets/` 直下へ複製し (`@opennextjs/aws` の
`createAssets.js`: `public/* => *`)、`wrangler.toml` の `[assets] directory` がそこを指す。
Cloudflare 公式 ([Workers static assets headers](https://developers.cloudflare.com/workers/static-assets/headers/)、
アクセス 2026-08-05) が fingerprinted asset への `_headers` 利用を推奨している。
ダッシュボード操作が要らず、rollback が git に残り、テストで範囲を固定できる。

- 対象は `/_next/static/*` の 1 行だけ。**ハッシュを持たない URL へ広げない**
  (デプロイしても最大 1 年ぶん古い資産が配信される)。範囲は
  `apps/web/src/__tests__/static-assets-headers.test.ts` が固定する。
- `_headers` は Worker が生成するレスポンス (HTML / RSC / API) には適用されない。
- デプロイ後の確認: `curl -I https://stats47.jp/_next/static/css/<hash>.css` で
  `max-age=31536000, immutable` になり、Chrome の repeat navigation で 304 が消えること。

### 5. `PERF-WORKER-P99-01` — Workersの遅いrouteを特定する

1. `cloudflare-observability` で過去24時間と7日を読み、route別のhandler duration、CPU、wall time、error、fetch / R2 binding spanを集計する。
2. `cloudflare-graphql` のrequest・CPU・wall・subrequest集計と突合する。
3. p99だけでコードを推測しない。slow trace上位20件についてpath、cache status、R2 key / size、outbound fetchを記録する。
4. 同じroute / bindingが複数回支配する場合だけ、対象routeの重複fetch、直列await、巨大JSON parse、cache missをコードと照合する。
5. route単位の修正と対象テストを行い、無関係なWorker refactorやsampling変更はしない。

参照:

- [Workers Observability](https://developers.cloudflare.com/workers/observability/)
- [Workers Traces](https://developers.cloudflare.com/workers/observability/traces/)

完了条件:

- p99の支配route / bindingを実測で特定、または「サンプル不足」と明記
- 修正する場合はbefore/afterの同条件traceを保存
- 認証できない場合は未完了のまま残し、推測修正しない

### 6. `A11Y-AREA-CONTRAST-01`

`apps/web/src/features/area-databook/components/GenderPairedKpiGrid.tsx` の固定青・桃（実測contrast 3.67 / 3.52）を、light/dark双方で4.5:1以上になる既存tokenまたは濃色へ変更する。男女の識別を色だけに依存させず、Lighthouse accessibility 100または当該contrast違反0を確認する。

## 検証コマンド

変更範囲に応じて段階的に行う。

```bash
npm run test:run --workspace packages/visualization
npm run test --workspace apps/web -- --run \
  src/features/ranking/__tests__/ranking-map-performance-contract.test.ts \
  src/features/ranking/components/RankingSidebar/__tests__/select-sidebar-items.test.ts
npm run type-check --workspace apps/web
npm run type-check --workspace packages/gis
npm run type-check --workspace packages/visualization
npm run build --workspace apps/web
git diff --check
```

TopoJSON生成に触れない段階ではGIS / visualizationのfull testは省略可。route、RSC payload、static assetに触れる最終節目ではweb full buildを実行する。

## 効果判定

```bash
# PSI API（Lab data）
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://stats47.jp/<path>&strategy=mobile&key=$PSI_API_KEY"

# 週次 LATEST 確認
cat .claude/state/metrics/psi/LATEST.md
```

参照: `.claude/rules/evidence-based-judgment.md`

- [ ] 上記 PSI API コマンドを実行したか
- [ ] before/after の実測値（LCP ms / CLS）を記録したか
- [ ] 想定効果に根拠（過去事例 / web.dev URL）を併記したか
- [ ] NG ワード（「のはず」「兆候」「浸透待ち」）を使っていないか
- [ ] 効果が想定の 80% 未満なら仮説と次の検証コマンドを書いたか

deploy直後の1回だけで `effect/full` にしない。変更を `effect/pending` としてログへ追記し、重複しないbefore/after期間で判定する。

## Claude Code投入プロンプト

```text
/performance-improvement を使って、2026-08-05 MCP監査で確定したWeb性能改善を実装してください。

SSOT:
- .claude/skills/analytics/performance-improvement/SKILL.md
- .claude/skills/analytics/performance-improvement/reference/improvement-log.md の [MCP-PERF-2026-08-05]
- .claude/todo/improvements.md

最初に /mcp を確認し、chrome-devtools と cloudflare-docs の接続、cloudflare-observability と cloudflare-graphql の認証状態を報告してください。後者が Needs authentication なら認証を案内し、Chrome/ローカルで進められる作業は止めないでください。

実行順は次の通りです:
1. PERF-RANKING-LCP-02
2. PERF-RANKING-PAYLOAD-01（sidebar削減を先、TopoJSONは別段階）
3. PERF-AREA-DOM-01
4. A11Y-AREA-CONTRAST-01
5. PERF-WORKER-P99-01（Cloudflare read-only調査後、根拠があるrouteだけ修正）
6. PERF-STATIC-CACHE-01（実装済。public/_headers。Cloudflare Rule は作らない）

各IDごとに、変更前のChrome trace/Network/DOM値を取り、外科的に実装し、対象テスト、type-check、同条件のChrome再計測を行ってください。rankingのベース地図・TileSwitcher・モバイルh1直後の配置は維持してください。画像最適化や広告削除は今回のtraceでLCP改善見込みが0ms、または既存バックログと重複するため追加しないでください。

本番deploy、R2 write、Cloudflare Cache Rules / Cache Response Rulesの変更、git pull/resetは実行しないでください。R2候補とCloudflare ruleは、検証結果・対象式・rollbackを提示した時点で停止し、私の承認を待ってください。

最終節目で apps/web のfull build、必要なworkspace test/type-check、git diff --checkを実行してください。結果はIDごとに before / change / test / after / 未検証 / 次の停止点で報告し、実測をimprovement-logへ追記、未完了statusだけを改善バックログへ反映してください。
```
