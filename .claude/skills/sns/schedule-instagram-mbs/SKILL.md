---
name: schedule-instagram-mbs
description: Meta Business Suite UI 経由で Instagram に予約投稿する（API 予約非対応の代替）。Use when user says "Instagram予約投稿", "IG予約". Playwright + 永続プロファイルで自動化。**初回 or 1 週間以上空いた場合は --dry-run 必須**.
disable-model-invocation: true
argument-hint: "<rankingKey> <YYYY-MM-DDTHH:MM> [<rankingKey> <date> ...] [--domain ranking|bar-chart-race] [--type image|reels] [--dry-run]"
---

Playwright（永続プロファイル）で Meta Business Suite (https://business.facebook.com) を自動操作し、Instagram の予約投稿を設定する。

## なぜ必要か

Instagram Graph API は `scheduled_publish_time` パラメータをサポートしていない（2026-04 時点）。予約投稿は Meta Business Suite の Web UI 経由でしか作成できない。本スキルはその UI 操作を自動化する。

## ⚠️ 重要: 初回 / セレクタ更新後は `--dry-run` で事前検証

MBS の UI は publish-x の X UI と同様に変わりやすい。**「予約モード未確認のまま即時投稿」事故を絶対に防ぐため**、以下の運用ルール:

1. **初回投稿 or 前回から 1 週間以上空いた場合**: `--dry-run` で composer 到達と schedule mode 確認まで実行（ファイルアップ + 投稿は skip）
2. dry-run 成功後に本番投稿
3. セレクタ検出失敗時は `Escape` で composer を閉じる fail-safe

## 引数

```
/schedule-instagram-mbs <rankingKey> <YYYY-MM-DDTHH:MM> [<rankingKey> <date> ...] [--domain ranking|bar-chart-race] [--type image|reels] [--dry-run]
```

| パラメータ | 必須 | デフォルト | 説明 |
|---|---|---|---|
| **contentKey** | 必須 | - | ランキングキー |
| **date** | 必須 | - | 予約日時 JST `2026-04-28T09:00` 形式 |
| **--domain** | - | `ranking` | `ranking` / `bar-chart-race` |
| **--type** | - | 自動判定 | `image` / `reels`。reels は `<key>/instagram/reel.mp4` 必須 |
| **--dry-run** | - | - | composer 到達確認のみ、ファイル upload + 投稿はスキップ |

## 前提条件

1. **Playwright Chromium インストール済み**: `npx playwright install chromium`
2. **メディア / caption が `.local/r2/sns/<domain>/<key>/instagram/` にあること**:
   - `caption.txt`
   - `reel.mp4` (reels) or `stills/*.png` (image)
3. **永続プロファイル**: `.local/playwright-meta-profile/` に Meta Business Suite ログインセッション
   - 初回実行時はブラウザが開き、手動 FB ログイン + IG Business 連携確認が必要（5 分以内）
   - 2 回目以降は自動

## 実行例

```bash
# 1 件 dry-run（初回検証）
npx tsx .claude/skills/sns/schedule-instagram-mbs/schedule-instagram-mbs.ts \
  fiscal-strength-index-prefecture 2026-04-28T09:00 --domain bar-chart-race --type reels --dry-run

# 本番予約 6 件
npx tsx .claude/skills/sns/schedule-instagram-mbs/schedule-instagram-mbs.ts \
  fiscal-strength-index-prefecture 2026-04-28T09:00 \
  local-tax-ratio-pref-finance 2026-04-30T09:00 \
  welfare-expenditure-ratio-pref-finance 2026-05-03T09:00 \
  --domain bar-chart-race --type reels
```

## 投稿フロー（自動）

1. ブラウザ起動（永続プロファイル）
2. `https://business.facebook.com/latest/home` 確認 → 未ログインなら `--dry-run` 中止 / 本番なら 5 分待機（ユーザー手動ログイン）
3. 各 post:
   a. `https://business.facebook.com/latest/composer` へ navigate
   b. Instagram account (stats47jp) 選択
   c. メディアファイル upload (`page.setInputFiles`)
   d. Caption 貼り付け（ClipboardEvent paste で確定動作）
   e. 「Schedule」option を選択
   f. 日時 picker 操作
   g. **schedule mode 確認** (button text に "Schedule" or "予約" が含まれる)
   h. 確認できなければ `Escape` で abort
   i. dry-run なら確認のみで abort、本番なら Submit
4. Submit 成功後 D1 `sns_posts` を `scheduled` に更新

## 失敗時の挙動

- セレクタ未検出 → `.local/playwright-meta-debug/<ts>_<key>_<step>.png` に screenshot
- schedule mode 未確認 → `Escape` で composer 閉じる、即時投稿は絶対に発火させない
- 投稿失敗 → 残りの post もスキップして終了（手動確認のため）

## DB 更新

成功時、`sns_posts` テーブル:
- `status` → `scheduled`
- `scheduled_at` → 指定日時 (ISO 8601 JST)

## 注意

- **MBS UI は publish-x の X UI と同等に脆弱**。初回 + 月 1 回程度は手動で MBS UI が変わっていないか確認すること
- IG account 選択 dropdown が見つからない場合は composer の URL に `?asset_id=<IG_USER_ID>` を付ける改修を検討
- メディア upload は IG の制約 (動画 90 秒、画像比率 etc.) に従うこと
- 1 件あたり 10-20 秒。7 件で 2-3 分
