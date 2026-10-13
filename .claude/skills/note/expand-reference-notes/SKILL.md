---
name: expand-reference-notes
domain: product
description: 教材 (参考文献) の分析企画を note 記事にする。R2 の観測値から数値・図・出典を決定的に作り、問いへの答えだけを執筆し、数値照合の検査を通して R2 へ保存する。Use when user says "教材をnoteに展開", "参考文献の企画を記事化", "reference note".
disable-model-invocation: true
primary_agent: note-manager
co_agents: [note-critic]
---

# expand-reference-notes

教材の分析企画 (`data/source-inventory/<sourceKey>/<edition>/analyses.json`) のうち、展開先に note を含むものを記事にする。
規約: `.claude/rules/reference-source-standards.md`「分析企画の展開」、保存は `.claude/scripts/note/catalog/README.md`。
書籍の本文・数値・図は使わない。数値は R2 の観測値 (stats47 のランキング) から取り直したものだけを書く。

## 1. 下ごしらえ (決定的)

```bash
npm run reference:expansion -- pending --channel note          # 未着手の企画
npx tsx .claude/scripts/note/reference/build-reference-note.ts --analysis <企画ID> --register
npx tsx .claude/scripts/note/reference/build-reference-note.ts --pending --register   # 都道府県の値で答える未着手の企画をすべて
```

`docs/31_note記事原稿/b-ref-<資料略号>-<企画番号>/` に `chart-data.json`・`data-provenance.json`・`images/<rankingKey>.png` (全 47 都道府県のタイル地図)・
`draft.md` を作る。`--register` は記事台帳に下書き (題名は仮に企画の問い) を足し、展開記録に企画中 (planned) を書く。
生成器は企画の形ごとに 4 つある。どれも同じ作業場・同じ執筆の印・同じ検査を使う。

| 企画の形 | 生成器 | 数値の出どころ |
|---|---|---|
| 都道府県の値で答える (geoScopes に prefecture-set) | `build-reference-note.ts` | R2 の観測値 (`app/stats/<key>/values.json`) |
| 年収によって支出がどう違うか (geoScopes に japan) | `build-reference-note-quintile.ts` | e-Stat 家計調査の年間収入五分位階級別 (0003348240) |
| 世帯主の年齢によって家計がどう違うか | `build-reference-note-age.ts` | e-Stat 家計調査の世帯主の年齢階級別 (金額 0003348238・数量 0003348237) |
| 地方ごとに各県の全体像を組み立てる | `build-reference-note-region.ts` | R2 の県データブックと県ページと同じ選定 (`selectAreaHighlights`) |

指標の表示名に分母が無ければ e-Stat の項目名から補い (`lib/estat-denominator.ts`)、同じ表示名の指標には subtitle を添える。
R2 に無い指標は外して理由を chart-data.json の `skipped` に残し、47 都道府県がそろわない指標は値のある県の数を明記する。
作り直しは何度でもよい。執筆済みの下書きは、書いた題名・説明文・導入・答えを残して生成部分だけ差し替える (`--refresh` で企画中も含めて作り直す)。

`draft.md` の各指標の節・指標どうしの関係・読むときの注意・データの出典は生成器が書く。直さない (数値を変えるなら生成器を直して作り直す)。

## 2. 執筆 (`<!-- WRITE:… -->` を埋める)

| 印 | 書くこと |
|---|---|
| `title` | 読者の言葉の題名。企画の問いを写さない。目立つ 1 位や差を入れてよい (数値は chart-data.json の値だけ) |
| `description` | 2 文程度の要約 |
| `intro` | 問いを読者の言葉で立て、何をどう比べるかと結論の要旨を 2〜3 段落で |
| `answer` | 見出し `## この問いへの答え` を付けて 2〜4 段落。データで言えることと言えないことを分けて書く |

- 数値は `chart-data.json` にある値 (各都道府県の値・平均・最大最小の比・地方別平均・順位相関・年) と、47 以下の整数 (順位・件数) だけ。
  差や合計を暗算して書かない (検査が止める)。
- 家計調査など県庁所在市の値は「兵庫県(神戸市)」のように市名を添え、県全体の値として書かない。
- 因果を断定しない。データに無い背景 (産地・気候・制度) は「〜として知られる」程度にとどめ、確かめていないことは確かめていないと書く。
- です・ます調。含める内容は完全な文で書き、矢印や体言止めの羅列にしない。書籍や著者には触れない。
- 手本: 果物 5 品目の記事 `b-ref-prc-a33` (台帳の題名「りんごは盛岡、みかんは和歌山、いちごは宇都宮 ── 果物5品目の購入量を47市で比べる」)。

## 3. 検査と保存

```bash
node .claude/scripts/note/reference/check-reference-note.mjs <key...> --apply-title   # 印の残り・答えの節・数値の照合・画像。合格したら題名を台帳へ
npm run note:article -- save <key...>                                                  # 公開 R2 へ保存 (読み戻し照合) → 台帳の manifest を更新
```

生成器・検査の契約は `npm run note:reference:test` が固定する (PR の note Catalog Contract Gate)。

公開前に `note-critic` で意味のレビューを必ず受ける。執筆と同じ agent にレビューさせない。数値照合の検査は数字の出どころしか見ないので、
次は検査を通ってしまう (2026-10-13 の 92 本では 30 本が REVISE。見つかったのはほぼこの 4 種):
数字を含まない順位の主張の誤り (「福井県は所得の上位に入らない」→ 実際は 7 位)、同じ値の県・地方の書き落とし、
県庁所在市の値や月額を県全体・年額として書く、定義の取り違え (即席麺にカップ麺を含める・販売量を消費量と書く)。
レビューには chart-data.json と data/metrics の定義を根拠に引かせ、指摘は元の執筆者に戻して直す。
生成器の節に誤りが見つかったら生成器を直して作り直す (書いた部分は残る)。

## 4. 公開 (オーナーの確認が要る)

note.com への公開は outward-facing なので、本数と日程をオーナーに確認してから `/publish-note` で行う。同じセッションで大量に連続投稿しない
(`sns-content-standards.md` §2-7)。カバーは `publish-note` の手順 (`cover-assets.json` の採用版) で用意する。
公開したら台帳の `status`・`noteUrl`・`publishedAt` を書き、展開記録を済みにする:

```bash
npm run reference:expansion -- record --analysis <企画ID> --channel note --status done --target note:<key> --by note-manager
```
