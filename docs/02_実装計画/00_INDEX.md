---
type: index
date: 2026-07-11
status: active
tags: [実装計画]
---

# 02\_実装計画 INDEX

**このプロジェクトの戦略と領域別実行計画の一覧。** 連番ファイルのみのフラット構成
（サブディレクトリ・アーカイブは持たない。完了・superseded した記録は git 履歴に残す）。

> **TODO (バックログ・受信箱) は 2026-07-11 に `docs/todo/` へ移設した。**
> 「次に何をやるか」は `docs/todo/README.md` から辿る。ここには戦略・実行計画の文書だけを置く。

## まず最初に読むファイル

| 知りたいこと                                                         | ファイル                                         |
| -------------------------------------------------------------------- | ------------------------------------------------ |
| **何を収益の軸にするか**（収益化・チャネル・広告配置の唯一の真実源） | `01_収益化マスタープラン.md` ★収益判断時必読     |
| **次に着手すべき施策はどれか**                                       | `docs/todo/`（inbox + 改善/機能/指標バックログ） |

## 🟢 領域別の実行計画（active）

| ファイル                                 | 内容                                                                                           |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------- |
| ~~`06_ブログ品質是正ループ.md`~~ (廃止) | 2026-07-12 に運用正典を .claude へ一本化 → `.claude/rules/blog-remediation-loop.md` |
| ~~`09_ランキング品質改修.md`~~ (廃止) | 2026-07-12 に運用スペックを .claude へ抽出 → `.claude/rules/ranking-content-standards.md` (戦略は 01・Wave 進捗は ai-content 是正キュー) |
| ~~`12_GSCカバレッジ是正ループ.md`~~ (廃止) | 2026-07-12 に運用正典を .claude へ一本化 → `.claude/skills/analytics/gsc-coverage-remediation/SKILL.md` |
| `14_収益化実装方針.md`                   | 収益化の実装詳細（広告配置・計測）                                                             |
| ~~`15_ブログSEO拡充戦略.md`~~ (廃止)     | 2026-07-12 に SSOT を .claude へ一本化 → `.claude/agents/blog-seo-strategist.md` §戦略コンテキスト |
| `16_月間100万PVロードマップ.md`          | トラフィック層の長期計画（T1-T4 フェーズ・レバー別施策カタログ）。PV は先行指標で NSM ではない |
| ~~`17_家計調査論点カタログ.md`~~ (移設) | 2026-07-12 に .claude reference へ → `.claude/skills/blog/draft-from-trend/reference/kakei-topic-catalog.md` |
| `18_テーマ指標チャート改善運用.md`       | ThemeCatalog の指標選定・チャート提案・Claude Code 実装・検証を1テーマずつ回す運用             |
| `19_テーマ定義・注意事項カード仕様.md`   | テーマページの定義・誤読防止カード共通仕様と4テーマ分の文靠・Claude Code実装指示               |
| ~~`20_survey別コンテンツクラスター戦略.md`~~ (廃止) | 2026-07-12 に運用スペックを .claude へ抽出 → `.claude/rules/survey-content-standards.md` (survey-curator 所有・実装は survey-editorial.ts) |
| `21_ランキングサムネイルAB表示仕様.md`  | ランキングリンクカードの地図型A・数値型Bを使い分けるSSOT、実装手順、受入条件                  |
| `22_運営者カード・ホーム広告整理仕様.md` | 全ページ共通の運営者プロモとホーム汎用アフィを撤去し、プロフィールと文脈広告を整理する仕様     |
| `23_ブログOGP生成AIパイプライン仕様.md`  | Geminiで記事別の文字なし背景を生成し、既存Satori合成・R2配信へ安全に統合するClaude Code実装仕様 |
| `24_テーマ分類再編成方針.md`             | 22テーマを固定せず、全レビュー後にkeep/split/merge/parent-hubで再編する分類・URL移行方針         |
| `25_アフィリエイト運用SSOT移行仕様.md`   | docs/40 の運用資料を affiliate-manager / skills / state / 型付き git TS へ移し、週次計測・改善ループを一本化する Claude Code 実装仕様 |

## 関連（このフォルダ外の正典）

- **TODO 真実源**: `docs/todo/`（01*改善 / 02*機能 / 03\_指標 バックログ + inbox）
- セッション引き継ぎ: `docs/handoffs/`
- データ層アーキテクチャ（完全DBレス・正典）: `docs/01_技術設計/12_完全DBレス設計.md`
- 統一レイアウト設計: `docs/01_技術設計/13_統一レイアウト設計.md`
- デザインシステム: `docs/01_技術設計/15_デザインシステムSSOT.md`
- theme-dashboard feature README: `apps/web/src/features/theme-dashboard/README.md`
- 現在計画: `docs/todo/current-{month,week}.md` / agent用週次レビュー: `.claude/skills/management/weekly-review/reference/reviews/`
- 批判的レビュー・パフォーマンス・コスト月報: `docs/04_レビュー/`
- 白書チャート逆引き inventory（ドーマント・skill 専用に移設）: `.claude/skills/analytics/whitepaper-chart-inventory/reference/inventory/`
