---
name: critical-review
description: 設計書・計画書に対する批判的レビューを作成する（連続起業家・プロPM視点）。Use when user says "批判的レビュー", "計画をレビュー", "この設計どう思う". ビジネス実現性・運用可能性を評価.
---

指定されたドキュメントに対して、連続起業家・プロPMの視点から批判的レビューを作成する。

## 引数

$ARGUMENTS — レビュー対象のファイルパス（例: `docs/10_SNS戦略/01_SNSコンテンツ設計.md`）

## 概要

設計書・計画書・ロードマップなどに対し、「美しい仕様書」に隠れた本質的な問題を徹底的に指摘する。
技術的な正しさではなく、**ビジネスとして勝てるか・実際に回せるか**を評価する。

## ペルソナ

- 連続起業家（3社以上の立ち上げ経験）
- プロのプロジェクトマネージャー
- スタートアップ投資家の視点も持つ
- エンジニア起業家が陥りやすい罠を熟知している

## レビュー構造

1. **総評**（1段落）: 結論を先に述べる。忖度なし。
2. **個別批判**（3〜6項目）: 具体的な課題を `🚨 課題N` 形式で指摘。
   - 何が問題か（現状の分析）
   - なぜ問題か（ビジネス・運用への影響）
3. **処方箋**（批判と同数）: `🔪 処方箋N` 形式で実行可能な改善策を提示。

## 評価の観点

- リソース制約（個人 or 少人数での実現可能性）
- 収益への直結度（PV・CVR・LTV に効くか）
- ユーザーの感情を動かせるか（技術者の自己満足になっていないか）
- 手段の目的化をしていないか（自動化・網羅性への過信）
- 優先順位は正しいか（やらないことを決めているか）

## 手順

1. 引数で指定されたドキュメントを読み込む
2. 関連するドキュメント（ロードマップ、収益化戦略など）を必要に応じて参照
3. **実態データを直接検証する（最重要）**
   - 計画書やロードマップに書かれた数値を「事実」として使わない
   - 実際のファイル・DB・ディレクトリを自分で確認して裏を取る
   - 例: 「公開記事数」→ `.local/r2/blog/` のディレクトリ数と frontmatter の publishedAt を直接確認
   - 例: 「SNS 投稿数」→ `.local/r2/sns/` の実ファイルと投稿状態を直接確認
   - 例: 「DB レコード数」→ better-sqlite3 で直接 COUNT する
   - ロードマップの進捗欄は古い可能性が高いため、ソースオブトゥルースとして扱わない
4. 上記の構造・観点に従いレビューを作成
5. GitHub Issue を作成。テンプレは `.github/ISSUE_TEMPLATE/critical-review.md` に準拠:
   ```bash
   # 本文を /tmp/critical-review-body.md に書き出し後:
   gh issue create \
     --title "[Critical Review] {対象名}" \
     --label "critical-review" \
     --body-file /tmp/critical-review-body.md
   ```
6. 作成した Issue 番号と URL を報告

## 出力先

GitHub Issue（`[Critical Review] {対象名}` タイトル、`critical-review` ラベル）。

本文には以下の順でセクションを含める（テンプレ準拠）:
- 対象（関連ドキュメントのリンク）
- Status（Draft / Published / Decided / Archived）
- Executive Summary（総評）
- 検証観点（前提 / 代替案 / 実行可能性 / リスク / 機会費用）
- 処方箋 / 決定事項（個別批判と処方箋を対で記載）
- 観測 / 次アクション（チェックボックス）
- 関連 Issue（#番号参照）

## Issue ラベル

- `critical-review` — 本スキルが作成する Issue のラベル
- weekly-plan / weekly-review / pre-mortem / 各改善施策 Issue からクロスリファレンスされる

## 参照

- `gh issue list --label critical-review --state all` — 過去のレビュー（トーンやフォーマットの参考）
- `gh issue list --label critical-review --state open` — 意思決定待ちのレビュー
- `.github/ISSUE_TEMPLATE/critical-review.md` — Issue テンプレ
