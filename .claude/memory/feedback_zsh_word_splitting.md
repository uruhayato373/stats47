---
name: feedback-zsh-word-splitting
description: この Mac の Bash ツールは zsh で動き、未クォートの変数も単語に分かれない。for x in $list や set -- $x が 1 要素のまま進み、気づかずに誤った記録や確認漏れを作る
metadata:
  type: feedback
---

Bash ツールのシェルは zsh なので、`for k in $keys` は改行区切りの一覧を 1 要素として回し、`set -- $x` も分割しない。

**Why:** 2026-10-09 に 2 回踏んだ。① backlog-loop の台帳に「カードID SHA」を 1 つのキーとして 6 件記録した (台帳を git で戻して記録し直した)。② R2 の 41 件の確認が「checked 1」で終わり、全件確認したつもりになりかけた。どちらもエラーにならず、出力の件数を見て初めて気づいた。

**How to apply:**
- 一覧の反復は `for k in ${=keys}` (zsh の明示分割)、または `while read -r k; do …; done <<< "$keys"` で書く。
- `ID:SHA` のように組を渡すときは `${pair%%:*}` / `${pair##*:}` で分ける (`set -- $x` を使わない)。
- 反復の後は件数 (`checked N`) を出し、期待件数と一致するかを見てから結論を書く。関連: [[feedback_exit_code_not_via_pipe]]。
