# Claude Code routine のトークン実績

`backlog-loop-daily` の各 run が 1 行 append する。
書き込み口は `.claude/scripts/lib/record-claude-usage.mjs` のみ（追記専用・既存行は書き換えない）。

**★2026-08-21 以降、ai-content / blog の行は増えない。** 日次生成ループを削除し、生成を
対話セッションへ移したため。対話セッションはこの JSON を出さないので、生成の消費は
このファイルからは追えなくなる。**既存の行は消さない** — 件数を決めるときの唯一の実測
（ai-content は 5 件で $79〜90、blog は 1 本で $8.2）で、月次の本数目標の根拠に使う。

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

## (廃止) 期間限定 boost

ai-content の日次件数と回数を不在週だけ上げる仕組み
(`.claude/config/content-generation-boost.json` + `content-generation-boost.mjs`) があったが、
**2026-08-21 に日次生成ループごと削除した**。件数は週次計画 (`.claude/todo/weekly.md` の Must) で
決める。月間目標は `.claude/todo/monthly.md`、blog の月間本数 SSOT は
`.claude/state/blog/seo-strategy.json` の `typeMix.perMonth`。

## 関連

- 診断: `.claude/scripts/lib/summarize-claude-execution.mjs`（同じ execution log から失敗理由を出す）
- 件数の根拠: `.github/workflows/{ai-content,blog}-generate-daily.yml` の冒頭コメント
- 予算ガード: `.claude/scripts/lib/__tests__/content-generation-routine.test.cjs`
  （件数だけ上げて timeout / max-turns を据え置く変更を落とす）
