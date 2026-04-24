---
name: diagnose-youtube-shadowban
description: YouTube チャンネルのシャドウバン疑いを事実ベースで診断し、GitHub Issue に集約する。Use when user says "シャドウバン確認", "YouTube診断", "動画再生されない", or detects views-drop. 新規投稿の 48h 再生数・トラフィックソース・登録者増減から判定し、疑い動画リストを Issue 化する。
---

YouTube チャンネル `UCdRiwDSX1aUd0dSd7Cs08Kg`（stats47jp）のシャドウバン疑いを事実ベースで診断し、回復アクションの起点となる GitHub Issue を起票する。

## 用途

- シャドウバン疑いが出たとき（再生数急減・ショートフィード露出消失）の第一歩
- 定期的な健康診断（月 1 回程度）
- `/recover-youtube-shadowban` の内部呼び出し元

## 前提

- `.env.local` に `GOOGLE_OAUTH_CLIENT_ID / SECRET / REFRESH_TOKEN` が設定済み
- `gh` CLI で GitHub にログイン済み
- スクリプト `node .claude/scripts/youtube/diagnose-shadowban.js` が read-only API のみを叩く

## 手順

### 1. 診断スクリプト実行

```bash
mkdir -p /tmp/youtube-diag
node .claude/scripts/youtube/diagnose-shadowban.js --pretty > /tmp/youtube-diag/report.txt
node .claude/scripts/youtube/diagnose-shadowban.js > /tmp/youtube-diag/report.json
```

出力の主要フィールド:
- `verdict`: `healthy` | `watch` | `likely-shadowban`
- `suspectVideos`: 48h+ 経過で views < 50 の動画リスト
- `trafficSourceBreakdown.recent`: 直近 14 日のトラフィックソース別 views
- `subscriberDelta`: 直近 14 日の登録者増減
- `viewsDelta.changePct`: 直近 14 日 vs その前 14 日の views 変化率

### 2. Issue 起票

```bash
TODAY=$(date +%F)
VERDICT=$(jq -r .verdict /tmp/youtube-diag/report.json)
SUSPECT_N=$(jq '.suspectVideos | length' /tmp/youtube-diag/report.json)

cat > /tmp/youtube-diag/issue-body.md <<EOF
## 診断サマリー

- **日付**: ${TODAY}
- **verdict**: \`${VERDICT}\`
- **suspect videos**: ${SUSPECT_N} 本（48h 経過で views < 50）

## 観測（直近 14 日）

\`\`\`
$(cat /tmp/youtube-diag/report.txt)
\`\`\`

## 推奨アクション

- [ ] suspect videos を \`update-privacy.js --from-json\` で private 化
- [ ] scheduled 投稿（D1 \`sns_posts\` で status='scheduled' の platform='youtube'）をキャンセル
- [ ] \`.claude/state/youtube-pause.json\` に 2 週間の停止期限を書き込み
- [ ] 停止期限後に BCR 1 本で復帰テスト（48h 再生 ≥ 100 なら pause 解除）

詳細は \`/recover-youtube-shadowban\` スキルを参照。

## 参照

- 診断スクリプト: \`.claude/scripts/youtube/diagnose-shadowban.js\`
- 戦略メモ: \`.claude/agents/youtube-strategist.md\` のシャドウバン関連セクション
EOF

gh issue create \
  --title "[YouTube Recovery] ${TODAY}" \
  --label "youtube-experiment" \
  --body-file /tmp/youtube-diag/issue-body.md
```

### 3. 結果報告

Issue 番号と verdict、suspect 数をユーザーに報告する。`likely-shadowban` のときは続けて `/recover-youtube-shadowban` の実行を促す。

## オプション

```bash
# 期間変更（デフォルト 14 日）
node .claude/scripts/youtube/diagnose-shadowban.js --days 7

# 閾値変更（デフォルト: 48h 経過で views < 50）
node .claude/scripts/youtube/diagnose-shadowban.js --views-threshold 100 --min-age-hours 72
```

## verdict 判定ロジック

| 条件 | verdict |
|---|---|
| `suspectVideos >= 5` | `likely-shadowban` |
| `suspectVideos >= 2` かつ views 変化率 ≤ -80% | `likely-shadowban` |
| reasons が 2 つ以上 | `likely-shadowban` |
| reasons が 1 つ | `watch` |
| それ以外 | `healthy` |

reasons: (a) suspect ≥ 2、(b) views 変化率 ≤ -50%、(c) suggested-video traffic ≤ -80%、(d) 登録者 net 負。

## 制限

- YouTube Analytics v2 API は **impressions / CTR を提供しない**。CTR 0% の検知は行えず、views / likes / comments の組み合わせで代替する
- `SHORTS` / `SUGGESTED_VIDEO` の値が取れないチャンネルでは該当 reason はスキップされる
- API quota: videos.list + reports.query で 1 回あたり ~10 units 消費

## 関連

- `/recover-youtube-shadowban` — 本スキルの結果を受けて非公開化 + 停止までを実行
- `/fetch-youtube-data` — 日常的なメトリクス取得
- `.claude/agents/youtube-strategist.md` — 戦略ドキュメント
