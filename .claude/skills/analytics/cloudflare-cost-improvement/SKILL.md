---
name: cloudflare-cost-improvement
description: Cloudflare Workers / D1 / R2 の月次コストと主要メトリクス（D1 rows read、Workers CPU ms、storage、月額課金）を GitHub Issues で追跡し、budget 超過検知・施策と効果を記録する。Use when user says "Cloudflare コスト確認", "D1 使用量", "Workers CPU 使用量", "請求書チェック", or when analyzing Cloudflare invoices / cost anomalies.
---

Cloudflare の月次コスト・リソース使用量を **GitHub Issues で時系列追跡**し、打った施策と効果を記録するスキル。

Cloudflare の請求は月次（前月 15 日〜当月 14 日集計、翌 15 日請求）。施策効果の測定は「デプロイから 14 日以上経過した観測値」で判定する。

## データの保管場所

| データ | 保管先 | 理由 |
|---|---|---|
| 生メトリクス・請求書 snapshot | git: `reference/weekly-snapshots/YYYY-Www.json` | immutable、diff 比較、オフライン可 |
| budget しきい値設定 | git: `reference/budgets.json` | プロジェクト設定 |
| 施策（1 施策 1 Issue） | GitHub Issues ラベル `cost-improvement` | タイムライン・PR リンク・通知・検索 |
| 月次スナップショット（議論用） | GitHub Issues ラベル `cost-snapshot` | 施策 Issue との相互参照、Web UI |
| 観測値の時系列・効果判定 | 各施策 Issue へのコメント + `effect/*` ラベル切替 | 自然なスレッド構造 |

## ラベル体系

- **分類**: `cost-improvement` / `cost-snapshot`
- **Tier**: `tier-1`（即効）/ `tier-2`（戦略）/ `tier-3`（要調査）
- **対象メトリクス**: `metric/d1-read` / `metric/d1-write` / `metric/d1-storage` / `metric/cpu-ms` / `metric/r2` / `metric/requests`
- **効果判定**: `effect/pending` → `effect/full` / `effect/partial` / `effect/none` / `effect/adverse`

## 引数

```
$ARGUMENTS — [mode]
             mode:
               - status  (デフォルト) : 直近スナップショット + 進行中施策を要約
               - observe : 新 snapshot 作成 + budget 判定 + 施策効果追記
               - action  : 新しい施策 Issue を作成
               - next    : 次に着手すべき改善候補を提示
               - invoice : 請求書 PDF から snapshot Issue を作成
```

## 手順

### Step 1: データソースの特定

Cloudflare メトリクス取得の優先順:

1. **Cloudflare Observability MCP** (`cloudflare-observability`) — Workers logs / analytics
2. **Cloudflare GraphQL MCP** (`cloudflare-graphql`) — 柔軟な分析クエリ
3. **Cloudflare Dashboard（ユーザー手動共有）** — MCP 未接続時
4. **月次請求書 PDF** — `~/Downloads/*.pdf` 内、`invoice` モードで処理

### Step 2: mode 別の処理

#### mode = status（デフォルト）

```
以下を並列に実行して要約:
1. reference/weekly-snapshots/ 配下の最新 YYYY-Www.json を Read
2. gh issue list --label cost-snapshot --state open --limit 3 で直近スナップショット Issue
3. gh issue list --label cost-improvement --state open で進行中施策一覧
4. gh issue list --label "effect/pending" で効果測定待ちの施策
5. gh issue list --label "effect/adverse" で逆効果検出済み（あれば警告強調）

出力:
- 最新 snapshot の合計額 + budget 超過メトリクス
- 進行中施策を「デプロイ日 - 経過日数 - ターゲット - effect ラベル」形式で列挙
- 次観測予定日（最も近いもの）
```

#### mode = observe

```
1. データ取得:
   a. cloudflare-graphql MCP で月次メトリクス（D1 rows read/written、CPU ms、storage、requests）
   b. MCP 未接続ならユーザーに Dashboard スクショ or CSV を依頼
   c. 請求書が手元にあるなら invoice モードへ誘導

2. reference/weekly-snapshots/YYYY-Www.json として JSON 保存:
   - 命名: ISO Week（2026-W20 等）
   - source: "Cloudflare GraphQL API via MCP" or "manual entry"
   - period_start / period_end 必須

3. budgets.json 判定:
   - warning_threshold <= 値 < error_threshold → WARNING
   - 値 >= error_threshold → ERROR
   - alerts 配列に記録

4. snapshot Issue 作成 or 更新:
   gh issue create --label cost-snapshot --title "[Cost Snapshot] YYYY-MM (...)" \
     --body "<template 埋め>"
   前月比セクションに前月 snapshot Issue の数値を引き算して記載

5. 進行中施策 Issue の効果判定（最重要）:
   gh issue list --label cost-improvement --label "effect/pending" で対象取得。
   各 Issue に対して:
   - 経過日数 = observe 実行日 - デプロイ日
   - 実測 delta = 最新値 - デプロイ時点の値（前月 snapshot から読む）
   - 判定:
     * 経過 < 14 日 → effect/pending 維持
     * 経過 ≥ 14 かつ |実測/想定| ≥ 80% → effect/full
     * 経過 ≥ 14 かつ 20-80% → effect/partial
     * 経過 ≥ 14 かつ < 20% → effect/none
     * 逆方向 → effect/adverse
   - 判定結果を施策 Issue にコメントとして追記:
     ```
     ## 📊 効果観測 (YYYY-MM-DD)
     - 経過日数: N 日
     - snapshot: #XX (参照)
     - 想定 delta: -50%
     - 実測 delta: -42%
     - 判定: **effect/partial** ⚠️
     ```
   - ラベル差し替え: gh issue edit $ISSUE --remove-label "effect/pending" --add-label "effect/XXX"

6. 出力:
   - budget 超過アラートを先頭で強調
   - 判定変化（pending → full/partial/none/adverse）した施策をハイライト
   - adverse があれば注意喚起
```

#### mode = action

```
1. 必須フィールド確認（欠落時は追加質問）:
   - 施策 ID: `T{Tier}-{Category}-{連番}` 形式
     - Tier: T1 / T2 / T3
     - Category: D1READ / D1WRITE / D1STORAGE / CPUMS / REQUESTS / R2 / CACHE
   - ターゲット指標（複数可）
   - 想定効果値（デプロイ前に明文化、後付けバイアス防止）
   - デプロイ日 / PR 番号 / コミット hash
   - 変更内容サマリ / 変更ファイル

2. .github/ISSUE_TEMPLATE/cost-improvement.md を雛形として gh issue create 実行:
   gh issue create \
     --title "[T{Tier}-{Cat}-{NN}] 施策名" \
     --label "cost-improvement,tier-{N},metric/{kind},effect/pending" \
     --body "<template 埋め>"

3. 作成した Issue 番号を返す。
   snapshot Issue に「アクティブな施策」として追記（gh issue edit --body）。

4. 次の観測日（デプロイ + 14 / 28 日、次回請求日）を計算して提示
```

#### mode = next

```
gh issue list --label cost-improvement --state open の中で effect/pending を除いた
（=未着手提案）枠 + 現状分析から次の改善候補を提示。

優先度: tier-1 > tier-2 > tier-3
同 tier 内は想定効果額の大きい順。
```

#### mode = invoice

```
1. 引数で PDF パス指定、または ~/Downloads/*.pdf の最新から自動検出
2. PDF を Read で開き以下を抽出:
   - Invoice number / Date of issue
   - Period (Mar 15 – Apr 14, 2026 等)
   - 各 line item の Qty（超過量）と Amount
   - Total / Tax / Total JPY（Tax Addendum ページ）
3. reference/weekly-snapshots/YYYY-Www.json として git 保存
4. budgets.json 判定
5. .github/ISSUE_TEMPLATE/cost-snapshot.md を雛形として snapshot Issue 作成:
   gh issue create \
     --title "[Cost Snapshot] YYYY-MM (Invoice IN-XXXXXXXX)" \
     --label "cost-snapshot" \
     --body "<metrics + budget 判定 + 前月比 + アラート>"
6. 前月 snapshot Issue を gh issue view で取得し「前月比」セクションを埋める
7. Step 2-observe-5 と同じ施策効果判定を実行
8. 合計額・超過指標をユーザーに報告
```

### Step 3: 共通ルール

- **Issue は append-only** — 編集ではなくコメント追記で履歴を残す
- **weekly-snapshots/*.json も append-only** — 過去の JSON は改変しない
- **日付は絶対日付** — 「今月」「先月」は使わない
- **数値はソース明示** — "invoice IN-62466340" or "GraphQL API at 2026-04-21 JST"
- **施策は 1 PR 1 Issue** — 複数目的の PR は分割
- **想定効果値はデプロイ前に Issue 本文に書く** — 後付けバイアス防止
- **月次請求到着時は必ず invoice モード実行** — この記録を起点に効果判定

## GitHub Issues 参照パターン

```bash
# 直近スナップショット
gh issue list --label cost-snapshot --state all --limit 6

# 効果測定待ちの施策
gh issue list --label cost-improvement --label "effect/pending"

# 逆効果検出済み（要対処）
gh issue list --label "effect/adverse"

# 特定カテゴリの施策
gh issue list --label "metric/d1-read"

# クロージング済みを含む Tier 1 施策
gh issue list --label tier-1 --state all
```

## MCP の使い方

### observability MCP（Workers logs / analytics）
- 「過去 24h の Workers errors」→ `mcp__cloudflare-observability__workers_logs_search` 等
- 「route 別 CPU time」→ analytics クエリ

### graphql MCP（GraphQL Analytics API）
- 月次 d1AnalyticsAdaptive 集計
- workersInvocationsAdaptive by scriptName
- D1 query-level の rows read 分析

初回利用時は Cloudflare の OAuth 認可画面が開く（ブラウザで Allow）。

## 実証チェックリスト（effect/* ラベルを付ける前に必須）

参照: `.claude/rules/evidence-based-judgment.md`

- [ ] 検証コマンドを実行したか:
  - Cloudflare 月次実測: `/cloudflare-cost-improvement` で snapshot 取得 → reference/weekly-snapshots/ に保存
  - GraphQL Analytics API: workers / R2 / D1 別の利用量を直接クエリ
- [ ] Cloudflare 仕様（Workers CPU/メモリ制限・R2 操作課金）を主張するなら公式ドキュメント URL を引用したか（`developers.cloudflare.com/...`）
- [ ] 比較対象（before / after / baseline）が明確か
- [ ] NG ワード（「のはず」「と思われる」「兆候」「浸透待ち」）を使っていないか
- [ ] 効果が想定の 80% 未満なら、`[仮説] 〜 / 検証コマンド: 〜 / 検証期日: YYYY-MM-DD / 期日後の判定: 〜` の 4 点セットを書いたか
- [ ] **コスト削減施策の前後比較は「同月内のリクエスト数で正規化」したか**（リクエスト数増減と施策効果が混ざる）

このチェック未満なら effect/full / effect/partial を付けない。effect/pending のままにすること。

## 関連スキル

- `/performance-improvement` — PSI / Lighthouse（速度系）
- `/gsc-improvement` — GSC（SEO 系）
- `/ga4-improvement` — GA4（行動分析）
- `/knowledge` — 恒久的な学び
- `/sync-remote-d1` — D1 push
- `/r2-du` — R2 使用量

## 前提

- `.mcp.json` に `cloudflare-observability` と `cloudflare-graphql` 登録済
- Cloudflare アカウントへのブラウザログイン済（OAuth 認可用）
- `.github/ISSUE_TEMPLATE/cost-improvement.md` と `cost-snapshot.md` が存在
- ラベル体系（`cost-improvement` / `cost-snapshot` / `tier-1/2/3` / `metric/*` / `effect/*`）が作成済
- `reference/budgets.json` / `reference/weekly-snapshots/` 初期化済
