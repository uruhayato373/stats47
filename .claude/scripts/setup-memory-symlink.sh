#!/usr/bin/env bash
#
# auto memory を repo 内 .claude/memory に集約し、Claude Code のグローバル memory
# パス (~/.claude/projects/<hash>/memory) をそこへ symlink する。
#
# 別 PC / クラウド Claude Code で「リポジトリを clone した直後に 1 回」実行すると、
# git で共有された memory をそのマシンの Claude Code が読み書きできるようになる。
#
# 仕組み: Claude Code は cwd の絶対パスの "/" を "-" に置換したディレクトリ名で
#   ~/.claude/projects/<hash>/memory にプロジェクト別 memory を置く。
#   このスクリプトはその <hash> を現在の repo ルートから算出し、symlink を張る。
#
# 冪等。既存の実ディレクトリは <path>.bak.<epoch> に退避してから symlink に置換する。
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPO_MEM="$REPO_ROOT/.claude/memory"

# Claude Code のプロジェクトハッシュ = 絶対パスの "/" を "-" に置換
HASH="$(printf '%s' "$REPO_ROOT" | sed 's#/#-#g')"
GLOBAL_MEM="$HOME/.claude/projects/$HASH/memory"

mkdir -p "$REPO_MEM"
mkdir -p "$(dirname "$GLOBAL_MEM")"

# 既に正しい symlink なら何もしない
if [ -L "$GLOBAL_MEM" ] && [ "$(readlink "$GLOBAL_MEM")" = "$REPO_MEM" ]; then
  echo "✓ already linked: $GLOBAL_MEM -> $REPO_MEM"
  exit 0
fi

# 実ディレクトリが既にある場合: 中身を repo に取り込んでから退避
if [ -e "$GLOBAL_MEM" ] && [ ! -L "$GLOBAL_MEM" ]; then
  echo "→ merging existing global memory into repo (repo 側を優先) ..."
  # repo に無いファイルだけ取り込む (repo の方が新しい/正典)
  cp -Rn "$GLOBAL_MEM"/. "$REPO_MEM"/ 2>/dev/null || true
  mv "$GLOBAL_MEM" "${GLOBAL_MEM}.bak.$(date +%s)"
elif [ -L "$GLOBAL_MEM" ]; then
  rm -f "$GLOBAL_MEM"
fi

ln -s "$REPO_MEM" "$GLOBAL_MEM"
echo "✓ linked: $GLOBAL_MEM -> $REPO_MEM"
echo "  memory files: $(ls -1 "$REPO_MEM"/*.md 2>/dev/null | wc -l | tr -d ' ')"
