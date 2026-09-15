---
name: gsc-improvement
description: Google Search Console の検索パフォーマンスとインデックス問題を .claude/todo/improvements.md で追跡し、週次 snapshot と施策の効果判定を記録する。Use when user says "GSC改善", "GSC記録", "インデックス改善", "SEO課題記録", or when analyzing gscエラー/ CSV files.
primary_agent: gsc-analyst
---

GSC の週次メトリクス（Clicks / Impressions / CTR / Position / Index Coverage）を
active 一覧と append-only の詳細ログに責務分離して追跡するスキル。

検索パフォーマンスとインデックス状態の効果は 2〜4 週間遅延するため、「何をいつしたか」「数値がどう動いたか」「次の候補は何か」を append-only で記録する。

## データの保管場所

| データ | 保管先 | 理由 |
|---|---|---|
| 生メトリクス CSV | git: `.claude/skills/analytics/gsc-improvement/reference/snapshots/YYYY-Www/` | immutable、diff 比較、オフライン可 |
| 目標しきい値設定 | git: `.claude/skills/analytics/gsc-improvement/reference/budgets.json` | プロジェクト設定 |
| 詳細ログ (agent 用) | git: `.claude/skills/analytics/gsc-improvement/reference/improvement-log.md` | 過去判定の根拠・検証コマンド・仮説を含む詳細 |
| 要約 (人間向け) | git: `.claude/todo/improvements.md` | active 施策の ID・要約・status・期日を俯瞰 |
| 週次スナップショット | `.claude/state/metrics/gsc/{history.csv,LATEST.md}` | GitHub Actions が日曜 JST 20:00 に自動更新 |
| 運用サイクル監査 | `.claude/state/metrics/gsc/operations-cycle-LATEST.{json,md}` | 計測→review→候補判断→plan→月次集約の接続状態 |

## 引数

```
$ARGUMENTS — [mode]
             mode:
               - status  (デフォルト) : 直近スナップショット + 進行中施策を要約
               - observe : 新 snapshot 取り込み + 目標判定 + 施策効果追記
               - action  : 新しい施策行を .claude/todo/improvements.md に追加
               - next    : 次に着手すべき改善候補を提示
```

## 手順

### Step 1: データソースの特定

GSC メトリクス取得の優先順:

1. **`/fetch-gsc-data` スキル** — API 経由で `reference/snapshots/YYYY-Www/` に CSV を保存
2. **`reference/snapshots/` 配下の既存 CSV** — 既に取得済みの週次データ
3. **GSC 画面からの手動エクスポート** — API で取れない index-coverage 詳細等

### Step 2: mode 別の処理

#### mode = status（デフォルト）

```
以下を並列に実行して要約:
1. reference/snapshots/ 配下の最新 YYYY-Www ディレクトリの CSV を Read
2. .claude/todo/improvements.md の6列表から status: pending / in-progress / effect-pending の行を抽出
3. reference/improvement-log.md を Read し未判定の検証コマンド一覧を抽出
4. .claude/state/metrics/gsc/LATEST.md を Read し週次推移を取得
5. `node .claude/scripts/gsc/audit-operations-cycle.mjs --stage monitor` を実行し、未接続工程を取得

出力:
- 最新 snapshot の主要指標 + 目標超過メトリクス
- 進行中施策を「デプロイ日 - 経過日数 - ターゲット - status」形式で列挙
- 次観測予定日（最も近いもの）
```

#### mode = observe

```
1. データ取得:
   a. /fetch-gsc-data snapshot <YYYY-Www> を呼び reference/snapshots/YYYY-Www/ に CSV 保存
   b. 既に存在するなら既存 CSV を読む
   c. 手動エクスポートが必要な index-coverage 詳細はユーザーに依頼

2. 主要指標を抽出:
   - queries.csv: 合計 clicks / impressions / ctr / position
   - pages.csv: 合計 + 上位 10 ページ
   - daily.csv: 日次トレンド
   - index-coverage.csv: 登録済み / 除外理由別件数
   - devices.csv, countries.csv: 参考

3. budgets.json 判定:
   - warning_threshold <= 値 < error_threshold → WARNING
   - 値 >= error_threshold → ERROR
   - alerts 配列に記録

4. 前週 snapshot との前週比を計算:
   - reference/snapshots/ の直近 2 週分を比較
   - .claude/state/metrics/gsc/history.csv から取得しても可

5. 進行中施策の効果判定（最重要）:
   ```bash
   node .claude/scripts/lib/effect-verdict/cli.mjs --week <YYYY-Www>
   node .claude/scripts/gsc/audit-operations-cycle.mjs --stage review-input --week <YYYY-Www>
   ```
   - effect ラベルの自動判定は `effect-verdict` の閾値・4ガードを正典とし、同じ比較を手作業で再実装しない。
   - `insufficient-target` は推測で補わない。`.claude/config/gsc-operations-cycle.json` の既知負債以外が1件でも増えたら運用監査をFAILにする。
   - 確定 verdict の `.claude/todo/improvements.md` 反映は `improvement-triage` に委譲する。確定済みIDがactive一覧に残れば運用監査がFAILにする。

6. 出力:
   - 目標超過アラートを先頭で強調
   - 効果判定を確定してTODOから削除した施策をハイライト
   - adverse があれば注意喚起
```

#### mode = action

```
1. 必須フィールド確認（欠落時は追加質問）:
   - 施策タイトル
   - tier: 1 (即効) / 2 (戦略) / 3 (要調査)
   - target_metric: gsc-clicks / gsc-impressions / gsc-ctr / gsc-position / gsc-index-coverage
   - 対象ページ / クエリ
   - 想定効果値（デプロイ前に明文化、後付けバイアス防止）
   - deployed_at / PR 番号 / コミット hash
   - 変更内容サマリ / 変更ファイル
   - verification_command（copy-pasteable な curl / API / script）

2. .claude/todo/improvements.md を Read し、該当 Tier の6列表に1行だけ追加する:

   ```markdown
   | GSC-NN | <次アクションを含む短い要約> | pending | YYYY-MM-DD | <owner> | gsc |
   ```

3. front-matter の `updated:` を本日日付に更新。
4. target metric、対象、baseline、想定効果、deployed_at、PR、検証コマンドは
   reference/improvement-log.md に appendする。想定効果は必ず `[target: +N clicks]`、
   `[target: -N errors]` の機械可読記法を併記し、欠落時は action を完了しない。
5. 次の観測日（デプロイ + 14 / 28 日）を計算して提示。
```

#### mode = next

```
1. .claude/todo/improvements.md のactive行と、reference/improvement-log.md の過去判定から派生候補を抽出
2. reference/improvement-log.md の「次の候補」「仮説」セクションから未着手を拾う
3. 最新 snapshot の「次のアクション」候補も合わせる

優先度: tier-1 > tier-2 > tier-3
同 tier 内は想定効果の大きい順。
```

### Step 3: 共通ルール

- **.claude/todo/improvements.md は active-only** — 未完了施策の追加・status 更新に限定する。effect 確定後は詳細を improvement-log に残し、行を削除する
- **snapshots/YYYY-Www/ も append-only** — 過去の CSV は改変しない
- **日付は絶対日付** — 「今週」「先週」は使わない
- **数値はソース明示** — "snapshots/2026-W17/queries.csv" のような相対パス
- **施策は 1 PR 1 ID** — 複数目的の PR は分割
- **想定効果値はデプロイ前に書く** — 後付けバイアス防止
- **週次の正典** — 日曜 `fetch-metrics-weekly` がsnapshot+effect verdictを生成し、`/weekly-review`が候補判断を記録、月曜20:30の`gsc-operations-cycle-weekly`が接続を監査する
- **責務を分離する** — `.claude/todo/improvements.md` はactive一覧、reference/improvement-log.md は判定履歴

## 参照パターン

```bash
# 直近スナップショット
ls -t .claude/skills/analytics/gsc-improvement/reference/snapshots/ | head -3
cat .claude/state/metrics/gsc/LATEST.md

# 進行中施策
node .claude/scripts/lib/scan-pending-improvements.mjs --format markdown

# 効果測定済み施策・詳細ログ
cat .claude/skills/analytics/gsc-improvement/reference/improvement-log.md

# 「表示は伸びたのにクリックが伸びない」を面別に切り分ける
#   pages.csv を素で集計してはならない: アンカー行 (#見出し 付き URL) が page 次元 imp の
#   26% を占めクリックがゼロなので、除外しないと CTR を系統的に過小評価する。
#   rolling28d の隣接週は 21 日重複するので WoW 比較も不可。下記が両方を扱う。
node .claude/scripts/gsc/analyze-ctr-seesaw.mjs 2026-W29 2026-W33   # 非重複な 28 日窓どうし
node .claude/scripts/gsc/analyze-ctr-seesaw.mjs 2026-W32 2026-W33   # 差分 = 最新週 − 落ちた週
node .claude/scripts/gsc/analyze-ctr-seesaw.mjs --weekly            # 日次を連結して 7 日ずつ

# 計測→review→候補判断→plan→月次集約の接続
node .claude/scripts/gsc/audit-operations-cycle.mjs --stage monitor
node --test .claude/scripts/gsc/__tests__/audit-operations-cycle.test.mjs
```

## 実証チェックリスト（効果判定を確定してTODO行を削除する前に必須）

参照: `.claude/rules/evidence-based-judgment.md`

- [ ] 検証コマンドを実行したか:
  - URL 単位の Google 認識: `node .claude/scripts/gsc/url-inspection-daily.cjs --limit 10`（pageFetchState / coverageState / lastCrawlTime を取得）
  - 本番 HTTP 挙動: `curl -A "Mozilla/5.0 (compatible; Googlebot/2.1)" -o /dev/null -w "%{http_code}\n" https://stats47.jp/<path>`
  - GSC 全体 snapshot: `/fetch-gsc-data last28d page snapshot YYYY-Www`
- [ ] Google 仕様を主張するなら公式ドキュメント URL を引用したか（`developers.google.com/search/...`）
- [ ] 比較対象（before / after / baseline）が明確か
- [ ] NG ワード（「のはず」「Google の仕様」「クロール予算枯渇」「兆候」「浸透待ち」）を使っていないか
- [ ] 効果が想定の 80% 未満なら、`[仮説] 〜 / 検証コマンド: 〜 / 検証期日: YYYY-MM-DD / 期日後の判定: 〜` の 4 点セットを書いたか
- [ ] **「Google が再クロールしているか」を URL Inspection API の lastCrawlTime 推移で確認したか**（GSC export の「サーバーエラー」レポートは古いスナップショットなので根拠にならない）

このチェック未満なら効果を確定せず、active 行を維持すること。

### 早期警戒トリガー（cutoff 日を絶対視しない）

ルーブリックの cutoff 日（暫定 21 日）を待たず、日次観測で以下に達したら早期 action:

| 警戒レベル | 条件 | アクション |
|---|---|---|
| 緑 | 再クロール件数 / 日 > 50 | 観測継続 |
| 黄 | 経過 7 日後で再クロール件数 / 日 < 5 | 案 B 準備（GSC URL 削除リクエスト下書き） |
| 赤 | 経過 14 日後で再クロール件数 / 日 < 5 | cutoff を待たず案 B フル発動 |

詳細根拠: `reference/rubric-rationale.md`

## 関連スキル

- `/fetch-gsc-data` — GSC API から生データを取得（本 skill の入力ソース）
- `/ga4-improvement` — GA4（行動分析）
- `/adsense-improvement` — AdSense（収益）
- `/cloudflare-cost-improvement` — Cloudflare コスト
- `/seo-audit` — サイト全体の SEO 監査
- `/performance-report` — Lighthouse + Core Web Vitals 監査
- `/knowledge` — 恒久的な教訓を記録

## 前提

- `.claude/todo/improvements.md` が存在（front-matter `type: improvement-log` / `metric: gsc`）
- `reference/budgets.json` / `reference/snapshots/` / `reference/improvement-log.md` 初期化済
- GSC プロパティ: `sc-domain:stats47.jp`
- 本番 URL: `https://stats47.jp`
