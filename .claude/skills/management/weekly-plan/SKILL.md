---
name: weekly-plan
description: 週次計画を生成する（並列サブエージェントで収集→戦略分析→批判的レビュー→計画出力）。Use when user says "週次計画", "今週の計画", "来週の予定". 5並列収集でKPIベース優先順位決定.
---

プロジェクトの現状を多角的に調査し、戦略的な週次計画を生成する。

## 引数

```
/weekly-plan [YYYY-Www]
```

- 週番号（任意）: ISO 8601 週番号（例: `2026-W11`）。省略時は今週。

## 概要

5つのサブエージェントで並列にコンテキストを収集し（開発状況・コンテンツ・パフォーマンス・計画課題・トレンド）、KPI に照らして優先順位を決定し、自ら批判的にレビューした上で、実行可能な週次計画を出力する。

## 手順

### Phase 1: コンテキスト収集（並列サブエージェント）

5つのサブエージェントを**同時に起動**し、それぞれの結果を収集する。

#### Agent A: 開発状況

```
調査項目:
- git log --oneline -20（直近の開発活動）
- git branch -a（作業中ブランチ）
- git diff --stat（未コミット変更）
- 型チェックエラーの有無（npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | tail -5）

出力形式: 箇条書きで「今週何が開発されたか」「未完了の作業」「技術的負債」をまとめる
```

#### Agent B: コンテンツパイプライン

```
調査項目:
- DB `sns_posts` テーブルからステータス別集計:
  DB: .local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite
  ```sql
  SELECT domain, platform, status, COUNT(*) FROM sns_posts GROUP BY domain, platform, status;
  ```
- .local/r2/blog/ 配下の記事数（公開済み / 下書き）
- docs/90_課題管理/ブログ記事一括企画.md の未実行企画数

出力形式: 「投稿可能なコンテンツ数」「記事パイプラインの状態」「ボトルネック」
```

#### Agent C: アクセス・パフォーマンス

```
調査項目:
DB: .local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite

- articles テーブルの公開記事数
  ```sql
  SELECT COUNT(*) FROM articles WHERE published = 1;
  ```

- SNS 投稿実績（DB `sns_posts` テーブルから集計）
  ```sql
  SELECT domain, platform, status, COUNT(*) FROM sns_posts GROUP BY domain, platform, status;
  SELECT domain, COUNT(*) as total, SUM(CASE WHEN status='posted' THEN 1 ELSE 0 END) as posted FROM sns_posts GROUP BY domain;
  ```

- SNS パフォーマンス
  - **最新値**: D1 `sns_posts` のキャッシュカラムから取得（`/update-sns-metrics` 実行後に更新済み）
    ```sql
    SELECT platform,
           COUNT(*) FILTER (WHERE status='posted') as posted_count,
           SUM(COALESCE(impressions, 0)) as impressions,
           SUM(COALESCE(likes, 0)) as likes,
           SUM(COALESCE(replies, 0)) as replies
    FROM sns_posts
    WHERE status = 'posted'
    GROUP BY platform;
    ```
  - **時系列履歴**: `.claude/skills/analytics/sns-metrics-improvement/snapshots/YYYY-MM-DD/metrics.csv`（`sns-metrics-store.cjs` の `readByRange` で集約）

- GA4/GSC メトリクス（`.claude/skills/analytics/{ga4,gsc}-improvement/reference/snapshots/YYYY-Www/` から最新 snapshot を読み込み）
  → `/weekly-review` の Phase 1 Agent C で `/fetch-{ga4,gsc}-data ... snapshot` が自動実行され CSV が保存される
  → 直近の snapshot ディレクトリ（overview.csv / pages.csv / queries.csv 等）から PV・流入経路・検索クエリを参照
  → snapshot が存在しない場合は「計測データなし」と報告

- NSM 実験進捗（`.claude/state/experiments.json` から active 実験を取得）
  ```bash
  node .claude/scripts/lib/experiments-state.mjs active
  node .claude/scripts/lib/experiments-state.mjs pending
  ```
  → running / measuring 中の実験と、pending_user_actions を把握
  → 次週の計画に「continue 実験」「measure 実行予定」を組み込む準備

- NSM 週次 snapshot JSON（`.claude/skills/management/nsm-experiment/reference/weekly-snapshots/YYYY-Www.json`）
  → weekly-review の Phase 0 で生成されたサマリ。engagedSessions / clicks / position 等の前週比

- SEO カバレッジ指標（DB `seo_tracking` テーブルから取得）
  → `SELECT * FROM seo_tracking ORDER BY date DESC LIMIT 10` で直近の推移を確認
  → `SELECT * FROM seo_actions WHERE status != 'done' ORDER BY priority` で未完了施策を確認
  → トレンド（改善中 / 悪化中 / 横ばい）を判定し計画に反映

出力形式: 「直近のパフォーマンス概況」「成長/停滞の兆候」
注: API 呼び出しは行わない（`/weekly-review` が取得済みのデータを参照する）。
```

#### Agent D: 計画・課題

```
調査項目:
- docs/02_実装計画/01_実装ロードマップ.md の現在のスプリント・未完了タスク
- docs/90_課題管理/ 配下のファイル一覧と優先度
- docs/03_レビュー/ の直近の指摘事項（特に繰り返し指摘されているパターン）
- docs/03_レビュー/weekly/ の前週の計画ファイル（存在する場合）
  → 計画 vs 実績の差分を分析

出力形式: 「ロードマップ上の現在地」「未解決の課題」「前週の振り返り」「繰り返しパターン」
```

#### Agent E: トレンド・検索需要

軽量なトレンドチェックを行い、今週のコンテンツ優先度に影響するシグナルを収集する。

```
調査項目:
- はてなブックマーク Hot Entry（RSS: https://b.hatena.ne.jp/hotentry/social.rss）
  → タイトルに「都道府県」「ランキング」「統計」「地域」等が含まれるエントリを抽出
- Google News RSS（https://news.google.com/rss/search?q=都道府県+統計&hl=ja&gl=JP&ceid=JP:ja）
  → 直近のニュースで stats47 のデータと関連しそうなテーマを抽出
- Yahoo!ニュース トピックス RSS（https://news.yahoo.co.jp/rss/topics/domestic.xml）
  → 地方・地域・ランキング関連のニュースを抽出

各ソースから最大5件ずつ、合計最大15件を取得する。
取得したトレンドについて、stats47 の DB（ranking_items, ranking_tags）とマッチングし、
既存データで記事化・SNS投稿できるものを「トレンド機会」として報告する。

出力形式:
- 「今週のトレンド機会」（stats47 データとマッチするもの）
- 「要調査」（マッチ不明だが需要がありそうなもの → `/discover-trends-all` の実行を提案）
- 「関連なし」はスキップ

注: フルスキャン（6ソース統合）が必要な場合は、
計画タスクとして「/discover-trends-all 実行」を Should/Could に提案する。
```

### Phase 2: 戦略分析

5エージェントの結果を統合し、以下を分析する:

1. **KPI との距離**: ロードマップの目標（PV、記事数、収益）に対する現在地
2. **ギャップ**: 計画と実行の乖離。特に繰り返し未達のタスク
3. **機会**: Agent E のトレンド機会を評価。stats47 データとマッチするトレンドがあれば記事化・SNS投稿の優先度を上げる
4. **リスク**: 放置すると悪化すること（技術的負債、トークン失効、コンテンツ枯渇）
5. **タイミング**: 今週でなければ意味がないこと（季節性、ニュース連動）

### Phase 2.5: NSM 実験候補の提案

`/nsm-experiment propose` を呼んで、現状メトリクスから新規実験候補 3-5 件を rubric 付きで取得する。

- 入力: `.claude/skills/management/nsm-experiment/reference/weekly-snapshots/YYYY-Www.json` + `.claude/skills/management/nsm-experiment/references/playbook.md`
- 出力: 候補リスト（impact / effort / learning / certainty の加重合計順）
- 候補は Phase 3 の Must / Should の選択肢として検討する

active な実験が既に 2 件以上あれば、新規候補の採用は抑制する（rubric 原則）。
continue 中の実験の measure 実行予定は Must 候補に加える。

### Phase 3: 優先度提案

以下の分類でタスクを提案する:

#### Must（必ずやる: 2-3件）
- 未達の繰り返しタスク or 収益直結 or 期限付き
- 各タスクに: 理由, 成功基準, 推定工数(S/M/L), 該当スキル

#### Should（できればやる: 2-3件）
- 中期的に重要 or コンテンツ蓄積
- 各タスクに同上

#### Could（余力があれば: 1-2件）
- 改善・実験・新規探索
- 各タスクに同上

### Phase 4: 批判的レビュー（セルフレビュー）

Phase 3 の提案を以下の3つの視点で攻撃する:

1. **「技術的に楽しいだけでは？」**
   - `/critical-review` の精神を継承
   - 収益・PV に直結しないタスクが Must に入っていないか
   - 「自動化」「リファクタ」が手段の目的化になっていないか

2. **「先週と同じ失敗を繰り返してないか？」**
   - 前週の計画（`docs/03_レビュー/weekly/` の直近ファイル）と照合
   - 毎週 Must に入りながら未達のタスクは、分割するか優先度を上げる
   - 工数見積もりが楽観的でないか

3. **「今週やらないと機会損失になるものは？」**
   - タイミング依存のタスクが Could に埋もれていないか
   - 「いつでもやれる」タスクが Must を圧迫していないか

レビュー結果に基づいて Phase 3 の分類を調整する。

### Phase 5: 出力

`docs/03_レビュー/weekly/YYYY-Www.md` に保存する。

## 出力フォーマット

```markdown
---
week: "YYYY-Www"
generatedAt: "YYYY-MM-DD"
sprint: "Sprint N（ロードマップ上の位置）"
---

# 週次計画 YYYY-Www

## 前週の振り返り (W-1)

| タスク | 分類 | 状態 | メモ |
|---|---|---|---|
| ... | Must | 完了/未達/一部 | ... |

**パターン分析**: （繰り返し未達のパターンがあれば指摘）

## 現状サマリー

| 指標 | 現在値 | 目標 |
|---|---|---|
| 公開記事数 | N | Sprint目標 |
| SNS 投稿済み | N 件 | — |
| 直近14日 imp (X) | N | — |

## トレンド機会

| トレンド | ソース | stats47 データ | アクション |
|---|---|---|---|
| ... | はてな/News/Yahoo | マッチする ranking_key or なし | 記事化 / SNS 投稿 / 要調査 |

## 今週のタスク

### Must
1. **タスク名** [S/M/L]
   - 理由:
   - 成功基準:
   - 使用スキル: `/skill-name`

### Should
（同形式）

### Could
（同形式）

## 批判的レビュー

> （Phase 4 の結果を引用形式で記載）
> 調整があればここに記載。

## 次週への申し送り
- （今週着手できなかったが重要なもの）
```

## 運用ルール

- **毎週月曜に実行**する想定。ユーザーが `/weekly-plan` を実行するだけで完結
- 前週の計画ファイルが存在する場合、**自動で振り返りを生成**する
- 前週の計画で未達のタスクは、自動的に今週の Must 候補に昇格させて検討する
- 計画ファイルのタスク状態（完了/未達）は、**週中にユーザーが手動で更新**する（Obsidian で編集）
- 計画ファイルは蓄積する（削除しない）。過去の計画は傾向分析に使用

## 参照

- `docs/02_実装計画/01_実装ロードマップ.md` — KPI・スプリント目標
- `docs/90_課題管理/` — 未解決タスク
- `docs/03_レビュー/` — 過去の批判的指摘
- `docs/03_レビュー/weekly/` — 過去の週次計画
- DB `sns_posts` / `sns_metrics` テーブル — SNS コンテンツ状況・メトリクス
- `.claude/skills/management/critical-review/SKILL.md` — 批判的レビューの精神
- `.claude/skills/blog/discover-trends-all/SKILL.md` — フルトレンドスキャン（Agent E で不足時に提案）
