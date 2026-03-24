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
- docs/11_SNS投稿管理/posts/ のテーブルファイルを読み込み
  → posted かつ postedAt が今週の投稿を集計（プラットフォーム別）
  → generated（投稿待ちコンテンツ数）
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

2. SNS 投稿実績（docs/11_SNS投稿管理/posts/ の Markdown テーブルから集計）
   → 各テーブルファイルの posted / generated 件数をプラットフォーム別に集計
   → postedAt が今週の投稿を特定
   → コンテンツ種別（Ranking / Bar Chart Race / Compare / Correlation）別の投稿率を算出
   注: SNS データは DB（sns_posts / sns_metrics）ではなく Markdown テーブルで管理されている

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

6. 週次メトリクス記録
   取得した GA4/GSC/YouTube データを `docs/60_運用ログ/weekly-metrics/YYYY-WNN.md` に保存:
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
- SNS 投稿実績: `docs/11_SNS投稿管理/posts/` の Markdown テーブルから posted 件数を集計（プラットフォーム×コンテンツ種別）
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

（`/update-sns-metrics` で取得した指標があれば記載。未取得の場合はその旨記載）

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
- `docs/60_運用ログ/weekly-metrics/` — 週次メトリクスの蓄積先
- `docs/02_実装計画/01_実装ロードマップ.md` — KPI・スプリント目標
- `docs/11_SNS投稿管理/` — SNS コンテンツ状況
- `.claude/skills/analytics/fetch-ga4-data/SKILL.md` — GA4 データ取得手順
- `.claude/skills/analytics/fetch-gsc-data/SKILL.md` — GSC データ取得手順
- `.claude/skills/management/weekly-plan/SKILL.md` — 週次計画スキル（ペア運用）
- `.claude/skills/management/knowledge/SKILL.md` — ナレッジ記録
