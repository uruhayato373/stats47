---
name: project_blog_svg_lineage_enforcement
description: ブログSVG「1画像=1設定ファイル」徹底ルール+復元キュー。生成時source.jsonセット出力/gate blocker/svg-lineage-queue。正典 blog-data-schema.md §1.7
metadata: 
  node_type: memory
  type: project
  originSessionId: e541e11c-0e31-4744-a32f-d0b7cf69468c
---

ブログSVG 612枚の棚卸しで **56%(344枚)が元データ(data/json)消失=「絵だけ」**(再生成・出典追跡不能)と判明(2026-06-20)。dark mode未対応・デザイン不統一・タイルマップ未救済の根本原因。根治を2軸で実装:

**再発防止(徹底・完成)**: 「1画像=1設定ファイル(source.json)」を3層強制。
- `generate-article-charts.ts`: SVG書込時に source.json を必ずセット出力(`writeChartSourceIfMissing`、既存確定版は尊重)。inline抽出もセット(incomplete:true)。
- `quality-gate.mjs`: source.json欠落を **blocker**(公開ブロック)。generator通過で新規は揃う/既存負債は復元してから公開。
- `fetch-ranking-data-r2.mjs` はSSOT確定版を出力。

**復元(段階的)**: 真実源=`.claude/state/blog/svg-lineage-queue.json`(`build-lineage-queue.mjs`生成、人間用`svg-lineage-LATEST.md`)。`restoreMethod`別に軽い順:
- `source-backfill`: 既存json→SSOT照合(`backfill-source.mjs`)。ranking47 + line/derived3 = verified 50枚。line は series最新年値で **n>=3** 照合(一部県の時系列)。incomplete(出自不明: scatter2軸/unknown/記事リンク無)は **量産せず agent特定へ**(ユーザー方針)。
- `ssot-restore`: ranking ambiguous + tilemap → `regenerate-tile-maps.ts`/`regenerate-ranking-cards.mjs`(SSOT照合・`--mapping`/trusted/Derived計算・自己検算)。タイルマップ62枚反映済。
- `ssot-restore-new`: scatter(2軸metric)/line/findings消失 → 手法を新規実装(agent特定)。
- `manual`: 無意味名(inline-chart-N)。

系譜完全率 30%→**40.4%**(both 247/612、2026-06-20)。source-backfill を 2 ツールで決定的に消化:
- `backfill-source.mjs`: scatter 2軸照合 + 全chartType照合(cpi-* unknown 救済) + **0.95精度ガード**(0.8だと相関別指標へ偽陽性)。10枚 verified。
- `resolve-scatter-axes.mjs`(新): axisラベルから候補keyを all.json名前検索→SSOT値照合(≥0.95)。独自スキーマ(fiscalIndex/tertiaryRatio)も field指定対応。FLAT_CONFIG=scale表記(平均給与万円=÷10000)、DERIVED_CONFIG=÷人口再計算(per-capita-local-tax 10/10)。同率は最新年優先。5枚 verified。

残 source-backfill 22枚(`source-backfill-residue.md`に分類): 派生3(welfare 7/11・retail 0/0構造不良・nurse-favored順位差)/authored全国系列9/複数系列2/semiconductor派生1/未取込3。**+ neither 343(json消失)は未着手=最大バケツ**(regenerate-ranking-cards/tile-maps/新手法で SSOT再生成)。復元は **SSOTから(`app/ranking`)。SVGの絵から逆復元禁止**(§1.6)。値を自己検算して捏造防止。

副産物バグ: **marriages/divorces の SSOT値が誤り**(divorcesキーに婚姻率の値・marriagesキーは~0.5異常、cdCat01取違え疑い、live /ranking/ に誤データ)。証拠+検証cmd+再取込手順=`docs/02_実装計画/05_指標バックログ.md §D`。

正典: `.claude/rules/blog-data-schema.md §1.5/1.6/1.7`。担当 = `chart-author` agent(データ系譜の整備・復元責務)。並行別件: 米/パン metric config(`rice-/bread-consumption-expenditure`、develop、次デプロイ後 data-refresh で取り込み→地図化、未取り込み指標は `docs/02_実装計画/05_指標バックログ.md`)。
