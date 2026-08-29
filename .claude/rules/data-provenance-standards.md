# データ出典・再現性 (provenance) 標準

stats47 の全データ (metric / blog / theme / area / open-data) について、**出典と「いつでも一次資料から
再取得・再検証できる情報」を機械チェック可能な形で記録する**ための単一ソース (SSOT) 規約。データを投入・
是正・監査する agent (`data-ingester` / `open-data-curator` / `snapshot-exporter`) / skill (`/audit-provenance`) /
人間はこれに従う。

> **背景 (2026-07-19)**: 消防庁 PDF 由来の `ambulance-hospital-arrival-time` を投入した際、config には出典名と
> ランディング URL しか記録されず「人が探せる」レベルで、決定的な再取得・再検証ができなかった。provenance 9点
> セットを後付けして初めて復元可能になった。この教訓を機械 lint + 定期監査で仕組み化する。

---

## 1. 再現性クラス (source をこの 4 分類で扱う)

| クラス | 該当 | 再取得キー | provenance 要否 |
|---|---|---|---|
| **A: 機械 ID で再取得可** | `kind:"estat"` (statsDataId) / `kind:"kakei-chousa"` (filter.statsDataId) | statsDataId (+cdCat01/02) | 不要 (id で決定的。url は UI 用) |
| **A': 機械 ID 付き external** | `external` + `mlit_ksj` (ksjDataId+ksjVersion) / config.estat.statsDataId | ksjDataId+Version / statsDataId | 不要 (再取得キーが config にあること) |
| **B: fetcher 依存・出典薄** | `external` で config が空 or url のみ (mlit_dpf / estat 空 / local-public-employee-salary / ssds) | 無し (fetcher コードに抽出ロジックが埋没) | **要**: config に再取得キー or provenance を backfill |
| **C: 手動抽出** | `external` + `fetcherKey:"manual"` (PDF/xlsx/HTML 由来) | provenance 9点セット | **必須** (無いと復元不能) |
| **D: 出典不明** | `fetcherKey:"unknown"` / TODO resourceId / calculated で親参照が config に無い | 無し | **新規投入禁止**。既存は是正対象 |

---

## 2. provenance 9点セット (クラス C 必須・手本 = ambulance)

手動抽出データは `source.config.provenance` (型 `SourceProvenance`, `packages/data-configs/src/types.ts`) に記録する:

| フィールド | 意味 | lint 必須 |
|---|---|---|
| `publicationIndexUrl` | 版一覧/ランディング URL (年版で変わりうる) | — |
| `pdfUrl` / `url` | **実データファイルの直リンク** (復元の起点) | **どちらか必須** |
| `table` | 表名・シート名 (例「別表8の1 病院収容所要時間別搬送人員の状況」) | — |
| `pdfPage` | PDF 内ページ番号 | — |
| `valueColumn` | どの列/セルが値か (例「令和6年中 平均(分)」) | — |
| `dataYear` | データの対象年 | — |
| `accessedAt` | アクセス日 (ISO date) | **必須** |
| `extraction` | 抽出手法 (再現手順) | **必須** |
| `verification` | 検算 (公表全国値との一致等) | **必須** |
| `restore` | 復元コマンド (誰でも一次資料から再取得・突合できる) | **必須** |

手本: `packages/data-configs/src/metrics/ambulance-hospital-arrival-time.ts` の `source.config.provenance`。

---

## 3. ドメイン別 provenance SSOT 対応表

| ドメイン | provenance の SSOT | 機械チェック | 弱点/是正先 |
|---|---|---|---|
| metric config | `source` (estat=statsDataId / external=config.provenance) | `validate-metric-config.ts` の `[provenance]`/`[provenance-thin]`/`[calc-ref]` | クラス B/D の 38 件 (provenance-thin warn) |
| blog SVG/data | R2 `app/blog/<slug>/data/<base>.source.json` (3点セット) | `quality-gate.mjs` の `svgLineageMissing` (blocker) / `build-lineage-queue.mjs` | 全量棚卸しの定期実行 |
| theme catalog | `selection` (proposedBy/sourceUrl/surveyedAt/rationale) | `validate-theme-catalog.ts` の `no-selection` (warn) | selection backfill |
| area-databook | editorial の `sourceUrl`+`accessedAt` | `validate-area-databook.ts` (error 済・良好) | — |
| open-data-catalog | catalog の `verifiedFromUrls`/`commercialUse` | `validate-open-data-catalog.ts` (error 済・良好) | 到達性 cron |
| ranking ai-content | 生成プロンプト規約 (数値の書き方) | `audit-ai-content.mjs` | 数値出典は metric 側に依存 |

---

## 4. 機械チェック (lint)

`validate-metric-config.ts` (pre-commit + CI + 週次 cron に配線):

| タグ | tier | 内容 |
|---|---|---|
| `[provenance]` | error (isActive:true) / warn (false) | `fetcherKey:"manual"` に provenance {url\|pdfUrl, accessedAt, extraction, verification, restore} 不足 |
| `[provenance-thin]` | warn | external に再取得キー/出典 URL が無い (クラス B/D の可視化。是正完了後 error 昇格) |
| `[calc-ref]` | error | calculation.numeratorKey 等 / CalculatedSource.formula の参照先 metric が registry に不在 |

**段階昇格**: `[provenance-thin]` は現在 warn (既存 38 件)。Wave B の backfill 完了後に error 昇格する
(DR-AUDIT-08 / metric-config-standards.md の warn→error 昇格パターン)。

---

## 5. 禁止事項

| NG | OK |
|---|---|
| 出典なし (config 空・fetcherKey:"unknown") の新規 external metric | 再取得キー or provenance 9点セットを config に記録 |
| 検算なしの手動投入 | verification (公表値との一致等) を provenance に記録 |
| 書籍・二次サイトの数値をそのまま投入 | 一次資料 (府省 PDF/API) から取り直し + restore コマンド記録 |
| ランディング URL だけで「出典記録済み」とする | 実ファイル直リンク (pdfUrl) + 表 + 列 + 抽出法まで |

---

## 6. 監査体制

- **入口 (投入時)**: lint error が新規の provenance 欠落をブロック (`data-ingester` は非 e-Stat 投入時に本 rules を必読)。
- **定期 (週次)**: `provenance-audit-weekly.yml` が全量を機械監査 → `.claude/state/provenance/{queue.json,LATEST.md}`
  を commit-back → error 増加 or D クラス検出時だけ `auto-generated` Issue (手本 = `ogp-image-audit-weekly.yml`)。
- **是正**: `/audit-provenance` skill が queue を提示 → fetcher コードから出典復元 → config backfill → lint 再実行。
  意味判断 (出典が本当に正しいか) だけ `open-data-curator` / 人間。

---

## 関連

- 型: `packages/data-configs/src/types.ts` (`SourceProvenance` / `KNOWN_FETCHER_KEYS` / `ExternalSource`)
- lint: `packages/data-configs/scripts/validate-metric-config.ts`
- queue: `.claude/scripts/provenance/audit-provenance-queue.mjs` → `.claude/state/provenance/`
- skill: `.claude/skills/db/audit-provenance/SKILL.md`
- cron: `.github/workflows/provenance-audit-weekly.yml`
- 手本 (blog lineage): `.claude/scripts/blog/build-lineage-queue.mjs` / `.claude/rules/blog-data-schema.md` §1.5/1.7
- metric 構造: `.claude/rules/metric-config-standards.md` / e-Stat: `.claude/rules/estat-api.md`
- 参考文献の保全・昇格条件: `.claude/rules/reference-source-standards.md`
- 実証判定: `.claude/rules/evidence-based-judgment.md`
