---
type: whitepaper-chart-inventory-index
date: 2026-05-27
status: active
target: 11 白書のチャート逆引き抽出 → area/theme 配置の素材リスト化
tags: [whitepaper, chart-inventory, planning]
---

# 白書チャート逆引き inventory — INDEX

11 種の白書 (NotebookLM ノートブック) から「実描画されているチャート」を逆引き抽出し、stats47 のチャート設計 (`page_components`, `theme_metrics`) の入力にする。e-Stat 全件 enumeration より信号/雑音比が高い「専門家が選定した重要統計の可視化」リスト。

## 親計画

- `/root/.claude/plans/47-swirling-wreath.md` — Phase A-E 全体計画
- `apps/web/scripts/data/page-components/theme/<key>.json` — theme チャート定義の実装 SSOT (17 テーマ実装済)
- `apps/web/src/features/area-profile/` — area プロフィールチャートの実装
- `docs/01_技術設計/03_情報設計.md` — area / theme の責務判定基準

## 進捗表

| slug | NotebookLM ノートブック名 | 主題 | status | chart 抽出数 | 章数 |
|---|---|---|---|---|---|
| [recent-whitepapers](./recent-whitepapers.md) | 最新の白書 | 人口減少 / AI / GX (横断) | **plan (Phase A-4 dry run)** | 0 | TBD |
| economic-fiscal | 経済財政白書 | 所得・賃金・財政・GDP | not-started | - | - |
| mhlw | 厚生労働白書 | 医療・介護・出生・自殺 | not-started | - | - |
| mlit | 国土交通白書 | 道路・港湾・住宅・建設 | not-started | - | - |
| energy | エネルギー白書,第６次エネルギー基本計画 | 電力・再エネ・カーボン | not-started | - | - |
| environment | 環境白書 | リサイクル・廃棄物・気候 | not-started | - | - |
| ict | 情報通信白書 | テレワーク・デジタル・通信 | not-started | - | - |
| transport | 交通政策白書 | 交通事故・物流・移動 | not-started | - | - |
| manufacturing | ものづくり白書 | 製造業・生産性 | not-started | - | - |
| small-business | 中小企業白書 | 起業・スタートアップ | not-started | - | - |
| children | こども白書 | 教育・保育・出生 | not-started | - | - |

**進捗**: 0 / 11 完了 (Phase A 段階で 1 白書 dry run のみ)

status: `not-started` → `plan` (CLI コマンド生成済) → `query-pending` (user 実行待ち) → `parsed` (skill 整形済) → `reviewed` (人間確認済) → `mapped` (Phase D 配置決定済)

## Phase A-4 dry run の合格基準

`recent-whitepapers.md` (最初の白書) の抽出結果を以下で評価:

- 各 query で 5-15 件の chart 抽出が得られているか
- chart_type が既存 enum + 拡張候補リストで網羅できるか
- 出典統計名が citation 付きで取れているか
- 1 query の応答切れ (truncate) が 1 回以下か

合格なら Phase B (残り 10 白書) 着手。不合格なら query template を再設計して再試行。

## chart_type enum 拡張候補 (Phase D で判定)

既存 (`theme_metrics.chart_type`): `["choropleth", "line", "pie", "bar", "ranking-table"]`

Phase A-B の抽出で出現頻度が高ければ Phase E で migration 検討:

| 候補 | 用途 | 既存実装 | 抽出件数 (Phase B 後埋まる) |
|---|---|---|---|
| `sparkline` | カード内簡易時系列 (area カード等) | なし | - |
| `scatter` | 2 指標相関 (47 県プロット) | なし | - |
| `pyramid` | 年齢構成 | `theme-dashboard/AgeCompositionChart` (enum 未登録) | - |
| `flow` | 人口・物流移動 | `MigrationFlowPlayer` (enum 未登録) | - |
| `stacked-bar` | 構成内訳 (時系列) | なし | - |
| `treemap` | 面積比例 | なし | - |

## responsibility ラベル (Phase D で確定)

各 chart 行の `responsibility` 列に以下のいずれかを記入:

- `area`: 47 県別 + 単一県プロフィール構成 (`chart_target: prefecture` 必須)
- `theme`: 主題横断・全国時系列・年齢構成
- `both`: area/theme 両方で使う (片方 primary、片方 summary)
- `external-source`: e-Stat 取込不可 (OECD / 民間調査等)
- `undecided`: 初期値 (Phase A-B 段階)

判定は別スキル or 人間レビューで実施。本 inventory の出力は「素材リスト」として `undecided` で完了。

## 関連

- スキル: `.claude/skills/analytics/whitepaper-chart-inventory/SKILL.md`
- TEMPLATE: `./TEMPLATE.md`
- 白書 SSOT: `.claude/skills/blog/brushup-blog-article/SKILL.md`
- nlm CLI wrapper: `.claude/scripts/notebooklm-cross-query.mjs`
