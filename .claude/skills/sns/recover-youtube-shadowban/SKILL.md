---
name: recover-youtube-shadowban
description: YouTube チャンネルのシャドウバン疑いに対する回復パイプラインを実行する。Use when user says "シャドウバン対応", "YouTube回復", "投稿停止", or after `/diagnose-youtube-shadowban` returns likely-shadowban. 診断→疑い動画 private 化→予約投稿キャンセル→2週間 pause→日次監視→復帰テストの 7 フェーズ。
---

`/diagnose-youtube-shadowban` の結果を受け、疑い動画の非公開化、予約投稿のキャンセル、2 週間の投稿停止、日次監視、復帰テストまでを実行する。

## 前提

- `.env.local` に `GOOGLE_OAUTH_CLIENT_ID / SECRET / REFRESH_TOKEN` 設定済み
- `gh` CLI ログイン済み
- ローカル D1 が `.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite` に存在
- 本スキルは破壊的操作（videos.update privacyStatus、D1 UPDATE）を含む。フェーズごとにユーザー確認を挟む

## フェーズ

### Phase 1. Diagnose

`/diagnose-youtube-shadowban` を呼び出し、Issue 番号と JSON パスを取得する。JSON を `/tmp/youtube-diag/report.json` に置く。Issue 番号を以後 `$ISSUE` として扱う。

### Phase 2. Triage

`suspectVideos` 一覧をユーザーに提示し AskUserQuestion で以下を確認:
- 全件 private 化するか、選別するか、キャンセルするか
- `status='scheduled' AND platform='youtube'` の D1 レコードも同時にキャンセルしてよいか

選別が必要な場合は `/tmp/youtube-diag/selected.json` に `{"videoIds": ["...", ...]}` を書き出して後続に渡す。

### Phase 3. Hide（疑い動画の private 化）

```bash
# 全件対応の場合
node .claude/scripts/youtube/update-privacy.js \
  --from-json /tmp/youtube-diag/report.json \
  --privacy private \
  --reason "shadowban-recovery $(date +%F) issue#${ISSUE}" \
  > /tmp/youtube-diag/hide-log.jsonl

# 実行ログを Issue へコメント
gh issue comment ${ISSUE} --body "$(cat <<EOF
## Phase 3: Hide 実行ログ

\`\`\`jsonl
$(cat /tmp/youtube-diag/hide-log.jsonl)
\`\`\`
EOF
)"
```

### Phase 4. Cancel scheduled

D1 の `sns_posts` で status='scheduled' の YouTube 投稿を列挙し、該当があれば:

```bash
SCHEDULED_SQL="SELECT id, content_key, post_url, scheduled_at FROM sns_posts
 WHERE platform='youtube' AND status='scheduled' AND scheduled_at > datetime('now');"
# 一覧取得は /tmp/query-scheduled.js で better-sqlite3 経由
# 該当する動画の videoId を post_url から抽出し、private 化
# → D1 側は status='draft' に戻し、notes に cancel 理由を追記
```

実行後、`gh issue comment ${ISSUE}` でキャンセル一覧を Issue に追記。

### Phase 5. Pause（2 週間の投稿停止）

```bash
# 今日 JST + 14 日
UNTIL=$(date -v+14d +%Y-%m-%dT00:00:00+09:00 2>/dev/null || date -d '+14 days' +%Y-%m-%dT00:00:00+09:00)
cat > .claude/state/youtube-pause.json <<EOF
{
  "until": "${UNTIL}",
  "reason": "shadowban-recovery",
  "issue": ${ISSUE},
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
```

`publish-youtube-normal` / `post-youtube` / `upload.js` は `.claude/scripts/lib/check-youtube-post-budget.cjs` を先頭で呼ぶため、このファイルが存在する限り YouTube 投稿は exit 1 で止まる。

### Phase 6. Monitor（日次）

停止期間中、毎日 `/fetch-youtube-data` を実行し Issue にコメント追記。ウォッチ指標:

- `subscribersGained` / `lost`: 減少が止まっているか
- `SUGGESTED_VIDEO` traffic: ゼロが続いていれば回復していない
- `YT_SEARCH` traffic: 検索流入は通常 shadowban の影響を受けにくい
- 既に public な既存動画の日次 views: 回復の先行指標

### Phase 7. Recover（復帰テスト）

停止期限（14 日後）到達後:

1. Bar Chart Race を 1 本だけレンダリングして公開（28 秒厳守）
2. 48 時間後に再生数確認:
   - views ≥ 100 → pause 解除（`rm .claude/state/youtube-pause.json`）、週 2 本運用で再開
   - views < 50 → pause をさらに 7 日延長、別フォーマットで再テスト
3. 判定結果を Issue にコメントして close

## 並行実験との衝突回避

`.claude/state/experiments.json` に YouTube 関連の `status: "running"` 実験があれば、`status: "aborted"` + `result: { reason: "shadowban-recovery", issue: <N> }` に更新する。GitHub Issue 側の該当実験にも「aborted due to shadowban recovery」コメントを残す。

## 検証

- Phase 3 単体テスト: `--dry-run` で対象一覧が正しいか確認してから本番実行
- Phase 5 後: `node .claude/scripts/lib/check-youtube-post-budget.cjs; echo $?` → exit 1 を確認
- Phase 7 後: 解除したら同じコマンドで exit 0 を確認

## 関連

- `/diagnose-youtube-shadowban` — Phase 1 で呼ぶ
- `.claude/scripts/youtube/update-privacy.js` — Phase 3, 4
- `.claude/scripts/lib/check-youtube-post-budget.cjs` — Phase 5 で効く
- `.claude/agents/youtube-strategist.md` — 復帰後の戦略
