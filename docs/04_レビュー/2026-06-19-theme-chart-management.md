---
type: critical-review
topic: theme-chart-management
date: 2026-06-19
status: draft
tags: [theme-dashboard, dbless, architecture, page-components]
---

# テーマの統計・チャート形式の管理場所 — 現状調査と整理方針

> インボックス TODO「各テーマで利用する統計とチャート形式（カード含む）の整理 + 管理場所の決定」の深掘り。
> 2026-06-19 にコードを実地調査した結果。**結論: 管理が 2 つの git TS ソースに分裂し、型コメントが廃止済み D1 テーブルを指したまま。手編集 JSON が SSOT 化している（DBレス規約違反）。**

## 現状：テーマ関連データは 3 層に分かれている

| 層 | 実体 (SSOT) | 何を持つ | 読まれ方 |
|---|---|---|---|
| ① テーマ定義 | `packages/types/src/indicator-sets/<theme>.ts`（`IndicatorSet`）| key/title/description/category、**どの rankingKey を含むか**（metrics[]）、**panelTabs**（タブの label + rankingKeys）、relatedArticleTagKeys | `apps/web/.../config/all-themes.ts` が import → `ALL_THEMES` → `/themes` で **ビルド時に焼き込み（SSG）** |
| ② チャート/カード定義 | `apps/web/scripts/data/page-components/theme/<theme>.json`（**手編集 JSON**）| **componentType**（kpi-card / line-chart / composition-chart…）、componentProps（estatParams=statsDataId+cdCat01）、section、sortOrder、grid span | `export-page-components-snapshot.ts` で R2 `app/page-components/theme/<key>.json` 化 → 実行時 `fetchFromR2AsJson` |
| ③ 観測値（数値） | R2 `app/stats/<metric>/values.json` | 47都道府県 × 全年の実数値 | reader (`@stats47/stats-r2`) |

## 問題点（drift）

### A. 同じ概念が 2 ソースに重複し、連結が緩い
- **「どの統計を載せるか」が二重定義**: ①は `rankingKey` で指標を列挙、②は同じ指標を `estatParams`（statsDataId+cdCat01）で**別表現で**再定義している。両者を結ぶキーがなく、手作業で整合を取っている（片方だけ直すとズレる）。
- **「section（タブ/区分）」も二重**: ①`panelTabs[].label`（例「財政健全度」）と ②`page-components[].section`（同じ文字列「財政健全度」）が**別ファイルに別個に存在**。文字列一致で暗黙に結合している。

### B. 型レイヤーのコメントが廃止済み D1 テーブルを指している（誤誘導）
- `packages/types/src/indicator-set.ts` に `// チャートは chart_definitions テーブルで管理（Single Source of Truth）/ page_chart_assignments.section でタブに割り当て` というコメントが残存。**`chart_definitions` / `page_chart_assignments` は完全DBレスで廃止済みのテーブル**。
- `apps/web/.../theme-dashboard/types.ts` も `/** DB 管理チャート（page_components + page_component_assignments）*/` と記述。実際の SSOT は ②の手編集 JSON で、D1 ではない。
- 型ファイル内に未使用の `ChartDefinition` union（`DualLineChartDef` / `MixedChartDef` / `DonutChartDef`）が定義されているが `IndicatorSet` からは参照されていない（過去の設計の残骸）。

### C. 手編集 JSON が SSOT 化（DBレス規約違反）
- `.claude/rules/data-storage.md` / doc 12 は **「page_components は git TS 定義が SSOT → 生成スクリプトで R2 JSON。手編集 JSON を SSOT にしない」**と定める。
- 実態は ②`data/page-components/theme/*.json` が**手編集 JSON のまま SSOT**（上流の .ts 定義なし。`extract-page-components-from-r2.ts` で R2 から一度 reverse-extract したものを以後手編集）。横断整合性のビルド時検証も限定的。

## 整理の選択肢

1. **①に寄せる（推奨方向）**: `IndicatorSet` を拡張し、各 metric にチャート形式（componentType / props）を型付きで持たせる。②の page-components JSON は `IndicatorSet` から**生成**（手編集を廃止）。`rankingKey` を唯一のキーにして①②の二重表現を解消。estatParams は metric config から導出。
   - 利点: 規約準拠（git TS が SSOT・手編集 JSON 廃止）、型安全、二重定義解消。
   - 注意: 生成スクリプト整備が必要。chart props の表現力を型で吸収できるか要検証。
2. **②に寄せる**: page-components JSON を正式 SSOT と認め、上流 .ts generator を付けて手編集 JSON を脱却。①はテーマ→指標の薄いマッピングに限定。
   - 利点: 既存 JSON 資産を活かせる。 欠点: 「設計図はコード」の原則からは弱い。
3. **現状維持 + ドキュメント整合のみ**: 最低限、型コメントの D1 参照を実態（R2/git TS）に修正し、①②の連結ルールを明文化。構造は変えない（最小コスト）。

## 次アクション（triage 時の判断材料）
- まず **B（誤コメント修正）と未使用 `ChartDefinition` の扱い**は低コストで即着手可（混乱の元を除去）。
- **A/C の本格整理**は設計判断（選択肢 1 vs 2）が必要 → 機能バックログ `04_機能バックログ.md` の section 化候補。`theme-component-builder` agent / `chart-component-standards.md` / doc 12 と整合させる。
- 規模が大きいため、月次の重点テーマ候補（ただし収益直結度は中。ブログ/ランキング品質より優先度は下）。

## 参照
- `docs/01_技術設計/12_完全DBレス設計.md`（page_components は git TS SSOT の原則）
- `.claude/rules/data-storage.md`（手編集 JSON を SSOT にしない）
- `.claude/rules/chart-component-standards.md`（componentType カタログ）
- `packages/types/src/indicator-set.ts` / `apps/web/scripts/data/page-components/theme/*.json`
- `apps/web/scripts/export-page-components-snapshot.ts`（②→R2 反映）
