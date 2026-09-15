#!/usr/bin/env bash
# macOS counterpart of local-resources.ps1: register a launchd agent that runs the local
# resource check daily, eligible generated-cache/scratch cleanup daily and the storage audit
# monthly. No persistent process; each run exits. Windows uses Task Scheduler (the .ps1).
#
#   bash scripts/scheduled/local-resources.sh install   # register launchd agent + git maintenance
#   bash scripts/scheduled/local-resources.sh run       # what the agent runs (cadence-aware)
#   bash scripts/scheduled/local-resources.sh remove    # unregister
set -euo pipefail

ACTION="${1:-run}"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LABEL="com.stats47.local-resources"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
STATE_DIR="$REPO/.local/resource-health"
NODE_PATH_BIN="${NODE_PATH_BIN:-$(command -v node)}"

case "$ACTION" in
  install)
    mkdir -p "$HOME/Library/LaunchAgents" "$STATE_DIR"
    cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$REPO/scripts/scheduled/local-resources.sh</string>
    <string>run</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict><key>NODE_PATH_BIN</key><string>$NODE_PATH_BIN</string></dict>
  <key>WorkingDirectory</key><string>$REPO</string>
  <key>StartCalendarInterval</key>
  <dict><key>Hour</key><integer>9</integer><key>Minute</key><integer>0</integer></dict>
  <key>RunAtLoad</key><true/>
  <key>StandardOutPath</key><string>$STATE_DIR/launchd.log</string>
  <key>StandardErrorPath</key><string>$STATE_DIR/launchd-error.log</string>
</dict>
</plist>
PLIST
    launchctl unload "$PLIST" 2>/dev/null || true
    launchctl load "$PLIST"
    # git schedules its own commit-graph / prefetch / incremental repack via launchd.
    git -C "$REPO" maintenance start
    launchctl list | grep "$LABEL" || true
    echo "installed: $PLIST"
    exit 0
    ;;
  remove)
    launchctl unload "$PLIST" 2>/dev/null || true
    rm -f "$PLIST"
    echo "removed: $PLIST"
    exit 0
    ;;
  run) ;;
  *)
    echo "usage: $0 install|run|remove" >&2
    exit 2
    ;;
esac

# Same cadence as local-resources.ps1: check daily / cleanup daily / audit every 30 days.
mkdir -p "$STATE_DIR"
CADENCE="$STATE_DIR/cadence.json"
[ -f "$CADENCE" ] || echo '{}' > "$CADENCE"
TODAY="$(date +%Y-%m-%d)"

cadence_get() { "$NODE_PATH_BIN" -e 'const c=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));process.stdout.write(c[process.argv[2]]??"")' "$CADENCE" "$1"; }
cadence_set() { "$NODE_PATH_BIN" -e 'const fs=require("fs");const p=process.argv[1];const c=JSON.parse(fs.readFileSync(p,"utf8"));c[process.argv[2]]=process.argv[3];fs.writeFileSync(p,JSON.stringify(c,null,2)+"\n")' "$CADENCE" "$1" "$2"; }
days_since() { "$NODE_PATH_BIN" -e 'const d=process.argv[1];process.stdout.write(d?String((Date.now()-Date.parse(d))/86400000):"999")' "$1"; }

had_failure=0
for mode in check cleanup audit; do
  [ "$(cadence_get "$mode")" = "$TODAY" ] && continue
  case "$mode" in cleanup) min=1 ;; audit) min=30 ;; *) min=0 ;; esac
  if [ "$min" -gt 0 ] && [ "$(days_since "$(cadence_get "$mode")" | cut -d. -f1)" -lt "$min" ]; then continue; fi
  args=("$REPO/.claude/scripts/lib/local-resources.mjs" "$mode" --record)
  [ "$mode" = cleanup ] && args+=(--apply)
  if "$NODE_PATH_BIN" "${args[@]}" > "$STATE_DIR/$mode.log" 2> "$STATE_DIR/$mode-error.log"; then
    cadence_set "$mode" "$TODAY"
  else
    had_failure=1
  fi
done
[ "$had_failure" -eq 0 ]
