---
name: publish-threads
description: Playwright で Threads Web の「日時を指定」機能を操作し、X の予約から作った Threads 下書きを予約投稿する。Use when user says "Threads予約", "スレッズ投稿", "Threads補充". 予約は同時 25 件までなので、公開で枠が空いたら再実行して補充する。**初回・画面変更後は `--limit 1 --dry-run` で予約モード到達を確認すること**。
disable-model-invocation: true
argument-hint: "--from-queue [--limit N] [--offset N] [--dry-run]"
primary_agent: x-strategist
---

# publish-threads — Threads の予約投稿 (Playwright)

X の予約から 1 日 2 件を Threads に転用し、Threads Web の予約機能で予約する。
頻度・位置づけは `.claude/rules/sns-content-standards.md` §0 / §1 が正典。

## 手順

```bash
# ① X の予約から Threads 下書きを作る (朝枠→10時台、昼枠→17時台。utm_source=threads、ハッシュタグ行は落とす)
node .claude/skills/sns/publish-threads/plan-from-x.cjs --from 2026-09-24 --to 2026-10-31 --dry-run
node .claude/skills/sns/publish-threads/plan-from-x.cjs --from 2026-09-24 --to 2026-10-31

# ② 予約モード到達の確認 (送信しない)
npx tsx .claude/skills/sns/publish-threads/publish-threads.ts --from-queue --limit 1 --dry-run

# ③ 予約 (早い順。満杯になったら止まり、残りは draft のまま)
npx tsx .claude/skills/sns/publish-threads/publish-threads.ts --from-queue
```

## 前提

- 専用プロファイル `.local/playwright-threads-profile/` に @stats47jp でログイン済みであること
  (未ログインなら何もせず止まる。ログインはオーナーが行う)
- 画像は台帳の `media_path` (X と同じローカル画像) をそのまま添付する。R2 は使わない

## Threads Web の仕様 (2026-09-23 実測)

| 項目 | 実測 |
|---|---|
| 予約の入口 | 作成画面右上の「もっと見る」→「日時を指定...」 |
| 日時の選択 | カレンダー (各日に「2026年9月24日木曜日」のラベル、「前月」「翌月」ボタン) と、時・分の 2 つのテキスト入力 →「完了」 |
| 予約モードの表示 | 作成画面上部に「明日10:30 JSTに投稿予定」の帯。日付は 今日 / 明日 / 1 週間以内は曜日 / それ以降は「10月4日(日)」。送信ボタンは「日時を指定」に変わる |
| 上限 | **予約は同時 25 件まで**。超えると「スレッドは25件まで日時設定できます」と出て予約されない |

スクリプトは帯の日付・時刻と送信ボタンの文言が予約したい日時と一致しないと送信しない (即時投稿を発火させない)。
上限の表示が出たら失敗ではなく「満杯」として止まり、その下書きは draft のまま残る。

## 補充 (自動)

25 件の上限があるため、10 月末までの 76 件は一度に入らない。launchd が 09:30 / 21:30 とログイン時に
`scripts/scheduled/threads-topup.sh` を動かし、空いた枠だけを入れる (`--fill --no-ledger`)。

- **Mac を閉じていた場合**: スリープ中に時刻が来た回は、次に起きたときに 1 回にまとめて実行される
  (`man launchd.plist` の StartCalendarInterval)。電源を切っていた場合はログイン時に実行される。
  予約は約 12 日分先まで入っているので、12 日以内に一度 Mac を開けば途切れない
- **git は触らない**: 予約済みは `.local/threads-scheduled.jsonl` (git 管理外) に残り、posts.json は draft のまま。
  公開後は CI の公開確認が draft から直接 posted にする (下記)
- **失敗時**: macOS の通知を出す。ログは `~/Library/Logs/stats47/threads-topup.log`。ログイン切れならオーナーが
  専用プロファイルでログインし直す
- 登録 / 解除 (オーナーの操作):
  ```bash
  cp scripts/scheduled/com.stats47.threads-topup.plist ~/Library/LaunchAgents/
  launchctl load ~/Library/LaunchAgents/com.stats47.threads-topup.plist
  launchctl unload ~/Library/LaunchAgents/com.stats47.threads-topup.plist
  ```

## 公開済みの確認 (CI)

`.github/workflows/sns-verify-threads-posted.yml` が毎晩 23:50 JST に
`node .claude/scripts/sns/verify-threads-posted.cjs --apply` を動かす。ログインせずに公開プロフィール
(`threads.com/@stats47jp`) を開き、見えた投稿のまとまりの文字が台帳の本文 1 行目を含む行だけ
`posted` + `post_url` (permalink) にして develop へ戻す。予約時刻を過ぎただけでは posted にしない。
予約時刻から 24 時間以上たっても見つからない行は警告に出す (Mac を閉じていて補充されなかった下書きなど)。
台帳の draft も対象にするので、自動補充が台帳を書かなくても公開済みは記録される (`--sync-ledger` は任意)。

- ローカルで確かめる: `node .claude/scripts/sns/verify-threads-posted.cjs --dry-run`
- 取得経路だけ確かめる (投稿の多い公開アカウント): `... --dry-run --account zuck`
- 2026-09-23 実測: ログインなしのプロフィールで @zuck の投稿 27 件の permalink・公開時刻・本文が取れた。
  投稿ページの og:description はリンクプレビュー用の巡回ソフトにしか返らないので使わない

## 関連

- 台帳: `.claude/state/sns/posts.json` (platform=threads)。書き込みは `sns-posts-store.cjs` 経由のみ
- API 方式 (`post-threads-scheduled.yml` / `threads-core.cjs`) は Meta のトークン登録後の代替経路として残す (定期実行は止めてある)
