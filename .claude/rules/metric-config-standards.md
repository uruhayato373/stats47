# metric config 標準 (ランキングデータの正典)

`packages/data-configs/src/metrics/<key>.ts` (`MetricConfig`) のフィールド役割と禁止事項の**単一ソース**。
新規 metric 量産・編集する agent / skill / 人間はこれに従う。検査は決定的 lint
`packages/data-configs/scripts/validate-metric-config.ts` (`npm run validate:config`) が担う
(pre-commit / CI `pr-quality-check.yml` に組込済)。

> 背景: subtitle に定義補足とデータ注釈(※)が混在し UI がタイトルに焼き込んでいた、
> `port`/`uncategorized`/`labor`/`local-economy` のような 17 軸外の無効 category が
> `category: string` 型で素通りしていた、等の「同じ間違い」を型 + lint で再発不能にする。

## フィールドの役割 (混ぜない)

| field | 役割 | 入れてよい | 入れてはいけない |
|---|---|---|---|
| `title` (必須) | 正準なランキング名 (h1) | 指標の名前 | **年** (2018年)・**注釈** (※/調査対象外)・subtitle の繰り返し |
| `subtitle?` | 同名指標を区別する短い定義補足 | 「乳用牛(めす)の飼養頭数合計」等の区別子 | title と同一/包含 (冗長)・注釈(※) |
| `note?` | データの注意書き / methodology | 「内陸県は漁港がなく調査対象外 (0で表示)」 | 定義・名前 |
| `description?` | 指標の定義・説明 (散文。「統計の定義」カード) | 出典・定義文 | 注釈(※)・SEO 文 |
| `category` (必須) | e-Stat 機械分類 (17 軸) | `CategoryKey` の 17 キーのいずれか | 17 軸外のキー (型 union でブロック) |
| `unit` (必須) | 単位 | 「人」「百万円」「％」 | 空文字・「‐」「-」(プレースホルダ) |
| `seoTitle?` / `seoDescription?` | SEO 専用 | 検索向け文 | フルタイムコード (2009100000) |

**年は `years` / `latestYear` が持つ。title に焼かない。** UI はデータ年度を別途表示する。

## category キー (17 軸固定)

`landweather` / `population` / `laborwage` / `agriculture` / `miningindustry` / `commercial` /
`economy` / `construction` / `energy` / `tourism` / `educationsports` / `administrativefinancial` /
`safetyenvironment` / `socialsecurity` / `international` / `infrastructure` / `ict`

- SSOT は `packages/data-configs/src/types.ts` の `CATEGORY_KEYS` (型 `CategoryKey`)。表示名/アイコンは
  `categories.ts` の `CATEGORY_DEFS`。
- **`category` は `CategoryKey` union 型なので無効キーはコンパイルエラー**になる。新規キーを増やさない。
- category は「e-Stat 機械分類の内部 backbone」であり、ユーザー向け主要ナビは theme
  (`/themes/*`)。役割分担: `docs/01_技術設計/03_情報設計.md`。

## UI 配置 (この型を前提にした描画)

- `title` → h1 (名前のみ)
- `subtitle` → h1 直下の控えめ 1 行 (`RankingHeaderPanel` titleDetail)
- `note` → チャート直下の小キャプション (`RankingKeyPageClient`)
- `description` → 「統計の定義」カード (`RankingDefinitionCard`)
- 一覧表 (`category`/`survey`) のタイトルは注釈(※)を連結しない (`isCaveatNote` で除外)

暫定: 専用 `note` フィールド移行が完了するまで、UI は `classifyRankingSubtitle` /
`isCaveatNote` (`apps/web/src/features/ranking/utils/classify-subtitle.ts`) で subtitle 文面から
注釈を判定して振り分ける。**データ側に `note` を分離したらこのヒューリスティックは不要になる。**

## lint の重大度 (validate-metric-config.ts)

| レベル | 対象 | 挙動 |
|---|---|---|
| **error** (CI/pre-commit をブロック) | 無効 category キー / title 年混入 (`title-year`) / title 注釈(※)混入 (`title-note`) / subtitle が注釈(※) (`subtitle-note`) / subtitle が title と冗長 (`subtitle-redundant`) / unit 空・「‐」(`unit`) / 重複 title に区別子なし (`dup-title`) | exit 1 |
| **warn** (表示のみ) | 現在は該当チェックなし (将来の段階的 cleanup 用に tier を温存) | exit 0 |

> **2026-06 昇格済**: 旧 warn だった 5 系統 (title-year/title-note・subtitle-note/redundant・unit・dup-title) は Phase 3 のデータ是正で warn=0 を達成 → **error に昇格**。量産時の再混入を CI/pre-commit でブロックする。新規 cleanup を warn から始めたい場合のみ warn tier を再利用する。

`--strict` で warn も exit 1 (現在 warn は 0 件のため実質 no-op、将来用)。

## 量産時の必須手順 (agent / skill)

新規 metric を作成・編集したら **必ず実行**:

```bash
npm run validate:years  --workspace=@stats47/data-configs   # 年の 4 桁正規化
npm run validate:config --workspace=@stats47/data-configs   # 構造規約 (category 等)
```

警告 (warn) を新たに増やさない。注釈は `note` に、年は `years` に、区別は `subtitle` に置く。

## 分類軸は必ず 1 系列に絞る（形状ゲート・★再発防止 2026-07-30）

**e-Stat の統計表は多次元クロス集計なので、config で軸を絞りきらないと同じ県が複数行になる。**
`page-data-batch.ts` は重複を落とさず `assignRanks` が通し番号を振るため、
「1 位 74.5%」のような**別系列の値**がそのまま配信される。

2026-07-30 の全件走査で active 2,179 件のうち **209 件**がこの状態だった
(重複行 176 / 単位と値の矛盾 27 / 県の欠落 24)。実害の例:
`/ranking/sports-participation-rate-swimming` は `cat03`(スポーツの種類 24 件) 未指定で
24 種目すべてを取得し、水泳ではない種目の 74.5% を 1 位として表示していた (正しくは 8.6%)。

### 絞るべき軸

| config | e-Stat の軸 | 絞り忘れたときの症状 |
|---|---|---|
| `cdCat01` 〜 `cdCat04` | cat01-cat05 | 同じ県が「軸のコード数」倍に増える |
| `cdTab` | tab (表章項目) | 同上。実数と率が同居する表で特に危険 |
| `timeScope: "annual"` | time | 年計 + 四半期 + 月次が 4 桁年に潰れて 17 倍になる |

**e-Stat は 4 軸目以降を持つ表が普通にある** (`smartphone-usage-students` は cat01-cat05 の 5 軸)。
`cdCat01`/`cdCat02` だけ指定して安心しない。

### 機械的な検査 (3 層)

| 層 | 実装 | 発火 |
|---|---|---|
| 取り込み時 | `page-data-batch.ts` の `gateShape` (error なら**書かずに既存 R2 を温存**) | `data-refresh.yml` |
| 事後監査 | `audit-ranking-data-integrity.ts` の検査 (j) | 週次 `ranking-integrity-audit-weekly.yml` |
| 棚卸し | `scan-stats-shape.ts` (R2 走査 + allowlist 生成 + 進捗計測) | 手動 |

判定はすべて `packages/data-configs/src/shape-gate.ts` の**同じ純関数**。
両端で同一定義にすることで「書き込み時に通ったものが監査で落ちる」食い違いを防ぐ。

**器の形** (行の数・県の数・単位との整合):

- `duplicate-area-year` 同一 (県, 年) が 2 行以上 → **error**
- `raw-truncated` `RESULT_INF.TOTAL_NUMBER > TO_NUMBER` → **error**
- `percent-out-of-range` unit が `%` で最大値 > 1000 → **error** (100-1000 は warn)
- `area-coverage` 47 県未満 → **warn**。以前 47 だった年が減ったときだけ error

**値の分布** (★2026-08-04 追加。器の形が完璧でも中身が壊れている場合を捕まえる):

- `constant-value` ある年の全県が同じ値 → **最新年なら error** / 過去年のみなら warn
- `zero-heavy` 最新年のゼロ率 ≥ 90% → **warn**
- `negative-count` 個数を数える unit (`COUNT_UNITS`) に負値 → **warn**

### 値の分布を見る理由 (★2026-08-04)

`bowling-alley-public` (公共ボウリング場数) は 47 行 1 系列で**器の形は完璧なまま、全 47 県の値が 0**
だった。順位が存在しないので ranking として成立しないが、取り込み・週次監査・走査のどれも素通りし、
AI コンテンツ生成 (FAQ 5 問 + 県別解説 47 件) まで進んで公開された。`summarizeShape` は
valueMin/valueMax を既に計算していて `min === max` は 1 行で判定できたのに、誰も見ていなかった。

**判定は年ごとに行う。** bowling-alley-public は全年通算だと distinct=2 (2008-18 に値 1 の県が数件ある)
で、**グローバル min/max 比較ではすり抜ける**。最新年だけを error にするのは、過去年の欠陥は既に
配信済みで書き込みを止めても直らないが、最新年なら次の取り込みで直せるから。
値が 1 件しか無い年は判定しない (比べる相手がいないので「全部同じ」が自明に成立するだけ)。

**閾値は実測から決めた** (active 2,176 件の全走査):

| 検査 | 該当 | 判断 |
|---|---|---|
| latest 年の全県同値 | 3 件 = 既知の欠陥と完全一致・誤検知 0 | error |
| ゼロ率 ≥90% | 2 件 (46/47・41/44 でどちらも要調査) | warn |
| ゼロ率 50-90% | 16 件 — 地熱発電所・原発・植物園など**正当が優勢** | 検知しない |
| 個数 unit の負値 | 1 件 (既知の壊れ) | warn |

ゼロ率 50-90% を弾かないのは「原発がある県は数県だけ」のような正当なデータが多数派だから
(誤検知を出すゲートは運用で無効化される)。負値も ％/‰/℃/円/人 は増減率・収支・気温で正当に
ありうるので `COUNT_UNITS` (店/施設/件/か所/館/校/園/台/隻/戸/棟…) に限る。

**allowlist のラチェットは形状側と別枠** (`MAX_KNOWN_BROKEN_VALUE`)。同じ枠にすると
「既存を是正して空いた枠に新しい壊れ方を入れる」ができてしまう。常に warn の 2 種
(`WARN_ONLY_CHECKS`) は何も fail させないので allowlist に載せない (`area-coverage` と同じ理由)。

### 検証済みプロファイル方式 (★2026-08-05・二層 SSOT)

上の閾値は「確実に壊れている」ものだけを拾うので、**判断が割れる帯を捨てていた**
(ゼロ率 50-90% の 16 件など)。そこを埋めるのがこの方式で、**広く疑い、agent が中身を
確かめたものだけ通す**。

**機械だけでは分離できないことを実測で確認している。** 「経年でゼロ率が急増したものだけ拾えば
agent 検証なしで壊れだけ取れる」を試して失敗した — 壊れているものほどずっと壊れているので
変化が出ず (bowling-alley-public の前年比 +0.02)、年が 1 つしかなく比較不能なものが 8 件あり、
その中に確定バグ (gini) が入っていた。分離に必要な情報は**指標が何を数えているかという意味の側**
にしかない。

| SSOT | 意味 | 形 | ラチェット |
|---|---|---|---|
| `expected-shape-anomaly.ts` | **壊れ**を期限つきで許可 | 生成物 (`--emit-allowlist`) | 件数の**縮小**専用 |
| `verified-value-profiles.ts` | **正当**と検証済み | agent が根拠つきで手書き | 未検証件数の**縮小**専用 |

疑い (`value-verification.ts`・監査層専用・取り込みは止めない):

- `zero-suspicion` 最新年ゼロ率 ≥ **0.3** / `thin-suspicion` 最新年 < **40 行** /
  `negative-suspicion` 負値あり (**unit を問わない**)
- 判定 4 状態: `clean` / `verified` / `unverified` / **`profile-violated`**

**検証は boolean でなく「予測」で書く。** `verified: true` だと中身を見ずに一括承認でき、
緑の板と実際の検証が区別できない。`zeroShareMax: 0.9` のような予測なら中身を見ないと数字が
書けず、以後ずっと機械が照合し、データが変われば `profile-violated` で自動的に戻ってくる
(`observedSeverity` の悪化検知と同じ発想)。台帳 lint が evidence・出典 URL・検証日・
予測の存在・定型文の使い回し (同一 evidence 6 件以上) を強制する。

**未検証はラチェット**で管理する (`.claude/state/ranking/integrity-audit.json` の
`valueVerification`)。76 件が一斉に赤くなるゲートは無視されるので、baseline に固定して
**増えたときだけ失敗**。`profile-violated` は即失敗 (検証が古くなった証拠)。

初回キャンペーン (2026-08-05・active 2,173 件): 疑い 76 → **検証済み 63 / 未検証 10**。
残 10 件は根拠を得られなかった分で、**0 を偽装せず baseline に残している**。
運用は skill `/verify-value-distribution` (owner: data-ingester / 調査は estat-researcher)。

**coverage を既定 warn にしているのは誤検知を避けるため。** `port-cargo-total` の欠落 8 県は
内陸 8 県と完全一致しており、素朴な「47 県必須」は `port-*` / `fishery-*` 系 15 件を誤検知する。
誤検知を出すゲートは運用で無効化されるので、確実に欠陥と言えるものだけを error にする。

### 「config は直ったのに配信が古い」を検出する (★2026-07-31 追加)

上の 3 層はどれも **「いま R2 にあるデータが壊れている」** しか言わない。config を是正しても
**再取り込みが走らなければ配信は古いまま**で、その状態を指す仕組みが無かった。

実例: `convenience-store-count-commercial` は 2026-07-30 の commit `aa5f7c37` で config を是正し、
e-Stat を実際に叩いて 47県×1行になることまで確認済みだった。にもかかわらず R2 は
**94 行 (重複 47 県・値域 -1.7〜7233)** のままで、負の値は店舗数ではなく増減率の系列だった。
allowlist の `until: 2026-12-31` まで誰も催促せず、`MAX_KNOWN_BROKEN` のラチェットも
「増やさない」だけで減らす圧力が無い。

検査 (k) (レシピ整合) が同じ乖離を狙う設計だが、**レシピ導入 (2026-07-30) 以前の payload は
`meta.recipe` を持たず `unbaked` (違反ではなく残数) に落ちるため発火しない**。全面再生成が
終わるまでこの空白が残る。

`packages/data-configs/scripts/audit-reingest-queue.ts` が recipe に依存せず、
**git の config 更新日** と **R2 の `meta.generatedAt`** の前後だけで判定する:

| verdict | 意味 | 直し方 |
|---|---|---|
| `stale-delivery` | config の方が新しい = 再取り込みで直る | `page-data-batch.ts --metric <key>` |
| `config-insufficient` | データの方が新しい = 是正後に取り込んでもこの形 | `diagnose-unpinned-axes.ts --fetch` で軸を診断 |
| `unknown` | どちらかの日付が取れず判定不能 | — |

同時刻は `config-insufficient` に倒す。「直したのに古い」と誤報して無駄な再取り込みを促すより、
「まだ壊れている」と報告して調査を促す方が安全なため。

**対象は allowlist の `known-broken` に限る。全 metric に広げてはいけない** — 一度 2,295 件全部で
実測したら **2,063 件 (90%)** が stale-delivery になった。一括コミットが全 config ファイルに触れるため、
git の更新日では「クエリが変わった」と「ただ触った (整形・registry 再生成)」を区別できない。
90% が該当するキューは優先度を示さない。この区別は本来 `configHash` の仕事で、検査(k) が担う
(全面再生成後に有効になる)。壊れていると分かっている集団の中でだけ、config への編集は
ほぼ確実に是正なので日付が意味を持つ。

初回実測 (2026-07-31): known-broken 14 件のうち **stale-delivery 2 / config-insufficient 12**。
後者は率系で、`aa5f7c37` 自身が「率系 4 は単一セルでは取れず calculation の設計が要る」と
書いている残件と一致する。

週次 `ranking-integrity-audit-weekly.yml` に **縮小専用ラチェット**で配線済み
(`--ratchet`: 前回より増えたときだけ失敗する)。0 件でなければ失敗にすると恒久的に赤くなり
無視されるため、増加を止めて減る方へ向ける。state は `.claude/state/data/{reingest-queue.json,LATEST.md}`。

### 既知の壊れは期限つきで登録する

`packages/data-configs/src/expected-shape-anomaly.ts` は
`scan-stats-shape.ts --emit-allowlist` の**生成物**。手で書かない。腐敗防止は 3 点:
`until` 必須 / `observedSeverity` より悪化したら降格しない / `MAX_KNOWN_BROKEN` ラチェット
(是正のたびに定数を下げる。上げる変更は原則しない)。

### 是正は診断スクリプトから始める

```bash
npx tsx packages/data-configs/scripts/diagnose-unpinned-axes.ts --fetch
```

getMetaInfo から未指定軸を列挙し、title と軸コード名の一致で pin 候補を提案する。
**「総数を pin する」を既定にしてはならない** — 「美術鑑賞の行動者率」に総数を当てると
全趣味の合計が配信され、形状ゲートは 47 行 1 系列なので**通ってしまう**。
判定ロジックの正典は `packages/data-configs/src/axis-match.ts` (回帰テストつき)。

## 取得レシピ (MetricRecipe) — 出典だけでは値は決まらない（2026-07-30）

配信データの正しさは `statsDataId` だけでは決まらない。**軸 pin (cdCat01-05)・tab 選択・
線形結合・軸合算・率・時間粒度・地域軸**が揃って初めて決まる。この一式を「レシピ」と呼び、
`packages/data-configs/src/recipe.ts` の **`buildRecipe(config)` が唯一の生成元**とする。

### 宣言演算 (これがあると単発クエリでは再現できない)

| フィールド | 用途 | 例 |
|---|---|---|
| `tabCombination` | 複数 tab の線形結合 | 年収 = 月額 tab08 × 12 + 賞与 tab12 × 1 |
| `axisSum` | 軸メンバーの合算 (総数コードが無い / 一部県にしか出ない) | 港湾の輸送形態 |
| `axisRatio` | 部分 / 部分の合計 × 100 | 非正規率 = 322 / (321+322) |
| `timeScope: "annual"` | 年計のみ採用 (月次・四半期を持つ表) | 商業動態統計 |
| `areaAxis` | 都道府県が area 軸ではなく cat 軸にある表 | 患者調査 (cat03 に 1〜48) |
| (kakei-chousa) | 県庁所在市 → 都道府県の写像 | 家計調査 694 件すべて |

### 両端で同一定義 (手選びコピーを作らない)

```
buildRecipe(config)  ←─ page-data-batch (値を書く)   → app/stats/<key>/values.json の meta.recipe
                     ←─ builder (item を組む)         → app/ranking/<key>/item.json の sourceConfig.recipe
                     ←─ 監査 (検査 k)                 → configHash を突き合わせて stale を検知
```

`configHash` は **クエリと変換だけ**の指紋。`years` や `title` は含めない
(年を伸ばしただけで全件不整合になるのを避ける。カバレッジは shape-gate が別に見る)。

### item.json `sourceConfig` の形 (★丸ごと spread しない)

```jsonc
{
  "estatParams": { "statsDataId": "...", "cdCat01": "...", "cdCat03": "..." },  // これだけ spread してよい
  "recipe":      { "kind": "estat", "ops": {...}, "derived": true, "configHash": "..." },
  "derived":     true,           // true なら e-Stat を叩かず正典 values.json を読む
  "statsDataId": "...",          // 後方互換 (survey-bucketing の SSDS 判定)
  "source":      { "name": "...", "url": "..." }
}
```

オンデマンド取得は必ず `resolveEstatParams()` / `isDerivedSource()`
(`packages/ranking/src/utils/source-config.ts`) を通す。`sourceConfig` を丸ごと spread すると
cdCat03 以降が落ちて多系列が混入し、`source`/`note` が param に混ざる。

### 禁止

| NG | OK |
|---|---|
| `sourceConfig` を丸ごと e-Stat に spread | `resolveEstatParams()` の返り値だけ |
| derived metric を e-Stat 単発クエリで再取得 | 正典 `app/stats/<key>/values.json` を読む |
| `calculation.formula` に自由文字列で計算式を書く | `tabCombination` / `axisRatio` / `axisSum` で宣言する (実行される) |
| 取り込み時に計算する metric に `isCalculated: true` | `false`。`isCalculated` は **他 metric を参照して実行時計算する**ものだけ |

`isCalculated: true` は `calculation.type` (`ratio`/`per_capita`/`subtraction`) と
分子・分母キーがそろって初めて機能する。型だけ立てても
`calculate-ranking-values.ts` の `if (!calculation.type) return []` で**必ず空になる**。

## 計算型 metric (`fetcherKey:"calculated"`) — 生成工程と期間の宣言 (★2026-08-05 新設)

分子・分母から計算して作る metric。現在 3 件 (`disposable-income-after-rent` /
`real-disposable-income` / `engel-coefficient`)。

### 生成は sync-snapshots の `calculated-stats` task が行う

**2026-08-05 まで、計算結果を `app/stats/<key>/values.json` に書く工程はどこにも無かった。**
`page-data-batch` は `kind:"external"` を skip し、`generate-ranking-values` は app/stats を
app/ranking へ射影するだけ。`calculateRankingValues` はランタイム用で R2 に書かない。結果、
配信値は単発スクリプトの産物で分子・分母の更新に追従せず、同じ扱いの 3 件が 1 年 / 1 年 /
18 年とバラバラだった。

| 層 | 実装 |
|---|---|
| 導出の純関数 (generator と監査が共有) | `packages/ranking/src/scripts/lib/calculated-stats-core.ts` |
| 期間換算・丸めの resolver | `packages/ranking/src/utils/period-align.ts` |
| CLI | `packages/ranking/src/scripts/generate-calculated-stats.ts` |
| task 配線 | `run.sh` の TASKS。**`ranking-items` の後・`ranking-values` の前** (producer が先) |
| 監査 | `audit-ranking-data-integrity.ts` の検査 (m) |

行の形・rank 規則 (value 降順・同値同順位・null は rank:null)・ソート順は
`page-data-batch` と揃える。**0 行・依存欠落・非有限値は書かずに exit 1** (空で R2 の既存
データを上書きしない)。

### 期間 (`periodAlign`) は宣言しないと機械では分からない

金額の単位が同じ「円」でも、**月額と年額は足し引きできない**。
`disposable-income-after-rent` は月額の可処分所得から**年額**の民営家賃を引いており、
控除額が 12 倍過大だった (1 位が山形→東京に入れ替わり 46/47 県の順位が動く規模)。

e-Stat のメタは期間を明示しない (`@unit` は両方「円」、`TABLE_INF` にも記載なし)。
桁で判定するしかない — 可処分所得 2024 全国 522,569 円は月額、同じ家計調査年次表の消費支出
2024 全国 3,602,915 円は年額。**したがって config の宣言が唯一の情報源**で、
`MONEY-UNIT-SCALE-01` が扱う 10^k のスケール軸では原理的に拾えない。

```ts
periodAlign: { numerator: "monthly", denominator: "annual", result: "monthly" }
```

換算は `result` 基準 (月額の結果に年額の項が来たら ÷12)。比では約分されるので
`type:"subtraction"` のみ必須 (lint `[calc-period]` が error)。

### `scaleFactor` と丸め桁も宣言する

率を % にする ×100 は `calculation.scaleFactor: 100`。丸めは `display.decimalPlaces`
(lint `[calc-display]` が必須化)。どちらも**配信値そのものを変える**ので既定に頼らない。
丸めは half-up (`Math.round`)。既存 `round1` と同方式で、engel の公開済み 846 行を
全行一致で再現できることを実測済み。

### 宣言はレシピに乗る = 監査が自動追従する

`buildOps` が `fetcherKey:"calculated"` のとき `ops.calc`
(type / 分子 / 分母 / periodAlign / scaleFactor / decimalPlaces) を焼く。したがって
**宣言を変えると configHash が変わり、検査 (k) が「R2 が stale」と検出する**。
検査 (m) は別軸で「分子・分母から作れるはずの年を作れているか」を見る (期待年は
generator と同じ `expectedCalculatedYears` で導出するので、監査が赤なら generator を
回せば必ず解消する)。

| NG | OK |
|---|---|
| 単発スクリプトで app/stats を手動生成する | `calculated-stats` task で再生成 |
| subtraction で `periodAlign` を省く | 必ず宣言 (lint が error) |
| ×100 を生成器にハードコードする | `scaleFactor: 100` を config に宣言 |
| 計算型でない metric にも `ops.calc` を広げる | calculated fetcher のみ (2,000 件超の一斉 drift を避ける) |

## isActive:true ≠ 本番公開（多段依存・★再発防止 2026-06-03）

`MetricConfig.isActive` を `true` にしただけでは ranking は **本番公開されない**。本番アプリは R2 snapshot と
派生リスト（`KNOWN_RANKING_KEYS` / `SITEMAP_RANKING_KEYS` / `INDEXABLE_RANKING_KEYS` / R2 `app/ranking-items/all.json`）
と整合して初めて 200 を返す。**ranking の middleware は `isGone` のみ 410** を返し、未登録キー（`GONE_RANKING_KEYS`
に無いが `KNOWN_RANKING_KEYS` にも無い）は middleware を素通りして page の `notFound()` で **404** になる
（`apps/web/src/middleware.ts:146-154`、2026-06-06 `5d9afb24` で notFound 委譲に変更。tag/theme は `!isKnown→410` だが
ranking は異なる）。いずれにせよ **200 にはならない**ので、`GONE_RANKING_KEYS` から外すだけでなく下記を整合させる必要がある。

公開には config(isActive) を起点に以下を整合再生成する（依存順・詳細手順は memory
`project_ranking_publish_pipeline_gap` / `.claude/todo/05_機能バックログ.md`「122 metric の本番公開」）:

1. R2 `app/ranking-items/all.json` + `app/ranking/<key>/item.json` 再生成（`packages/ranking/src/scripts/generate-ranking-items.ts`。CI: `sync-snapshots.yml` の `ranking-items` task で配線済み）
2. R2 `app/ranking/<key>/values.json` 再生成（`packages/ranking/src/scripts/generate-ranking-values.ts`。正典 `app/stats/<metric>/values.json` から配信用に決定的変換。CI: `sync-snapshots.yml` の `ranking-values` task、**必ず ranking-items の後**に実行する。実描画値・OGP・blog がこれを読むため、未生成だと stale 配信 or 空ページになる。2026-07-27 の復旧以降は `audit-ranking-data-integrity.ts` と週次workflowで欠落を検査する）
3. `KNOWN_RANKING_KEYS` 再生成（`apps/web/scripts/generate-known-ranking-keys.ts`）
4. `SITEMAP_RANKING_KEYS` / `INDEXABLE_RANKING_KEYS` 再生成
5. 再デプロイ → CDN purge（GONE の 410 は 7 日エッジキャッシュ。未登録キーの 404 は ISR）
6. **本番 URL を Googlebot UA で実測**し 200 を確認（`/deploy` Step 7.5）

> 2026-06-03 事故: 122 metric を `isActive:true` 化 + `GONE_RANKING_KEYS` 除去だけ行い、上記 3-6 未反映で
> 全件未達だった（当時の middleware は ranking 未登録キーを 410 にしていた。2026-06-06 `5d9afb24` 以降は
> 404 に変更。いずれも 200 ではない）。「isActive を変えた=公開した」と思い込まないこと。
>
> 2026-07-27 事故: 上記ステップ 2 (`app/ranking/<key>/values.json` 生成) が Phase 6 (2026-05-27) の
> D1→R2 移行時に writer 不在のまま 2 ヶ月間欠落し、既存ランキングは stale 配信・新規 67 metric は
> 空ページのまま sitemap 掲載されていた。「isActive:true + item.json だけで公開完了」とも思い込まないこと。
>
> **手動投入 metric (`fetcherKey:"manual"`) の追加落とし穴**: rank を計算するのは `page-data-batch` だが、
> 手動投入はこの経路を通らないため **`app/stats` の行が rank を持たない**。values writer 側で正典と
> 同一規則 (値の降順・同値は同順位) で導出しているので投入自体は成立するが、**手動で `app/stats` に
> 値を置くときは rank を自分で埋める必要はない**一方、`app/stats` を直接読む他の consumer が
> rank を前提にしている場合は破綻しうる。手動投入後は `/audit-ranking-data-integrity` で確認すること。

## 関連

- 型: `packages/data-configs/src/types.ts` (`MetricConfig` / `CategoryKey` / `CATEGORY_KEYS`)
- lint: `packages/data-configs/scripts/validate-metric-config.ts`
- e-Stat 年の正規化: `.claude/rules/estat-api.md`
- タクソノミー役割分担: `docs/01_技術設計/03_情報設計.md`
- UI 振り分け util: `apps/web/src/features/ranking/utils/classify-subtitle.ts`
