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

**neither(json消失)343の再生成に着手 → both 299/612=48.9%(2026-06-21)。** ranking 83枚中52枚を `restore-ranking-from-svg.mjs`(新)で復元・push:旧SVG表示値を抽出→候補key(記事リンク+basename名前検索+ドリフト補正)とSSOT照合(scale込み≥0.95)→`fetch-ranking-data-r2`+`generate-article-charts`で3点セット再生成→push前に旧SVG値と再照合。**chart-author agent生成を整合性監査でレビューし捏造バグ3点修正**: ①SCALES極端値(1e6/1e-6)除外(SSOT全0のgini壊れデータにSVG×極小≈0で偽陽性100%した) ②絶対tol下限0.05撤廃+退化ガード(SSOT無分散は不採用) ③extractSvgValuesがfindPrefInToken未使用で短縮名(徳島)取りこぼし→extraction-fail29→7。**article.mdはpush除外必須(stale地雷)**。
**scatter も着手 → both 326/612=53.3%(neither 264)。** scatter 70中27復元(`restore-scatter-from-svg.mjs`新): 点に数値テキスト無いので点値照合不可 → **記事/ranking/リンクkey(著者由来)を SSOT値域で x/y軸に割当**(`assignLinksByRange`、x/y は元SVG目盛レンジ適合で決定)。**agent初版は name検索で誤確定**(軸「スポーツ行動者率」が実在key「スポーツの年間行動者率」と語順差で逃し camping に)→レビューで link×値域方式に作り直し根治。article.md push除外。base名 `scatter-*`(接尾辞-scatterでない)はgenerator未dispatch→json/sourceのみ。
**findings も完了 → both 381/612=62.3%(neither 209)。** findings 55全件復元(`restore-findings-from-svg.mjs`): authored要点カードは旧SVGテキスト=データなので `[title,番号,見出し,本文]`構造を抽出し `{title,findings:[{heading,text}]}`+source.json(kind:authored)を生成。**SVGは再生成せず保持**(richer形式を現rendererが劣化させるため)→json/sourceのみpush。捏造0/視覚変化0。
残 neither 209: manual76(無意味名) + scatter43(リンク値域不適合) + ranking flagged31 + line31 + tilemap15 + stacked13。worklist=`source-backfill-residue.md`(22)+`neither-restore-method.md`(手法/落とし穴/進捗)。復元は**SSOTから。SVGの絵から逆復元禁止**(§1.6)、値を自己検算して捏造防止。

**アスペクト比統一 + 再発防止ゲート完成(2026-06-21)**: カタログ別 viewBox 幅が分裂(ranking 49%/scatter 46%等)していた。原因=旧SVGの非正規サイズ残存(svg-builder生成器は固定: bar columns960×404・scatter960×624・line680×420・tile600×700・findings960)。是正: `rerender-ranking-columns.mts`(99枚)・`rerender-scatter-canonical.mts`(8枚)が既存検証済みjsonから再描画(値不変)。**再発防止**: `svg-lint.mjs` に `lintSvgSize`+`classifyChartTypeFromName` 追加→`quality-gate.mjs`(pre-commit+publish-blog.yml=新規/校正両方)と`audit-chart-quality.mjs`に配線。全6カタログ blocker(SIZE_ENFORCED)。both全件S3で正規幅実証(ranking222/scatter33/line2)。標準§6・chart-author.md更新。**★R2反映はS3 API(diff-push-r2)が確実。push-r2-wrangler(wrangler put)は「Upload complete」表示でも永続化しないflaky挙動あり→必ずS3 GETで検証**(scatter統一時5/8が黙って未永続化、S3 PutObjectで確実反映)。

副産物バグ: **marriages/divorces の SSOT値が誤り**(divorcesキーに婚姻率の値・marriagesキーは~0.5異常、cdCat01取違え疑い、live /ranking/ に誤データ)。証拠+検証cmd+再取込手順=`.claude/todo/backlog.md §D`。

正典: `.claude/rules/blog-data-schema.md §1.5/1.6/1.7`。担当 = `chart-author` agent(データ系譜の整備・復元責務)。並行別件: 米/パン metric config(`rice-/bread-consumption-expenditure`、develop、次デプロイ後 data-refresh で取り込み→地図化、未取り込み指標は `.claude/todo/backlog.md`)。
