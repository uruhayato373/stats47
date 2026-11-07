---
name: run-analysis
domain: content
description: 問いの分析を、計画・計算・反証・下書き・審査の順に実行役で進める。順番はコード、判断は Codex、最終審査だけ Claude が持つ。Use when user says "分析を回す", "問いを記事まで進める", "analysis:run", "/run-analysis".
primary_agent: analysis-critic
---

**4 型の宣言 (必須)**: 作る前に参照型・教科書型・論文型・ノウハウ型のどれか 1 つを決める。このスキルが作るのは論文型で、問いの台帳に結びつくものだけを扱う。

# run-analysis

問いの分析を 1 コマンドで審査の手前まで進める。公開はしない。

```bash
npm run analysis:run -- --analysis analysis:M01-factory-size
npm run analysis:run -- --analysis analysis:H01-vacancy-population --notebooks "stats47 住宅土地統計"
```

`--dry-run` は次の工程を出すだけで何も実行しない。台帳の行と spec が無い問いは先に `/manage-issue-ledger` で足す。

## 担当の分け方

Claude のトークンを節約するため、会話へ載せるのは止まった理由だけにする。

| 工程 | 担当 | 結果の置き場 |
|---|---|---|
| 順番・やり直し・止める場所 | コード (`analysis-run-core.mjs`) | `.local/analysis/<id>/run.json` |
| 論点の下調べ | NotebookLM (`--notebooks` のときだけ。数値の根拠にしない) | `research.json` |
| 計画・結論の台帳・反証・下書き・1 次審査 | Codex (read-only・JSON の型を指定) | `plan.json`・`analyses.json`・`article.md` |
| 計算と図 | 分析スクリプト | `analysis-summary.json`・`data/` |
| 最終審査 | Claude の `blog-critic` を 1 回 | `review.md` |

Codex は規約の文脈を持たないので、指示文 `prompts/*.md` に読むファイルを書く。Codex の返答はファイルへ書き、Claude は読み直さない。

## 止まったとき

- `needs-final-review`: 表示された `articleSha256` を添えて `blog-critic` を起動し、`review.md` の frontmatter に書かせる。PASS ならもう一度 `analysis:run` を実行すると `reviewed` になる。
- `needs-owner`: やり直しが 2 回で解消しない。`run.json` と `analyses.json` の `refutation` を読み、判断してから続ける。
- 上限の手数で止まったら、そのまま再実行すると続きから進む。

## 機械が止めるもの

`npm run analysis:check` が次を止める (品質ゲートと PR CI も同じ判定)。

- 幅が基準をまたぐのに「過半」と言う主張 (`claims` の `above`・`below`・`straddles`)
- 反証の記録が無い、分析の出力より古い、崩れた主張が残っている
- 審査の後に本文を変えた (`articleSha256` が本文と違う)
- BLOCK か MAJOR の指摘が残っている。verdict が PASS でも通さない
- 4:5 の図が記事の表示で判定されない名前になっている

## 禁止

- 反証や審査が通らないからといって、主張を弱めずに `refutation` や `review.md` を手で書き換えない
- Codex に R2 への書き込み・公開・コミットをさせない
- NotebookLM の回答を数値の根拠にしない。数値は分析の出力だけから取る
