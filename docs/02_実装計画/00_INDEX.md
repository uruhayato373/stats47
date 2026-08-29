---
title: 実装計画INDEX
type: index
date: 2026-07-11
updated: 2026-07-30
status: active
tags: [実装計画]
---

# 02\_実装計画 INDEX

**このプロジェクトの戦略と領域別実行計画の一覧。** 連番ファイルのみのフラット構成
（サブディレクトリ・アーカイブは持たない。完了・superseded した記録は git 履歴に残す）。

> **TODO (バックログ・受信箱) は 2026-07-11 に `.claude/todo/` へ移設した。**
> 「次に何をやるか」は `.claude/rules/todo-standards.md` から辿る。ここには戦略・実行計画の文書だけを置く。

## まず最初に読むファイル

| 知りたいこと                                                         | ファイル                                         |
| -------------------------------------------------------------------- | ------------------------------------------------ |
| **何を収益の軸にするか**（収益モデル・チャネル・広告配置の唯一の真実源） | `docs/00_プロジェクト管理/02_収益化戦略.md` ★収益判断時必読 |
| **次に着手すべき施策はどれか**                                       | `.claude/todo/`（inbox + 改善/機能/指標バックログ） |

## 🟢 領域別の実行計画（active）

<!-- docs-governance:active-plans:start -->
| ファイル | 内容 | Status | 関連バックログ |
|---|---|---|---|
| [`42_アフィリエイトPlaywright継続運用・安全化実装仕様.md`](./42_%E3%82%A2%E3%83%95%E3%82%A3%E3%83%AA%E3%82%A8%E3%82%A4%E3%83%88Playwright%E7%B6%99%E7%B6%9A%E9%81%8B%E7%94%A8%E3%83%BB%E5%AE%89%E5%85%A8%E5%8C%96%E5%AE%9F%E8%A3%85%E4%BB%95%E6%A7%98.md) | アフィリエイト Playwright 継続運用・安全化実装仕様 | `in-progress` | `ASP-CONTINUITY-01` |
| [`43_地理スコープ分離・日本統計基盤実装仕様.md`](./43_%E5%9C%B0%E7%90%86%E3%82%B9%E3%82%B3%E3%83%BC%E3%83%97%E5%88%86%E9%9B%A2%E3%83%BB%E6%97%A5%E6%9C%AC%E7%B5%B1%E8%A8%88%E5%9F%BA%E7%9B%A4%E5%AE%9F%E8%A3%85%E4%BB%95%E6%A7%98.md) | 地理スコープ分離・日本統計基盤実装仕様 | `active` | `null` |
| [`44_市区町村統計スコープ分離・ランキング基盤実装仕様.md`](./44_%E5%B8%82%E5%8C%BA%E7%94%BA%E6%9D%91%E7%B5%B1%E8%A8%88%E3%82%B9%E3%82%B3%E3%83%BC%E3%83%97%E5%88%86%E9%9B%A2%E3%83%BB%E3%83%A9%E3%83%B3%E3%82%AD%E3%83%B3%E3%82%B0%E5%9F%BA%E7%9B%A4%E5%AE%9F%E8%A3%85%E4%BB%95%E6%A7%98.md) | 市区町村統計スコープ分離・ランキング基盤実装仕様 | `active` | `null` |
| [`45_日本国勢図会一次資料化・マルチチャネル展開実装仕様.md`](./45_%E6%97%A5%E6%9C%AC%E5%9B%BD%E5%8B%A2%E5%9B%B3%E4%BC%9A%E4%B8%80%E6%AC%A1%E8%B3%87%E6%96%99%E5%8C%96%E3%83%BB%E3%83%9E%E3%83%AB%E3%83%81%E3%83%81%E3%83%A3%E3%83%8D%E3%83%AB%E5%B1%95%E9%96%8B%E5%AE%9F%E8%A3%85%E4%BB%95%E6%A7%98.md) | 日本国勢図会一次資料化・マルチチャネル展開実装仕様 | `active` | `null` |
| [`46_その他参考文献OCR・クロップ・stats47展開実装仕様.md`](./46_%E3%81%9D%E3%81%AE%E4%BB%96%E5%8F%82%E8%80%83%E6%96%87%E7%8C%AEOCR%E3%83%BB%E3%82%AF%E3%83%AD%E3%83%83%E3%83%97%E3%83%BBstats47%E5%B1%95%E9%96%8B%E5%AE%9F%E8%A3%85%E4%BB%95%E6%A7%98.md) | その他参考文献OCR・クロップ・stats47展開実装仕様 | `active` | `REFERENCE-SOURCE-EXPANSION-01` |
| [`47_GeoAI事業M1実装仕様.md`](./47_GeoAI%E4%BA%8B%E6%A5%ADM1%E5%AE%9F%E8%A3%85%E4%BB%95%E6%A7%98.md) | GeoAI事業M1実装仕様 | `active` | `null` |
<!-- docs-governance:active-plans:end -->

## 関連（このフォルダ外の正典）

- **TODO 真実源**: `.claude/todo/`（改善 / 機能 / 指標バックログ + inbox）
- 収益化戦略（NSM・収益レーン・配置判断・ゲート）: `docs/00_プロジェクト管理/02_収益化戦略.md`
- セッション残タスク: `.claude/todo/` の該当バックログへ直接反映
- データ層アーキテクチャ（完全DBレス・正典）: `docs/01_技術設計/02_データアーキテクチャ.md`
- デザインシステム（統一レイアウトを含む）: `docs/01_技術設計/04_デザインシステム.md`
- theme-dashboard feature README: `apps/web/src/features/theme-dashboard/README.md`
- 現在計画: `.claude/todo/{monthly,weekly}.md` / agent用週次レビュー: `.claude/skills/management/weekly-review/reference/reviews/`
- レビュー由来の未完了策: `.claude/todo/` / 定期レポート履歴: 各skillの `reference/`
- 白書チャート逆引き inventory（ドーマント・skill 専用に移設）: `.claude/skills/analytics/whitepaper-chart-inventory/reference/inventory/`
