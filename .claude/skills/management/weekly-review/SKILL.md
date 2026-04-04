---
name: weekly-review
description: 週次レビューを生成する（実績収集→計画差分分析→成果・課題・学び記録）。Use when user says "週次レビュー", "今週の振り返り", "週次まとめ". 4つのサブエージェントで並列収集.
---

今週の実績を多角的に調査し、成果・課題・学びを記録する週次レビューを生成する。

## 引数

```
/weekly-review [YYYY-Www]
```

- 週番号（任意）: ISO 8601 週番号（例: `2026-W10`）。省略時は今週。

## 概要

4つのサブエージェントで並列に実績データを収集し、計画との差分を分析し、成果・課題・学びを構造化して記録する。来週の計画策定は `/weekly-plan` に委譲する。

## 手順

### Phase 1: 実績収集（並列サブエージェント）

4つのサブエージェントを**同時に起動**し、それぞれの結果を収集する。

#### Agent A: 開発活動

```
調査項目:
- git log --since="7 days ago" --oneline（コミット一覧）
- git log --since="7 days ago" --stat --format="" | tail -1（変更ファイル数・行数サマリー）
- git log --since="7 days ago" --diff-filter=A --name-only --format=""（新規作成ファイル）
- git branch -a で作業中ブランチ
- git diff --stat で未コミット変更

出力形式:
- 「開発した機能・修正」を箇条書き（コミットメッセージから要約）
- 「変更規模」（コミット数、ファイル数、行数）
- 「未コミット・作業中の変更」
```

#### Agent B: コンテンツ実績

```
調査項目:
- .local/r2/blog/ 配下の記事一覧と最終更新日
  → 今週新規作成・更新された記事を特定
- DB（sns_posts テーブル）から投稿実績を集計:
  DB: .local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite
  ```sql
  -- 今週の投稿数（プラットフォーム別）
  SELECT domain, platform, COUNT(*) FROM sns_posts WHERE status='posted' AND posted_at >= '<monday>' GROUP BY domain, platform;
  -- 投稿待ちコンテンツ数
  SELECT domain, platform, COUNT(*) FROM sns_posts WHERE status IN ('draft', 'scheduled') GROUP BY domain, platform;
  -- 全体ステータス概況
  SELECT domain, platform, status, COUNT(*) FROM sns_posts GROUP BY domain, platform, status;
  ```
- .local/r2/sns/ 配下の新規生成コンテンツ

出力形式:
- 「今週公開した記事」
- 「今週の SNS 投稿数」（プラットフォーム別）
- 「投稿待ちコンテンツのストック数」
```

#### Agent C: パフォーマンス指標

```
調査項目:

1. DB からコンテンツ規模を取得
   DB: .local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite
   ```sql
   SELECT COUNT(*) FROM articles WHERE published = 1;
   ```

2. SNS 投稿実績（DB `sns_posts` テーブルから集計）
   ```sql
   -- プラットフォーム別ステータス集計
   SELECT domain, platform, status, COUNT(*) FROM sns_posts GROUP BY domain, platform, status;
   -- 今週の投稿
   SELECT domain, platform, COUNT(*) FROM sns_posts WHERE status='posted' AND posted_at >= '<monday>' GROUP BY domain, platform;
   -- コンテンツ種別別の投稿率
   SELECT domain, COUNT(*) as total, SUM(CASE WHEN status='posted' THEN 1 ELSE 0 END) as posted FROM sns_posts GROUP BY domain;
   ```

3. GA4 データ取得（API 呼び出し）
   `/fetch-ga4-data` スキルの手順に従い、以下の 3 レポートを取得:
   - overview（last28d）: PV・ユーザー数・セッション・直帰率のサマリー
   - channels（last28d）: 流入経路別（Organic / Direct / Social / Referral）
   - pages（last28d）: ページ別 PV 上位 30 件
   → 前週データがある場合は増減を算出

4. GSC データ取得（API 呼び出し）
   `/fetch-gsc-data` スキルの手順に従い、以下の 2 レポートを取得:
   - query（last28d）: 検索クエリ上位 30 件（クリック・表示・CTR・順位）
   - page（last28d）: ページ別上位 30 件
   → 順位 11-20 位の「あと一押し」クエリを特定

5. YouTube データ取得（API 呼び出し）
   `/fetch-youtube-data` スキルの手順に従い、以下を取得:
   - overview: 登録者数・総再生回数・動画数
   - top 10: 再生数上位 10 本（再生・いいね・コメント）
   → 前週データがある場合は増減を算出

6. SNS パフォーマンス指標（DB `sns_metrics` テーブルから集計）
   ※ `/update-sns-metrics` 実行後に D1 へ自動蓄積される。API 不要・直接クエリ可。
   ```sql
   -- 最新取得日を確認
   SELECT MAX(fetched_at) FROM sns_metrics;
   -- プラットフォーム別集計（最新バッチ）
   SELECT p.platform,
          COUNT(DISTINCT m.sns_post_id) as post_count,
          SUM(m.impressions) as total_impressions,
          SUM(m.views) as total_views,
          SUM(m.likes) as total_likes,
          SUM(m.comments) as total_comments
   FROM sns_metrics m
   JOIN sns_posts p ON m.sns_post_id = p.id
   WHERE m.fetched_at = (SELECT MAX(fetched_at) FROM sns_metrics)
   GROUP BY p.platform;
   -- インプレッション上位投稿（X）
   SELECT p.ranking_key, m.impressions
   FROM sns_metrics m
   JOIN sns_posts p ON m.sns_post_id = p.id
   WHERE p.platform = 'x' AND m.fetched_at = (SELECT MAX(fetched_at) FROM sns_metrics)
   ORDER BY m.impressions DESC LIMIT 5;
   ```

7. SEO 指標を DB に記録
   GSC カバレッジレポートの数値を `seo_tracking` テーブルに INSERT する:
   ```sql
   -- ローカル D1 に better-sqlite3 で接続
   INSERT OR REPLACE INTO seo_tracking (date, metric_key, value, note, created_at)
   VALUES ('YYYY-MM-DD', 'crawled_not_indexed', N, 'GSCカバレッジレポートより', datetime('now'));
   INSERT OR REPLACE INTO seo_tracking (date, metric_key, value, note, created_at)
   VALUES ('YYYY-MM-DD', 'indexed', N, 'GSCカバレッジレポートより', datetime('now'));
   ```
   また `seo_actions` テーブルの施策ステータスを確認し、実施済みの施策があれば更新する:
   ```sql
   UPDATE seo_actions SET status = 'done', implemented_at = 'YYYY-MM-DD', updated_at = datetime('now')
   WHERE id = ? AND status != 'done';
   ```

7. 週次メトリクス記録
   GA4/GSC/YouTube データを `docs/60_運用ログ/weekly-metrics/YYYY-WNN.md` に保存:
   ```markdown
   # 週次メトリクス YYYY-WNN
   ## GA4（YYYY-MM-DD 取得）
   - PV: N / ユーザー: N / セッション: N / 直帰率: N%
   - 流入経路: Organic N% / Direct N% / Social N% / Referral N%
   - 上位ページ: ...
   ## GSC（YYYY-MM-DD 取得）
   - クリック: N / 表示: N / 平均CTR: N% / 平均順位: N
   - 上位クエリ: ...
   ## YouTube（YYYY-MM-DD 取得）
   - 登録者: N / 総再生: N / 動画数: N
   - 再生数 Top 10: ...
   ```
   ## SNS パフォーマンス（YYYY-MM-DD 取得、`sns_metrics` テーブル）
   | プラットフォーム | 計測投稿数 | 主要指標 |
   |---|---|---|
   | X | N件 | インプレッション合計: N / いいね: N / シェア: N |
   | TikTok | N件 | 再生数合計: N / いいね: N / コメント: N |
   | YouTube | N件 | 再生数合計: N / いいね: N |
   | Instagram | N件 | リーチ: N |
   X 上位投稿: ranking_key — N imp, ...
   注: データは `/update-sns-metrics` 実行後に D1 `sns_metrics` テーブルへ自動蓄積。ここには D1 から直接クエリした値を記載する。

   注: SEO カバレッジ指標（クロール済み未インデックス数等）は DB（seo_tracking）で管理。md には GA4/GSC/YouTube/SNS の詳細データを記録する。

出力形式:
- 「パフォーマンス概況」（GA4/GSC/YouTube の主要指標を明記）
- 「注目すべきトレンド」（流入経路の変化、上昇/下降クエリ、再生数の伸び）
- 「改善候補」（CTR が低い高表示クエリ、順位 11-20 位のクエリ）
```

#### Agent D: 計画との差分

```
調査項目:
- docs/03_レビュー/weekly/ の当週ファイル（YYYY-Www.md）を読み込み
  → 計画されていたタスクの一覧を抽出
  → git log と照合して完了/未達を判定
- docs/90_課題管理/ 配下の変更（今週追加・削除されたファイル）
- docs/03_レビュー/ の今週追加されたレビュー

出力形式:
- 「計画タスク vs 実績」の対照表
- 「計画外で実施したこと」
- 「未達タスクの理由（推定）」
```

### Phase 2: 分析・統合

4エージェントの結果を統合し、以下を分析する:

1. **達成率**: 計画タスクの完了率。Must / Should / Could 別の達成率
2. **成果ハイライト**: 今週のトップ3〜5の成果（インパクト順）
3. **課題・ブロッカー**: 未達タスクの原因分析。繰り返しパターンの検出
4. **計画外作業**: 計画にないが実施した作業。なぜ発生したか
5. **学び**: バグ解決、設計判断、ツール・手法の発見
6. **数値変化**: 記事数・SNS指標の週次差分

### Phase 2.5: ロードマップ実測値の更新

`docs/02_実装計画/01_実装ロードマップ.md` の「現在のステータス」テーブルを、DB の実測値で更新する。

#### 取得するデータ

```bash
DB=".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
sqlite3 "$DB" "
  SELECT 'articles' as item, COUNT(*) as cnt FROM articles WHERE published = 1
  UNION ALL SELECT 'ranking_items_pref', COUNT(*) FROM ranking_items WHERE area_type='prefecture'
  UNION ALL SELECT 'correlation_analysis', COUNT(*) FROM correlation_analysis
  UNION ALL SELECT 'ranking_ai_content', COUNT(*) FROM ranking_ai_content
  UNION ALL SELECT 'area_profiles', COUNT(*) FROM area_profiles
  UNION ALL SELECT 'categories', COUNT(*) FROM categories
  UNION ALL SELECT 'subcategories', COUNT(*) FROM subcategories
"
```

- `.local/r2/sns/` 配下の画像・動画数（`find .local/r2/sns -name '*.png' -o -name '*.jpg' | wc -l` / `find .local/r2/sns -name '*.mp4' | wc -l`）
- `.local/r2/note/` 配下の note 原稿数
- SNS 投稿実績: DB `sns_posts` テーブルから posted 件数を集計（プラットフォーム×コンテンツ種別）
- CLI スキル数: `.claude/skills/` 配下の `SKILL.md` の数

#### 更新ルール

- `現在のステータス（YYYY-MM-DD 実測値）` の日付を今日に更新
- テーブル内の数値を実測値に置換
- 状態（✅/⚠️/❌）は実測値に基づいて判断
- **「基本方針」「Sprint 定義」「凍結タスク」は変更しない**（人間が意図的に変更する部分）
- **「完了済み資産」セクションの数値も実測値で更新する**

### Phase 3: ナレッジ抽出

今週の作業から `/knowledge` スキルに記録すべき知見があれば提案する:
- 再利用可能なパターン
- ハマったポイントと解決策
- 設計判断の根拠

### Phase 4: 出力

`docs/03_レビュー/weekly/YYYY-Www-review.md` に保存する。

### Phase 5: 週次計画の自動生成

レビューファイルの保存完了後、**自動的に `/weekly-plan` を実行**して来週の計画を生成する。

- 対象週: レビュー対象週の翌週（例: W11 レビュー → W12 計画）
- レビュー結果の「来週への申し送り」が計画の入力になる
- ユーザーへの確認は不要（レビューと計画はセットで実行する）

## 出力フォーマット

```markdown
---
week: "YYYY-Www"
type: review
generatedAt: "YYYY-MM-DD"
---

# 週次レビュー YYYY-Www

## サマリー

- 計画タスク達成率: N/M（N%）
- 主な成果: （1行で）

## 計画 vs 実績

| タスク | 分類 | 状態 | メモ |
|---|---|---|---|
| ... | Must | 完了/未達/一部 | ... |

計画外作業:
- ...

## 成果ハイライト

1. **成果名**: 詳細（インパクト・背景）
2. ...

## 開発活動

- コミット数: N
- 変更ファイル数: N（+N行 / -N行）
- 主な変更:
  - ...

## コンテンツ実績

| 種別 | 今週 | 先週 | 増減 |
|---|---|---|---|
| 公開記事 | N | N | +N |
| SNS 投稿 (X) | N | N | +N |
| SNS 投稿 (Instagram) | N | N | +N |
| 投稿待ちストック | N | — | — |

## パフォーマンス

### GA4（過去 28 日）

| 指標 | 値 | 前期比 |
|---|---|---|
| PV | N | +N% |
| ユーザー | N | +N% |
| セッション | N | +N% |
| 直帰率 | N% | — |

| 流入経路 | セッション | 割合 |
|---|---|---|
| Organic Search | N | N% |
| Direct | N | N% |
| Social | N | N% |

### GSC（過去 28 日）

| 指標 | 値 |
|---|---|
| クリック | N |
| 表示 | N |
| 平均 CTR | N% |
| 平均順位 | N |

上位クエリ・改善候補:
- ...

### YouTube

| 項目 | 値 | 前週比 |
|---|---|---|
| 登録者 | N | +N |
| 総再生回数 | N | +N |
| 動画数 | N | +N |

再生数 Top 5:
- ...

### SNS パフォーマンス

※ データは D1 `sns_metrics` テーブルに蓄積済み（`/update-sns-metrics` 実行後）。以下のクエリで取得:
```sql
SELECT p.platform, COUNT(DISTINCT m.sns_post_id) as posts,
       SUM(m.impressions) as impressions, SUM(m.views) as views, SUM(m.likes) as likes
FROM sns_metrics m JOIN sns_posts p ON m.sns_post_id = p.id
WHERE m.fetched_at = (SELECT MAX(fetched_at) FROM sns_metrics)
GROUP BY p.platform;
```

| プラットフォーム | 計測投稿数 | インプレッション / 再生数 | いいね |
|---|---|---|---|
| X | N | N imp | N |
| TikTok | N | N views | N |
| YouTube | N | N views | N |
| Instagram | N | N reach | N |

最終取得日: YYYY-MM-DD（未取得の場合は「`/update-sns-metrics` 未実行」と記載）

## 課題・ブロッカー

1. **課題名**: 原因分析、影響範囲
   - 対策案: ...

### 繰り返しパターン

（過去の週次計画・レビューと照合して検出された繰り返しパターン）

## 学び・ナレッジ

- **知見タイトル**: 詳細
  - `/knowledge` に記録推奨: はい/いいえ

## 来週への申し送り

- 未達タスクの引き継ぎ
- 来週注意すべきこと
- `/weekly-plan` への入力として使用
```

## 運用ルール

- **毎週日曜〜月曜に実行**する想定（レビュー完了後に自動で `/weekly-plan` が実行される）
- 当週の計画ファイル（`YYYY-Www.md`）が存在しない場合でも、git log ベースで実績を収集する
- レビューファイルは蓄積する（削除しない）。傾向分析に使用
- `/weekly-plan` の Phase 1 Agent D がこのレビューファイルを参照する

## 参照

- `docs/03_レビュー/weekly/` — 週次計画・レビューの蓄積先
- `docs/60_運用ログ/weekly-metrics/` — 週次メトリクスの蓄積先（GA4/GSC/YouTube 詳細データ）
- DB `seo_tracking` テーブル — SEO カバレッジ指標の数値推移（crawled_not_indexed 等）
- DB `seo_actions` テーブル — SEO 改善施策の管理（planned → in_progress → done）
- `docs/02_実装計画/01_実装ロードマップ.md` — KPI・スプリント目標
- DB `sns_posts` / `sns_metrics` テーブル — SNS コンテンツ状況・メトリクス
- `.claude/skills/analytics/fetch-ga4-data/SKILL.md` — GA4 データ取得手順
- `.claude/skills/analytics/fetch-gsc-data/SKILL.md` — GSC データ取得手順
- `.claude/skills/management/weekly-plan/SKILL.md` — 週次計画スキル（ペア運用）
- `.claude/skills/management/knowledge/SKILL.md` — ナレッジ記録
