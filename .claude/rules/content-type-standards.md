---
paths:
  - "data/content/content-types.json"
  - "data/content/type-fit-review.json"
  - ".claude/scripts/content-types/**"
  - "contents/blog/**"
  - ".claude/skills/blog/**"
  - ".claude/skills/note/**"
  - ".claude/skills/sns/**"
  - ".claude/skills/product/**"
  - ".claude/skills/content/**"
  - "apps/admin/app/content/**"
---
# コンテンツの 4 型

**すべてのコンテンツは参照型・教科書型・論文型・作り方型のどれか 1 つに属する (2026-11-06 オーナー決定)。** 未分類のまま作らない・公開しない。
正本は `data/content/content-types.json` で、型の定義・振り分けの規則・個別の指定を持つ。判定の実装は `.claude/scripts/content-types/classify-core.mjs` の 1 つだけである。

## 型の約束

型は読者が何を求めているかで決める。形式や媒体では決めない。

| 型 | 読者の問い | 満たす約束 | 審査で落とす例 |
|---|---|---|---|
| 参照型 | 1 位はどこか | 順位・差・値をすぐ引けて、指標の定義と年が分かる | 値より前置きが長い。理由を断定する |
| 教科書型 | この統計で何がわかるか、どう使うか | 定義・読み方・読み違えやすい点を説明する | 順位の紹介だけで読み方が無い |
| 論文型 | 自分たちの〇〇はどうなるか | 読者が持つ問いに、方法・結果・言える範囲で答える | 読者の問いになっていない 2 指標の相関。因果を断定する |
| 作り方型 | どうやって作るか、自分の仕事でどう再現するか | 手順・入力・つまずく点が揃い、読者が再現できる | 手順が飛んでいて再現できない |

**題名の「なぜ」だけで論文型にしない。** 1 つの指標の順位を紹介する記事は、題名が問いの形でも参照型である (題名の問いは `blog-quality-standards.md` の curiosity gap で、読者が持ち込む問いとは別物)。論文型は複数の指標や分析で問いに答える記事を指す。

## 作るときの手順

1. 企画の時点で型を 1 つ決める。迷ったら、読者が読み終えて何をするかで決める。
2. 型が自動で決まるかを確かめる。`npm run content-types:check` が通れば決まっている。
3. 通らなければ `assignments` に `{ "id": "blog:<slug>", "type": "type:paper", "reason": "<判定の理由>" }` を足す。同じ形のものが続くときだけ `rules` を足す。
4. 型の約束を満たす形で書く。critic は型の約束も審査する。

優先順は 個別の指定 → 導出 → 規則。導出は 2 つある。問いに答えるブログ (`issue-links` の `answers`・`analyses.json` の `article`) は論文型、ブログや note を指す投稿は指している先の型を継ぐ。

## 機械の止め

| 場所 | 止めるもの |
|---|---|
| `npm run content-types:check` (`content:check` の一部。PR CI・pre-commit) | 全ページ・公開待ちの原稿・note・投稿・本の型が決まらない |
| `.claude/scripts/blog/quality-gate.mjs` | 型の決まらないブログの公開 (`blog-auto-publish.yml` もここを通る) |
| `sns-posts-store.cjs` の `insert` | 型の決まらない domain の下書きの追加。投稿済みの記録は失わないよう止めない |
| `npm run check-datasets` | 規則が指す型の実在と、事業イシューマップの行が持つ型の定義の写しのずれ |
| `npm run content-types:test` | 判定そのものの回帰 |

管理画面の `/content/expansion` は同じ判定で 4 型 × 媒体の件数を出し、`/content/types` が型ごとの一覧を出す。

## 禁止

- 5 つ目の型を足さない。未分類を受け皿にしない。
- 検査を通すためだけに、内容を読まずに型を指定しない。`reason` には判定の理由を書く。
- 型に合わせるためだけに公開済みの本文を書き換えない。下の洗い出しを通す。
- 型を URL・ナビ・タグにしない。読者向けの分類ではなく、制作の見方である。
- 事業の問い (`data/business/issue-map.json`) と社会の問い (`data/content/issues.json`) を混ぜない。型は語彙として共有するだけで、回収の判断は型の台帳へ持ち込まない。

## 型に合っていない記事の洗い出し

`npm run content-types:fit` が公開ブログの本文と GSC のクリックから `data/content/type-fit-review.json` を作り直す。機械は信号と処置の案だけを出す。
公開から計測の終わりまで 28 日に満たない記事のクリック 0 は「未計測」であり、撤去・統合の根拠にしない (2026-11-06 に公開直後の 11 本を撤去の案にした誤りから)。
処置の決定は台帳の `decisions` に書き、作り直しでは消えない。撤去と書き直しは公開に関わるので人が決める。クリックのある記事は、型が合わないだけなら本文を触らない。
