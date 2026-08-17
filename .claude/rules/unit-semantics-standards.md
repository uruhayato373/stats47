# 単位セマンティクス標準 (単位の解釈・換算・検証の正典)

数値に付く**単位** (円 / 千円 / ％ / 人 / 人口10万対 / 月額・年額…) をどう解釈し、どう突き合わせ、
どう機械検証するかの**単一ソース (SSOT)**。ブログ・Kindle・ランキング・テーマ・エリアのどの面でも
これに従う。単位を解釈するコードを書く agent / skill / 人間はここを読む。

> **背景 (2026-08-12 の棚卸し)**: 単位の解釈がリポジトリ内 **44 箇所に独立実装**されており、
> 同じクラスの事故が繰り返し起きていた。片方を直しても他方に波及しないのが根本原因。
> 実測した事故 4 件:
> 1. 書籍監査が「千円で持つ SSOT」と「円で書かれた本文」を桁を揃えず比較し **0.19% の差を「誤り」と誤報**
> 2. **ブログ factual-check の値検出力がゼロ** — 明らかな誤値でも警告が出ない状態が
>    `blog-data-schema.md` に「value 系 0%」と記録されたまま 2 ヶ月放置
> 3. 家賃を年額のまま月額から引き **46/47 県の順位が動いた** (2026-08-05)
> 4. 地図照合が「13,326**千**円」の千をスケール接頭辞と誤読し全県不一致

---

## 1. モデル

単位文字列を次の 4 要素に分解する。正典は
`packages/data-configs/src/unit/unit-semantics.ts`。

| 要素 | 意味 | 例 |
|---|---|---|
| `dimension` | 次元。**解釈できなければ `null`** | `currency` / `people` / `percent` / `count` |
| `scaleExponent` | 基底単位に対する 10 の指数 | `千円` → 3 / `百万円` → 6 |
| `hasDenominator` | 分母つきか | `人（人口10万対）` → true |
| `normalized` | NFKC + trim した表記 | `ｈａ` → `ha` |

### 芯: 「解釈できない」を黙って 1 倍にしない

単位文字列は e-Stat 由来で自由度が高く (実測 **134 種**)、全てを解釈することはできない。
**解釈できない単位は `dimension: null` を返し、換算 (`conversionFactor`) は `null` を返す。**
呼び出し側は「換算不能」を受けて比較をスキップする。

**ここで 1 倍にフォールバックしてはならない。** 桁違いの値が「一致」と判定され、監査が全 PASS に
なって意味を失う (上記の事故 1・2 がまさにこれ)。

### 換算しないと決めているもの

| 組 | 理由 |
|---|---|
| `人` ↔ `人（人口10万対）` | 分母が違うものは比べられない |
| `‰` ↔ `％` | 10 倍違うが、混同事故を避けて別次元にする |
| `指数` / `（全国=100）` ↔ 実量 | 無次元量は他と換算しない |
| 次元が違う組 (`人` ↔ `円`) | 当然比較しない |

---

## 2. 二層 SSOT (正典と鏡)

`.claude/scripts/**` は**素の node** で実行されるため TS を import できない
(pre-commit / publish-blog / 日次 cron はすべて `node ...mjs`)。両方に同じ解釈が要る。

```
packages/data-configs/src/unit/unit-semantics.ts   ← 正典 (ここだけ編集する)
        │  npx tsx packages/data-configs/scripts/generate-unit-semantics-mirror.ts
        ▼
.claude/scripts/lib/unit-semantics.mjs             ← 鏡 (自動生成・直接編集禁止)
```

**手写しの二重実装をしない。** それが 44 箇所の独立実装を生んだ原因そのもの。

### 鏡の陳腐化を止める 2 つのゲート

| ゲート | どこで走るか |
|---|---|
| `generate-unit-semantics-mirror.ts --check` | pre-commit §6.45 (単位ファイルを触ったとき) / `pr-quality-check.yml` の **Unit Semantics Mirror Gate** |
| パリティテスト | `packages/data-configs/src/unit/__tests__/mirror-parity.test.ts` — 68 語彙の総当たり換算が完全一致することを assert |

両方とも鏡を 1 箇所改変して**実際に発火することを実証済み** (2026-08-12)。

---

## 2.5 取り込み時の換算は `valueScale` で宣言する (金額族専用・2026-08-17)

e-Stat は**倍率を単位文字列に埋め込む** (`千円` / `百万円`)。取り込みは値を変換せず `unit` は
config の文字列を貼るだけなので、**宣言が無いと config が「万円」でも値は千円のまま配信される**。
2026-08-05 に職業別平均年収 39 件がこの状態で 10 倍過大だった (東京の調理従事者が 4,153.9「万円」)。

```ts
// packages/data-configs/src/metrics/cook-annual-income.ts
source: { kind: "estat", statsDataId: "0003445758", valueScale: 0.1, /* 千円 → 万円 */ … }
```

| 決めごと | 内容 |
|---|---|
| 書ける値 | `10^k` のみ。期待値は `10^(原単位の指数 − config.unit の指数)` |
| 適用箇所 | `page-data-batch.ts` の `shapeForPrefecture` / `shapeForCity` (`applyValueScale`) |
| 欠測 | `null` のまま。0 を捏造しない |
| 浮動小数 | `4153.9 * 0.1` は 2 進で `415.39000000000004`。有効桁 15 で丸めて残差だけ落とす (整数は丸めない) |
| レシピ | `buildOps` が `ops.valueScale` に載せる → **configHash が変わり監査 (検査 k) が R2 の stale を追跡**する |
| `valueScale: 1` | 未宣言と同義なのでレシピに**載せない** (既存 2,000 件超の configHash を一斉に動かさない) |

**`tabCombination` の `factor` とは別物。** あちらは系列の線形結合の係数で**単位を変えない**
(千円を 12 倍しても千円)。混同すると二重に掛かる。

判定と全数監査は `packages/data-configs/src/money-unit.ts` (純関数・テスト 27 件) と
`packages/data-configs/scripts/audit-money-unit-scale.ts`。原単位は tab 軸から読むが、
**社会・人口統計体系 (`0000010xxx`) は tab が 1 値で単位を持たず cat01 (指標) 側にある**ので、
pin 済み分類コードの `@unit` も見る (`resolvePinnedSourceUnit`)。pin から複数の異なる単位が
取れたら `ambiguous` として**選ばない**。

## 3. 禁止事項

| NG | OK |
|---|---|
| 新しいスケール表 (`{ 千: 1e3, 万: 1e4 }` 等) をファイル内に書く | `unit-semantics` の `scalePrefixMultiplier` / `conversionFactor` を呼ぶ |
| 換算不能を 1 倍にフォールバックする | `null` を返して呼び出し側に比較を諦めさせる |
| 鏡 (`.claude/scripts/lib/unit-semantics.mjs`) を直接編集 | 正典を編集して再生成 |
| 「千」を無条件にスケール接頭辞とみなす | `isScalePrefixPartOfUnit(prefix, ssotUnit)` で判定 |
| 検証器を作って「全 PASS」で満足する | 誤値を注入して**発火することを実測**する (§5) |
| **金額族以外の unit に `valueScale` を付ける** | 金額族のみ。lint `[value-scale]` が error で弾く (§2.5) |
| **`valueScale` に `10^k` 以外を書く** | 同上。率や人数に付けると配信値が黙って何倍かになる |
| **config を直しただけで再取り込みを省く** | 宣言を変えたら再取り込みまでやる (`audit-reingest-queue.ts` が `stale-delivery` で追う) |

### 例外として残している自前実装

`normalizeUnitForAxis` (`theme-catalog/types.ts`) は **NFKC 畳み込みのみで、千円と円を畳まない**。
これは意図的 — テーマの Y 軸は「千円」と「円」を別軸にするのが正しいため。ここは変更しない。

表示層のベタ書き変換 (`FinanceSankey` の `/100000`、`BlogRankingTable` の億円分岐、
`chart-styles.ts` の `formatCompact` 等) は挙動リスクがあるため今回は移行対象外。
新規増殖だけを止め、移行は backlog 扱いとする。

---

## 4. 分母つき指標の扱い — **分母は `unit` ではなく label / subtitle が持つ**

> **★訂正 (2026-08-12)**: この節は当初「分母つき指標なのに `unit` が素なのが欠陥。`unit` に
> 分母を含める規約が次の一手」と書いていた。**実装を確認したところ誤りだったので書き直した。**

metric config は 3 つに分けて持つ。これが正しい設計で、変えてはならない。

| field | 例 |
|---|---|
| `title` | 糖尿病による死亡者数 |
| `subtitle` | **人口10万人当たり** ← 分母はここ |
| `unit` | 人 |

表示は「糖尿病による死亡者数 / 人口10万人当たり / 20.6人」。**`unit` に分母を足すと
「人口10万人当たり … 20.6人（人口10万対）」と二重表示になる**ので、`unit` は素のままが正しい。
blog の data json も同じ形で、`label: 人口10万人あたり外国人数` / `unit: 人` と label 側が持つ。

実測: 分母つきキー名 (`per-100k` / `per-capita` 等) を持つ metric は **212 件 (active 198)**。
これらの `unit` が素なのは**欠陥ではなく規約どおり**。

### したがって照合は label で判定する

`parseUnit` は**単位文字列**を解釈する関数なので、`人` に `hasDenominator: false` を返すのが正しい。
分母の判定を `parseUnit` に求めてはならない。

実際に起きていた誤検出は label の部分一致が原因だった。data label
「人口10万人**あたり**公害苦情受理件数」に本文の「公害苦情受理件数」が部分文字列として含まれ、
**実数と人口当たりを同一視**して比較していた (本文 12,811件 = 実数 vs data 41.3件 = 人口10万対 →
「310 倍の乖離」と報告。本文は誤っていない)。

修正は `article-factual-check.mjs` の `mentionsForeignMetric`:
**分母修飾子が両方にある / 両方に無いときだけ同じ指標とみなす**
(`DENOMINATOR_QUALIFIER_RE`)。テストは①誤検出が消えること②**分母つき同士の誤りは従来どおり
検出すること**の両方向を固定する (`__tests__/article-factual-check.detection.test.mjs`)。

---

## 4.5 「全 PASS」を疑うべき典型 (2026-08-12 に 3 つ実測した)

同じ形の欠陥が 3 箇所で見つかった。**検証器が緑なのは、正しいからか何も見ていないからか、
出力からは区別がつかない。**

| 検証器 | 緑だった理由 | 実際 |
|---|---|---|
| ブログ値照合 | 4 欠陥の複合で claim が 1 つも抽出されていなかった | 誤り 4 件中 1 件しか出ない |
| 散布図 gate | 元データを持つ 78 枚しか見ておらず、失った 24 枚を**集合から外していた** | 24 枚中 22 枚が非正準 |
| epubcheck | 仕様適合しか見ない。素の `<img>` 表紙は構文として妥当 | 全 32 冊 0 error のままレイアウトが崩壊 |

疑い方は 3 つ:

1. **母集団を数える** — 「78/78 正準」より先に「対象は本当に 78 か」を確かめる。
   分母から外れたものは永遠に緑に見える。
2. **誤りを注入する** — 実データに 2 倍・1.5 倍・100 倍の誤りを入れて発火するかを見る。
   通らなければ検証器が壊れている。
3. **層を分ける** — 「仕様として妥当か」と「読めるか」は別の検査。前者だけでは後者は守れない。

## 5. 検証器を作るときの義務

**「全 PASS」は「何も見ていない」と区別がつかない。** 単位や数値を照合する検証器を新設・修正
したら、次の 2 つを必ず持つこと。

1. **ミューテーションテスト** — 誤値を注入して**発火すること**を固定する
2. **非検出テスト** — 正しい値で**発火しないこと**を固定する (誤検知を出すゲートは運用で無効化される)

さらに、修正が効いていることを示すには**修正を 1 つずつ戻して失敗数が増えることを実測**する。

実例: `article-factual-check.mjs` の値検出力は 2026-08-12 に
**誤り 4 件中 1 件 → 5 件中 5 件検出・誤検出 0** へ回復した。閾値の修正だけを戻すと 5 件、
派生スキップの修正だけを戻すと 6 件が落ちることを実測して、各修正が効いていることを確かめている
(`__tests__/article-factual-check.detection.test.mjs`)。

### severity の段階導入

値の不一致は当面 **warning に留める** (blocker にしない)。**昇格の条件**は次の 2 つが揃うこと:

1. ✅ 艦隊実測で誤検出 0 — **2026-08-12 に公開 426 記事で実測し `VALUE_MISMATCH` 0 件**
   (§4 の分母判定を入れる前は 9 記事 21 件。すべて実数 ↔ 人口当たりの取り違えによる誤検出だった)
2. ⏳ 2 週間の運用で新規記事に誤検出が出ないことを確認

**0 件を「検証器が動いていない」と混同しないための実測** (同日、公開記事 `foreign-population-growth-rate`
の実データに誤値を注入): 2 倍・1.5 倍・100 倍のいずれも**発火**、正しい値と実数を語る文では**無反応**。
日次 cron に縮小専用ラチェット (baseline 0) を配線してあるので、新しい不一致が入れば失敗する。

順位 (rank) の不一致は従来どおり **blocker** (実績あり)。

---

## 6. 役割分担

| 工程 | 担当 |
|---|---|
| 単位語彙の追加・正典の保守・`validate:config` の unit 検査 | `data-ingester` (Tier 2 が config / 観測値の単位を所有) |
| 横断監査の実行 | skill `/audit-units` |
| 記事本文の数値是正 | `article-writer` → `blog-critic` |
| 書籍本文の数値是正 | `kindle-publisher` |

---

## 関連

- 正典: `packages/data-configs/src/unit/unit-semantics.ts` / 鏡: `.claude/scripts/lib/unit-semantics.mjs`
- 生成器: `packages/data-configs/scripts/generate-unit-semantics-mirror.ts`
- **金額族の換算 (§2.5)**: 判定 `packages/data-configs/src/money-unit.ts`
  (`checkMoneyUnitScale` / `resolvePinnedSourceUnit` / `applyValueScale`) /
  全数監査 `packages/data-configs/scripts/audit-money-unit-scale.ts` /
  型 `EstatSource.valueScale` / レシピ `recipe.ts` の `ops.valueScale` /
  lint `validate-metric-config.ts` の `[value-scale]`
- 期間 (月額↔年額): `packages/ranking/src/utils/period-align.ts` / `metric-config-standards.md` の `periodAlign`
- 値照合: `.claude/scripts/lib/article-factual-check.mjs` (ブログ) /
  `packages/product-factory/src/text/fact-claims.ts` (書籍) / `.claude/scripts/lib/map-value-match.mjs` (地図) /
  **`packages/data-configs/src/seo-meta-facts.ts` (seoTitle・seoDescription)**
- **桁の接頭辞 (「5,090億円」の「億」) を読む実装は `scalePrefixMultiplier` +
  `isScalePrefixPartOfUnit` を呼ぶ**。地図 (`map-value-match.mjs`) と SEO
  (`seo-meta-facts.ts`) が同じ 2 関数を使う。判別できない接頭辞は倍率を掛けず
  **値の照合を見送る** (誤検知を出すゲートは運用で無効化されるため)
- 数値の書き方 (本文側の規約): `.claude/rules/blog-quality-standards.md`「数値の書き方」
- 実証ベース判定: `.claude/rules/evidence-based-judgment.md`
