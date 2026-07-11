---
name: post-youtube
description: YouTube に動画を投稿する (既定=月1本、量産実験モード中は youtube-experiment.json で上限緩和)。Use when user says "YouTube投稿", "YouTubeアップロード", "YT投稿". シャドウバン再発防止ガード3点(月次上限・重複・翌日診断)を必ず通す。ローカル OAuth 無しでも CI 経路 (youtube-upload.yml) で投稿可。
disable-model-invocation: true
argument-hint: "<動画ファイル> --title <タイトル> [--description <説明>] [--thumbnail <png>] [--metric-keys <json>] [--template <id>] [--content-key <key>]"
primary_agent: youtube-strategist
---

# /post-youtube — YouTube 投稿 (既定=月1 / 実験モードで緩和)

既定は**月 1 本の慎重運用**。2026-07-11 からは**量産実験モード** (`.claude/state/youtube-experiment.json` が
ある間 `monthlyLimit` に緩和、削除で月 1 復帰。`.claude/rules/sns-content-standards.md` §1 例外注記)。
シャドウバンの真因 (68 本/月の量産 + 同タイトル再投稿 28 本、2026-04 Issue #88) を二度と踏まないため、
**ガード 3 点を必ず通す**。重複・再投稿は実験中も全面禁止。

> **⚠️ ローカルに OAuth は無い (2026-07-11 実測)**: `.env.local` に `GOOGLE_OAUTH_*` は 0/3。CI secrets の
> `GOOGLE_OAUTH_*` は生存しており (投稿成功で実証)、secrets は読み出せないためローカルへ複製も不可。
> **投稿は下記「投稿手順 A (CI 経路)」が既定**。ローカル投稿 (手順 B) はユーザーが Google Cloud Console で
> CLIENT_ID/SECRET を用意し `oauth-setup.js` 再認証 (stats47 チャンネル選択) した場合のみ。

## 前提

- 動画は `/bar-chart-race` (BCR 長尺) で生成済み (47 県まとめ動画の生成スキルは撤退時に削除済み)
- 月次上限内であること (ガード 1 が停止する。既定 1 本/月、実験モード中は `monthlyLimit`)

## ガード 3 点 (すべて必須)

### ガード 1: 月次上限 + 停止期間チェック

```bash
node .claude/scripts/lib/check-youtube-post-budget.cjs || exit 1
```
今月の投稿数 (posted + scheduled) が上限 (既定 1、`.claude/state/youtube-experiment.json` があれば
`monthlyLimit` に緩和) に達していれば exit 1。`.claude/state/youtube-pause.json` の pause 期間中も停止。

### ガード 2: 多層重複チェック (5 層)

```bash
node .claude/scripts/lib/check-youtube-duplicate.cjs --title "<生成タイトル>" \
  [--thumbnail <png>] [--content-key <key>] [--template <id>] [--metric-keys '<json配列>'] || exit 1
```
投稿台帳 `.claude/state/sns/posts.json` (直近 60 日) + YouTube API でタイトル/サムネ/content_key/template+metrics の
重複を検出。1 件でもヒットで停止 (タイトル・サムネは ERROR)。

### ガード 3: 投稿翌日のシャドウバン診断

投稿翌日に必ず実行し、SUGGESTED_VIDEO / インプレッションの異常を観測する:
```bash
node .claude/scripts/youtube/diagnose-shadowban.js --pretty
```

## 投稿手順 A: CI 経路 (★既定・2026-07-11 実証済、ローカル creds 不要)

1. **タイトル生成**: 50 字以内・SEO キーワード先頭・**過去タイトルと重複させない** (雛形 rules §2-6)
2. **ガード 1 → 2 をローカルで先に実行** (どちらか exit 1 なら中止。CI 内でも upload.js が再実行する)
3. **mp4 を GitHub Release アセット化** (R2 push の代替 transport):
   ```bash
   gh release create yt-<slug> <video.mp4> --title "..." --notes "CI 投稿 transport 用" --prerelease
   gh release view yt-<slug> --json assets -q '.assets[].apiUrl'   # ← video_url に使う
   ```
4. **リクエストファイルを develop に push** (worktree 推奨。push で `youtube-upload.yml` が発火):
   `.claude/state/youtube-upload-request.json` に書く —
   `{video_url(アセット apiUrl), title, description, tags, privacy, publish_at(空=即時),
   content_key, metric_keys}`。**★`metric_keys` は JSON 配列** (`["births"]`。素の文字列は
   upload.js の `--metric-keys` バリデーションで落ちる)。
5. **run を監視**: `gh run watch $(gh run list --workflow=youtube-upload.yml --limit 1 --json databaseId -q '.[0].databaseId')`
   → 成功したら video URL をログから確認し、oEmbed でチャンネル (`@stats47jp`) を実測確認
6. **翌日ガード 3** を実行し結果を `docs/15_実験ログ/youtube/` に記録

> 予約投稿は `privacy: "private"` + `publish_at` (JST ISO)。詳細は `docs/10_SNS戦略/07_YouTube量産実験.md` §5。

## 投稿手順 B: ローカル経路 (OAuth 再認証済みの場合のみ)

1. **OAuth 確認**: `node .claude/scripts/youtube/oauth-setup.js` (チャンネル選択は必ず stats47)
2. 手順 A の 1-2 と同じ
3. **アップロード** (`upload.js` が内部でガード 1・2 を再度実行し、投稿台帳 posts.json に自動記録):
   ```bash
   node .claude/scripts/youtube/upload.js <動画ファイル> \
     --title "<タイトル>" --description "<説明>" \
     --tags "都道府県,ランキング,統計" \
     --thumbnail <サムネイル.png> \
     --metric-keys '<json配列>' --template <composition-id> --content-key <key> \
     --privacy public
   ```
4. **翌日ガード 3** を実行し結果を記録

## 投稿後

- 投稿は `upload.js` が `sns-posts-store.cjs` 経由で posts.json に自動記録する (別途 `/mark-sns-posted` 不要)
- メトリクスは `/update-sns-metrics` で後日 UPDATE

## 参照

- チャネル規約・頻度リミット・タイトル雛形: `.claude/rules/sns-content-standards.md` (§1 §2-6)
- 量産実験の実装手順書 (CI 経路の詳細): `docs/10_SNS戦略/07_YouTube量産実験.md`
- CI workflow: `.github/workflows/youtube-upload.yml` (リクエストファイル駆動・develop push で発火)
- 動画生成: `/bar-chart-race`
- 経緯: `.claude/agents/youtube-strategist.md` / memory `project_youtube_shadowban_recovery_2026_04` / `project_youtube_mass_experiment_2026_07`
- ガードスクリプト: `.claude/scripts/lib/check-youtube-{post-budget,duplicate}.cjs` / `.claude/scripts/youtube/diagnose-shadowban.js`
