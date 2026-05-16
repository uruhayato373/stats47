---
name: cloudflare-cost-improvement
description: Cloudflare Workers / D1 / R2 の月次コストと主要メトリクス（D1 rows read、Workers CPU ms、storage、月額課金）を docs/05_改善ログ/cloudflare-cost.md で追跡し、budget 超過検知・施策と効果を記録する。Use when user says "Cloudflare コスト確認", "D1 使用量", "Workers CPU 使用量", "請求書チェック", or when analyzing Cloudflare invoices / cost anomalies.
---

Cloudflare の月次コスト・リソース使用量を **`docs/05_改善ログ/cloudflare-cost.md` で時系列追跡**し、打った施策と効果を記録するスキル。

Cloudflare の請求は月次（前月 15 日〜当月 14 日集計、翌 15 日請求）。施策効果の測定は「デプロイから 14 日以上経過した観測値」で判定する。

## データの保管場所

| データ | 保管先 | 理由 |
|---|---|---|
| 月次 snapshot・請求書 | git: `reference/weekly-snapshots/YYYY-Www.json` | immutable、diff 比較、オフライン可 |
| 日次 usage snapshot（自動） | git: `.claude/state/metrics/cloudflare/{snapshots/YYYY-MM-DD.json,history.csv,LATEST.md}` | `.github/workflows/cloudflare-usage-daily.yml` が日次 02:30 JST 自動更新 |
| budget しきい値（月次） | git: `reference/budgets.json` | 月次レビュー用 |
| budget しきい値（日次） | git: `reference/budgets-daily.json` | 日次自動アラート用、cloudflare-usage-daily.yml が参照 |
| 施策（1 施策 1 section、人間向け要約） | `docs/05_改善ログ/cloudflare-cost.md` | Obsidian で時系列・status 別に絞り込み可能 |
| 詳細ログ（agent 用、検証コマンド・仮説） | `reference/improvement-log.md` | append-only、agent が深掘り参照 |
| 月次スナップショット（人間向け要約） | `docs/04_レビュー/cloudflare-cost/YYYY-MM.md` | `.claude/scripts/cloudflare/monthly-snapshot.mjs` が自動書き出し |
| 日次アラート（自動起票） | GitHub Issues ラベル `cloudflare-alert,auto-generated` タイトル `[Cloudflare Alert] ...` | 閾値違反時のみ起票・解決後 close で運用 |

→ **2 層構造**: `docs/05_改善ログ/cloudflare-cost.md` は人間が眺める施策要約、`reference/improvement-log.md` は agent が深掘りする詳細。日次アラートのみ Issues に残す（PSI/Cloudflare daily アラート方針）。

## frontmatter / status

各 section の冒頭で以下を管理:

```markdown
## <施策タイトル>

- **status**: pending | effect/full | effect/partial | effect/none | effect/adverse
- **tier**: 1 | 2 | 3
- **target_metric**: d1-read | d1-write | d1-storage | cpu-ms | r2 | requests
- **deployed_at**: YYYY-MM-DD
- **verification_command**: <copy-pasteable script>
```

## 引数

```
$ARGUMENTS — [mode]
             mode:
               - status  (デフォルト) : 直近スナップショット + 進行中施策を要約
               - observe : 新 snapshot 作成 + budget 判定 + 施策効果追記
               - action  : 新しい施策 section を追加
               - next    : 次に着手すべき改善候補を提示
               - invoice : 請求書 PDF から snapshot + docs/04_レビュー/cloudflare-cost/YYYY-MM.md を作成
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
2. docs/05_改善ログ/cloudflare-cost.md を Read し status: pending / in-progress の section を抽出
3. reference/improvement-log.md を Read し未判定の検証コマンド一覧を抽出
4. .claude/state/metrics/cloudflare/LATEST.md を Read し日次推移を取得

出力:
- 最新 snapshot の合計額 + budget 超過メトリクス
- 進行中施策を「デプロイ日 - 経過日数 - ターゲット - status」形式で列挙
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

4. 前週 snapshot との前週比を計算:
   - reference/weekly-snapshots/ の直近 2 週分を比較
   - .claude/state/metrics/cloudflare/history.csv から取得しても可

5. 進行中施策の効果判定（最重要）:
   docs/05_改善ログ/cloudflare-cost.md を Read し status: pending の section を抽出。
   各施策に対して:
   - 経過日数 = observe 実行日 - deployed_at
   - 実測 delta = 最新値 - デプロイ時点の値（前月 snapshot から読む）
   - 判定:
     * 経過 < 14 日 → status: pending 維持
     * 経過 ≥ 14 かつ |実測/想定| ≥ 80% → status: effect/full
     * 経過 ≥ 14 かつ 20-80% → status: effect/partial
     * 経過 ≥ 14 かつ < 20% → status: effect/none
     * 逆方向 → status: effect/adverse
   - 判定結果を docs/05_改善ログ/cloudflare-cost.md の該当 section の「実測」「判定」欄に Edit insert:
     ```
     ### 実測
     - 経過日数: N 日
     - snapshot: reference/weekly-snapshots/YYYY-Www.json
     - 実測 delta: D1 read -42%（想定 -50% の 84%）

     ### 判定
     - status: effect/full
     - 判定日: YYYY-MM-DD
     ```
   - section 冒頭の `status: pending` を `status: effect/XXX` に Edit 更新
   - 詳細な検証ログは reference/improvement-log.md に追記

6. 出力:
   - budget 超過アラートを先頭で強調
   - 判定変化（pending → full/partial/none/adverse）した施策をハイライト
   - adverse があれば注意喚起
```

#### mode = action

```
1. 必須フィールド確認（欠落時は追加質問）:
   - 施策タイトル
   - tier: 1 (即効) / 2 (戦略) / 3 (要調査)
   - target_metric: d1-read / d1-write / d1-storage / cpu-ms / r2 / requests
   - 想定効果値（デプロイ前に明文化、後付けバイアス防止）
   - deployed_at / PR 番号 / コミット hash
   - 変更内容サマリ / 変更ファイル
   - verification_command（copy-pasteable な GraphQL query / curl）

2. docs/05_改善ログ/cloudflare-cost.md を Read し、見出し直下（最新を上）に以下 section を Edit insert:

   ```markdown
   ## <施策タイトル>

   - **status**: pending
   - **tier**: <1|2|3>
   - **target_metric**: <metric>
   - **deployed_at**: YYYY-MM-DD
   - **verification_command**: <copy-pasteable script>

   ### 想定効果
   <+xxx, 根拠>

   ### 実測
   （pending）

   ### 判定
   （pending）
   ```

3. front-matter の `updated:` を本日日付に更新。
4. 詳細な検証コマンド・仮説・参照リンクは reference/improvement-log.md にも append。
5. 次の観測日（デプロイ + 14 / 28 日、次回請求日）を計算して提示。
```

#### mode = next

```
1. docs/05_改善ログ/cloudflare-cost.md を Read し status: pending を除いた施策 + 過去 effect/full の派生候補を抽出
2. reference/improvement-log.md の「次の候補」「仮説」セクションから未着手を拾う
3. 最新 snapshot の「次のアクション」候補も合わせる

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
5. docs/04_レビュー/cloudflare-cost/YYYY-MM.md を Write（frontmatter `type: cloudflare-cost-snapshot` / `month: YYYY-MM` / `invoice_id: IN-XXXXXXXX`）:
   - metrics 表
   - budget 判定
   - 前月比（前月の docs/04_レビュー/cloudflare-cost/YYYY-MM.md を Read して比較）
   - 進行中施策の status 一覧（docs/05_改善ログ/cloudflare-cost.md から抽出）
6. Step 2-observe-5 と同じ施策効果判定を実行
7. 合計額・超過指標をユーザーに報告
```

### Step 3: 共通ルール

- **docs/05_改善ログ/cloudflare-cost.md は append-only** — section の追加・status の更新のみ。過去判定の改竄は禁止
- **weekly-snapshots/*.json も append-only** — 過去の JSON は改変しない
- **日付は絶対日付** — 「今月」「先月」は使わない
- **数値はソース明示** — "invoice IN-62466340" or "GraphQL API at 2026-04-21 JST"
- **施策は 1 PR 1 section** — 複数目的の PR は分割
- **想定効果値はデプロイ前に書く** — 後付けバイアス防止
- **月次請求到着時は必ず invoice モード実行** — この記録を起点に効果判定
- **2 層構造を維持** — docs/ は人間が眺める要約、reference/improvement-log.md は agent が深掘りする詳細

## 参照パターン

```bash
# 直近スナップショット
ls -t .claude/skills/analytics/cloudflare-cost-improvement/reference/weekly-snapshots/ | head -3
ls -t docs/04_レビュー/cloudflare-cost/*.md | head -3
cat .claude/state/metrics/cloudflare/LATEST.md

# 進行中（pending）施策
cat docs/05_改善ログ/cloudflare-cost.md | grep -B1 -A4 'status.*pending'

# 効果測定済み施策
cat docs/05_改善ログ/cloudflare-cost.md | grep -B1 'status.*effect/'

# 詳細ログ
cat .claude/skills/analytics/cloudflare-cost-improvement/reference/improvement-log.md

# 日次アラート（Issues に残る運用）
gh issue list --label cloudflare-alert --state open
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

## 実証チェックリスト（status: effect/* に更新する前に必須）

参照: `.claude/rules/evidence-based-judgment.md`

- [ ] 検証コマンドを実行したか:
  - Cloudflare 月次実測: `/cloudflare-cost-improvement observe` で snapshot 取得 → reference/weekly-snapshots/ に保存
  - GraphQL Analytics API: workers / R2 / D1 別の利用量を直接クエリ
- [ ] Cloudflare 仕様（Workers CPU/メモリ制限・R2 操作課金）を主張するなら公式ドキュメント URL を引用したか（`developers.cloudflare.com/...`）
- [ ] 比較対象（before / after / baseline）が明確か
- [ ] NG ワード（「のはず」「と思われる」「兆候」「浸透待ち」）を使っていないか
- [ ] 効果が想定の 80% 未満なら、`[仮説] 〜 / 検証コマンド: 〜 / 検証期日: YYYY-MM-DD / 期日後の判定: 〜` の 4 点セットを書いたか
- [ ] **コスト削減施策の前後比較は「同月内のリクエスト数で正規化」したか**（リクエスト数増減と施策効果が混ざる）

このチェック未満なら status を effect/full / effect/partial に更新しない。pending のままにすること。

## 関連スキル

- `/performance-improvement` — PSI / Lighthouse（速度系）
- `/gsc-improvement` — GSC（SEO 系）
- `/ga4-improvement` — GA4（行動分析）
- `/knowledge` — 恒久的な学び
- `/sync-snapshots` — R2 スナップショット更新
- `/r2-du` — R2 使用量

## 前提

- `.mcp.json` に `cloudflare-observability` と `cloudflare-graphql` 登録済
- Cloudflare アカウントへのブラウザログイン済（OAuth 認可用）
- `docs/05_改善ログ/cloudflare-cost.md` が存在（front-matter `type: improvement-log` / `metric: cloudflare-cost`）
- `docs/04_レビュー/cloudflare-cost/` ディレクトリ存在
- `reference/budgets.json` / `reference/weekly-snapshots/` 初期化済
