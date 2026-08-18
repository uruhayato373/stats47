# Blog data schema 規約 + wave 命名規則 + skill ↔ docs ↔ memory map

Blog エコシステム (article 生成 / brushup / factual-check / 効果計測) の **対応関係の真実源**。
Phase A (2026-05-27) で `recursive-purring-planet.md` plan の一環として整備。

## 0. 記事ライフサイクル (R2ファースト・企画文書レス / 2026-06-15 更新) ★

ブログは **「生成 → 公開 → ライブで反復」** で回す。企画文書 (旧 `docs/20_ブログ記事企画`) は**廃止**。

```
metric 選定 (GSC ギャップ/トレンド/カテゴリ/ユーザー指示)
  → fetch-ranking-data-r2.mjs (R2 app/stats/<key> 直 fetch → docs/21/<slug>/data/*.json)
  → article.md 生成 (docs/21 = ephemeral outbox) + generate-article-charts.ts
  → factual-check + quality-gate + blog-critic(review.md PASS)
  → published:true で develop push → blog-auto-publish.yml が R2 公開 + docs/21 ドラフトを自動削除
     (公開対象の選定は `select-republish-slugs.mjs`。**新規記事だけでなく改稿版も対象**)
  → 公開後はライブ (stats47.jp/blog/<slug>) で確認 → /brushup-blog (R2 取得→是正) で反復
```

- **記事の正典 (SSOT) は R2 `app/blog/<slug>`**。`docs/21_ブログ記事原稿` は ephemeral outbox (公開後 CI が自動 `git rm` → 常に空)。`.local/r2/app/blog/` は R2 のローカルミラー (brushup 作業域)。
  - **outbox 不変条件は二重で機構保証する (2026-06-21)**: ① `blog-auto-publish.yml` が公開した slug を即 `git rm` + commit-back。② `blog-remediation-daily.yml` (日次 JST 08:00) が `prune-published-outbox.mjs --apply` で「published:true かつ **R2 (正典) の article.md と内容が完全一致**」のドラフトを掃除。**広い `git add` (統合コミット等) で公開済みドラフトが出戻りしても翌日には自動で消える**。`published:false` の作業中ドラフトは保持。**内容一致を要求するのは安全装置**: brushup (既 live 記事の改稿) は docs/21 に published:true のまま新版を置き R2 には旧版が live なので、「存在」だけで消すと改稿中の新版を誤削除する (差分があれば保持)。docs/21 を消さず R2 を唯一の真実源に保つ設計 (transport は git・R2 直書きは creds 持つ CI 専用なので docs/21 は必要)。
- **廃止 (2026-06-15)**: `docs/20_ブログ記事企画` 全体、`/plan-blog-{articles,trends,from-gsc,affiliate}` `/update-blog-plan` スキル、`blog-planner` agent、`fetch-article-data.mjs` (D1依存) / `generate-gsc-driven-plan.mjs` / `generate-brushup-queue.cjs` スクリプト。
- **置換**: 企画 → `/draft-from-trend` の metric 選定に統合 / データ接地 → `fetch-ranking-data-r2.mjs` (R2直) / brushup キュー → `.claude/state/blog/remediation-queue.json` (`brushup-queue.md` は廃止)。
- 新規記事の生成・公開はクラウド版でも完結する (git push → push トリガー CI が R2 反映。R2 直書きは CI 専用)。

## 1. data/\*.json 統一 schema (Phase B で実装、ここでは規約のみ宣言)

`.local/r2/app/blog/<slug>/data/*.json` の **統一 schema** (Phase B 完了後の状態):

```json
{
  "areaName": "鹿児島",
  "rank": 12,
  "value": 110700,
  "label": "耕地面積",
  "unit": "ha"
}
```

**必須 field**: `areaName` / `rank` / `value` / `label` / `unit`

**任意 field `chartType` (非canonical basename の復旧記事用・2026-06-24)**: `generate-article-charts.ts` の
`detectChartType` は **filename suffix を最優先**で型判定する (`*-ranking.json`→bar 等、§4)。だが復旧記事は
article.md が埋め込む basename (`data/library-per-capita.svg` 等) を変えられず canonical suffix にできない。
この場合に限り JSON 先頭に `"chartType": "bar"|"tile-grid"|"line"|"scatter"|"stacked-bar"|"summary"` を持たせると、
suffix で確定できないとき**だけ**これに fallback ディスパッチする (suffix 判定が成立する canonical 名では無視)。
新規 canonical 記事では使わない (suffix で十分)。

**現状 (Phase B 前) の 3 種共存** (探索結果より):

| Schema 形式    | 構造例                                             | label 位置           | unit 位置 |
| -------------- | -------------------------------------------------- | -------------------- | --------- |
| flat array     | `[{areaName, rank, value, unit}]`                  | item 内 (空 or なし) | item 内   |
| nested-metrics | `{rankings: {label, unit, data: [{rank, value}]}}` | wrapper              | wrapper   |
| timeseries     | `{series: {label, data: [{year, value}]}}`         | wrapper              | なし ❌   |

3 種が混在することで `article-factual-check.mjs` の `walkAndIndex()` が label/unit を完全 index 化できず、value mismatch detector が実装不能になっている (2026-05-27 検出力テスト: rank 系 100% / value 系 0%)。

> **★2026-08-12 更新: value 系の検出力を回復した。** 上の「0%」は schema 混在だけが原因ではなく、
> `checkValueClaims` の **4 欠陥の複合**だった (コード実読で確定):
> ①県名アンカーの消費 —「東京都の**1人**当たり県民所得は5,204,000円」で先に「1人」を claim として
> 食い、lastIndex が進んで**本命の数値が一度も抽出されない** ②派生スキップの誤爆 — 指標名に含まれる
> 「当たり」で per-capita 系が全滅 ③閾値が 3 倍 — 1.9 倍の誤りが無言で通る ④flat 配列の
> `item.label` 未索引 — label 空 → 未知指標として全 claim を skip。
>
> 修正後の実測は **誤り 5 件中 5 件検出・誤検出 0** (修正前は 4 件中 1 件)。
> 抽出は「県名を先に全部拾い、数値を独立に走査して直前の県へ紐づける」方式に変えたので、
> ①のアンカー消費は構造的に起きない。検出力は
> `__tests__/article-factual-check.detection.test.mjs` が固定する
> (既存の `value.test.mjs` は全ケースが「警告 0 件 = 正」で**欠陥を保護していた**)。
>
> 残る課題は schema ではなく**分母つき単位の表記**。`per-100k` 系の指標なのに `unit` が「件」「人」と
> 素で書かれた data が 88 件中 12 件あり、実数と人口当たりの値が同次元で比較されて誤検出になる。
> 正典: `.claude/rules/unit-semantics-standards.md` §4。

**Phase B での migration**: `.claude/scripts/blog/migrate-data-schema.mjs` で flat / nested / timeseries → 統一 schema に一括変換。

## 1.5 ランキングチャートのデータ系譜 + カード型 (2026-06-20 確定) ★

ブログのランキングチャートは **「いつでも復元できる系譜」+「カード型固定」** を必須とする。
今日まで data JSON が R2 で SVG と名前ドリフトし再生成不能になっていた事故の根治策。

### 3点セット (1 ランキング = basename 共通の 3 ファイル)

| ファイル                                                | 役割                           | 必須 |
| ------------------------------------------------------- | ------------------------------ | ---- |
| `data/<name>.source.json`                               | **出典 manifest**（復元用）    | ✅   |
| `data/<name>.json`                                      | 型付きデータ（§1 統一 schema） | ✅   |
| `data/<name>.svg`（横長）+ `data/<name>-ig.svg`（縦長） | データから決定的生成           | ✅   |

- **永続SSOT = R2 `app/blog/<slug>/data/`**（作業中は docs/21、公開後は R2 のみ）。3点とも R2 に残す。
- **basename はドリフトさせない**。SVG は必ず data JSON から再生成し、SVG だけ改名しない。

### 出典 manifest の schema（SSOT配慮: e-Stat 生 param を複製しない）

データの真実源は **metric config (git TS) → e-Stat → R2 `app/ranking`/`app/stats`**。manifest はそこを**参照**するだけにし、生 param を blog 側に複製して二重 SSOT を作らない。

```jsonc
// ranking 由来（大多数）— rankingKey を参照、生paramは持たない
{ "kind": "ranking", "rankingKey": "<key>", "year": "2020", "unit": "％", "label": "...",
  "transform": "all47 (svg-builder が上位5+下位5を抽出)",
  "source": "r2:app/ranking/<key>/values.json",
  "restore": "node .claude/scripts/blog/fetch-ranking-data-r2.mjs --slug <slug> --keys <key> --data-name <name>" }

// metric 化していない e-Stat 直叩き — ここで初めて statsDataId + params を保存
{ "kind": "estat", "statsDataId": "0003448237", "params": {…}, "year": "2023", "transform": "top5+bottom5" }

// 手動/外部 — データ自体が唯一の源
{ "kind": "manual", "source": "総務省 決算カード 2022 (URL)" }
```

### source.json の `kind` 語彙 + 「再取得できるか」の機械検査 (2026-07-29)

`kind` は当初 `ranking` / `estat` / `manual` の 3 種として書かれていたが、**実装は 14 種まで増えていた**
（2026-07-29 に公開済み 898 件を実測）。ドリフトを止めるため、語彙と「再取得に必要なフィールド」の
正典を **`.claude/scripts/lib/chart-provenance.mjs` の `CHART_SOURCE_KIND_SPECS`** に置き、
**未知の kind は error** にする。新しい kind を足すときは共有定義も更新する。公開前の
`quality-gate.mjs` と定期監査 `audit-chart-provenance.mjs` はこの純粋関数を共用し、
片方だけ判定が緩むドリフトを防ぐ。

| kind                                                | 再取得の手掛かり                            | 件数 (2026-07-29) |
| --------------------------------------------------- | ------------------------------------------- | ----------------- |
| `ranking`                                           | `rankingKey` + `year`                       | 649               |
| `estat`                                             | `statsDataId`                               | 58                |
| `scatter`                                           | `xKey` + `yKey` + `year`                    | 36                |
| `derived`                                           | `source` (`r2:...`)                         | 60                |
| `manual`                                            | `source` または `url`                       | 11                |
| `correlation`                                       | `source` (`r2:app/correlation/...`)         | 5                 |
| `calculated`                                        | `inputs[].rankingKey` + `formula`           | 3                 |
| `composite`                                         | `xMetric.rankingKey` + `yMetric.rankingKey` | 1                 |
| `ranking-pair` / `ranking-join` / `derived-scatter` | `source` / `x*RankingKey` / `rankingKeys[]` | 各 1              |
| **`authored`**                                      | **なし（対象外）**                          | 65                |
| `bar` / `line`                                      | `incomplete: true` = 出自不明の暫定         | 7                 |

- **`authored` は欠陥ではない**。記事本文由来の要点テキスト等は **SSOT 指標ではなく data json 自体が真実源**で、
  SSOT から再取得できないのが正しい。「復元不能」と混同して SSOT から作り直すと**捏造**になる。
- **複数キーを 1 文字列に連結する規約がある**（`"a + b"` / `"a|b"`、`transform` に式を併記）。
  実在確認するときは分解する（分解しないと必ず 404 になり誤検知する。2026-07-29 に実際に 2 件出した）。

**検査 (`audit-chart-provenance.mjs`)**: kind ごとに必要な参照があるか、参照先 rankingKey が R2 に実在するか、
`NEXT_PUBLIC_ESTAT_APP_ID` がある CI では statsDataId が e-Stat API に実在するかを見る（最大3回再試行）。
存在検査（quality-gate の系譜 gate）では「**存在するが復元できない**」を捕まえられないため別に要る。
日次 cron (`blog-remediation-daily.yml`) に**縮小専用ラチェット**付きで配線済み — 欠陥が前回より増えたら失敗する。
実測ベースライン: restorable 804 / out-of-scope 65 / 欠陥 29（参照なし 18 + 自己申告 incomplete 11）。
最新値は `.claude/state/blog/chart-provenance-LATEST.md` が正典。

散布図は追加で `lintScatterData` が、有限数の x/y、都道府県識別子の一意性、原則47点、
秘匿値等を除外する場合の `excludedAreas` + `exclusionReason` + `expectedPointCount` の整合、
`kind: calculated` の計算式を blocker として検査する。`lintScatterParity` は data JSON の
有効点数と SVG の描画点数を一致させる。公開後も日次 cron が全散布図を JSON から再生成して
SVG の byte 一致を要求し、既知の復元対象7件は ranking / e-Stat / 観光庁原表から点集合を
再計算して公開 JSON と照合する。監査は読み取り専用で、差異・取得失敗とも fail-closed。

> `.source.json` は **観測値ではない**ので、`article-factual-check.mjs` / `quality-gate.mjs` の ground truth 索引と `generate-article-charts.ts` のチャート生成からは除外する（実装済: `endsWith(".source.json")` ガード）。

### カード型は2レイアウト・上位5下位5 固定

ランキングは **上位5+下位5 のカード型のみ**（10件は廃止）。1 データから2バリアントを出力:

| 出力                                   | layout                                  | 用途                      | viewBox            |
| -------------------------------------- | --------------------------------------- | ------------------------- | ------------------ |
| `<name>.svg`（article.md が参照）      | `columns`（横長2列・上位左/下位右）     | ブログ本文 + X            | `960×404`          |
| `<name>-ig.svg`（SNS専用・未埋め込み） | `portrait`（縦長スタック・上位5↓下位5） | Instagram フィード/リール | `1080×1350`（4:5） |

実装: `fetch-ranking-data-r2.mjs`（取得 + manifest）→ `generate-article-charts.ts`（2レイアウト生成、`packages/svg-builder` の `generateBarChartSvg` `layout:"columns"|"portrait"`）。
カード型カタログの SSoT は `.claude/rules/blog-svg-chart-standards.md`。

**既存記事の一括再生成**: `.claude/scripts/blog/regenerate-ranking-cards.mjs`。全公開記事を triage（tractable=1ランキング+key解決可 / ambiguous=複数or key無 / no-ranking）し、tractable を SSOT から横長+縦長へ再生成（dry-run=staging `.local/regen-staging`、R2 push はしない）。before/after ギャラリー `/tmp/regen-cards-gallery.html` を出力。R2 反映は別途 `diff-push-r2` で行う。

> **2つの一括再生成の使い分け（混在防止）**: ランキングの是正は **`regenerate-ranking-cards.mjs`**（SSOT=R2 app/ranking から**再取得**して manifest 付きで横長+縦長を作る。データが R2 に無い記事でも復元できる）が正典。`regenerate-blog-svgs.yml`（CI）は **既存 `data/*.json` を入力に全チャート種を再描画**する用途で、ソース JSON が R2 に残っていない記事のランキングは再生成できない（→ `regenerate-ranking-cards.mjs` を使う）。

## 1.6 タイルマップ（choropleth）のデータ系譜 + デザイン（2026-06-20 確定） ★

タイルマップもランキングと**同じ SSOT データフロー**に統一する。**SVG からの値の逆復元は禁止**（必ず SSOT から取得し、既存 SVG は metric 照合にのみ使う）。

### デザイン（`packages/svg-builder/src/charts/choropleth.ts` が SSoT）

- サイズ **720×720 固定（正方形）**（2026-07-31 改訂。780×560 → 720×720。それ以前は 600×700）。記事内は `md:max-w-2xl`=672px 幅の `<img>` として描画されるため、**画面上の高さは `672 × H/W` で決まる**。780×560 は記事の占有高さこそ小さいが、その分**地図が小さくなり県名と値が読めなかった**（2026-07-31 の指摘）。正方形にして**地図を最大化**し、47 タイル（14×16 の縦長格子）の周りに余る**左上と右下**を情報に使う。
- **背景を敷かない（透過）+ テーマ非依存の配色**。サイトのテーマは next-themes の class 方式で `enableSystem={false}`（OS の `prefers-color-scheme` を意図的に無視）だが、`<img>` 内の SVG から親の `.dark` class は見えない。SVG 側が OS に追従すると **OS ダーク + サイトライトで SVG だけ濃紺の箱**になる。透過 + 固定配色ならライト/ダーク双方で成立する（gate = `lintTileGridQuality`、正典 `blog-svg-chart-standards.md` §3 / §6-2）。
- **左上の余白**にタイトル（長ければ折返し）・サブタイトル・**上位 3 県**（色チップ + 県名（「宮崎県」まで） + 値と単位）。値は**左カラムの右端ではなく県名の実幅**で決めた位置に右揃えする（右端に飛ばすと「東京都 …… 9,320」と離れて 1 行として読めない）。地図だけでは読めない実数値をここで出す。値の大小を機械的に並べるだけで、指標の良し悪しは判断しない。**下位 3 県は出さない**（地図を最大化した分スペースが減り、上位だけの方が読みやすい）。見出し（「多い順」等）も置かず「1. 宮崎県」の形で並べる。
- **タイル内は「県名 + 値」の 2 行**（`showValue` の既定は **true**）。地図を大きくした目的が
  「県名と値を読めるようにする」ことなので、既定で値を出さないと目的を果たさない
  （2026-07-31 の再生成で値が 1 枚も入っていなかった）。
- **字の大きさは 1 マスタイルで 1 度だけ決め、全タイル共通にする**。タイルの実寸から個別に
  決めると 2 マス幅・2 マス高（北海道・兵庫・岐阜・千葉…）だけ 2 倍以上大きくなり、
  地図が騒がしくなる（実測 23px vs 11px）。**どの県も同じ重みで並べる図**なので、
  字の大きさが県によって変わると意味が生じてしまう。1 マスに収まらない長い名前だけそのタイルで縮める。
- **タイル内の表示名はコードから決定的に作る**（呼び元の `name` を使わない）。実データは
  末尾の「県/府/都/道」を一律に落としていて **北海道が「北海」になっていた**。道だけは落とさない。
  `<title>` と `aria-label` は正式名称（「北海道」「神奈川県」）。
- タイル内テキストは **タイル色の相対輝度でインクを切り替える**（淡色タイル→濃紺 `#16243a` / 濃色タイル→白 `#f5f8fc`）+ 縁取り（`paint-order` stroke）。**2026-07-31 改訂**（旧: 単色白 + 縁取り。淡色タイルで県名と値が読めないという指摘を受けた。縁取りがあるため WCAG の文字対背景コントラストはそのまま当てはまらないが、地色との相対輝度で切り替えると淡色・濃色の両端で可読になる）。地図以外の文字は `#6e7d94`（白地 4.18:1 / 濃紺地 4.27:1。ライト・ダーク双方で 4.5:1 を満たす単色は存在せず最良 4.22:1 なので、両者の最小値を最大化する近傍から選んでいる）。
- **凡例は地図ブロックの右下**（2026-07-29〜。左上は上位/下位リストが使うため）。端ラベル既定は**「低い/高い」+ 実数値スケール（最小・中間・最大）**。目盛りラベルは**単位が長いと重なる**ため、フォントを 10→8 まで縮め、それでも収まらなければ中間ラベルを落とす（実測: `5,802,432百万円` の 3 ラベルが完全に重なった）。「安全/危険」等の**意味的ラベルは指標の意味が確実な場合に json `legendLabels` で明示したときのみ**（旧デフォルト 安全/危険 が消費支出額等に焼き込まれた事故の再発防止。gate = `lintChoroplethLegend`）。
- **タイル座標は格子（列・行・スパン）で持つ**。実測でピッチ 38.167 / 原点 (33,45) の完全な均等格子と確認できたため、47 行の px ベタ書きを `TILE_GRID` に置き換えた。タイルサイズの変更は `TILE` と `GAP` の 2 定数で済む。
- **カラーは D3 カラースキーム指定可**: `scheme`（d3-scale-chromatic の `interpolate<Name>`。例 `Blues`/`Viridis`/`RdYlGn`/`RdBu`/`Spectral`/`YlOrRd`…連続・発散とも）。未指定時は既定 Reds。`reverse` で反転。
- 値表示は `showValue`（県名のみ=既定 / 県名+値）。

### データ取得ルール（SSOT・捏造禁止）

- 地図データの真実源は **R2 `app/ranking/<key>/values.json`**（= metric config → e-Stat → R2 派生。ランキングと同一）。
- `data/<name>-map.json`（型付き 47 県値）+ `data/<name>-map.source.json`（manifest: `kind:"ranking"`, `rankingKey`, `year`, `verifiedMatchRate`）の3点。author が `scheme` を JSON に指定可。
- `generate-article-charts.ts` が `*-map.json` を `generateChoroplethSvg` にディスパッチ（`data.scheme`/`reverse`/`showValue`/`legendLabels` を渡す）。

### 既存記事の一括再生成

`.claude/scripts/blog/regenerate-tile-maps.ts`（dry-run=staging `.local/regen-tilemaps` + gallery `/tmp/tilemap-gallery.html`、R2 push しない）。記事の `/ranking/<key>` 候補 × 各年の SSOT 値を**既存地図の表示値と照合**し metric+年を確定（一致率≥0.8）。確証できた地図のみ SSOT から再生成、**確証できない地図は flag**（個別に metric→key 特定が要る。捏造しない）。R2 反映は別途 `diff-push-r2`（ローカルは `push-r2-wrangler.ts app/blog --apply`、stage dir は事前にクリーンにする）。

照合は地図 title の日本語短縮単位（万/千/億/兆）を実値化して相対2%で判定する（`468万人` ↔ SSOT `4679280` を同値とみなす）。

> **★「千/万」がスケール接頭辞か単位の一部かは SSOT の unit でしか判別できない**（2026-08-11 実測）。
> `unit="人"` に対する表示 `468万人` の「万」はスケール短縮（×1e4 して比較する）だが、
> `unit="千円"` に対する `13,326千円` の「千」は**単位そのもの**で倍率 1。後者を ×1000 すると
> 全県が外れて一致率 0% になり、**値が完全一致しているのに「SSOT照合 失敗」**になる
> （savings-map で発覚。単位が千円/万円系の指標がすべて再生成不能だった）。判定は
> 「SSOT の unit がその短縮単位で始まるか」で行う。照合の純粋関数は
> `.claude/scripts/lib/map-value-match.mjs`（`parseDisplayValue` / `matchRate` / `parseMapDisplay`）に
> 切り出し、`__tests__/map-value-match.test.mjs` が両方向を固定している。記事リンクの key が AI 生成の命名ゆれで実在 key とズレている場合（例 `health-life-expectancy-male` ↔ 実在 `healthy-life-expectancy-male`、`activity-rate` ↔ `annual-participation-rate`）は、**`--mapping <json>`**（`{"<slug>/<base>": "<correctKey>"}`）を渡すと triage をスキップし correctKey の SSOT で照合・再生成する。correctKey は `app/ranking/<key>/values.json` が 200 で実在し、かつ照合一致したものだけ staging に出る（値が合わなければ flag = 記事本文と地図のズレ防止）。

旧地図SVGが県別 `<title>` 値を持たない古い形式（自動照合が空振りする）の場合は、mapping 値を `{"key":"<correctKey>","year":"<year>"}` 形式にすると、その年の SSOT で照合ゲートをスキップして生成する。**この trusted モードは年と記事本文の数値を事前に人/agent が突合していることが前提**（捏造防止）。生成された `source.json` には `verifiedMatchRate: 0` と `trusted`（記事本文照合済みの旨）が記録され、自動照合を通っていないことが追跡できる。`source.json` は観測値ではないため factual-check / quality-gate / チャート生成の対象外（§1.5）。

## 1.7 全SVGデータ系譜の整備・再発防止 (2026-06-20 確定) ★

ブログ SVG 612 枚の棚卸しで **56% (344枚) が元データ (`data/<name>.json`) を失い「絵だけ」= 再生成・出典追跡が
不能**と判明 (✅both 181/30% ・🟡jsonOnly 87/14% ・🔴neither 344/56%)。dark mode 未対応・デザイン不統一・
タイルマップ未救済の**根本原因**。「1枚ずつ個別救済」でなく、全記事のデータ系譜を体系的に揃える。

> **最新の実測 (2026-07-29)**: 417 記事 / SVG 1045 枚 → ✅both **898 (86%)** ・🟡jsonOnly 11 (1%) ・
> 🔴neither **136 (13%)**。gate 導入以降の新規記事で系譜喪失は発生していない (残る 136 は gate 前の負債)。
> 最新値は `.claude/state/blog/svg-lineage-LATEST.md` が正典 — **この段落の数字を真実源にしない**。

### 再発防止 (新規記事で元データ消失を構造的に不可能にする)

- **gate** (`quality-gate.mjs`): 各 `data/*.svg` に対応する `.json`+`.source.json` の欠落を検出 (§1.5 の3点セット)。
  **2026-06-20 に blocker へ昇格済** (当初は warning で段階導入したが復元体制が整い昇格)。公開記事で3点セットを強制し、
  SVG だけ残る状態を止める。**既存負債を再公開する記事は SSOT から復元 (backfill/ssot-restore) してから公開すること**
  (復元不能=SSOTに無いデータに依存する図は、図を外すか記事を再設計する。逆復元・捏造で gate を通さない)。
- **生成保証 (実装済 2026-06-20・徹底の核心)**: `generate-article-charts.ts` が SVG を書くたびに `source.json` を
  **セット出力**する (`writeChartSourceIfMissing`、既存の確定版は尊重)。全チャート種 (bar/tile-grid/line/scatter/summary)
  で「**1画像=1設定ファイル**」を generator レベルで保証し、SVG だけ書いて source.json を書かない経路を構造的に塞ぐ。
  `fetch-ranking-data-r2.mjs` は SSOT 確定版 (rankingKey 確定) を出力。**復元 (backfill) は過去負債の処理であり、
  新規は発生源で防ぐのが先決** (場当たりに「絵だけ」を作らない)。
- **outbox 掃除の安全装置 (2026-07-29 追加)**: `prune-published-outbox.mjs` は article.md の内容一致だけでなく
  **「ローカルにあるファイルが全て R2 に載っているか」**を確認してから `docs/21` を削除する。
  data/_.json・_.source.json は**ローカルにしか無い場合がある**（実例: `library-museum-cultural-capital` は
  ローカルに json+source があるのに R2 は svg のみ 404）。article.md だけ見て消すと元データが永久に失われるため、
  R2 に無いものが 1 つでもあれば保持する（保持側の誤りは翌日また判定されるので無害、削除側の誤りは不可逆）。
- **定期棚卸し + ラチェット (2026-07-29 配線)**: `blog-remediation-daily.yml` (日次 JST 08:00) が
  `build-lineage-queue.mjs` を実行して queue を develop へ commit-back し、**元データ消失 (`byStatus.neither`) が
  前回より増えたら workflow を失敗させる**（縮小専用ラチェット）。
  **なぜ cron が要るか**: 公開時 gate は _ローカル outbox_ を見るだけで、しかも公開時にしか発火しない。
  gate 導入 (2026-06-20) より前に公開された記事の系譜喪失は誰も検知せず、2026-07-29 にタイルマップを
  再生成しようとして初めて 12 枚が復元不能と判明した（該当 11 記事の公開日は全て 2026-03〜06-07 = gate 導入前）。
  定期棚卸しが無いと「gate は効いているのに負債が見えない」状態が続く。

### ★「SSOT に無い」と「復元不能」を混同しない (2026-07-29 の誤判断)

合成スコア (単位「点」) や増減率・差分は **SSOT から再構成できる**。`app/ranking/<key>` に
単一 key で見つからないだけで、複数指標を e-Stat から取って計算した派生値だからである。
正しい記録先は `kind: "calculated"` (`inputs[].rankingKey` + `year` + `formula`) または
`kind: "derived"` (`source` + 算出の説明) で、これがあれば data json は再計算できる。

2026-07-29 に「独自スコアと増減率は原理的に復元不能」と判断したが**誤り**だった。
オーナーの指摘で是正した。実際に詰めると律速は別のところにあった:

- `per-capita-income-gap/income-growth-ranking` は「県民所得 対前年増加率 2021年度」で、
  記事本文に算出方法が書かれており 2 年差と特定できた
- だが **SSOT に 2021 年が無い**。県民所得は年代で別 key に分割されており
  (`per-capita-prefectural-income-h27` = 2020 のみ / `per-capita-kenmin-shotoku-h23` = 2010-2018)、
  どの key にも 2021 が無い

**律速は復元手法ではなく SSOT の年・指標カバレッジ**である。元データは e-Stat なので、
足りない年は **e-Stat から取り込んで SSOT を伸ばせばよい** (`data-ingester` の領域)。
「SSOT に無い」を「復元不能」と読み替えて諦めない。

ゼロ (元データ消失 0) への経路は 4 つで、いずれも実行可能:

1. **抽出器の追加** — scatter (2 軸あるので単一軸より特定精度が高い) / line / findings
2. **指紋照合の改良** — 単位族の判定・候補数 (`find-chart-metric.mjs`)
3. **SSOT の拡張** — e-Stat から不足年・不足指標を取り込む
4. **記事の改変** — 上記で届かない図は外すか、SSOT にある図に差し替える (下記「再発防止」の既存方針)

4 があるので**ゼロは必ず到達できる**。「復元できないから残す」は選択肢ではない。

### 復元 (既存の欠落を SSOT から揃える)

真実源 = `.claude/state/blog/svg-lineage-queue.json` (`build-lineage-queue.mjs` が R2 棚卸しで生成、人間用は
`svg-lineage-LATEST.md`)。各 SVG に `restoreMethod` を割り当て、軽い順に消化する:

| restoreMethod      | 枚数 | 手法                                                                                                                                                                            |
| ------------------ | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `source-backfill`  | 87   | 既存 json を SSOT に対応付け → `source.json` 後付け (`backfill-source.mjs`、再生成不要・最軽)。json の値を SSOT照合・埋め込み rankingKey 優先。県キーは areaName/pref/name 対応 |
| `ssot-restore`     | 99   | ranking/tilemap の元データ消失 → `regenerate-tile-maps.ts` / `regenerate-ranking-cards.mjs` で SSOT復元                                                                         |
| `ssot-restore-new` | 169  | scatter/line/findings の元データ消失 → 復元手法 (SSOT照合) の新規実装が要る                                                                                                     |
| `manual`           | 76   | 無意味名 (`inline-chart-N`) ・型不明 → 個別手当て                                                                                                                               |

**復元は SSOT (`app/ranking`) から行う (SVG の絵から逆復元しない、§1.6)。** 値が記事本文と一致するか自己検算
(タイルマップの trusted/Derived 手法) して捏造を防ぐ。担当 = `chart-author` agent (データ系譜の整備・復元責務)。

## 2. Wave 命名規則

Blog の brushup 施策は **wave 単位** で記録・追跡する。wave は「同一目的・同一日付・同一手法」でまとめた施策のセット。

### Wave ID フォーマット

```
YYYY-MM-DD-<method>[-<batch>]
```

- `method`: `manual` (人手), `auto` (一括リライト = `/brushup-blog --target batch`), `mixed` (両方)
- `batch`: 同一日に複数 wave を実行した場合の連番 (optional)

例:

- `2026-05-23-manual` — 2026-05-23 に手動で 10 記事 (BLOG-WAVE-2026-05-23-manual section)
- `2026-05-25-auto` — 2026-05-25 に一括リライト (当時の自動 batch スキル、現 `/brushup-blog --target batch`) で 54 記事 (BLOG-WAVE-2026-05-25-auto section)
- `2026-06-15-auto-1` / `2026-06-15-auto-2` — 同日 2 波の場合

### Wave に紐づくデータ

| 場所                                                | 内容                                                                  |
| --------------------------------------------------- | --------------------------------------------------------------------- |
| `.claude/todo/04_改善バックログ.md` の section heading | `## [BLOG-WAVE-<wave_id>] <title> (旧ID: <BLOG-CTR-*>)`               |
| section frontmatter                                 | `wave_id`, `legacy_section_ids`, `predecessor_wave`, `successor_wave` |
| `.claude/state/blog/auto-brushup-history.json`      | 各 entry に `wave_id` フィールド (2026-05-27 migration 済)            |
| commit message                                      | 必須ではない (過去 commit の履歴改変を避けるため)                     |

### Predecessor / Successor

複数 wave が **同じ slug を再上書き** した場合は対応関係を明示:

- `predecessor_wave`: 自分より前に同 slug を改修した wave
- `successor_wave`: 自分より後に同 slug を再上書きした wave

**純粋効果分離が不能** な記事は section の「純粋効果分離の限界」note で明示。判定対象から除外。

## 3. Skill ↔ Docs ↔ Memory map

施策フェーズごとの対応関係。stale 防止のため定期的に確認 (週次 review 時など)。

### Skill (実装)

| Skill                                                 | 役割                                                                                                                                                                                                     | 関連 script                                                                             |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `/brushup-blog`                                       | リライトの唯一エンジン。`--target priority` (キュー) / `--target article` (1 記事、CTR-reframe 既定。エキスパート視点追加は対話実行のみ NotebookLM) / `--target batch` (ユーザー指示時の一括、cron なし) | `.claude/scripts/blog/{select-brushup-candidates,quality-gate}.mjs`, `lint-article.cjs` |
| `/publish-article`                                    | draft → publish (factual gate あり)                                                                                                                                                                      | `.claude/scripts/lib/article-factual-check.mjs`                                         |
| `/draft-from-trend`                                   | trend → 新規 draft 生成                                                                                                                                                                                  | `.claude/scripts/blog/{fetch-ranking-data-r2,generate-article-charts}.mjs`              |
| `/publish-bulk-articles`                              | 複数記事の bulk publish                                                                                                                                                                                  | factual gate 共有                                                                       |
| `measure-gsc-impact.mjs` (wave_id 駆動・2026-06-08〜) | due 到達 wave の before/after を週次 GSC で自動 diff → `improvement-log.md` の `## [BLOG-WAVE-<id>]` upsert。`fetch-metrics-weekly.yml` cron に配線済 (delta 提示まで・status 確定は weekly-review)      | `measure-gsc-impact.mjs`                                                                |
| `/analyze-winning-patterns`                           | 天井ループ: GSC実測×構造特徴で勝ち要因抽出 (順位交絡統制付き)。概念: `.claude/rules/blog-quality-standards.md` §継続品質ループ                                                                           | `.claude/scripts/blog/analyze-winning-patterns.mjs`                                     |

### Docs (人間向け真実源)

| Docs                                                                    | 内容                                               | 更新トリガ                     |
| ----------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------ |
| `.claude/todo/04_改善バックログ.md`                                        | wave section の真実源 (status / effect / 判定基準) | wave deploy 時 + effect 計測時 |
| `.claude/todo/03_今週の計画.md`                                            | 現在の週次 TODO                                    | 週次 (月曜・上書き)            |
| `.claude/skills/management/weekly-review/reference/reviews/YYYY-Www.md` | agent用週次振り返り                                | 週次 (日曜)                    |
| `.claude/todo/05_機能バックログ.md`                                        | 大規模 session の未完了機能・自動化を直接追記      | session 終了時                 |

### Memory (auto memory)

| Memory                                    | 内容                                                 | 更新タイミング             |
| ----------------------------------------- | ---------------------------------------------------- | -------------------------- |
| `project_blog_brushup_risk_2026_05_25.md` | brushup の FAIL/WARN リスクと factual-check 実装状態 | factual-check 検出力測定後 |
| `feedback_bulk_blog_publish_isr_404.md`   | bulk publish の ISR 404 リスク                       | 該当現象観測時             |
| `feedback_evidence_based_judgment`        | 実証ベース判定ルールの参照                           | 判定方針変更時             |
| `feedback_skill_schema_drift`             | SKILL.md と実 schema 乖離リスク                      | schema migration 時        |

### State (機械向け真実源)

| State                                          | 内容                                                                                                                                                                                                                                           | 書き込み箇所                                               |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `.claude/state/blog/remediation-queue.json`    | **品質是正キュー (状態付き)**。「次に何を直すか」の真実源。pending/in-progress/done + wave_id。GSC×品質 blocker の統合スコア。**正典: `.claude/rules/blog-remediation-loop.md`**                                                               | `build-remediation-queue.mjs` (build / --mark-\* / --next) |
| `.claude/state/blog/winning-patterns.json`     | **勝ち要因 (天井ループ)**。featureSignals (confidence付) + 順位交絡統制 (robust/confounded) + 記事別 conformance。build-remediation-queue が conformance を tiebreaker に読む。概念: `.claude/rules/blog-quality-standards.md` §継続品質ループ | `analyze-winning-patterns.mjs`                             |
| `.claude/state/blog/auto-brushup-history.json` | wave_id 駆動 source of truth (effect 計測の入力 + 是正キューの done シード)                                                                                                                                                                    | `/brushup-blog --target batch\|queue` 実行時               |
| `.claude/state/blog/auto-brushup-skipped.log`  | dedup でスキップした slug ログ                                                                                                                                                                                                                 | 同上                                                       |
| `.claude/state/blog/SHARED-failure-cases.md`   | F-001〜N の failure ledger                                                                                                                                                                                                                     | factual FAIL 検出時                                        |

## 4. 整理の判断指針 (次に同じ混乱が起きたとき)

セッション中に「設計・ドキュメント・メモリ・スキルが混乱している」と気付いたら、以下を確認:

1. **改善ログの section ID と auto-brushup-history.json の wave_id が一致しているか** (`jq '[.entries[].wave_id] | unique' .claude/state/blog/auto-brushup-history.json` で一覧)
2. **auto memory が実装と一致しているか** (個別 memory の `description` を読み、現状確認)
3. **SKILL.md が実装と乖離していないか** (`feedback_skill_schema_drift` の警告に該当しないか)
4. **改善ログの section が「単一施策 = 1 section」になっているか** (重複対応の場合は `predecessor_wave` / `successor_wave` で明示)

混乱の兆候:

- 同じ slug が複数 section に登場
- effect 計測時に「どの section の数字を更新すべきか不明」
- factual-check 実装と memory に乖離

→ 個別実装ではなく **整理 PR を先に切る** (Phase A 的な)。

## 関連

- 親 plan: `~/.claude/plans/recursive-purring-planet.md`
- Phase B (data schema 統一) で実装予定の migrate script: `.claude/scripts/blog/migrate-data-schema.mjs` (未着手)
- Phase C で実装予定の value detector: `.claude/scripts/lib/article-factual-check.mjs` の `checkValueClaims` (未実装、Phase B 前提)
- Phase D (wave 効果計測): `measure-gsc-impact.mjs` を wave_id 駆動化し `fetch-metrics-weekly.yml` cron に配線済 (2026-06-08)。SKILL 化はせず週次 cron で自動実行。正典: `.claude/rules/blog-remediation-loop.md`
