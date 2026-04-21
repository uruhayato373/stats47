---
name: cloudflare-cost-improvement
description: Cloudflare Workers / D1 / R2 の月次コストと主要メトリクス（D1 rows read、Workers CPU ms、storage、月額課金）を追跡し、budget 超過を検知・施策と効果を記録する。Use when user says "Cloudflare コスト確認", "D1 使用量", "Workers CPU 使用量", "請求書チェック", or when analyzing Cloudflare invoices / cost anomalies.
---

Cloudflare の月次コスト・リソース使用量を **時系列で追跡**し、打った施策と効果を記録するスキル。

Cloudflare の請求は月次（前月 15 日〜当月 14 日集計、翌 15 日請求）。施策効果の測定は「デプロイから 14 日以上経過した観測値」で判定する。

## 用途

- 月次請求額と主要メトリクスを継続的に記録したい
- budget（無料枠・警告・エラー閾値）を超過した指標を検知したい
- 打った施策（ISR 追加、キャッシュ調整等）の効果を測定したい
- 次に着手すべき改善候補を参照したい
- Cloudflare 請求書を受領したら数値をスナップショットとして残したい

## 管理ファイル

- **`reference/improvement-log.md`** — メイン成果物（Baseline / Action Log / Observation Log / Next Actions）
- **`reference/budgets.json`** — メトリクス別の budget（無料枠・警告・エラー閾値）
- **`reference/weekly-snapshots/YYYY-Www.json`** — 月次（または臨時）スナップショット

## 引数

```
$ARGUMENTS — [mode]
             mode:
               - status  (デフォルト) : improvement-log.md を読んで現状を要約
               - observe : 最新メトリクスをスナップショットとして記録 + budget 判定
               - action  : 新しい施策を Action Log に追加
               - next    : Next Actions から次の候補を提示
               - invoice : 請求書 PDF から月次スナップショットを作成
```

## 手順

### Step 1: データソースの特定

Cloudflare メトリクス取得の優先順:

1. **Cloudflare Observability MCP** (`cloudflare-observability`) — Workers logs / analytics 取得に利用
2. **Cloudflare GraphQL MCP** (`cloudflare-graphql`) — より柔軟な分析クエリ（D1 query-level, Workers by route）
3. **Cloudflare Dashboard（ユーザー手動共有）** — MCP 未接続時のフォールバック。ユーザーにスクショ or CSV 提供を依頼
4. **月次請求書 PDF** — `~/Downloads/*.pdf` 内。`invoice` モードで処理

MCP 接続状況の確認:
- `.mcp.json` に `cloudflare-observability` と `cloudflare-graphql` の 2 つが登録済み
- 初回利用時はブラウザで OAuth 認可が必要
- 接続失敗時は手動データ提供を促す

### Step 2: mode 別の処理

#### mode = status（デフォルト）

```
reference/improvement-log.md を Read し、以下を要約:
- 最新スナップショット（3.1 月次メトリクス履歴の最終行）
- 現在進行中の施策（Action Log で実測効果が PENDING のもの）
- budget 超過中のメトリクス
- 次に観測すべき日付（Next Actions の監視タスク）
```

#### mode = observe

```
1. データ取得:
   a. MCP 利用可能なら cloudflare-graphql で月次メトリクス取得
      （clause: "zone/accounts analytics for last N days"）
   b. MCP 未接続ならユーザーに Dashboard Analytics のスクショ or CSV を依頼
   c. 請求書到着後なら invoice モードを案内

2. 必須メトリクス:
   - d1_rows_read (月次合計)
   - d1_rows_written
   - d1_storage_gb (最新値 = GB-month)
   - workers_cpu_ms (月次合計)
   - workers_requests_standard

3. reference/weekly-snapshots/YYYY-Www.json に保存:
   - 命名: ISO Week（2026-W20 等）
   - period_start / period_end を明記
   - source: "Cloudflare GraphQL API via MCP" or "manual entry from dashboard"

4. budgets.json としきい値比較:
   - warning_threshold <= 値 < error_threshold → WARNING
   - 値 >= error_threshold → ERROR
   - alerts 配列に記録

5. improvement-log.md 更新:
   - 3.1 月次メトリクス履歴 に 1 行追記
   - 施策効果サマリの自動計算（gsc-improvement Step 2.observe.7 と同じロジック）:
     * 経過日数 < 14 → PENDING
     * 経過日数 >= 14 かつ |実測/想定| >= 80% → FULL_EFFECT ✅
     * 20% <= ... < 80% → PARTIAL_EFFECT ⚠️
     * < 20% → NO_EFFECT ❌
     * 逆方向 → ADVERSE 🚨
   - Action Log 各施策の「実測効果」テーブルにも同じ行を追記

6. 出力:
   - budget 超過アラートを先頭で強調
   - 判定変化（PENDING → FULL/PARTIAL 等）をハイライト
   - ADVERSE があれば注意喚起
```

#### mode = action

```
1. 必須フィールド確認（欠落時は追加質問）:
   - **施策 ID**: `T{Tier}-{Category}-{連番}`
     - Tier: T1（即効）/ T2（戦略）/ T3（要調査）
     - Category: D1READ / D1WRITE / D1STORAGE / CPUMS / REQUESTS / R2 / CACHE など
   - **ターゲット指標**: d1_rows_read / workers_cpu_ms など
   - **想定効果値**: 削減率 or 絶対値 delta
   - **デプロイ日**: YYYY-MM-DD
   - **PR / コミット hash**
   - **変更内容サマリ**
   - **変更ファイルリスト**

2. improvement-log.md の Action Log に追加（gsc-improvement と同じフォーマット）

3. 「実測効果」テーブル初期化（observe で自動追記される）
```

#### mode = next

```
improvement-log.md の Next Actions セクションから優先度上位 3 件を提示。
Tier 順（Tier 1 → 2 → 3）で消化する原則。
```

#### mode = invoice

```
1. 引数で PDF パス指定、または ~/Downloads/*.pdf の最新から自動検出
2. PDF を Read（Read tool は PDF 対応）
3. 以下を抽出:
   - Invoice number / Date of issue / Date due
   - Period（Mar 15 – Apr 14, 2026 のような表記）
   - 各 line item の Qty（超過量）と Amount
   - Total / Tax rate / Total in JPY（Tax Addendum ページ）
4. weekly-snapshots/YYYY-Www.json として保存:
   - source: "Cloudflare invoice IN-XXXXXX"
   - period_start / period_end
   - metrics 各項目に billable_overage と billable_amount_usd を記録
   - cost_summary に subtotal / tax / total / exchange_rate_jpy
5. budget 判定 + improvement-log.md に 1 行追記
6. 請求額・超過指標をユーザーに報告
```

### Step 3: 共通ルール

- **ログは append-only** — 過去エントリは改変しない
- **日付は絶対日付**（`2026-05-05`）。「今月」「先月」は使わない
- **数値はソース明示** — "invoice IN-62466340" or "Cloudflare GraphQL API at 2026-04-21"
- **施策は 1 PR 1 ID** — 複数目的の PR は分割
- **想定効果値はデプロイ前に明記** — 後付けバイアス防止
- **月次請求到着時は必ず invoice モード実行** — 14 日の集計ギャップがあるため、この記録を起点に判定

## MCP の使い方（参考）

### observability MCP で Workers logs / analytics を取得

Claude 内で自然文で呼び出し可能:
- 「過去 24h の Workers errors を取得」→ `mcp__cloudflare-observability__workers_logs_search` 等
- 「特定 route の CPU time を取得」→ analytics クエリ

### graphql MCP で詳細メトリクス

Cloudflare GraphQL Analytics API を直接叩ける。D1 query レベルの分析にも対応:
- 「月次の d1AnalyticsAdaptive の集計を取得」
- 「workersInvocationsAdaptive by scriptName」

### 初回利用時の OAuth

```
ブラウザで https://dash.cloudflare.com にログイン済みであること
MCP 接続時に Cloudflare の認可画面が開く → Allow
成功すると Claude が MCP ツールを呼べるようになる
```

## 関連スキル

- `/performance-improvement` — PSI / Lighthouse（速度系）の改善ログ
- `/gsc-improvement` — GSC（SEO 系）の改善ログ
- `/ga4-improvement` — GA4（行動分析）の改善ログ
- `/knowledge` — 恒久的な学び（本 skill は進行中、knowledge は確定した学び）
- `/sync-remote-d1` — ローカル D1 → 本番 D1 の push
- `/r2-du` — R2 ディスク使用量

## 前提

- `.mcp.json` に `cloudflare-observability` と `cloudflare-graphql` が登録済み
- Cloudflare アカウントへのブラウザログイン済み（OAuth 認可用）
- `reference/budgets.json` / `reference/improvement-log.md` が初期化済み
