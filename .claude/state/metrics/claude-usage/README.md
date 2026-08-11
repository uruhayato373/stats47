# Claude Code routine のトークン実績

`ai-content-generate-daily` / `blog-generate-daily` の各 run が 1 行 append する。
書き込み口は `.claude/scripts/lib/record-claude-usage.mjs` のみ（追記専用・既存行は書き換えない）。

## 何のために取るか

日次件数を ai-content 1→5 / blog 1→3 に引き上げたが、**1 件あたり何トークンかを一度も
測らないまま**「利用枠が律速だから 5 にした」と言っている状態だった。次にいくつまで
上げるかを実測で決めるための履歴。

## 列

| 列 | 意味 |
|---|---|
| `date` / `workflow` / `run_id` | いつ・どちらの routine・どの run |
| `limit` | その run の指定件数 |
| `items` | verify を通った件数（失敗 run は 0） |
| `turns` / `duration_ms` / `cost_usd` | result entry の構造フィールド |
| `input` / `output` / `cache_write` / `cache_read` | usage の 4 種 |
| `token_source` | `result` / `messages` / **`none`** |
| `is_error` | 1 なら失敗 run |

## 読むときの注意

- **4 種を合計しない。** `cache_read` は大幅に割引されるので、合算すると桁が壊れる
  （実測で対話セッション全体の 98% が `cache_read` だった）。1 件あたりのコストを見るなら
  `output` と `cache_write` を主に見る
- **`token_source=none` は「0 トークン」ではなく「未取得」。** 0 として集計しない
- **`cost_usd` は「API で課金したらいくらか」の換算値**であって実請求ではない。
  OAuth（Pro / Max）経由なので、**利用枠を何 % 使ったかはこの CSV からは分からない**。
  枠の残りは枠に当たったときのエラーからしか観測できない（`is_error=1` かつ `turns` が
  極端に小さい行がその候補）
- 失敗 run も記録する。利用枠に当たったかを見たいのは主にそちら

## 期間限定 boost を掛ける / 止める

不在週など対話利用がゼロになる期間だけ ai-content の件数と回数を上げられる。
Max の週次枠は繰り越されないので、使わなければ捨てるだけになる。

**操作口は `.claude/config/content-generation-boost.json` の 1 ファイルだけ**で、
develop へ push すれば次のスケジュール実行から効く。cloud セッションは
`actions:write` を持たず workflow_dispatch できない (403) ので、この経路にしてある。

| したいこと | 操作 |
|---|---|
| 件数を変える | `aiContent.limit` を書き換える (上限 MAX_LIMIT = 5・baseline の枠にも効く) |
| 回数を**増減**する | `aiContent.extraCrons` を足し引きする。**産出を増やすときはここ** (件数を増やすと 1 件あたりが悪化する) |
| 今すぐ止める | `until` を過去の日時にする、またはファイルごと削除する |
| 延長する | `until` を延ばす |

放置しても `until` を過ぎれば自動で baseline に戻る。**戻し忘れが事故にならない**ことが
この設計の目的なので、期限を外して恒久化しない (恒久的に増やすなら workflow の
`--default-limit` を上げ、予算ガードを通す)。

### 使用量が多いかをどう判断するか

**枠の消費率は測れない** (上の注意書きのとおり `cost_usd` は換算値)。観測できるのは:

- 各 run が `history.csv` に 1 行 commit する `items` と `is_error`
- gate job が run ごとに job summary へ出す「boost 開始以降 N 回 / M 件 / 失敗 K 回」

判断材料は**失敗の増え方**。枠に当たった run は成果ゼロのまま枠を消費するので、
直近 2 回が連続失敗したら gate が追加スロットを止め baseline へ戻す
(`maxConsecutiveFailures`)。成功が 1 回入れば自動で復帰する。

## 関連

- 診断: `.claude/scripts/lib/summarize-claude-execution.mjs`（同じ execution log から失敗理由を出す）
- 件数の根拠: `.github/workflows/{ai-content,blog}-generate-daily.yml` の冒頭コメント
- 予算ガード: `.claude/scripts/lib/__tests__/content-generation-routine.test.cjs`
  （件数だけ上げて timeout / max-turns を据え置く変更を落とす）
