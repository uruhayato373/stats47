# cloud セッション向け — ブログ記事バッチ生成プロンプト

Claude Code on the web / クラウドセッションに貼り付けて使う。`<N>` を書く本数に置き換える。

> **本数を空欄にしない。** 2026-W35 に「2 本だけ」という計画に対して 85 本が公開され、
> 他の Must が全部押し出された。上限が無いと必ず同じことが起きる。
> 月間の本数 SSOT は `.claude/state/blog/seo-strategy.json` の `typeMix.perMonth` (月 17-19 本)。

---

## プロンプト本文（ここから下をコピー）

```
ブログ記事を <N> 本、生成から公開待ちまで確定させてください。<N> 本ちょうどで、1 本も超えないでください。

## 実行環境の前提（クラウドなので必ず守る）

- `gh` CLI は使えません。workflow_dispatch も 403 で叩けません。
- R2 への直接書き込みはできません（CI 専用）。公開は develop への push トリガーで
  `blog-auto-publish.yml` が行います。
- データ接地は R2 の公開 URL（https://storage.stats47.jp）を既定で読むので認証は不要です。
- サムネイル・OGP 画像は公開時に CI が生成します。こちらで作る必要はありません。
- `blog-auto-publish.yml` の 1 回の公開上限は 10 件です。10 本を超える場合は
  10 本ずつに分けて push してください。

## 手順

### 1. 何を書くか決める

    node .claude/scripts/blog/build-topic-queue.mjs

pending の上位から <N> 件を対象にします。status が done / in-progress のものは選ばないでください。

### 2. 接地・健全性ゲート・SVG・prompt を用意する

    npx tsx packages/ai-content/src/scripts/generate-blog-article.ts --limit <N> --keep-draft

これで各 slug に次が揃います。`article.md` はまだありません。それを書くのがあなたの仕事です。

    docs/21_ブログ記事原稿/<slug>/
      ├── article.prompt.txt   型・ルール・接地済み ground truth
      ├── data/*.json          R2 観測値（数値の出どころ）
      ├── data/*.source.json   出典 manifest
      └── data/*.svg           生成済みチャート

データ健全性ゲートに落ちた topic は skip されます。**落ちた分を別の topic で埋めて
<N> 本に揃えようとしないでください。** 用意できた本数がその回の上限です。

### 3. 記事を書く

対象一覧:

    find "docs/21_ブログ記事原稿" -mindepth 2 -maxdepth 2 -name 'article.prompt.txt' \
      | sed 's|.*/\([^/]*\)/article.prompt.txt|\1|'

各 slug について `article.prompt.txt` を読み、そこに書かれた型と ground truth に従って
`article.md` を書きます。`article-writer` agent に委譲してよく、slug 単位で成果物が
分離しているので並行できます。**同時に起動するのは最大 3 体まで**。

守ること（正典 `.claude/rules/blog-quality-standards.md`）:

- 数値は `data/*.json` にある値だけを使う。無い値は書かない。
- 県名の直後の括弧に値や順位を書かない。括弧内は機械照合の対象外になり、
  誰にも検証されない数値になる。散文に開いて書く。
  NG: 愛知県（746.0万人）が4位  /  OK: 愛知県は746.0万人で4位
- markdown 表（| … |）を一切使わない。データは SVG 図、列挙は箇条書き。
- 文体はですます調に統一する。である調を混ぜない。
- 各図の直下に `<source-link href="/ranking/<key>">` を 1 枚だけ置く。末尾に束ねない。
- タイトルは 17 字前後、curiosity gap 要素は 1 個だけ。煽り語を重ねない。

### 4. 決定的ゲートを通す

    NODE_OPTIONS='--conditions react-server' \
      npx tsx packages/ai-content/src/scripts/generate-blog-article.ts --ingest <slug>

blocker が出たら記事を直して再実行してください。**ゲートは絶対に緩めないでください。**
review.md がまだ無い段階では「critic の審査待ち」で止まります。それが正常です。

### 5. critic に審査させる（別コンテキスト・必須）

`blog-critic` agent を起動して `docs/21_ブログ記事原稿/<slug>/review.md` を書かせます。

**自分が書いた記事を自分で採点しないでください。** critic には記事本文だけを渡し、
ground truth も型の指示も再試行履歴も渡さないでください。verdict が REVISE なら
指摘を直して 4 に戻ります。

### 6. 確定して push する

    NODE_OPTIONS='--conditions react-server' \
      npx tsx packages/ai-content/src/scripts/generate-blog-article.ts --ingest <slug>

critic が PASS していれば published: true が立ち、公開待ちになります。
develop へ push すると CI が factual / quality ゲートを再検証して R2 に公開し、
docs/21 のドラフトを自動削除します。

    git add docs/21_ブログ記事原稿/<slug>
    git commit -m "feat(blog): <slug> を公開"
    git push origin develop

`git add -A` は使わないでください（並行セッションの WIP が混入します）。

## 失敗したときの扱い

1 本が落ちても残りを止めないでください。通った分だけ push し、落ちた分は
docs/21 のドラフトを残したまま（published: false）次回に繰り越します。

**公開対象が 0 件のときに「成功」と報告しないでください。** どの slug がなぜ落ちたかを
必ず書いてください。

## やってはいけないこと

- ゲートを緩めて通す → 記事を直して通す。通らなければその回は出さない
- 自分で書いた記事を自分で critic する → blog-critic を別コンテキストで起動する
- ground truth に無い数値を書く → data/*.json にある値だけを使う
- R2 の article.md を直接編集する → outbox → push → CI が公開する
- <N> 本を超えて書く → 超過分は書かない。翌回に回す
- 健全性ゲートで落ちた分を別 topic で埋める → 用意できた本数がその回の上限

## 最後に報告すること

- 書いた本数 / push した本数 / 落ちた本数（落ちた slug とその理由）
- critic の verdict 内訳（PASS / REVISE）
- ゲートを緩めていないこと
```

---

## 使い方の目安

| 状況 | `<N>` |
|---|---|
| 週次計画の Must に本数がある | その本数（計画が正典） |
| 月間下限に足りない分を埋める | `typeMix.perMonth` の下限 − 当月公開済み |
| 試験的に回す | 2〜3 |

1 回 10 本を超えるときは `MAX_PUBLISH: 10` に合わせて push を分ける。

## 関連

- 主経路の skill: `.claude/skills/blog/write-prepared-article/SKILL.md`（対話セッション用）
- 品質基準（正典）: `.claude/rules/blog-quality-standards.md`
- データ系譜: `.claude/rules/blog-data-schema.md` §0 / §1.5
- 公開: `.github/workflows/blog-auto-publish.yml`
- クラウドの制約: `.claude/rules/branch-workflow.md`「実行環境による差分」
