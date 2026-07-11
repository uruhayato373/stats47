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

| 層 | 場所 | 役割 |
|---|---|---|
| **SSOT** | `packages/data-configs/src/theme-catalog/<key>.ts` (`ThemeCatalog`) | 指標選定 + チャート割当 + 選定根拠 (selection)。**ここだけを編集する** |
| 登録簿 | `packages/data-configs/src/theme-catalog/index.ts` (`THEME_CATALOGS`) | カタログ駆動テーマの入口。ここに登録されたテーマだけ生成対象 |
| 型 | `packages/data-configs/src/theme-catalog/types.ts` | `ThemeCatalog` / `CatalogMetric` / `CatalogChart` / `MetricSelection` |
| **生成物** (手編集禁止) | `packages/types/src/indicator-sets/<key>.ts` | IndicatorSet codegen (`// AUTO-GENERATED — DO NOT EDIT`) |
| **生成物** (手編集禁止) | `apps/web/scripts/data/page-components/theme/<key>.json` | page-components (R2 verbatim export 用・byte 一致) |

```
ThemeCatalog (SSOT, git TS)
  │  npm run generate:catalog --workspace=@stats47/data-configs
  ├─▶ packages/types/src/indicator-sets/<key>.ts        (IndicatorSet codegen)
  └─▶ apps/web/scripts/data/page-components/theme/<key>.json
        │  export-page-components-snapshot.ts (無変更)
        └─▶ R2 app/page-components/theme/<key>.json → 本番テーマページが読む (完全DBレス)
```

- **legacy 共存**: `THEME_CATALOGS` に未登録のテーマ (現在 manufacturing 以外) は従来どおり手編集の
  IndicatorSet TS + page-components JSON を SSOT とする。generator は触らない (golden diff ゼロ保証)。
- **横展開**: テーマ 1 件ずつ catalog TS を作り `THEME_CATALOGS` に登録 → golden diff (byte 一致) 確認 → commit。

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
  pre-commit + CI (`pr-quality-check.yml` の Theme Catalog Gate) が `--check` diff で手編集・生成忘れを両方向検知する。
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

| 見せたいこと (データ形状) | componentType | 補足 |
|---|---|---|
| 1 指標の単一値 (最新値の強調) | `kpi-card` | KPI カード (非チャート) |
| 時系列の推移・2 指標の乖離 | `line-chart` | 折れ線。`estatParams`/`labels`/`seriesColors` |
| 棒 + 折れ線の二軸 | `mixed-chart` | 左 Y=棒 / 右 Y=折れ線 |
| 構成比 (内訳・その他算出・trend タブ) | `composition-chart` | セグメント構成。`segments`/`statsDataId` |
| 単年の内訳円グラフ | `donut-chart` | `topN` 指定可 |
| 消費者物価の指標プロファイル | `cpi-profile` | CPI 専用 |
| 消費者物価のヒートマップ | `cpi-heatmap` | CPI 専用 |
| 年齢構造 (男女×年齢階級) | `pyramid-chart` | 人口ピラミッド (非チャート扱いで個別描画) |
| 考察・解説テキスト | `markdown-section` | 末尾フル幅の文章 (指標非紐付き・relatedRankingKeys 不要) |

- **色は必ず指定する** (ページ間統一。adapter デフォルトに頼らない)。予約色: 男=`#3b82f6` / 女=`#ec4899`。
  推奨: 危険/死者=`#ef4444` / 件数=`#f59e0b` / 改善率=`#22c55e` / 中立=`#6b7280` / 特殊=`#8b5cf6` / 人口=`#3b82f6`。
- **9 種以外のチャート表現が要るとき**は theme renderer 側 (`ThemeDbChartRenderer` /
  `ThemeDbChartComponentProps`) に型と描画を追加してから (chart-component-builder / theme-ui-manager)、
  `CATALOG_COMPONENT_TYPES` にも足す。カタログはあくまで既存の theme componentType の割当。

---

## 4. 指標の役割 (role) と選定根拠 (selection)

### role
| role | 意味 | 目安件数 | 基準 |
|---|---|---|---|
| `primary` | テーマのヘッドライン。`tabIndicators` の先頭タブ + stat-card として描画 | 1〜3 | 地域差大・時系列変化が劇的・検索需要高 |
| `secondary` | primary を補完する関連データ | 3〜8 | 別の切り口・相関がある |
| `context` | 背景情報。カードには出さずランキングページで閲覧 | 制限なし | マニアックだが調べたい人に価値 |

### selection (選定根拠 — provenance)
新規に追加する `primary`/`secondary` 指標は `selection` を記入する (validator warn で促す)。

```ts
{ rankingKey: "...", shortLabel: "...", role: "primary",
  selection: {
    proposedBy: "ものづくり白書 2025",           // 提案元 (白書 / 調査 / 競合)
    sourceUrl: "https://www.meti.go.jp/report/...",// 出典 URL (evidence-based-judgment.md 準拠)
    surveyedAt: "2026-07-04",                      // 調査日
    rationale: "製造業の付加価値の地域偏在を示す主指標のため",
  } }
```

- **不採用にした候補は `rejectedCandidates` に残す** (`{ rankingKey, reason }`)。再調査の重複を防ぐ。
- 出典は URL + アクセス日を必須とする (`.claude/rules/evidence-based-judgment.md`)。推測で「白書由来」と書かない。

---

## 5. validator (`npm run validate:catalog`)

決定的 lint `packages/data-configs/scripts/validate-theme-catalog.ts`。pre-commit + CI に配線済み。

| レベル | 検査 |
|---|---|
| **error** | metrics.rankingKey / relatedRankingKeys が METRICS_REGISTRY・metrics に不在 / componentType union 外 / componentKey **テーマ内**重複 |
| **error (鮮度)** | `generate:catalog --check` — 生成物と SSOT の diff (手編集・生成忘れの両方向) |
| **warn** (`--strict` で error) | selection 未記入 / componentKey **横断**共有 (複数ページ再利用は設計上許容) / primary がチャート未使用 (metrics[] の stat-card で描画) / sortOrder 重複 (描画は配列順で安定) |

---

## 6. 禁止事項

| NG | OK |
|---|---|
| `indicator-sets/<key>.ts` や `page-components/theme/<key>.json` を手編集 (カタログ駆動テーマ) | カタログ TS を編集 → `generate:catalog` |
| カタログ外の componentType 文字列を使う | `CATALOG_COMPONENT_TYPES` の 18 種から選ぶ |
| 出典なしで selection.proposedBy に「白書」と書く | sourceUrl + surveyedAt を併記 (evidence-based) |
| 実在しない rankingKey を metrics に入れる | METRICS_REGISTRY 実在キーのみ (validator が弾く) |
| legacy テーマの JSON をカタログ化せず generator 対象に混ぜる | `THEME_CATALOGS` 登録 = カタログ化と一体で行う |

---

## 7. 役割分担

| 工程 | 担当 |
|---|---|
| 指標×チャート候補の**調査・提案** (白書/Web/競合/GSC) | `theme-researcher` (read-only、提案を `docs/todo/03_指標バックログ.md` へ) |
| 提案の**採否判断・カタログ設計** (role/チャート構成) | `theme-designer` (採択分を catalog TS 化) |
| チャート **componentProps 詳細化・監査** | `theme-component-builder` |
| チャートコンポーネント自体の新設 | `chart-component-builder` (`chart-component-standards.md`) |
| 観測値投入 (e-Stat → R2) | `data-ingester` |
| e-Stat 実在検証 | `estat-researcher` |
| R2 push | CI (`export-page-components-snapshot.ts`) / `r2-publisher` |

---

## 8. カタログ情報の UI 描画対応 (テーマページ)

カタログの各情報がテーマページ (`/themes/*`) のどこに出るか (2026-07-04 完全描画化)。

| カタログ情報 | UI 描画先 | 実装 |
|---|---|---|
| `metrics` (role≠context) | 指標タブ (`tabIndicators`、1 指標 1 タブ) + KPI stat-card | `to-theme-config.ts` → `ThemeMetricsDashboard` |
| `metrics` (全 role・context 含む) + `selection` | **「このテーマの全指標」セクション** (role 別・`/ranking/<key>` リンク・選定根拠注記) | `ThemeIndicatorCatalogSection.tsx` |
| `charts.componentProps` | チャート本体 (line/mixed/composition/donut/cpi/pyramid) | `ThemeDbChartRenderer` |
| `charts.sourceName` / `sourceLink` / `rankingLink` | チャートカード footer (出典 + 「ランキングを見る」) | `ChartFooter` (ThemeMetricsDashboard の ChartPanel footer) |
| `charts.section` | **テーマページでは未使用** (area ページの `AreaChartSection` のみ使用) | — |
| `keywords` | `<meta>` / 構造化データ | theme utils |
| `relatedArticleTagKeys` | 関連記事セクション + ネイティブアフィリ | `ThemeRelatedArticles` |
| `rejectedCandidates` | UI 非表示 (再調査防止の記録のみ) | — |
| (別途) EMBEDDED_SECTIONS | GIS 埋め込み (移動フロー/駅乗降/高速道路/過疎×医療/日照)。`hideMap` と独立に描画 | `THEME_SECTION_REGISTRY` |

> `hideMap: true` (全テーマ既定) は地図タブ UI (コロプレス/指標タブ/年度セレクタ) を隠すだけ。
> **page-components チャート・考察 (markdown)・GIS 埋め込み・全指標セクションは hideMap に関係なく描画する**
> (2026-07-04 に `cardsOnly` を廃止し完全ダッシュボード化)。カタログ無しテーマ (climate / local-finance) は
> IndicatorSet.metrics にフォールバック (selection なしで動く)。local-finance は bespoke ページ
> (`app/themes/local-finance/page.tsx`) に全指標セクションを個別追加。

---

## 関連

- 型・SSOT: `packages/data-configs/src/theme-catalog/`
- generator: `packages/data-configs/scripts/generate-theme-catalog.ts`
- validator: `packages/data-configs/scripts/validate-theme-catalog.ts`
- drift guard: `apps/web/src/features/theme-dashboard/actions/theme-chart-props.ts` 末尾 (`_ThemeChartTypeDriftGuard`)
- 調査スキル: `.claude/skills/theme/research-theme-catalog/SKILL.md`
- 調査 agent: `.claude/agents/theme-researcher.md`
- チャートコンポーネント: `.claude/rules/chart-component-standards.md`
- 情報設計 (テーマの責務): `docs/01_技術設計/07_情報設計.md`
- 完全DBレス: `docs/01_技術設計/12_完全DBレス設計.md`
