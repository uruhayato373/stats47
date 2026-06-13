---
type: index
date: 2026-05-29
status: active
tags: [実装計画]
---

# 02_実装計画 INDEX

実装ロードマップと各施策の計画を置く。**ここは「今後やるべきこと」の一覧**。
完了・superseded した記録は `archive/` へ移す（削除はしない）。

> 三大ロードマップ: `01_実装ロードマップ.md`（Sprint 単位）/ `100x-pv-strategy.md`（24ヶ月 PV）/ `seo-todo-unify-phase-1-3.md`（SEO×TODO 統一）。
> 個別施策の TODO 真実源は `docs/02_実装計画/improvement-backlog.md`、未着手 backlog は `docs/02_実装計画/feature-backlog.md`（指標拡充候補は `indicator-backlog.md`）。
>
> **2026-05-29 集約**: 散在していた個別計画をテーマ別に 4 ファイルへ統合した（`phase-1-plan` / `phase-2-plan` / `theme-dashboard-plan` / `gis-content-plan`。各ファイル冒頭の `<!-- 元ファイル: -->` で出自を保持）。

## 🟢 Active（進行中）

| ファイル | 内容 |
|---|---|
| `01_実装ロードマップ.md` | Sprint ロードマップ（Phase 0 進行中） |
| `100x-pv-strategy.md` | 24ヶ月 PV 100x 戦略（Phase 0 active、Phase 1-4 は future） |
| `seo-todo-unify-phase-1-3.md` | SEO 向上 × TODO 一元化（Phase 3 一部残） |
| `d-redesign-master-plan.md` | D リデザイン マスタープラン |
| `theme-dashboard-plan.md` | テーマダッシュボード（移行手順 + チャート提案を統合。`theme-charts-planning/` の親計画） |
| `gis-content-plan.md` | GIS 統計コンテンツ戦略 + 掛け合わせ候補カタログ（統合） |
| `dbless-migration.md` | 完全DBレス移行（棚卸し+スペック+進捗を統合。Phase C完了 / Phase B・E・F 残。正典: `docs/01_技術設計/12_完全DBレス設計.md`） |
| `feature-backlog.md` | 未着手の機能・自動化 backlog（🟢今実装 / 🔵将来。50_Issues から統合 2026-06-07） |
| `indicator-backlog.md` | 指標拡充候補（pending 16 / failed 12）。`expand-indicators` / `parse-backlog.cjs` が参照 |

## 🔵 Future — Phase 1（W29-W44）

| ファイル | 内容 |
|---|---|
| `phase-1-plan.md` | 市区町村復活 / 指標拡張 / 人口移動 SNS 自動化 を統合 |

## 🟣 Future — Phase 2（W45 以降）

| ファイル | 内容 |
|---|---|
| `phase-2-plan.md` | 権威性コンテンツ / note マネタイズ / 被リンク戦略 を統合 |

## 📚 Reference / Catalog

| パス | 内容 |
|---|---|
| `whitepaper-chart-inventory/` | 11 白書チャート逆引き inventory |
| `estat-ranking-candidates/` | e-Stat ランキング候補（4,332 未 metric 化） |

## 🗂 Planning（サブディレクトリ）

| パス | 内容 |
|---|---|
| `area-charts-planning/` | area プロフィール チャート構成設計（17 テーマ） |
| `theme-charts-planning/` | テーマ別チャート設計（17 テーマ、Phase 3 R2 反映待ち） |

## 🗄 archive/

完了・superseded した計画の保管（履歴として残す）。
