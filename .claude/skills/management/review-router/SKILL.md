---
name: review-router
description: 「レビューして」と言われたとき、対象・文脈・日付から適切なレビュースキルを自動選択して実行する。レビュー系スキルのルーティングガイド。
user-invocable: false
---

「レビューして」「チェックして」「確認して」等のレビュー依頼を受けたとき、文脈から最適なレビュースキルを判断し実行する。

## ルーティングルール

### 1. 対象が明示されている場合

| 文脈・対象 | 実行スキル | 例 |
|---|---|---|
| ブログ記事のファイルパス | `/expert-review` | 「この記事をレビューして」 |
| ブログ記事の企画・アイデア | `/panel-review` | 「この企画をレビューして」 |
| 記事を公開前にチェック | `/proofread-article` | 「公開前チェックして」 |
| 設計書・計画書・ロードマップ | `/critical-review` | 「この計画をレビューして」 |
| Web ページの URL | `/ui-panel-review` | 「このページのUIをレビューして」 |
| UIの整合性・一貫性 | `/review-ui-consistency` | 「UIの整合性をレビューして」「画面がバラバラ」 |
| packages/ のコード | `/review-packages` | 「パッケージをレビューして」 |
| コード変更に対するテスト | `/review-tests` | 「テストを確認して」 |
| SEO・検索流入 | `/seo-audit` | 「SEOをレビューして」「検索順位を確認して」 |

### 2. 対象が不明で周期的レビューと判断される場合

「レビューして」「今週のレビューして」など、特定の対象がない場合は**日付ベース**で判断する。

```
現在の日付を確認
  ↓
四半期末の月（3,6,9,12月）の最終2週間か？
  → YES → /weekly-review を実行した後、/pre-mortem も実行
  → NO  → /weekly-review のみ実行
```

#### 四半期レビューの判断基準

- 3月・6月・9月・12月の **15日以降** → `/pre-mortem` を追加実行
- それ以外 → `/weekly-review` のみ
- 前回の pre-mortem が同月に既に存在する場合（`gh issue list --label pre-mortem --search "[Pre-Mortem] {YYYY-MM}"` でヒットする）→ スキップ

### 3. 複合的な依頼の場合

「記事を書いたのでレビューして公開して」のような複合依頼:
1. まず `/proofread-article` で公開前チェック
2. 問題なければ `/publish-article` を提案

「今週の計画を立ててレビューして」:
1. `/weekly-plan` で計画生成
2. 続けて `/critical-review` で計画を批判的レビュー

## 判断に迷った場合

ユーザーに確認する。以下のように選択肢を提示:

```
レビュー対象を確認させてください:
1. 週次レビュー（プロジェクト進捗）
2. 記事レビュー（データ正確性・統計的妥当性）
3. 記事企画レビュー（10人パネル評価）
4. UI/UX レビュー（Web ページ）
5. 設計書の批判的レビュー
6. コード・パッケージレビュー
7. SEO 監査（検索パフォーマンス・インデックス状況）
```

## スキル一覧（クイックリファレンス）

### 定期レビュー

| スキル | 対象 | 周期 | 出力先 |
|---|---|---|---|
| `/weekly-review` | プロジェクト進捗 | 毎週 | GitHub Issue (`weekly-review` ラベル) |
| `/weekly-plan` | 来週の計画 | 毎週 | GitHub Issue (`weekly-plan` ラベル) |
| `/pre-mortem` | プロジェクトリスク + 対策 | 四半期 | GitHub Issue (`pre-mortem` ラベル) |
| `/seo-audit` | SEO 総合監査 | 月次 | GitHub Issue (`seo-audit` ラベル) |

### 随時レビュー

| スキル | 対象 | トリガー | 出力先 |
|---|---|---|---|
| `/expert-review` | ブログ記事（データ正確性） | 記事パス指定 | GitHub Issue (`blog-review` ラベル) |
| `/panel-review` | ブログ記事企画 | 企画・アイデア | stdout |
| `/proofread-article` | 記事公開前チェック | 公開前 | stdout |
| `/critical-review` | 設計書・計画書 | ドキュメントパス指定 | GitHub Issue (`critical-review` ラベル) |
| `/ui-panel-review` | Web ページ UI/UX | URL 指定 | stdout |
| `/review-app` | App Router 層の品質 | ルート指定 or all | GitHub Issue (`dev-review` ラベル) |
| `/review-feature` | feature ドメイン品質 | feature 名指定 | GitHub Issue (`dev-review` ラベル) |
| `/review-ads` | ads ドメイン品質 | 随時 | GitHub Issue (`dev-review` ラベル) |
| `/review-ui-consistency` | UI 横断の一貫性 | 整合性の疑問 | GitHub Issue (`dev-review` ラベル) |
| `/review-packages` | packages/ コード品質 | コード変更後 | GitHub Issue (`dev-review` ラベル) |
| `/review-tests` | テストの確認・作成 | コード変更後 | stdout |
| `/sns-weekly-report` | SNS 週次パフォーマンス | 毎週 | GitHub Issue (`sns-weekly-report` ラベル) |

### 過去分の参照

出力先が Issue のスキルは `gh issue list --label <ラベル> --state all` で参照できる。ラベル一覧: `weekly-review`, `weekly-plan`, `pre-mortem`, `seo-audit`, `critical-review`, `dev-review`, `blog-review`, `sns-weekly-report`, `performance-report`, `youtube-experiment`。
