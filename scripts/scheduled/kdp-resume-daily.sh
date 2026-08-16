#!/bin/bash
# kdp-resume-daily.sh — KDP 32 冊出版の再開ジョブ (launchd から 1 日 3 回)。
#
# ★なぜ要るか (2026-08-13)
#   KDP は未公開 (下書き + レビュー中) タイトルが約 10 冊で「本の作成数制限」に当たり、
#   新規下書きを作れない。審査 (最大 72h) が終わって枠が空いたタイミングは人が張り付けないので、
#   定期に試行して空いていれば次のバッチを進める。制限中は名指しエラーで即終了する (無害)。
#
# ★公開 (--commit) を含む
#   オーナーが 2026-08-13 に「32 冊すべてを公開までやり切る」と明示指示済み。
#   対象は kdp-listings.json の status != listed の書籍だけで、それ以外には触れない。
#   止めたいとき: launchctl bootout gui/$UID/com.stats47.kdp-resume-daily
#
# 安全弁 (スクリプト側): account assert (knownAsin) / verify ゲート (read-back 全項目 PASS のみ公開) /
#   連続失敗ブレーカ / プロファイル排他 (他の Chromium が使用中なら起動自体を拒否)

# ★launchd は最小 PATH で走るので node が見つからない。既存ジョブと同じ _common.sh で解決する。
source "$(dirname "$0")/_common.sh"
set -u
cd "$PROJECT_DIR" || exit 1
LOG_DIR=".local/kdp-debug"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/resume-$(date +%Y%m%d-%H%M).log"

# 全冊 listed なら何もしない (ジョブの役目が終わっている)
REMAIN=$(python3 -c "
import json
d = json.load(open('.claude/config/kdp-listings.json'))['listings']
print(sum(1 for v in d.values() if v['status'] != 'listed'))" 2>/dev/null || echo "?")
if [ "$REMAIN" = "0" ]; then
  echo "[resume] 全冊 listed — 役目終了。launchctl bootout gui/\$UID/com.stats47.kdp-resume-daily で解除してよい" | tee -a "$LOG"
  exit 0
fi
echo "[resume] $(date) 残り $REMAIN 冊" | tee -a "$LOG"

# 1) 公開済みの審査状態 + ASIN 回収 (失敗しても後続は続ける)
node .claude/scripts/kdp/kdp-batch.mjs --phase status >>"$LOG" 2>&1 || true

# 2) 下書き作成 (作成数制限中なら名指しエラーで即失敗して抜ける)
# ★_common.sh が set -e を敷くので、exit 1 を || で受けないと**ここでスクリプトごと死に、
#   後続の publish フェーズが永遠に走らない** (制限中は draft が常に exit 1)。
DRAFT_RC=0
node .claude/scripts/kdp/kdp-batch.mjs --phase draft >>"$LOG" 2>&1 || DRAFT_RC=$?

# 3) 公開 (verify ゲート内蔵・PASS のみ)。下書きが 1 冊もできていなくても
#    前回作成済みで未公開の本があれば拾う。
PUB_RC=0
node .claude/scripts/kdp/kdp-batch.mjs --phase publish --commit >>"$LOG" 2>&1 || PUB_RC=$?

echo "[resume] done draft_rc=$DRAFT_RC publish_rc=$PUB_RC log=$LOG" | tee -a "$LOG"
tail -40 "$LOG"
