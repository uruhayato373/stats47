---
name: review-router
description: 「レビューして」と言われたとき、対象・文脈・日付から適切なレビュースキルを自動選択して実行する。レビュー系スキルのルーティングガイド。
user-invocable: false
primary_agent: strategy-advisor
---

「レビューして」「チェックして」「確認して」等のレビュー依頼を受けたとき、文脈から最適なレビュースキルを判断し実行する。

## ルーティングルール

### 1. 対象が明示されている場合

| 文脈・対象 | 実行スキル | 例 |
|---|---|---|
| ブログ記事のファイルパス | `/blog-review --mode expert` | 「この記事をレビューして」 |
| ブログ記事の企画・アイデア | `/panel-review` | 「この企画をレビューして」 |
| 記事を公開前にチェック | `/blog-review --mode proofread` | 「公開前チェックして」 |
| 設計書・計画書・ロードマップ | `/critical-review` | 「この計画をレビューして」 |
| Web ページの URL | `/ui-panel-review` | 「このページのUIをレビューして」 |
| UIの整合性・一貫性 | `/review-feature --scope ui-consistency` | 「UIの整合性をレビューして」「画面がバラバラ」 |
| packages/ のコード | `/review-feature --scope packages` | 「パッケージをレビューして」 |
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
- 最新の週次レビューに同月のpre-mortem実施済みと明記されている場合 → スキップ

### 3. 複合的な依頼の場合

「記事を書いたのでレビューして公開して」のような複合依頼:
1. まず `/blog-review --mode proofread` で公開前チェック
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
| `/weekly-review` | プロジェクト進捗 | 毎週 | `.Codex/skills/management/weekly-review/reference/reviews/YYYY-Www.md` |
| `/weekly-plan` | 来週の計画 | 毎週 | `.Codex/todo/weekly.md` |
| `/pre-mortem` | プロジェクトリスク + 対策 | 四半期 | 未完了策を `.Codex/todo/` |
| `/seo-audit` | SEO 総合監査 | 月次 | 未完了策を `.Codex/todo/improvements.md` |

### 随時レビュー

| スキル | 対象 | トリガー | 出力先 |
|---|---|---|---|
| `/blog-review --mode expert` | ブログ記事（データ正確性） | 記事パス指定 | 公開gate用 `review.md` |
| `/panel-review` | ブログ記事企画 | 企画・アイデア | stdout |
| `/blog-review --mode proofread` | 記事公開前チェック | 公開前 | stdout |
| `/critical-review` | 設計書・計画書 | ドキュメントパス指定 | 恒久判断をSSOT、未完了策をTODO |
| `/ui-panel-review` | Web ページ UI/UX | URL 指定 | stdout |
| `/review-feature --scope app <route\|all>` | App Router 層の品質 | ルート指定 or all | 未完了策を機能バックログ |
| `/review-feature --scope feature <name>` | feature ドメイン品質 | feature 名指定 | 未完了策を機能バックログ |
| `/review-feature --scope feature ads` | ads ドメイン品質 | 随時 | 未完了策を機能バックログ |
| `/review-feature --scope ui-consistency` | UI 横断の一貫性 | 整合性の疑問 | 未完了策を機能バックログ |
| `/review-feature --scope packages` | packages/ コード品質 | コード変更後 | 未完了策を機能バックログ |
| `/review-feature --scope types` | 型安全性 | tsc エラー時 | 未完了策を機能バックログ |
| `/review-tests` | テストの確認・作成 | コード変更後 | stdout |
| `/sns-weekly-report` | SNS 週次パフォーマンス | 毎週 | skill `reference/reports/` |

### 過去分の参照

戦略の変遷はGit、定期レポートは各skill reference、未完了策は `.Codex/todo/` を参照する。
詳細は [`../../rules/docs-vs-issues.md`](../../rules/docs-vs-issues.md)。
