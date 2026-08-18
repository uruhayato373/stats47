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
