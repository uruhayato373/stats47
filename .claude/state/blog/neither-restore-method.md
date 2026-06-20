# neither(json消失=絵だけ) 343枚の SSOT 再生成 — 手法と落とし穴 (2026-06-20)

`option A`。json も source.json も消えた SVG を **SSOT(app/ranking)から再生成**して 3点セットに戻す。
**旧SVGの表示値が唯一の照合先**(SVGの絵から逆復元でなく、SSOT再取得値が旧SVG表示と一致するか自己検証して捏造を防ぐ)。

## 構成 (343)
| restoreMethod × chartType | 件数 | 状態 |
|---|---|---|
| ssot-restore × ranking | 83 | 62が`-ranking`名(大半ambiguous=記事に複数ranking)。本手法の主対象 |
| ssot-restore-new × scatter | 70 | 2軸metric特定 (resolve-scatter-axes の応用 + 旧SVG点群照合) |
| ssot-restore-new × findings | 55 | **authored**(記事本文の要点текст)。SSOT不可→記事から再生成 or kind:authored |
| ssot-restore-new × line | 31 | 全国/複数県系列。national-trend多い→authored or 系列照合 |
| ssot-restore × tilemap | 15 | 未取込metric待ちの難物 (regenerate-tile-maps.ts既存) |
| ssot-restore-new × stacked | 13 | 構成比。内訳metric群の特定 |
| manual × unknown | 76 | 無意味名(inline-chart-N)。個別 |

## ranking 再生成の手法 (実証済・proven)
1. 旧SVG `app/blog/<slug>/data/<base>.svg` を取得し **県名:値マップ**を抽出
2. 候補key = 記事`/ranking/<key>`リンク + **basename トークンを all.json の rankingKey/rankingName で名前検索**
3. 各候補の SSOT partition と旧SVG値を **matchRate(相対2%)** で照合、best ≥0.95 を採用
4. 確定したら `fetch-ranking-data-r2.mjs --keys <key>` + `generate-article-charts.ts` で 3点セット(json/source.json/columns+portrait svg)を staging 生成
5. staging を `.local/r2/app/blog` へ移し `push-r2-wrangler.ts app/blog --apply`

実証: `crime-rate-regional-gap/arrest-rate-ranking` → `criminal-arrest-rate` 100%一致で再生成可。

## 落とし穴 (必ず対処)
- **旧SVGが順位(1,2,3…)を表示している**場合がある (`fire-rate-ranking`: 茨城1 山梨2 = rank)。値テキストと順位テキストを誤抽出しない (値は小数/カンマ/単位付き、順位は1-47の連番。ラベル位置・桁で判別)。
- **スケール差** (`theft-ranking` 6.65 vs SSOT raw)。per-1000/per-100k/万円等。旧SVG値×{1,1000,1e4,0.1,…}も試す。
- **派生** (`education-per-student` = 教育費÷生徒数)。raw keyに当たらない→分母metricで再計算(resolve-scatter-axes DERIVED_CONFIG方式)。
- **命名ドリフト** (記事リンク `health-life-expectancy-male` → 実在 `healthy-life-expectancy-male`、`overseas-travel-activity-rate-15plus` → `overseas-travel-annual-participation-rate-15plus`)。all.json で実在key補正。
- **未取込metric** (alcohol=国税庁/地方公務員給与一般/過疎医療/国際ボランティア) → 再生成せず flag (指標バックログ §未取込)。
- **regenerate-ranking-cards.mjs の罠**: SVG名 `*-ranking` ヒューリスティックで拾うため、neither の `*-comparison`(multi-series)を触らず、既にbothの`*-ranking`を再生成してしまう。**queue の neither base を明示ターゲット**にすること(slug単位でなくbase単位)。**必ず push 前に旧SVG値と新jsonを照合**(規約trust禁止)。

## 検証 (捏造防止・必須)
push 前に「再生成 json の上位/下位値 == 旧SVG表示値」を機械照合 (≥0.95)。一致しなければ push せず flag。
正典: `.claude/rules/blog-data-schema.md §1.6/§1.7`。担当 `chart-author`。ツール: `fetch-ranking-data-r2.mjs` / `generate-article-charts.ts` / `regenerate-tile-maps.ts` / `resolve-scatter-axes.mjs`。
