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
  → 公開後はライブ (stats47.jp/blog/<slug>) で確認 → /brushup-blog (R2 取得→是正) で反復
```

- **記事の正典 (SSOT) は R2 `app/blog/<slug>`**。`docs/21_ブログ記事原稿` は ephemeral outbox (公開後 CI が自動 `git rm` → 常に空)。`.local/r2/app/blog/` は R2 のローカルミラー (brushup 作業域)。
  - **outbox 不変条件は二重で機構保証する (2026-06-21)**: ① `blog-auto-publish.yml` が公開した slug を即 `git rm` + commit-back。② `blog-remediation-daily.yml` (日次 JST 08:00) が `prune-published-outbox.mjs --apply` で「published:true かつ **R2 (正典) の article.md と内容が完全一致**」のドラフトを掃除。**広い `git add` (統合コミット等) で公開済みドラフトが出戻りしても翌日には自動で消える**。`published:false` の作業中ドラフトは保持。**内容一致を要求するのは安全装置**: brushup (既 live 記事の改稿) は docs/21 に published:true のまま新版を置き R2 には旧版が live なので、「存在」だけで消すと改稿中の新版を誤削除する (差分があれば保持)。docs/21 を消さず R2 を唯一の真実源に保つ設計 (transport は git・R2 直書きは creds 持つ CI 専用なので docs/21 は必要)。
- **廃止 (2026-06-15)**: `docs/20_ブログ記事企画` 全体、`/plan-blog-{articles,trends,from-gsc,affiliate}` `/update-blog-plan` スキル、`blog-planner` agent、`fetch-article-data.mjs` (D1依存) / `generate-gsc-driven-plan.mjs` / `generate-brushup-queue.cjs` スクリプト。
- **置換**: 企画 → `/draft-from-trend` の metric 選定に統合 / データ接地 → `fetch-ranking-data-r2.mjs` (R2直) / brushup キュー → `.claude/state/blog/remediation-queue.json` (`brushup-queue.md` は廃止)。
- 新規記事の生成・公開はクラウド版でも完結する (git push → push トリガー CI が R2 反映。R2 直書きは CI 専用)。

## 1. data/*.json 統一 schema (Phase B で実装、ここでは規約のみ宣言)

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

| Schema 形式 | 構造例 | label 位置 | unit 位置 |
|---|---|---|---|
| flat array | `[{areaName, rank, value, unit}]` | item 内 (空 or なし) | item 内 |
| nested-metrics | `{rankings: {label, unit, data: [{rank, value}]}}` | wrapper | wrapper |
| timeseries | `{series: {label, data: [{year, value}]}}` | wrapper | なし ❌ |

3 種が混在することで `article-factual-check.mjs` の `walkAndIndex()` が label/unit を完全 index 化できず、value mismatch detector が実装不能になっている (2026-05-27 検出力テスト: rank 系 100% / value 系 0%)。

**Phase B での migration**: `.claude/scripts/blog/migrate-data-schema.mjs` で flat / nested / timeseries → 統一 schema に一括変換。

## 1.5 ランキングチャートのデータ系譜 + カード型 (2026-06-20 確定) ★

ブログのランキングチャートは **「いつでも復元できる系譜」+「カード型固定」** を必須とする。
今日まで data JSON が R2 で SVG と名前ドリフトし再生成不能になっていた事故の根治策。

### 3点セット (1 ランキング = basename 共通の 3 ファイル)

| ファイル | 役割 | 必須 |
|---|---|---|
| `data/<name>.source.json` | **出典 manifest**（復元用） | ✅ |
| `data/<name>.json` | 型付きデータ（§1 統一 schema） | ✅ |
| `data/<name>.svg`（横長）+ `data/<name>-ig.svg`（縦長） | データから決定的生成 | ✅ |

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

> `.source.json` は **観測値ではない**ので、`article-factual-check.mjs` / `quality-gate.mjs` の ground truth 索引と `generate-article-charts.ts` のチャート生成からは除外する（実装済: `endsWith(".source.json")` ガード）。

### カード型は2レイアウト・上位5下位5 固定

ランキングは **上位5+下位5 のカード型のみ**（10件は廃止）。1 データから2バリアントを出力:

| 出力 | layout | 用途 | viewBox |
|---|---|---|---|
| `<name>.svg`（article.md が参照） | `columns`（横長2列・上位左/下位右） | ブログ本文 + X | `960×404` |
| `<name>-ig.svg`（SNS専用・未埋め込み） | `portrait`（縦長スタック・上位5↓下位5） | Instagram フィード/リール | `1080×1350`（4:5） |

実装: `fetch-ranking-data-r2.mjs`（取得 + manifest）→ `generate-article-charts.ts`（2レイアウト生成、`packages/svg-builder` の `generateBarChartSvg` `layout:"columns"|"portrait"`）。
カード型カタログの SSoT は `.claude/rules/blog-svg-chart-standards.md`。

**既存記事の一括再生成**: `.claude/scripts/blog/regenerate-ranking-cards.mjs`。全公開記事を triage（tractable=1ランキング+key解決可 / ambiguous=複数or key無 / no-ranking）し、tractable を SSOT から横長+縦長へ再生成（dry-run=staging `.local/regen-staging`、R2 push はしない）。before/after ギャラリー `/tmp/regen-cards-gallery.html` を出力。R2 反映は別途 `diff-push-r2` で行う。

> **2つの一括再生成の使い分け（混在防止）**: ランキングの是正は **`regenerate-ranking-cards.mjs`**（SSOT=R2 app/ranking から**再取得**して manifest 付きで横長+縦長を作る。データが R2 に無い記事でも復元できる）が正典。`regenerate-blog-svgs.yml`（CI）は **既存 `data/*.json` を入力に全チャート種を再描画**する用途で、ソース JSON が R2 に残っていない記事のランキングは再生成できない（→ `regenerate-ranking-cards.mjs` を使う）。

## 1.6 タイルマップ（choropleth）のデータ系譜 + デザイン（2026-06-20 確定） ★

タイルマップもランキングと**同じ SSOT データフロー**に統一する。**SVG からの値の逆復元は禁止**（必ず SSOT から取得し、既存 SVG は metric 照合にのみ使う）。

### デザイン（`packages/svg-builder/src/charts/choropleth.ts` が SSoT）

- サイズ **600×700 固定**。テキストは **全て白 + 濃い縁取り（`paint-order` stroke）+ ソフトシャドウ**（淡色〜濃色どのタイルでも可読。白/黒の切替はしない）。
- タイトルは**左上の余白に左寄せ・大きく**（自動フィット最大22px）、**年は別行・15px**。
- **凡例はタイトル直下の左上余白**（2026-07-13〜。旧右下 8px は視認性が低く左上が遊休だった）。端ラベル既定は**「低い/高い」+ 実数値スケール（最小・中間・最大）**。「安全/危険」等の**意味的ラベルは指標の意味が確実な場合に json `legendLabels` で明示したときのみ**（旧デフォルト 安全/危険 が消費支出額等に焼き込まれた事故の再発防止。gate = `lintChoroplethLegend`）。
- **カラーは D3 カラースキーム指定可**: `scheme`（d3-scale-chromatic の `interpolate<Name>`。例 `Blues`/`Viridis`/`RdYlGn`/`RdBu`/`Spectral`/`YlOrRd`…連続・発散とも）。未指定時は既定 Reds。`reverse` で反転。
- 値表示は `showValue`（県名のみ=既定 / 県名+値）。

### データ取得ルール（SSOT・捏造禁止）

- 地図データの真実源は **R2 `app/ranking/<key>/values.json`**（= metric config → e-Stat → R2 派生。ランキングと同一）。
- `data/<name>-map.json`（型付き 47 県値）+ `data/<name>-map.source.json`（manifest: `kind:"ranking"`, `rankingKey`, `year`, `verifiedMatchRate`）の3点。author が `scheme` を JSON に指定可。
- `generate-article-charts.ts` が `*-map.json` を `generateChoroplethSvg` にディスパッチ（`data.scheme`/`reverse`/`showValue`/`legendLabels` を渡す）。

### 既存記事の一括再生成

`.claude/scripts/blog/regenerate-tile-maps.ts`（dry-run=staging `.local/regen-tilemaps` + gallery `/tmp/tilemap-gallery.html`、R2 push しない）。記事の `/ranking/<key>` 候補 × 各年の SSOT 値を**既存地図の表示値と照合**し metric+年を確定（一致率≥0.8）。確証できた地図のみ SSOT から再生成、**確証できない地図は flag**（個別に metric→key 特定が要る。捏造しない）。R2 反映は別途 `diff-push-r2`（ローカルは `push-r2-wrangler.ts app/blog --apply`、stage dir は事前にクリーンにする）。

照合は地図 title の日本語短縮単位（万/千/億/兆）を実値化して相対2%で判定する（`468万人` ↔ SSOT `4679280` を同値とみなす）。記事リンクの key が AI 生成の命名ゆれで実在 key とズレている場合（例 `health-life-expectancy-male` ↔ 実在 `healthy-life-expectancy-male`、`activity-rate` ↔ `annual-participation-rate`）は、**`--mapping <json>`**（`{"<slug>/<base>": "<correctKey>"}`）を渡すと triage をスキップし correctKey の SSOT で照合・再生成する。correctKey は `app/ranking/<key>/values.json` が 200 で実在し、かつ照合一致したものだけ staging に出る（値が合わなければ flag = 記事本文と地図のズレ防止）。

旧地図SVGが県別 `<title>` 値を持たない古い形式（自動照合が空振りする）の場合は、mapping 値を `{"key":"<correctKey>","year":"<year>"}` 形式にすると、その年の SSOT で照合ゲートをスキップして生成する。**この trusted モードは年と記事本文の数値を事前に人/agent が突合していることが前提**（捏造防止）。生成された `source.json` には `verifiedMatchRate: 0` と `trusted`（記事本文照合済みの旨）が記録され、自動照合を通っていないことが追跡できる。`source.json` は観測値ではないため factual-check / quality-gate / チャート生成の対象外（§1.5）。

## 1.7 全SVGデータ系譜の整備・再発防止 (2026-06-20 確定) ★

ブログ SVG 612 枚の棚卸しで **56% (344枚) が元データ (`data/<name>.json`) を失い「絵だけ」= 再生成・出典追跡が
不能**と判明 (✅both 181/30% ・🟡jsonOnly 87/14% ・🔴neither 344/56%)。dark mode 未対応・デザイン不統一・
タイルマップ未救済の**根本原因**。「1枚ずつ個別救済」でなく、全記事のデータ系譜を体系的に揃える。

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

### 復元 (既存の欠落を SSOT から揃える)
真実源 = `.claude/state/blog/svg-lineage-queue.json` (`build-lineage-queue.mjs` が R2 棚卸しで生成、人間用は
`svg-lineage-LATEST.md`)。各 SVG に `restoreMethod` を割り当て、軽い順に消化する:

| restoreMethod | 枚数 | 手法 |
|---|---|---|
| `source-backfill` | 87 | 既存 json を SSOT に対応付け → `source.json` 後付け (`backfill-source.mjs`、再生成不要・最軽)。json の値を SSOT照合・埋め込み rankingKey 優先。県キーは areaName/pref/name 対応 |
| `ssot-restore` | 99 | ranking/tilemap の元データ消失 → `regenerate-tile-maps.ts` / `regenerate-ranking-cards.mjs` で SSOT復元 |
| `ssot-restore-new` | 169 | scatter/line/findings の元データ消失 → 復元手法 (SSOT照合) の新規実装が要る |
| `manual` | 76 | 無意味名 (`inline-chart-N`) ・型不明 → 個別手当て |

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

| 場所 | 内容 |
|---|---|
| `docs/todo/01_改善バックログ.md` の section heading | `## [BLOG-WAVE-<wave_id>] <title> (legacy: <旧 BLOG-CTR-*>)` |
| section frontmatter | `wave_id`, `legacy_section_ids`, `predecessor_wave`, `successor_wave` |
| `.claude/state/blog/auto-brushup-history.json` | 各 entry に `wave_id` フィールド (2026-05-27 migration 済) |
| commit message | 必須ではない (legacy refactoring を避けるため) |

### Predecessor / Successor

複数 wave が **同じ slug を再上書き** した場合は対応関係を明示:

- `predecessor_wave`: 自分より前に同 slug を改修した wave
- `successor_wave`: 自分より後に同 slug を再上書きした wave

**純粋効果分離が不能** な記事は section の「純粋効果分離の限界」note で明示。判定対象から除外。

## 3. Skill ↔ Docs ↔ Memory map

施策フェーズごとの対応関係。stale 防止のため定期的に確認 (週次 review 時など)。

### Skill (実装)

| Skill | 役割 | 関連 script |
|---|---|---|
| `/brushup-blog` | リライトの唯一エンジン。`--target priority` (キュー) / `--target article` (1 記事、CTR-reframe 既定。エキスパート視点追加は対話実行のみ NotebookLM) / `--target batch` (ユーザー指示時の一括、cron なし) | `.claude/scripts/blog/{select-brushup-candidates,quality-gate}.mjs`, `lint-article.cjs` |
| `/publish-article` | draft → publish (factual gate あり) | `.claude/scripts/lib/article-factual-check.mjs` |
| `/draft-from-trend` | trend → 新規 draft 生成 | `.claude/scripts/blog/{fetch-ranking-data-r2,generate-article-charts}.mjs` |
| `/publish-bulk-articles` | 複数記事の bulk publish | factual gate 共有 |
| `measure-gsc-impact.mjs` (wave_id 駆動・2026-06-08〜) | due 到達 wave の before/after を週次 GSC で自動 diff → `improvement-log.md` の `## [BLOG-WAVE-<id>]` upsert。`fetch-metrics-weekly.yml` cron に配線済 (delta 提示まで・status 確定は weekly-review) | `measure-gsc-impact.mjs` |
| `/analyze-winning-patterns` | 天井ループ: GSC実測×構造特徴で勝ち要因抽出 (順位交絡統制付き)。概念: `.claude/rules/blog-quality-standards.md` §継続品質ループ | `.claude/scripts/blog/analyze-winning-patterns.mjs` |

### Docs (人間向け真実源)

| Docs | 内容 | 更新トリガ |
|---|---|---|
| `docs/todo/01_改善バックログ.md` | wave section の真実源 (status / effect / 判定基準) | wave deploy 時 + effect 計測時 |
| `docs/todo/current-week.md` | 現在の週次 TODO | 週次 (月曜・上書き) |
| `.claude/skills/management/weekly-review/reference/reviews/YYYY-Www.md` | agent用週次振り返り | 週次 (日曜) |
| `docs/handoffs/YYYY-MM-DD-<x>.md` | 大規模 session 完了時のハンドオフ (フラット。種別絞り込みは frontmatter `type:`) | session 完了時 |

### Memory (auto memory)

| Memory | 内容 | 更新タイミング |
|---|---|---|
| `project_blog_brushup_risk_2026_05_25.md` | brushup の FAIL/WARN リスクと factual-check 実装状態 | factual-check 検出力測定後 |
| `feedback_bulk_blog_publish_isr_404.md` | bulk publish の ISR 404 リスク | 該当現象観測時 |
| `feedback_evidence_based_judgment` | 実証ベース判定ルールの参照 | 判定方針変更時 |
| `feedback_skill_schema_drift` | SKILL.md と実 schema 乖離リスク | schema migration 時 |

### State (機械向け真実源)

| State | 内容 | 書き込み箇所 |
|---|---|---|
| `.claude/state/blog/remediation-queue.json` | **品質是正キュー (状態付き)**。「次に何を直すか」の真実源。pending/in-progress/done + wave_id。GSC×品質 blocker の統合スコア。**正典: `.claude/rules/blog-remediation-loop.md`** | `build-remediation-queue.mjs` (build / --mark-* / --next) |
| `.claude/state/blog/winning-patterns.json` | **勝ち要因 (天井ループ)**。featureSignals (confidence付) + 順位交絡統制 (robust/confounded) + 記事別 conformance。build-remediation-queue が conformance を tiebreaker に読む。概念: `.claude/rules/blog-quality-standards.md` §継続品質ループ | `analyze-winning-patterns.mjs` |
| `.claude/state/blog/auto-brushup-history.json` | wave_id 駆動 source of truth (effect 計測の入力 + 是正キューの done シード) | `/brushup-blog --target batch\|queue` 実行時 |
| `.claude/state/blog/auto-brushup-skipped.log` | dedup でスキップした slug ログ | 同上 |
| `.claude/state/blog/SHARED-failure-cases.md` | F-001〜N の failure ledger | factual FAIL 検出時 |

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
