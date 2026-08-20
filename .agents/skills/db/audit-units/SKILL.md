---
name: audit-units
description: 単位 (円/千円/％/人口10万対/月額年額) の解釈・換算・照合を全サーフェス横断で監査する。config の単位語彙・金額スケール・ブログ本文の値照合・書籍の事実照合・鏡のドリフトを一度に確認し、桁違いや分母違いの事故を検出する。ユーザーが「単位を監査」「桁が合っているか確認」「数値の単位チェック」等と言ったときに使う。
primary_agent: data-ingester
---

# audit-units — 単位の横断監査

正典: `.Codex/rules/unit-semantics-standards.md`。

単位の解釈は 5 つの面 (config / ブログ / 書籍 / 地図 / ランキング) に散らばっており、
どれか 1 つだけ見ても事故は見つからない。ここで一度に走らせる。

## いつ使うか

- 数値の桁が疑わしいとき (「この値、千円と円が混ざっていないか？」)
- 新しい単位の metric を投入した後
- 単位セマンティクスの正典 (`packages/data-configs/src/unit/`) を変更した後
- 書籍・記事の公開前に横断で確認したいとき

## 手順

### 1. 鏡のドリフト (最優先・これが崩れると全部の判定が信用できない)

```bash
npx tsx packages/data-configs/scripts/generate-unit-semantics-mirror.ts --check
(cd packages/data-configs && npx vitest run src/unit)   # 正典 28 + パリティ 4。★subshell にする
                                                        #   (cd が漏れると後続の手順が別ディレクトリで走り「失敗」に見える)
```

`--check` が失敗したら**先に再生成する** (`--check` を外して実行)。鏡が古いまま他の監査を回すと、
`.Codex/scripts/**` 側だけ古い解釈で判定してしまう。

### 2. config の単位 (語彙と金額スケール)

```bash
npm run validate:config       --workspace=@stats47/data-configs   # [unit-vocab] を含む
npm run audit:money-unit-scale --workspace=@stats47/data-configs
```

`[unit-vocab]` は warn。**解釈できない単位を持つ metric** を列挙する。
語彙に足すべきものと、単位表記そのものを直すべきものを見分けて対応する
(推測で語彙を増やさない — 増やすと誤った換算が生まれる)。

### 3. ブログ本文の値照合 (艦隊)

```bash
node .Codex/scripts/blog/audit-published-blog.mjs            # 全公開記事 (--limit N で小さく試せる)
node -e '
const a = require("/tmp/published-blog-audit.json");
const hits = a.results.flatMap((r) =>
  (r.flags || []).filter(([, m]) => m.startsWith("VALUE_MISMATCH")).map(([sev, m]) => ({ slug: r.slug, sev, m })));
console.log("VALUE_MISMATCH:", hits.length, "件 /", new Set(hits.map((h) => h.slug)).size, "記事 / 全", a.total, "記事");
for (const h of hits.slice(0, 20)) console.log(" ", h.sev, h.slug, "—", h.m);
'
```

単一記事なら `node .Codex/scripts/blog/quality-gate.mjs <slug>`。

**報告された不一致を鵜呑みにしない。** 実測では大半が「data 側の単位表記が不正確」で、
本文が正しいケースがある (正典 `unit-semantics-standards.md` §4 の分母つき単位)。
**どちらが正しいかを SSOT で確かめてから直す** —
壊れた data に合わせて本文を書き換えると品質が下がる。

### 4. 書籍の事実照合

```bash
npx tsx packages/product-factory/scripts/audit-book-facts.mts             # 全書籍
npx tsx packages/product-factory/scripts/audit-book-facts.mts --book K-S1-01   # 1 冊
```

**`--book` で必ず絞る。** 絞らないと全書籍の**合計**が出るので、1 冊の件数と読み違える
(未知フラグは exit 2 で止まるようにした。`--id` 等を渡しても黙って全冊走ることはない)。

**「照合 N 件」はカバレッジ。** 少なければ監査が薄いだけで、品質が高いわけではない
(実測: K-S1-01 は 13 章 74k 字に対し照合 9 件 = 抽出できた主張がその程度しかない)。
不一致 0 を「本文が正しい」と読み替えない。

### 5. 地図の値照合

タイルマップの再生成時に `map-value-match.mjs` が SSOT と突合する。

```bash
node --test .Codex/scripts/lib/__tests__/map-value-match.test.mjs
npx tsx .Codex/scripts/blog/regenerate-tile-maps.ts   # dry-run。matchRate が落ちた地図が出る
```

## 判定

| 症状 | 疑うもの |
|---|---|
| ある指標の**全県**が不一致 | 単位の桁 (千円↔円) か分母 (実数↔人口10万対) の取り違え |
| 一部の県だけ不一致 | 本文の値そのものの誤り、または年次違い |
| 何も検出されない | **検証器が動いているかを疑う**。誤値を 1 つ注入して発火することを確かめる |

3 つ目が最重要。「全 PASS」は「何も見ていない」と区別がつかない
(実際にブログの値検出力は 2 ヶ月ゼロのまま「0%」と記録されて放置されていた)。

## 直すときの委譲先

| 対象 | 担当 |
|---|---|
| config の unit 表記・語彙 | `data-ingester` (このスキルの primary) |
| ブログ本文の数値 | `article-writer` → `blog-critic` |
| 書籍本文の数値 | `kindle-publisher` |
| 地図・チャートの再生成 | `chart-author` |

## 関連

- 正典: `.Codex/rules/unit-semantics-standards.md`
- 実装: `packages/data-configs/src/unit/unit-semantics.ts` (正典) / `.Codex/scripts/lib/unit-semantics.mjs` (鏡)
- 数値の書き方 (本文側): `.Codex/rules/blog-quality-standards.md`
- 実証ベース判定: `.Codex/rules/evidence-based-judgment.md`
