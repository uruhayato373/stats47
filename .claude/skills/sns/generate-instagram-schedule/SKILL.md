---
name: generate-instagram-schedule
description: Instagram スケジュール JSON を D1 + ig-posted-log.jsonl を参照して重複なし自動生成する。Use when user says "IGスケジュール生成", "次のスケジュール", "generate-instagram-schedule".
disable-model-invocation: true
---

Instagram 投稿スケジュール JSON を自動生成する。

## 重複防止の仕組み

以下 3 つのソースから「投稿済み / スケジュール済み」キーを収集し、すべて除外する:

1. **ローカル D1** `sns_posts` テーブル（`platform='instagram' AND status='posted'`）
2. **`.claude/state/ig-posted-log.jsonl`** — GitHub Actions 投稿後に自動追記されるログ
3. **`.claude/state/instagram-w*-schedule.json`** — 過去・現在の全スケジュールファイル

## 実行前の確認事項

- [ ] 新しい ranking アセット（stills）が `.local/r2/sns/ranking/<key>/instagram/stills/` に存在すること
- [ ] 新しいリールが `.local/r2/sns/bar-chart-race/<key>/instagram/reel.mp4` に存在すること
- アセットが不足していれば `/render-sns-stills` でレンダリングしてから実行

## 実行コマンド

```bash
# 候補一覧確認（--dry-run）
node .claude/scripts/instagram/generate-schedule.cjs \
  --from 2026-06-11 --to 2026-07-01 \
  --images 14 --reels 3 \
  --dry-run

# スケジュール生成・保存
node .claude/scripts/instagram/generate-schedule.cjs \
  --from 2026-06-11 --to 2026-07-01 \
  --images 14 --reels 3 \
  --out .claude/state/instagram-w20-schedule.json
```

## 引数

| 引数 | 必須 | デフォルト | 説明 |
|---|---|---|---|
| `--from` | - | 翌日 | 開始日 (YYYY-MM-DD) |
| `--to` | - | from+20日 | 終了日 (YYYY-MM-DD) |
| `--images` | - | 18 | ranking 画像スロット数 |
| `--reels` | - | 3 | bar-chart-race リールスロット数 |
| `--out` | - | stdout のみ | 出力ファイルパス |
| `--dry-run` | - | false | 候補一覧のみ表示 |

## 生成後の手順

1. 出力された schedule JSON を確認し、`post-from-schedule.cjs` のデフォルトパスを更新:
   - `.claude/scripts/instagram/post-from-schedule.cjs` の `IG_SCHEDULE_FILE` デフォルト値
   - `.github/workflows/post-instagram-scheduled.yml` のコメント

2. 変更を commit → main merge:
   ```bash
   git checkout -b feature/instagram-wXX-schedule
   git add .claude/state/instagram-wXX-schedule.json \
            .claude/scripts/instagram/post-from-schedule.cjs \
            .github/workflows/post-instagram-scheduled.yml
   git commit -m "feat(instagram): WXX スケジュール追加"
   gh pr create --base develop ...
   ```

3. 不足アセットがある場合:
   - ranking 画像: `/render-sns-stills` → `/push-r2 sns/ranking/<key>`
   - bar-chart-race リール: `/render-bar-chart-race` → `/push-r2 sns/bar-chart-race/<key>`

## 参照スクリプト

- `generate-schedule.cjs`: 本スキルの実体
- `backfill-posted-log.cjs`: D1 → ig-posted-log.jsonl の初回バックフィル（一度だけ実行）
- `post-from-schedule.cjs`: GitHub Actions 投稿スクリプト（ig-posted-log へ自動追記）
