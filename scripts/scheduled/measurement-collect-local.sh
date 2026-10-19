#!/bin/bash
# 認証付き計測を Mac で直接取得する (2026-10-19。CI の authenticated-measurement.yml の置き換え)。
# measurement-session-refresh.sh がログインを保ち直した直後に呼ぶ。
#
# 対話の作業フォルダ ($PROJECT_DIR) と git の操作が衝突しないよう、定期実行専用の clone ($CLONE_DIR) で
# 取得・要約・コミットする。プロファイル・.env.local・保管庫の鍵は $PROJECT_DIR のものを使う。
# 記録コミットには CI を止める印を付けない (付けると develop→main の PR の検査が止まる。.claude/rules/branch-workflow.md)。
#
# 初回: git clone --branch develop https://github.com/uruhayato373/stats47.git ~/stats47-measurement && (cd ~/stats47-measurement && npm ci)

source "$(dirname "$0")/_common.sh"

CLONE_DIR="${STATS47_MEASUREMENT_CLONE:-$HOME/stats47-measurement}"
TITLE='認証付き計測に要対応の取得元がある'
LABEL='authenticated-measurement-alert'

cd "$CLONE_DIR"
git fetch --quiet origin develop
git checkout --quiet develop
git reset --quiet --hard origin/develop
# lockfile が変わったときだけ依存関係を入れ直す
LOCK_HASH=$(shasum package-lock.json | cut -d' ' -f1)
if [ "$(cat .local/measurement-lock-hash 2>/dev/null)" != "$LOCK_HASH" ]; then
  npm ci --no-audit --no-fund --loglevel=error
  mkdir -p .local && echo "$LOCK_HASH" > .local/measurement-lock-hash
fi

node .claude/scripts/measurement/collect-local.mjs --main-root "$PROJECT_DIR"

git add data/authenticated/latest.json data/authenticated/revenue-history.json data/products/sales-ledger.json
if ! git diff --cached --quiet; then
  # データだけの記録なので pre-commit (型検査など数分) は通さない。CI の record job も同じ扱いだった。
  git -c core.hooksPath=/dev/null commit --quiet -m 'chore(metrics): authenticated measurement status (Mac)'
  for attempt in 1 2 3; do
    if git pull --quiet --rebase origin develop && git push --quiet origin HEAD:develop; then break; fi
    if [ "$attempt" = 3 ]; then exit 1; fi
    sleep 5
  done
fi

# 取得元に失敗があれば Issue で知らせ、全件そろえば閉じる (CI の record job と同じ規則)。
EXISTING=$(gh issue list --state open --label "$LABEL" --limit 1 --json number --jq '.[0].number // empty')
if jq -e '.status == "pass"' data/authenticated/latest.json >/dev/null; then
  if [ -n "$EXISTING" ]; then gh issue close "$EXISTING" --comment "Mac の取得で全取得元がそろいました ($(date -Iseconds))"; fi
else
  printf '\n実行: Mac の定期実行 %s (ログ: ~/Library/Logs/stats47/measurement-collect-local.log)\n' "$(date -Iseconds)" >> /tmp/authenticated-measurement-summary.md
  if [ -n "$EXISTING" ]; then
    gh issue edit "$EXISTING" --title "$TITLE" --body-file /tmp/authenticated-measurement-summary.md
  else
    gh label create "$LABEL" --description 'Authenticated measurement collection or session failure' --color b60205 --force
    gh issue create --title "$TITLE" --label "$LABEL,auto-generated" --body-file /tmp/authenticated-measurement-summary.md
  fi
  exit 1
fi
