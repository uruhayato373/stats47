---
paths:
  - "packages/data-configs/src/theme-catalog/**"
  - "apps/web/src/{features/theme-dashboard,app/themes}/**"
  - ".claude/{skills/theme,scripts/themes,state/themes}/**"
  - ".claude/agents/theme-*.md"
---
# テーマ指標×チャート統合カタログ標準 (ThemeCatalog SSOT)

テーマページ (`/themes/<key>`) が「どの統計指標を、どのチャートで、なぜ表示するか」を管理する
**統合カタログ (ThemeCatalog) の単一ソース (SSOT)**。カタログを設計・編集・調査する agent
(`theme-researcher` / `theme-designer` / `theme-component-builder`) / 人間はこれに従う。

> **背景**: 従来はテーマの (a) 指標選定 = `packages/types/src/indicator-sets/<key>.ts` と
> (b) チャート定義 = `apps/web/scripts/data/page-components/theme/<key>.json` が独立編集され、
> 突合の仕組みが無くドリフト可能だった。選定根拠 (どの白書・調査に基づくか) の記録場所も無かった。
> 2026-07-04 に両者を 1 ファイルの `ThemeCatalog` に統合し、指標・チャート・選定根拠を一元管理する。
> 方式は `chart-component-standards.md` / `blog-quality-standards.md` と同じ「rules に規約 1 ファイル、
> agent/skill は参照のみ」パターン。

---

## 1. SSOT と生成物 (どれを編集し、どれが自動生成か)

| 層                      | 場所                                                                  | 役割                                                                   |
| ----------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **SSOT**                | `packages/data-configs/src/theme-catalog/<key>.ts` (`ThemeCatalog`)   | 指標選定 + チャート割当 + 選定根拠 (selection)。**ここだけを編集する** |
| SSOT (expanded 由来の selection) | `packages/data-configs/src/theme-catalog/selection-evidence.ts` | `expanded.ts` の tuple で定義された指標の selection (§4「置き場」)。backfill writer が再生成 |
| 登録簿                  | `packages/data-configs/src/theme-catalog/index.ts` (`THEME_CATALOGS`) | カタログ駆動テーマの入口。ここに登録されたテーマだけ生成対象           |
| 型                      | `packages/data-configs/src/theme-catalog/types.ts`                    | `ThemeCatalog` / `CatalogMetric` / `CatalogChart` / `MetricSelection`  |
| **生成物** (手編集禁止) | `packages/types/src/indicator-sets/<key>.ts`                          | IndicatorSet codegen (`// AUTO-GENERATED — DO NOT EDIT`)               |
| **生成物** (手編集禁止) | `apps/web/scripts/data/page-components/theme/<key>.json`              | page-components (R2 verbatim export 用・byte 一致)                     |

```
ThemeCatalog (SSOT, git TS)
  │  npm run generate:catalog --workspace=@stats47/data-configs
  ├─▶ packages/types/src/indicator-sets/<key>.ts        (IndicatorSet codegen)
  └─▶ apps/web/scripts/data/page-components/theme/<key>.json
        │  export-page-components-snapshot.ts (無変更)
        └─▶ R2 app/page-components/theme/<key>.json → 本番テーマページが読む (完全DBレス)
```

- 登録テーマの一覧は `THEME_CATALOGS` が正典。登録テーマの生成物を直接編集しない。
- bespoke / 未登録 route をカタログ化する場合は catalog TS 作成と registry 登録を同じ変更で行い、golden diff を確認する。

---

## 2. 編集フロー (カタログ駆動テーマ)

```
1. packages/data-configs/src/theme-catalog/<key>.ts を編集 (指標追加・チャート変更・selection 記入)
2. npm run generate:catalog  --workspace=@stats47/data-configs   # 生成物を再生成
3. npm run validate:catalog  --workspace=@stats47/data-configs   # 整合チェック
4. npx tsc --noEmit -p apps/web/tsconfig.json                    # 型 (componentProps / drift guard)
5. commit (SSOT + 生成物を同時に)。生成物だけを手編集しない
```

- 生成物 (`indicator-sets/<key>.ts` / `page-components/theme/<key>.json`) を**手で編集してはならない**。
  `npm run preflight:pr` (push 前) + develop-quality-gate の catalog-gates + CI (`pr-quality-check.yml` の Theme Catalog Gate) が
  `--check` diff で手編集・生成忘れを両方向検知する (2026-09-18 に pre-commit から移動)。
- R2 反映は既存フロー (`/sync-snapshots --only page-components` 相当 → `export-page-components-snapshot.ts`) のまま。
  カタログ由来で実データ (JSON byte) が変わったときだけ R2 push が要る。

---

## 3. チャート選定文法 (データ形状 → componentType)

**テーマページ (`/themes/*`) は `ThemeDbChartRenderer`**
(`apps/web/src/features/theme-dashboard/`) で描画される。これは stat-charts の `DashboardComponentRenderer`
(area 系ページ) とは**別 renderer・別型集合**なので注意 (area の bar-chart/sunburst/radar 等は
テーマページでは描画されない)。テーマで有効な componentType は下表の 9 種のみ。チャート型の正典は
`ThemeDbChartComponentProps` (`theme-chart-props.ts`) + 非チャート 3 種。drift は
`theme-chart-props.ts` 末尾の drift guard 型 (`_ThemeChartTypeDriftGuard`) が type-check で検知する。

| 見せたいこと (データ形状)             | componentType       | 補足                                                     |
| ------------------------------------- | ------------------- | -------------------------------------------------------- |
| 1 指標の単一値 (最新値の強調)         | `kpi-card`          | KPI カード (非チャート)                                  |
| 時系列の推移・2 指標の乖離            | `line-chart`        | 折れ線。`seriesRefs`/`labels`/`seriesColors`              |
| 棒 + 折れ線の二軸                     | `mixed-chart`       | 左 Y=棒 / 右 Y=折れ線                                    |
| 構成比 (内訳・その他算出・trend タブ) | `composition-chart` | `seriesRefs` の型付き系列から構成比を算出                 |
| 単年の内訳円グラフ                    | `donut-chart`       | `topN` 指定可                                            |
| 消費者物価の指標プロファイル          | `cpi-profile`       | CPI 専用                                                 |
| 消費者物価のヒートマップ              | `cpi-heatmap`       | CPI 専用                                                 |
| 年齢構造 (男女×年齢階級)              | `pyramid-chart`     | 男女×年齢階級34本の `seriesRefs` を同じR2契約で読む       |
| 考察・解説テキスト / FAQ              | `markdown-section`  | 末尾フル幅。FAQ は `componentProps.displayMode="faq"`   |

FAQ の authored SSOT は `componentProps.markdown` に `### Q1: 質問` + 回答の組を記述し、必ず
`displayMode: "faq"` を付ける。generator が `items: [{question, answer}]` へ構造化して配信し、runtime は
Markdown 見出しを再解析しない。空回答・不正見出し・重複質問は `validate:catalog` で error とする。
通常の考察は `displayMode` を省略するか `"prose"` とし、FAQ 表示のために feature 側へ個別 parser を足さない。

- **色は必ず「意味 role」で指定する** (ページ間統一・生 hex 禁止。2026-08-13 の WP5 で 179 生色を role 化)。
  色キー (`seriesColors` / `lineColors` / `columnColors` / `colors` / `palette` / `color` / `fill` / `stroke`) には
  role 名を書く: 人口=`population` / 男=`male` / 女=`female` / 危険・死者=`danger` / 件数=`count` /
  改善=`improve` / 中立=`neutral` / 特殊=`special` / 多系列の追加色=`series-1`〜`series-12`。
  role→hex の正典は `packages/data-configs/src/theme-catalog/chart-color-role.ts`。生成器
  (`transform.chartToPageComponent`) が page-components 出力時に role→hex へ解決するので app 側 renderer は
  現状どおり hex を読む。生 hex を色キーに書くと validator `[raw-color]` が error にする
  (choropleth の連続・発散配色は別系統で `color-scheme-policy.ts` が正典・role 対象外)。
- **チャートの観測値参照は `StatSeriesRef` を使う**。line/donut/composition は `seriesRefs`、
  mixed は `columnSeriesRefs` / `lineSeriesRefs`、KPI は単一要素の `seriesRefs` とする。
  参照には `metricKey` と表示上必要な label/color role だけを置き、e-Stat filter・倍率・変換式・unitを複製しない。
  値、年、unit、欠測は全種別で `@stats47/stats-r2/readers` の同じpayload契約から解決する。
  生の `estatParams` / `statsDataId` / category filter は最終形では禁止し、validator・契約test・
  `check-web-estat-imports.cjs` が catalog と production runtime の再混入をCIで拒否する。
  依存ミラーは同じcollectorから全 `metricKey` を列挙し、週次live監査がR2上の存在、年、有限値、unit、
  `meta.areaCount`、recipe/config hashを全件検査する。47県未満はshape-gate SSOTと同じwarn-onlyだが、
  `meta.areaCount` と実際の地域数の不一致はerrorとする。
- **9 種以外のチャート表現が要るとき**は theme renderer 側 (`ThemeDbChartRenderer` /
  `ThemeDbChartComponentProps`) に型と描画を追加してから (chart-component-builder / theme-ui-manager)、
  `CATALOG_COMPONENT_TYPES` にも足す。カタログはあくまで既存の theme componentType の割当。

---

## 4. 指標の役割 (role) と選定根拠 (selection)

### role

| role        | 意味                                                                       | 目安件数 | 基準                                   |
| ----------- | -------------------------------------------------------------------------- | -------- | -------------------------------------- |
| `primary`   | テーマのヘッドライン。`tabIndicators` の先頭 = `defaultRankingKey`         | 1〜3     | 地域差大・時系列変化が劇的・検索需要高 |
| `secondary` | primary を補完する関連データ                                               | 3〜8     | 別の切り口・相関がある                 |
| `context`   | 背景情報。指標カードには出さず「全指標」セクションとランキングページで閲覧 | 制限なし | マニアックだが調べたい人に価値         |

> **role≠context = ページ上部の指標カード (ChartCard) 1 枚**。旧「指標タブ (1 指標 1 タブ)」の
> UI は廃止済みで、`tabIndicators` という名前だけが変換関数 (`to-theme-config.ts`) に残っている。
> **枚数は下のチャートとの重複を避けて絞る** — 同じ事実をカードとチャートで二度見せない
> (2026-08-04 に population-dynamics を 10 → 4 に削減した際の判断基準)。

### 指標名の 3 系統 (`shortLabel` / `readerLabel` / 正準 `title`) — 統合しない

同じ指標に 3 つの呼び名が並ぶが、**役割が違うので一本化しない**。

| 名前 | 持ち主 | 使う場所 | 何のために |
|---|---|---|---|
| `shortLabel` | ThemeCatalog の `CatalogMetric` (テーマごとに人が書く) | 指標カードのタイル・凡例・比較表 | **そのテーマの文脈で最短に識別する**。「所定内給与(男)」のように、同じテーマに並ぶ他の指標と区別できる最小の語 |
| `readerLabel` | metric config の導出規則 (`packages/data-configs/src/prominence`) | チャート見出し・散布図の軸・ページ横断の索引 | **文脈なしで読める平易な名詞句**。テーマを跨いで同じ指標が同じ呼び方になる |
| `title` | metric config (正準) | 指標ハブ `/ranking/<key>` の h1・出典表記 | 統計表と照合できる正式名 |

`shortLabel` をテーマ横断で共有させない (同じ指標でもテーマが違えば最短の区別語は変わる)。
逆に `readerLabel` をテーマごとに上書きしない (面ごとに呼び方が割れると読者が同定できない)。
狭い場所には `shortLabel`、広い場所には `readerLabel` と覚える。

### selection (選定根拠 — provenance)

新規に追加する `primary`/`secondary` 指標は `selection` を記入する (validator warn で促す)。

```ts
{ rankingKey: "...", shortLabel: "...", role: "primary",
  selection: {
    proposedBy: "ものづくり白書 2025",           // 提案元 (白書 / 調査 / 競合)
    sourceUrl: "https://www.meti.go.jp/report/...",// 出典 URL (evidence-based-judgment.md 準拠)
    surveyedAt: "2026-07-04",                      // 調査日
    rationale: "製造業の付加価値の地域偏在を示す主指標のため",
    adoptionCriteria: ["representativeness", "readerValue"], // 採用基準 (下記)
    readerQuestion: "この県のものづくりは全国でどの位置にあるか", // 指標1件に絞った読者の問い
    targetReaderOrDecision: "立地・進学先を検討する読者の比較材料", // 対象読者/支える意思決定
  } }
```

- **不採用にした候補は `rejectedCandidates` に残す** (`{ rankingKey, reason }`)。再調査の重複を防ぐ。
- 出典は URL + アクセス日を必須とする (`.claude/rules/evidence-based-judgment.md`)。推測で「白書由来」と書かない。
- **`adoptionCriteria` は採用基準の controlled vocabulary** (`ADOPTION_CRITERIA`、types.ts):
  `representativeness`(代表性) / `comparability`(比較可能性) / `complementarity`(補完性) /
  `dataQuality`(データ品質) / `readerValue`(読者への有用性)。**満たす基準だけを列挙する**
  (定型的に全項目を埋めない)。validator は空でも error にしない (`[no-adoption-criteria]` warn) —
  根拠不足なら記入せず採用を保留してよい。
- **`readerQuestion` / `targetReaderOrDecision` は任意**。section/evidenceTopics の問いより
  指標 1 件に絞った粒度で書く。読者向け本文にそのまま露出しない (内部の判断根拠)。

#### selection の置き場 (2026-09-16 新設 — 混在させない)

| 指標の定義場所 | selection を書く場所 |
|---|---|
| `<theme>.ts` の `metrics[]` にインライン (24 テーマ) | その metric の `selection` (従来どおり) |
| `expanded.ts` の spec tuple (31 テーマ) / 既存テーマ拡張 tuple (67 章) | `selection-evidence.ts` の `SELECTION_EVIDENCE[themeKey][rankingKey]` — tuple には欄が無い。`makeCatalog` / `extensionMetric` が定型文より優先して読む |

`selection-evidence.ts` は JSON 形式の TS で、`selection-backfill.mjs apply` が丸ごと再生成する (手書きも同じ形を保つ)。
どちらに書くかは writer が「`<theme>.ts` に rankingKey があるか」で機械判定する (`isInlineMetric`)。

#### 「一次資料で裏付けた」と主張する selection の機械検査 (adoptionCriteria あり = 主張)

validator が error にする: `[selection-code-mismatch]` (`#A03503` 等のコードが metric config の cdCat01 と不一致 —
adoptionCriteria の有無に関わらず) / `[selection-boilerplate]` (`SELECTION_BOILERPLATE_PHRASES` の定型文が残る) /
`[selection-source-required]` (https の sourceUrl と ISO 日付の surveyedAt が無い) / `[selection-criteria-all]` (5 基準全部)。
URL の到達性・引用の実在 (`evidenceQuote` が本文にあるか) は network が要るので validator では見ず、
backfill の gate (`.claude/scripts/themes/selection-backfill-core.mjs gateEntries`) が書き込み前に見る。
定型文で埋めるくらいなら未記入のまま残す (`[no-adoption-criteria]` warn は warning ratchet で減少専用)。
運用: skill `/backfill-theme-selection` (対話) / `run-selection-backfill.sh` (夜間無人)。

---

## 4.5 指標カードの編成 (`metricGroups`) — 2026-08-06 新設

テーマページ上部の「主要指標」は **1 グループ = 1 カード**で描く (生存指標 2 件以上 = 選択 UI 付き
切替パネル / 1 件 = 選択 UI の無いコンパクトカード / 0 件 = カードごと描かない。判定はカタログ定義件数
ではなく観測不足フィルタ後の実件数)。切替パネルの中は値付きタイルの横スクロール列で、**タイルのチェック
で折れ線に系列が重なる** (GA4 のスコアカードと GSC のチェックボックス折れ線の良いとこ取り)。1 ページに
複数カードが縦に並ぶ。

```ts
metricGroups: [
  {
    key: 'labor-market', // kebab・テーマ内一意 (React key / 計測ラベル)
    title: '労働市場の需給', // カード見出し
    rankingKeys: ['active-job-opening-ratio', 'unemployment-rate'], // ⊆ metrics・タイル順
    defaultCheckedKeys: ['active-job-opening-ratio', 'unemployment-rate'], // ⊆ rankingKeys・1 件以上
  },
];
```

### 編成の指針

- **1 グループ = 1 つの問いに答える束**にする。「賃金の水準」「労働市場の需給」のように、
  カードの見出しだけで何を比べているか分かる単位で切る。指標の多いテーマ
  (occupation-salary 39 件) は職種の系統でカードを分ける。
- **単位は 1 グループ 2 種まで** (Y 軸が左右 2 本しかないため。3 種以上は validator error)。
  単位が違う指標を同居させるのはむしろ推奨で、`有効求人倍率 (倍)` × `失業率 (％)` のような
  逆相関は 2 軸で重ねて初めて関係が読める。
- **`defaultCheckedKeys` は 3 件以内**が目安 (4 件以上は warn)。mount 時にその数だけ
  時系列を取りに行くので、初期表示のコストに直結する。**そのカードで最初に見せたい対比**を選ぶ。
- **全ての非 context 指標をどれかのグループに入れる** (未所属は `[group-orphan]` warn)。

### 横断比較

`ThemeComparisonSection` は既存の章の後で、`metricGroups.rankingKeys` と `tabIndicators` から
比較対象を導出する。専用の overview 指標リストは持たない。県の中央値・差分・指標切替地図には
同じ年次の有限な都道府県値だけを使い、全国・市区町村・別年を混ぜない。固定 `comparisonYear` を
尊重し、既存 `comparisonMap` の地図は重複表示しない。比較地図は県選択だけで、章の配置や既存
セレクタを置き換えない。誤読防止注記は公開 `RankingItem.annotation` / `description` を使う。

### 実行時の振る舞い (UI 側の約束)

| 状況                       | 描画                                                                                      |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| 単位 1 種                  | 単軸 (従来と同じ)                                                                         |
| 単位 2 種                  | 表示順で 1 個目の単位 = 左軸、2 個目 = 右軸。軸頭に単位ラベル                             |
| 右軸の指標だけを残した     | 左軸に戻る (目盛りだけの空軸を残さない)                                                   |
| 県選択 + チェック 1 本     | 実線 = その県 / 破線 = 全国 (従来どおり)                                                  |
| 県選択 + チェック 2 本以上 | 破線は出さない (系列が倍になって読めなくなる)                                             |
| 最後の 1 本                | 外せない (`aria-disabled` + 理由。系列ゼロの空カードを作らない)                           |
| 年表記が違う指標を同居     | **4 桁の年コードで突き合わせる** (ラベルではない)。x 軸ラベルは編成順で先に来た系列の表記 |

- **`%` と `％` は同じ単位**として 1 軸に載せる (正規化は `normalizeUnitForAxis`。
  全角半角の互換文字だけを畳み、`円` と `千円` は畳まない)。validator と UI が同じ関数を使う。
- **年 (暦年) と年度を同じカードに入れると、x 軸ラベルはどちらか一方の表記になる**。
  突合は年コードなので系列はずれないが、対象期間は厳密には一致しない。混ぜるかは編成側の判断
  (labor-wages の `最低賃金`(年度) × `大卒初任給`(年) は許容している)。
- 系列色はグループ内の定義順で固定 (`getChartColor(index)`)。他をチェックしても色は変わらない。
- KPI 採用の観測数に足りない指標 (`MIN_VALUES_FOR_KPI` 未満) はグループから自動で外れ、
  `defaultCheckedKeys` も生存キーに絞られる。全滅したグループはカードごと描かない。

### codegen を通らない

`metricGroups` は **generator (transform.ts) が読まない**。追加しても生成物
(`indicator-sets/<theme>.ts` / `page-components/theme/<theme>.json`) は byte 不変で、
app 側は server component が `THEME_CATALOGS` を直読みする。IndicatorSet は compare /
Remotion と共有する型なので、theme 固有の UI 都合を持ち込まない。

---

## 4.6 白書・統計の論点レンズ (`evidenceTopics`) — 2026-08-24 新設

白書・報告書を独立した第四 taxonomy にせず、Theme に従属する「データを読む問い」として管理する。
論点レンズと公式資料の正典は `theme-catalog/evidence-lenses.ts`、テーマごとの採択結果は
`ThemeCatalog.evidenceTopics` に置く。

```ts
evidenceTopics: [
  {
    key: 'facility-access',
    lensKey: 'regional-access',
    title: '教育・文化施設への地域アクセス',
    question: '施設の量とアクセス条件には、どのような地域差があるか。',
    summary: '白書の論点を都道府県データで確かめるための短い案内。',
    sourceKeys: ['mext-whitepaper-2024'],
    relatedRankingKeys: ['library-count-per-million'],
    relatedChartKeys: ['education-school-count-trend'],
    relatedThemeKeys: ['population-dynamics'],
    relatedArticleTagKeys: ['教育'],
  },
];
```

- `lensKey` は複数テーマで再利用できる安定した観点、`sourceKeys` は根拠資料である。白書名を lens にしない。
- NotebookLM は論点・図表候補を抽出する補助。採択には公式 HTTPS URL、資料の実在、関連 route の実在が必要。
- 1 topic = 1 問い。指標カードやチャートと同じ事実を再説明せず、関連ページへ進む理由を短く示す。
- 公開 URL は増やさない。`/themes/*` 内から既存 ranking / theme / tag へ接続し、`nav_surface=theme_evidence` で計測する。
- `relatedChartKeys` は同じ ThemeCatalog の実在 chart、ranking は active、theme は自己参照不可とする。
- generator は読まない。UI は `ThemeEvidenceTopicsSection` が ThemeCatalog を直読みする。

---

## 4.7 チャートの比較対象・可視化選定理由 (`comparisonBasis` / `visualizationRationale`) — 2026-09-15 新設

`CatalogChart` に監査・意味レビュー用の内部メタデータを持たせる。**どちらも読者向け UI には描画しない**
(componentType から説明文を自動生成しない、という既存禁止パターンと対になる内部フィールド)。

```ts
{ componentKey: '...', componentType: 'line-chart', /* ... */,
  comparisonBasis: '全国平均との差の時系列推移',       // 何と比べる可視化か (自由記述)
  visualizationRationale: '傾きの変化が焦点のため折れ線を選定', // なぜこの componentType/レイアウトか
}
```

- `comparisonBasis` は area-databook の `compareNationalAvg` (boolean) と役割は同じだが、テーマの
  チャートは比較対象が多様 (前年比・他都道府県・他指標との相関等) なため自由記述にする。
- `visualizationRationale` は admin のカタログ監査画面 (§8) だけが表示する。UI コンポーネントが
  このフィールドを読んで描画することは禁止 (機械検査は該当なし。レビュー時に grep で確認する)。
- どちらも省略可。単一指標の単純表示など比較や特筆すべき選定理由が無いチャートには書かない。

## 4.8 HARM 該当 (`harmRelevance`) — 2026-09-15 新設

テーマが読者のどの悩み・目標 (Health / Ambition / Relation / Money) に関係するかを、企画・テーマ側が
任意で記録する。**HARM の定義自体はここに複製しない** — 正本は Obsidian vault、配布版は
`.claude/shared-policy/POLICY.md`、stats47 固有の適用は `.claude/shared-policy/application.json`
(規約は `.claude/rules/shared-business-policy.md`)。

```ts
harmRelevance: [
  { axis: 'money', reason: '家計の可処分所得を比較し、家計や住まい選びの判断材料にする読者に関連する。' },
]
```

- **複数該当・該当なしを許容し、全テーマに強制しない**。分類だけの記録 (reason 空欄) は validator
  error で拒否する — 「該当するだけで収益性がある」と判断させないため。
- `/themes/*` は収益化より深掘り導線を優先する面 (`docs/00_プロジェクト管理/02_収益化戦略.md` §4)。
  ここでの分類は UI の広告枠を直接増減させない。admin のカタログ監査画面 (§8) が企画側の参照材料として表示する。
- テーマ名から読者の購入意図を決めつけない。reason には具体的な読者の悩み・意思決定を書く
  (POLICY.md の「判断の問い」に対応)。

---

## 5. validator (`npm run validate:catalog`)

決定的 lint `packages/data-configs/scripts/validate-theme-catalog.ts`。`preflight:pr` + develop-gate + CI に配線済み (pre-commit では走らない)。

| レベル                         | 検査                                                                                                                                                                                                                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **error**                      | metrics.rankingKey / relatedRankingKeys が METRICS_REGISTRY・metrics に不在 / `markdown-section` 以外で relatedRankingKeys が空 / componentType union 外 / componentKey **テーマ内**重複                                                                                                 |
| **error (chart editorial)**    | 旧 componentType 別の汎用 description、空 annotation、catalog と componentProps の annotation 二重定義                                                                                                                                                                                 |
| **error (metricGroups)**       | `[group-key]` rankingKeys が metrics に不在 / `[group-dup-key]`・`[group-dup-title]` テーマ内重複 / `[group-empty]` rankingKeys が空 / `[group-default]` defaultCheckedKeys が空 or rankingKeys 外 / **`[group-units]` グループ内の相異なる単位が 3 種以上** (Y 軸は左右 2 本しかない) |
| **error (鮮度)**               | `generate:catalog --check` — 生成物と SSOT の diff (手編集・生成忘れの両方向)                                                                                                                                                                                                          |
| **warn** (`--strict` で error) | selection 未記入 / componentKey **横断**共有 (複数ページ再利用は設計上許容) / primary がチャート未使用 (metrics[] の stat-card で描画) / sortOrder 重複 / 指標ハブ本文の定義・注釈が未整備                                                                                               |
| **warn (metricGroups)**        | `[group-default-many]` 初期チェック 4 件以上 (mount 時にその数だけ時系列を取りに行く) / `[group-large]` 系列候補 9 件以上 / `[group-orphan]` 非 context 指標がどのグループにも未所属                                                                                                   |
| **error (evidenceTopics)**     | source/lens 不在、key 重複、ranking 非実在・inactive、chart 非実在、theme 非実在・自己参照、tag/key 形式違反、公式 source が HTTPS でない                                                                                                                                              |
| **warn (evidenceTopics)**      | ranking/theme/tag の内部導線が 1 件もない                                                                                                                                                                                                                                              |
| **error (harmRelevance)**      | `[harm-axis]` axis が HARM_AXES 外 / `[harm-axis-dup]` 同一テーマ内で axis 重複 / `[harm-reason]` reason が空                                                                                                                                                                          |
| **error (chart selection meta)** | `[comparison-basis]` / `[visualization-rationale]` — 指定時に空文字                                                                                                                                                                                                                 |
| **warn (adoptionCriteria)**    | `[no-adoption-criteria]` primary/secondary で selection はあるが adoptionCriteria 未記入 (根拠不足なら記入せず保留してよい)                                                                                                                                                             |
| **error (adoptionCriteria)**   | `[adoption-criteria]` ADOPTION_CRITERIA 外の値                                                                                                                                                                                                                                        |
| **error (selection evidence)** | `[selection-code-mismatch]` 統計指標コードが metric config の cdCat01 と不一致 / `[selection-boilerplate]` adoptionCriteria 付きなのに定型文が残る / `[selection-source-required]` https sourceUrl・ISO surveyedAt が無い / `[selection-criteria-all]` 5 基準全部列挙 (§4「機械検査」・2026-09-16 新設) |
| **warn (chart-temporal-fit)**  | `[chart-temporal-fit]` line-chart が参照する指標の `years` が1年しかない (推移を描けない・チャート型の再検討候補。2026-09-15新設・実測13件・誤検知の余地が無い確実な不整合のみ検出するため warn のまま運用する)                                                                          |

---

## 6. 禁止事項

| NG                                                                                            | OK                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `indicator-sets/<key>.ts` や `page-components/theme/<key>.json` を手編集 (カタログ駆動テーマ) | カタログ TS を編集 → `generate:catalog`                                                                                                                                                                                             |
| カタログ外の componentType 文字列を使う                                                       | `CATALOG_COMPONENT_TYPES` の 18 種から選ぶ                                                                                                                                                                                          |
| 出典なしで selection.proposedBy に「白書」と書く                                              | sourceUrl + surveyedAt を併記 (evidence-based)                                                                                                                                                                                      |
| 実在しない rankingKey を metrics に入れる                                                     | METRICS_REGISTRY 実在キーのみ (validator が弾く)                                                                                                                                                                                    |
| `isActive:false` のキーを metrics / `relatedRankingKeys` に置く                               | isActive:true のキーのみ。inactive は `/ranking/<key>` が 410 か空ページになる (validator `[metric-inactive]` が error。2026-07-24 に `dwelling-per-floor-area` が `/themes/living-housing` で 410 を返していた)                |
| componentType だけから「確認できます」等の説明を生成する                                      | title・凡例・軸に委ね、誤読防止に不可欠な条件だけ `charts.annotation` に記述                                                                                                                                                        |
| 指標の定義・算出方法を Theme chart ごとに複製する                                             | `/ranking/[key]` を指標ハブとし、`relatedRankingKeys` で接続                                                                                                                                                                        |
| 未登録 route の JSON を暗黙に generator 対象へ混ぜる                                          | ThemeCatalog 作成と `THEME_CATALOGS` 登録を同じ変更で行う                                                                                                                                                                           |

---

## 7. 役割分担

| 工程                                                                | 担当                                                                |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 指標×チャート候補の**調査・提案** (白書/Web/競合/GSC)               | `theme-researcher` (app/config read-only、提案を `.claude/todo/backlog.md` へ) |
| 公式ダッシュボードの**問い・指標・可視化研究**                      | `theme-researcher` (`public-dashboard-catalog.json` を公式一次資料で保守) |
| 白書からの**論点レンズ候補抽出** (NotebookLM + 公式資料照合)        | `theme-researcher` (read-only、候補を theme-designer へ返す)        |
| 提案の**採否判断・カタログ設計** (role/チャート構成/evidenceTopics) | `theme-designer` (採択分を catalog TS 化)                           |
| チャート **componentProps 詳細化・監査**                            | `theme-component-builder` (`relatedChartKeys` との整合も確認)       |
| チャートコンポーネント自体の新設                                    | `chart-component-builder` (`chart-component-standards.md`)          |
| 観測値投入 (e-Stat → R2)                                            | `data-ingester`                                                     |
| e-Stat 実在検証                                                     | `estat-researcher`                                                  |
| R2 push                                                             | CI (`export-page-components-snapshot.ts`) / `r2-publisher`          |

---

## 8. カタログ情報の UI 描画対応 (テーマページ)

カタログの各情報がテーマページ (`/themes/*`) のどこに出るか (2026-07-04 完全描画化)。

| カタログ情報                                       | UI 描画先                                                                                                                                                              | 実装                                                                                              |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `metrics` (role≠context)                           | ページ上部の指標カード群のタイル (値 + 順位)。**チェックすると下の折れ線に系列が重なる**                                                                               | `to-theme-config.ts` の `tabIndicators` → `ThemeMetricsDashboard` → `MetricSwitcherPanel`         |
| **`metricGroups`**                                 | **1 グループ = 指標カード 1 枚**。1 ページに複数枚が縦に並ぶ。省略時は非 context 指標を 1 枚に倒す                                                                     | `ThemePageLayout` が `THEME_CATALOGS` を直読み → `ThemeDashboardClient` → `ThemeMetricsDashboard` |
| `metrics` (全 role・context 含む)                  | 左レールの折りたたみ「全指標」。狭幅は本文上部の同等 UI                                                                                                                | `ThemeSideNav` / `ThemePageLayout`                                                                |
| `metrics.selection` (adoptionCriteria/readerQuestion/targetReaderOrDecision 含む) | **UI 非表示**。採否・再調査用の内部 provenance として SSOT に保持。`/quality/catalog-audit` (§8.1) が読み取り専用表示 | —                                                                                                 |
| `charts.comparisonBasis` / `charts.visualizationRationale` | **UI 非表示**。監査・意味レビュー用の内部メタデータ。`/quality/catalog-audit` (§8.1) だけが表示                                                                       | —                                                                                                 |
| `harmRelevance`                                    | **UI 非表示**。企画側の参照材料。`/quality/catalog-audit` (§8.1) が読み取り専用表示                                                                                    | —                                                                                                 |
| `charts.componentProps`                            | チャート本体 (line/mixed/composition/donut/cpi/pyramid)                                                                                                                | `ThemeDbChartRenderer`                                                                            |
| `charts.annotation`                                | 系列断絶・母集団差・比較不能条件など、この可視化固有の誤読防止注釈                                                                                                     | generator → `componentProps.annotation` → `ChartFooter`                                           |
| `charts.sourceName` / `sourceLink`                 | チャートカード footer の出典                                                                                                                                            | `ChartFooter` (ThemeMetricsDashboard の ChartPanel footer)                                        |
| `charts.relatedRankingKeys`                        | `markdown-section` 以外で必須の指標ハブ導線。先頭を primary `rankingLink`、残りを `rankingLinks` へ決定生成                                                            | `catalogToPageComponentsJson` → `ChartFooter`                                                     |
| `charts.section`                                   | **テーマページでは未使用** (area ページの `AreaChartSection` のみ使用)                                                                                                 | —                                                                                                 |
| `keywords`                                         | `<meta>` / 構造化データ                                                                                                                                                | theme utils                                                                                       |
| `relatedArticleTagKeys`                            | 関連記事セクション + ネイティブアフィリ                                                                                                                                | `ThemeRelatedArticles`                                                                            |
| `evidenceTopics`                                   | **「白書・統計から見る論点」**。公式資料から ranking / theme / tag へ周遊                                                                                              | `ThemeEvidenceTopicsSection` (`nav_surface=theme_evidence`)                                       |
| `metrics` → 相関 (別途 R2)                          | **「このテーマと関連の深い指標」**。テーマ外の指標のうち、テーマ内指標と人口補正後の順位相関 \|r\|≥0.5 のもの最大 8 件。相関 workflow が `app/correlation/by-theme/<themeKey>.json` に事前計算 | `ThemeCorrelatedMetrics` (`nav_surface=theme_ranking`)                                            |
| `rejectedCandidates`                               | UI 非表示 (再調査防止の記録のみ)                                                                                                                                       | —                                                                                                 |
| (別途) EMBEDDED_SECTIONS                           | 埋め込み section。**半幅 2 カラム** = 人口移動フロー / 通勤フロー (ChartPanel 化・2026-08-04)、**全幅** = 駅乗降 / 高速道路 / 過疎×医療 / 日照。`hideMap` と独立に描画 | `THEME_SECTION_REGISTRY` + `HALF_WIDTH_SECTIONS`                                                  |
| (別途) 左レール                                    | `THEME_NAV_GROUPS` のグループ別テーマリンク + 地域 + 全指標 + 出典調査。992px 未満は本文上部のテーマ Select・ページ内クイックリンク等が代替                            | `ThemePageLayout` の `PageShell leftRail`                                                         |

> `hideMap: true` (全テーマ既定) は地図タブ UI (コロプレス/年度セレクタ) を隠すだけ。
> **page-components チャート・考察 (markdown)・埋め込み section は hideMap に関係なく描画する**
> (2026-07-04 に `cardsOnly` の付与をやめ完全ダッシュボード化。prop 自体は残存するので付けない)。
> カタログ無しテーマ (climate / local-finance) は
> IndicatorSet.metrics にフォールバック (selection なしで動く)。local-finance は bespoke ページ
> (`app/themes/local-finance/page.tsx`) に全指標セクションを個別追加。

## 8.1 管理画面 (`/quality/catalog-audit`) — 2026-09-15 新設

`apps/admin/app/quality/catalog-audit/page.tsx` で読み取り専用のカタログ完全性監査を表示する
(既存 `/quality` へ1行のキューサマリを追加。書き換え機能は追加しない)。表示内容:

- テーマ別: metrics 件数、selection/adoptionCriteria/readerQuestion の充足率、harmRelevance の有無
- validator (`validate-theme-catalog.ts`) の error/warn を種別ごとに集計、テーマ別の内訳
- HARM 該当テーマの一覧 (axis + reason。企画側の参照材料であり、UI の広告枠設定ではない)
- `visualizationRationale` 等の内部メタデータは値をそのまま表示してよい (読者向け UI には出ない
  ことが実装契約であり、admin は監査目的でこの内容を見る場所)

値は `THEME_CATALOGS` (git TS SSOT) と validator の再実行結果から都度算出し、別の台帳やキャッシュへ
複製しない。実装は `apps/admin/lib/server/catalog-audit.ts` が `validate-theme-catalog.ts` の
export 済み関数を再利用する (判定ロジックを admin 側へ複製しない)。

---

## 関連

- 型・SSOT: `packages/data-configs/src/theme-catalog/`
- generator: `packages/data-configs/scripts/generate-theme-catalog.ts`
- validator: `packages/data-configs/scripts/validate-theme-catalog.ts`
- drift guard: `apps/web/src/features/theme-dashboard/actions/theme-chart-props.ts` 末尾 (`_ThemeChartTypeDriftGuard`)
- 調査スキル: `.claude/skills/theme/research-theme-catalog/SKILL.md`
- 選定根拠の backfill: `.claude/skills/theme/backfill-theme-selection/SKILL.md` (夜間 driver `.claude/scripts/themes/run-selection-backfill.sh`)
- 公式ダッシュボード研究カタログ: `.claude/skills/theme/research-theme-catalog/reference/public-dashboard-catalog.json`
- 研究カタログ監査: `npm run theme:dashboard-catalog:test && npm run theme:dashboard-catalog:check`
- 調査 agent: `.claude/agents/theme-researcher.md`
- チャートコンポーネント: `.claude/rules/chart-component-standards.md`
- 情報設計 (テーマの責務): `docs/01_技術設計/03_情報設計.md`
- 完全DBレス: `docs/01_技術設計/02_データアーキテクチャ.md`


## 9. 問い別の章と継続監査

現行21テーマは `ThemeCatalog.sections` を持つ。`metricGroupKeys` / `chartKeys` /
`embeddedSectionKeys` が章内配置の正典で、ThemeDashboardTabbedが描画する。
未配置・未知参照・二重配置はvalidatorで停止。page-componentのsection文字列とは別の契約。
単年は比較表または数値で示し、複数年だけ推移にする。同じ指標のカードと詳細図は重複させない。

週次 `npm run theme:portfolio:audit` と既存live auditで実データ/構造を確認する。
月次は公式新年・定義・章の問いを見直し、採否根拠をselectionへ反映する。
年・分母・単位・地理範囲が異なる系列は、同一尺度として合算や比較をしない。
