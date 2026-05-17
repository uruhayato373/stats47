---
name: plan-blog-from-gsc
description: GSC snapshot から順位 11-30 の中位クエリを抽出して 30-40 件のブログ記事企画ドラフトを生成。Use when user says "GSC企画", "GSC起点ブログ", "中位クエリ記事化".
argument-hint: [週数] [本数]
---

GSC snapshot N 週分 (デフォルト 5 週) を集計し、**順位 11-30 / 表示 ≥ 10 のクエリ** を抽出。テーマクラスター化・既存 metric 突合・既存 articles 突合を行い、`docs/20_ブログ記事企画/backlog/gsc-driven-YYYY-MM-DD.md` として企画ドラフトを保存する。

GSC 起点の量産フローの **企画フェーズ** を担当 (執筆は `article-writer` agent、公開は `/publish-bulk-articles`)。

## 用途

- 「中位クエリ」(順位 11-30) を新規記事化して 1 ページ目に押し上げたい
- 既存ランキングページに対する補強記事 (REWRITE) と新規記事 (NEW) を仕分けしたい
- 量産対象の優先順位 (想定 imp 順) を可視化したい

## 引数

```
$ARGUMENTS — [週数] [本数]
             週数: 集計対象の週数 (デフォルト 5)
             本数: 出力するテーマ上位数 (デフォルト 40)
```

## 前提

- `.claude/skills/analytics/gsc-improvement/reference/snapshots/<YYYY-Www>/queries.csv` が存在 (`/fetch-gsc-data snapshot` で生成)
- ローカル D1 に `metrics` (2,000+ 件) と `articles` (160+ 件) が存在
- `better-sqlite3` モジュールが node_modules にインストール済み

## 手順

### Phase 1: GSC 集計

1. 最新週から遡って N 週分の `queries.csv` を読み込み
2. 同一クエリは weighted average で集計 (`position` は impressions で重み付け)
3. 順位 11-30 / 表示 ≥ 10 のクエリを抽出 (`mid` バケット)
4. 比較用に順位 1-10 / CTR < 5% / 表示 ≥ 30 も別バケット (`low_ctr`) で抽出 (タイトル改修候補)

### Phase 2: metric / articles 突合

5. クエリから「コアキーワード」を抽出 (`都道府県` `ランキング` `別` `最新` `年号` `県名` を除去後の漢字 2 文字以上)
6. 各クエリについて:
   - `metrics.title` または `metrics.key` で完全マッチを検索 → 該当 metric を特定 (`metric:<key>`)
   - `articles.title` で全コアキーワードを含むものを検索 → 既存記事を特定 (`existing_article`)
7. テーマ抽出: クエリから「○○消費量」「○○漁獲量」「健康寿命」「平均身長」等の主要キーワードを抜き出して集約

### Phase 3: 分類と優先順位

8. 各テーマを以下の 3 タグに分類:
   - `NEW (metric済)`: 既存記事なし、metric あり → 即着手可能
   - `NEW (NO-METRIC)`: 既存記事なし、metric なし → 先に `/fetch-estat-data` で metric 登録が必要
   - `REWRITE`: 既存記事あり → 補強・姉妹記事を検討
9. テーマ内の合計 imp で降順ソート、上位 N 件を出力

### Phase 4: 出力

10. `docs/20_ブログ記事企画/backlog/gsc-driven-YYYY-MM-DD.md` に保存:

```markdown
# GSC 起点ブログ記事企画 (YYYY-Www 抽出)

> 生成日: YYYY-MM-DD
> 起点データ: .claude/skills/analytics/gsc-improvement/reference/snapshots/<週リスト>
> 抽出条件: 順位 11-30 / 表示 ≥ 10 → N クエリ → M テーマに集約
> 想定本数: 上位 N+ 本

## 凡例
- **NEW**: 既存記事なし
- **REWRITE**: 既存記事あり
- **NO-METRIC**: metrics 未登録

---

## 1. <theme> [TAG] - 想定 imp=<sum>
- **データソース**: `+metric:<key>` (<title>, category=<key>)
- **既存記事**: [`<slug>`] <title>  (REWRITE のみ)
- **GSC クエリ (N 件)**:
  - imp=<n> / pos=<p> / ck=<c> | `<query>`
  ...

## 2. ...
```

11. `docs/20_ブログ記事企画/backlog/INDEX.md` の「バッチ・トレンド」セクションに追記
12. ユーザーへサマリー報告:
    - 総テーマ数 / NEW(metric済) / NEW(no-metric) / REWRITE の内訳
    - 「低 CTR タイトル改修候補」のテーマ数 (別バケット)
    - 次のステップ案 (article-writer agent 並列起動 / 個別執筆 / metric 登録)

## 実装スクリプト

`.claude/scripts/blog/generate-gsc-driven-plan.mjs` に配置 (NODE_PATH=./node_modules で実行)。

```bash
cd <project_root>
NODE_PATH=./node_modules node .claude/scripts/blog/generate-gsc-driven-plan.mjs [週数] [本数]
```

スクリプトは下記参照 (前回の `/tmp/gsc-article-planner.cjs` を改良):
- Phase 1-4 を 1 ファイルで実装
- PROJECT_ROOT は `process.cwd()` または明示パスで安全に解決
- `better-sqlite3` で D1 読み取り

## 量産フロー全体での位置

```
1. /fetch-gsc-data snapshot YYYY-Www  (毎週の GSC snapshot 取得)
   ↓
2. /plan-blog-from-gsc 5 30          ★本スキル (企画ドラフト)
   ↓
3. ユーザーが上位 N 件を選定
   ↓
4. Agent(article-writer) × N 並列起動 (原稿 + INSERT SQL 生成)
   ↓
5. /publish-bulk-articles <slug1> <slug2> ... (D1 INSERT + R2 sync + 検証)
   ↓
6. 2-4 週後に CTR 改善実測 (/fetch-gsc-data で前後比較)
```

## 注意

- **データ取得は読み取りのみ** — GSC API は呼ばない (snapshot 前提)。新規取得が必要なら `/fetch-gsc-data snapshot` を先に
- **企画は確定ではない** — 出力は「候補リスト」。タイトル詳細・骨子は `article-writer` agent または手動で書く
- **NO-METRIC テーマ** — `/fetch-estat-data` で metric 登録が必要なので、執筆に進む前に確認

## 関連

- `/fetch-gsc-data` — 起点となる GSC snapshot 取得
- `Agent(article-writer)` — 企画ドラフトから 1 本 1 本を執筆する subagent
- `/publish-bulk-articles` — 執筆完了後の一括公開
- `/plan-blog-articles` — カテゴリ起点企画 (相補的)
- `.claude/rules/evidence-based-judgment.md` — 効果計測時の準拠ルール
