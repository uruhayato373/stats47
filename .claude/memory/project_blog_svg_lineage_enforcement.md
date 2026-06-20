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

系譜完全率 30%→**38%**(both 232/612、2026-06-20)。残り incomplete37/ssot-restore99/ssot-restore-new169/manual76 は **agent による SSOT特定**(scatter 2軸metric割出し・ambiguous base→key マッピング)。復元は **SSOTから(`app/ranking`)。SVGの絵から逆復元禁止**(§1.6)。値を記事本文と自己検算して捏造防止。

正典: `.claude/rules/blog-data-schema.md §1.5/1.6/1.7`。担当 = `chart-author` agent(データ系譜の整備・復元責務)。並行別件: 米/パン metric config(`rice-/bread-consumption-expenditure`、develop、次デプロイ後 data-refresh で取り込み→地図化、未取り込み指標は `docs/02_実装計画/05_指標バックログ.md`)。
