---
name: generate-instagram-schedule
description: Instagram スケジュール JSON を D1 + ig-posted-log.jsonl を参照して重複なし自動生成する。Use when user says "IGスケジュール生成", "次のスケジュール", "generate-instagram-schedule".
disable-model-invocation: true
primary_agent: instagram-strategist
---

Instagram 投稿スケジュール JSON を自動生成する。

## 重複防止の仕組み

以下 3 つのソースから「投稿済み / スケジュール済み」キーを収集し、すべて除外する:

1. **ローカル D1** `sns_posts` テーブル（`platform='instagram' AND status='posted'`）
2. **`.Codex/state/ig-posted-log.jsonl`** — GitHub Actions 投稿後に自動追記されるログ
3. **`.Codex/state/instagram-w*-schedule.json`** — 過去・現在の全スケジュールファイル

## 実行前の確認事項

- [ ] 新しい ranking アセット（stills）が `.local/r2/sns/ranking/<key>/instagram/stills/` に存在すること
- [ ] 新しいリールが `.local/r2/sns/bar-chart-race/<key>/instagram/reel.mp4` に存在すること
- アセットが不足していれば `/render-sns-stills` でレンダリングしてから実行

## 実行コマンド

```bash
# 候補一覧確認（--dry-run）
node .Codex/scripts/instagram/generate-schedule.cjs \
  --from 2026-06-11 --to 2026-07-01 \
  --images 14 --reels 3 \
  --dry-run

# スケジュール生成・保存
node .Codex/scripts/instagram/generate-schedule.cjs \
  --from 2026-06-11 --to 2026-07-01 \
  --images 14 --reels 3 \
  --out .Codex/state/instagram-w20-schedule.json
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

1. 出力された schedule JSON を確認する。**スクリプト側の編集は不要**
   (2026-07-07〜 `post-from-schedule.cjs` が当日エントリを含む週ファイルを自動選択する。
   エントリに `time` "HH:MM" JST を持たせると 08:03/12:03/19:03 の該当 cron 枠で配信、
   未指定は 08:00 扱い。同一日に複数エントリ可 — 各 cron 実行が未投稿の最早 1 件を消化)。

2. schedule JSON を commit → **main へ反映** (cron は main checkout で動くため):
   ```bash
   git add .Codex/state/instagram-wXX-schedule.json
   git commit -m "feat(instagram): WXX スケジュール追加"
   # develop 経由で develop→main PR (通常デプロイフローに同乗)
   ```

3. 不足アセットがある場合:
   - ranking 画像: `/render-sns-stills` → `/push-r2 sns/ranking/<key>`
   - bar-chart-race リール: `/bar-chart-race --step render` → `/push-r2 sns/bar-chart-race/<key>`

## 参照スクリプト

- `generate-schedule.cjs`: 本スキルの実体
- `backfill-posted-log.cjs`: D1 → ig-posted-log.jsonl の初回バックフィル（一度だけ実行）
- `post-from-schedule.cjs`: GitHub Actions 投稿スクリプト（ig-posted-log へ自動追記）
