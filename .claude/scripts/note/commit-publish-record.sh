#!/usr/bin/env bash
# note の公開記録 (記事台帳と、台帳から作り直した索引) を commit し、commit が通ったときだけ push する。
#
#   bash .claude/scripts/note/commit-publish-record.sh "<コミットメッセージ>" <ファイル> [<ファイル>...]
#
# commit と push を別々のコマンドで続けて打つと、pre-commit が commit を止めても push が走り、
# 「push した」という出力だけが残って公開記録が手元にしか無い状態を見落とす
# (2026-11-05 の note 公開。NOTE-PLAYWRIGHT-DIALOG-CRASH-01)。ここでは前の段が失敗したら次へ進まない。
#
# 最後の 1 行が結果で、公開の報告へそのまま写す:
#   PUBLISH_RECORD: pushed <sha>      commit と push が済んだ
#   PUBLISH_RECORD: FAILED <段> ...   その段で止まった (終了コード 1)。原因を直して同じコマンドをやり直す
# 名指ししたファイルだけを commit する (ほかの作業が index に載せた変更を巻き込まない)。
set -uo pipefail

if [ "$#" -lt 2 ]; then
  echo "PUBLISH_RECORD: FAILED usage — コミットメッセージと、記録するファイルを 1 つ以上渡す"
  exit 64
fi
MESSAGE="$1"; shift

fail(){ # $1=止まった段  $2=いまの状態
  echo "PUBLISH_RECORD: FAILED $1 — $2"
  exit 1
}

git add -- "$@" || fail add "公開記録は commit も push もされていない"
git commit -m "$MESSAGE" -- "$@" || fail commit "公開記録は commit も push もされていない (push は実行していない)"
SHA="$(git rev-parse --short=9 HEAD)"
git push || fail push "commit $SHA は手元にあるが push されていない"
echo "PUBLISH_RECORD: pushed $SHA"
