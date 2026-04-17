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

### Phase 0: NSM 週次スナップショット生成

Phase 1 の並列エージェント起動より前に、NSM（週間エンゲージドセッション数）の週次スナップショットを生成する。

```bash
node .claude/scripts/snapshot-weekly-metrics.mjs [YYYY-Www]
```

- 出力先: `.claude/skills/management/nsm-experiment/reference/weekly-snapshots/YYYY-Www.json`
- 内容: GA4 + GSC + PSI の今週/前週比較サマリ（`metrics-reader.mjs` 経由）
- 既存ファイルがあればスキップ（上書きしたい場合は `--force`）
- 続く Phase 1 Agent C と Agent E がこの JSON を参照する

### Phase 1: 実績収集（並列サブエージェント）

5つのサブエージェントを**同時に起動**し、それぞれの結果を収集する。

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

3. GA4 snapshot 取得（全件、週次 CSV 保存）
   `/fetch-ga4-data last28d snapshot <当週 YYYY-Www>` を実行する。
   保存先: `.claude/skills/analytics/ga4-improvement/reference/snapshots/<YYYY-Www>/`
   取得ファイル: overview.csv / pages.csv(全件) / channels.csv / devices.csv / daily.csv
   取得完了後、`/ga4-improvement observe` を実行して improvement-log.md の Observation Log に追記する。
   前週の snapshots ディレクトリが存在すれば主要指標の増減を算出する。

4. GSC snapshot 取得（全件、週次 CSV 保存）
   `/fetch-gsc-data last28d query snapshot <当週 YYYY-Www>` を実行する。
   保存先: `.claude/skills/analytics/gsc-improvement/reference/snapshots/<YYYY-Www>/`
   取得ファイル: queries.csv(全件) / pages.csv(全件) / devices.csv / countries.csv / daily.csv
   さらに `gcsエラー/` 配下の手動エクスポート CSV があれば index-coverage.csv / index-trend.csv として同ディレクトリへコピーされる。
   取得完了後、`/gsc-improvement observe` を実行して improvement-log.md の Observation Log に追記する。
   順位 11-20 位の「あと一押し」クエリは queries.csv から抽出する。

5. YouTube データ取得（API 呼び出し）
   `/fetch-youtube-data` スキルの手順に従い、以下を取得:
   - overview: 登録者数・総再生回数・動画数
   - top 10: 再生数上位 10 本（再生・いいね・コメント）
   → 前週データがある場合は増減を算出

6. SNS パフォーマンス指標
   - **最新値（プラットフォーム別集計）** は D1 `sns_posts` テーブルのキャッシュカラム（`impressions / likes / reposts / replies / bookmarks / metrics_updated_at`）から取得:
     ```sql
     -- 最新更新日を確認
     SELECT MAX(metrics_updated_at) FROM sns_posts;
     -- プラットフォーム別集計
     SELECT platform,
            COUNT(*) FILTER (WHERE status='posted') as posted_count,
            SUM(COALESCE(impressions, 0)) as total_impressions,
            SUM(COALESCE(likes, 0)) as total_likes,
            SUM(COALESCE(replies, 0)) as total_comments,
            SUM(COALESCE(reposts, 0)) as total_reposts
     FROM sns_posts
     WHERE status = 'posted'
     GROUP BY platform;
     -- インプレッション上位投稿（X）
     SELECT content_key, impressions, likes, reposts
     FROM sns_posts
     WHERE platform='x' AND status='posted'
     ORDER BY COALESCE(impressions, 0) DESC LIMIT 5;
     ```
   - **時系列履歴（週次トレンド）** は `.claude/skills/analytics/sns-metrics-improvement/snapshots/YYYY-MM-DD/metrics.csv` から:
     ```bash
     # 直近 14 日分の snapshot を合算（sns-metrics-store.cjs の readByRange を使うと手軽）
     node -e "const s=require('./.claude/scripts/lib/sns-metrics-store.cjs'); const d=new Date(); const end=d.toISOString().slice(0,10); d.setDate(d.getDate()-14); const start=d.toISOString().slice(0,10); console.log(JSON.stringify(s.readByRange(start,end).length+' rows'))"
     ```

7. SNS メトリクスと YouTube のレビュー本文への埋め込み
   SNS / YouTube の週次ハイライトは本レビュー本文（`docs/03_レビュー/weekly/YYYY-Www-review.md`）に直接記載する。
   GA4/GSC の詳細データは snapshot CSV と improvement-log.md に分離済みなので、レビュー本文では「主要指標の前週差 + snapshot へのリンク参照」のみに圧縮する。

出力形式:
- 「パフォーマンス概況」（overview.csv / GSC サマリー + YouTube + SNS の主要指標を 1 行で明記）
- 「注目すべきトレンド」（流入経路の変化、上昇/下降クエリ、再生数の伸び）
- 「改善候補」（CTR が低い高表示クエリ、順位 11-20 位のクエリ — queries.csv から抽出）
- 「snapshot 参照」（`.claude/skills/analytics/{gsc,ga4}-improvement/reference/snapshots/YYYY-Www/` へのリンク）
```

#### Agent E: NSM 実験進捗

```
調査項目:

1. `.claude/state/experiments.json` から status が running / measuring の実験を抽出
   ```bash
   node .claude/scripts/lib/experiments-state.mjs active
   node .claude/scripts/lib/experiments-state.mjs pending
   ```

2. 各 active 実験について、Phase 0 で生成された週次 snapshot JSON（`.claude/skills/management/nsm-experiment/reference/weekly-snapshots/YYYY-Www.json`）を参照し、baseline と今週値の delta を計算
   - baseline → snapshot の該当メトリクス（例: `gsc_weekly_clicks`, `engagedSessions`, `gsc_total_errors`）
   - started_at から経過日数を計算（10 日未満なら「measure 判定はまだ早い」と注記）

3. **measure 候補の抽出**: started_at から 10 日以上経過、かつ status が running の実験 → 「measure 実行候補」として surface

4. **継続作業の surface**: `pending_user_actions` が 0 件でない実験 → 「ユーザー作業が残っている」として明示

出力形式:
- 「active 実験一覧」（id / title / status / 経過日数 / baseline → 今週値 の簡易 delta）
- 「measure 実行候補」（10 日以上経過した running 実験）
- 「継続作業が必要な実験」（pending_user_actions）
- 「次確認日が近い実験」（next_check_date）
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

5エージェントの結果を統合し、以下を分析する:

1. **達成率**: 計画タスクの完了率。Must / Should / Could 別の達成率
2. **成果ハイライト**: 今週のトップ3〜5の成果（インパクト順）
3. **課題・ブロッカー**: 未達タスクの原因分析。繰り返しパターンの検出
4. **計画外作業**: 計画にないが実施した作業。なぜ発生したか
5. **学び**: バグ解決、設計判断、ツール・手法の発見
6. **数値変化**: 記事数・SNS指標の週次差分
7. **NSM 実験進捗**: Agent E の出力から、measure 候補と継続作業を抜き出して Phase 3 へ引き渡す

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

## NSM 実験進捗

Phase 0 で生成された週次 snapshot（`.claude/skills/management/nsm-experiment/reference/weekly-snapshots/YYYY-Www.json`）を参照。

### active な実験

| id | title | status | 経過 | baseline → 今週 | 次アクション |
|---|---|---|---|---|---|
| EXP-NNN | ... | running | N 日 | clicks 98 → 135 (+37%) | measure 候補 |

### measure 候補（10 日以上経過した running）

- EXP-NNN: `/nsm-experiment measure EXP-NNN` を来週実行

### 継続作業が必要な実験

- EXP-NNN: pending_user_actions が N 件残存

## パフォーマンス

詳細データは snapshot CSV と improvement-log.md を参照（レビュー本文では主要指標の前週差のみを記載）。

### GA4（過去 28 日） — snapshot: `.claude/skills/analytics/ga4-improvement/reference/snapshots/YYYY-Www/`

| 指標 | 今週 | 前週 | 差分 |
|---|---|---|---|
| PV | N | N | +N |
| ユーザー | N | N | +N |
| セッション | N | N | +N |
| 直帰率 | N% | N% | — |

主要な動き:
- Organic Search: N → N (+N)
- 上位ページの変化: pages.csv の Top 3 を 1 行ずつ

### GSC（過去 28 日） — snapshot: `.claude/skills/analytics/gsc-improvement/reference/snapshots/YYYY-Www/`

| 指標 | 今週 | 前週 | 差分 |
|---|---|---|---|
| 合計クリック | N | N | +N |
| 合計表示 | N | N | +N |
| 平均 CTR | N% | N% | — |
| 平均順位 | N | N | — |

上位クエリ・改善候補（queries.csv から抽出）:
- 順位 11-20 位で表示 > N の「あと一押し」クエリを 3 件
- CTR < 2% で表示 > N のタイトル改善候補を 3 件

### インデックスカバレッジ（GSC 画面からの手動エクスポート）

`snapshots/YYYY-Www/index-coverage.csv` が存在する場合は以下を 1 行で:
- 404 / 5xx / ソフト404 / クロール済み未登録 / 検出未登録 / 登録済みの前週差

### YouTube

| 項目 | 値 | 前週比 |
|---|---|---|
| 登録者 | N | +N |
| 総再生回数 | N | +N |
| 動画数 | N | +N |

再生数 Top 5:
- ...

### SNS パフォーマンス

※ 最新値は D1 `sns_posts` キャッシュカラムから、時系列履歴は `.claude/skills/analytics/sns-metrics-improvement/snapshots/YYYY-MM-DD/metrics.csv` から取得する（詳細は Phase 1 Agent C 参照）。

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
- `.claude/skills/analytics/gsc-improvement/reference/` — GSC 週次 snapshot CSV と施策記録
- `.claude/skills/analytics/ga4-improvement/reference/` — GA4 週次 snapshot CSV と施策記録
- `docs/02_実装計画/01_実装ロードマップ.md` — KPI・スプリント目標
- DB `sns_posts` / `sns_metrics` テーブル — SNS コンテンツ状況・メトリクス
- `.claude/skills/analytics/fetch-ga4-data/SKILL.md` — GA4 データ取得手順（snapshot モード）
- `.claude/skills/analytics/fetch-gsc-data/SKILL.md` — GSC データ取得手順（snapshot モード）
- `.claude/skills/analytics/ga4-improvement/SKILL.md` — GA4 改善記録スキル
- `.claude/skills/analytics/gsc-improvement/SKILL.md` — GSC 改善記録スキル
- `.claude/skills/management/weekly-plan/SKILL.md` — 週次計画スキル（ペア運用）
- `.claude/skills/management/knowledge/SKILL.md` — ナレッジ記録

注: 2026-04-15 以降、以下は廃止:
- `docs/60_運用ログ/weekly-metrics/` — snapshot CSV で代替（過去分も 2026-04-17 削除済み）
- DB `seo_tracking` / `seo_actions` テーブル — improvement-log.md で代替
