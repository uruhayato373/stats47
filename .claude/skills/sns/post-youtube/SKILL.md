---
name: post-youtube
description: YouTube に「月1本のみ」の慎重再開ポリシーで動画を投稿する。Use when user says "YouTube投稿", "YouTubeアップロード", "YT投稿". シャドウバン再発防止ガード3点(月1上限・重複・翌日診断)を必ず通す。
disable-model-invocation: true
argument-hint: "<動画ファイル> --title <タイトル> [--description <説明>] [--thumbnail <png>] [--metric-keys <json>] [--template <id>] [--content-key <key>]"
primary_agent: youtube-strategist
---

# /post-youtube — YouTube 月1本の慎重投稿

YouTube は 2026-05-29 に完全撤退したが、2026-07 に**月 1 本の慎重再開**へ方針変更した
(`.claude/rules/sns-content-standards.md` §0)。シャドウバンの真因 (68 本/月の量産 + 同タイトル再投稿 28 本、
2026-04 Issue #88) を二度と踏まないため、**ガード 3 点を必ず通す**。量産・Shorts 連投は禁止。

> **⚠️ 復元済スクリプト・初回は OAuth 再認証が必要**: 撤退時に YouTube サブシステムを削除したため、
> `.env.local` の `GOOGLE_OAUTH_*` トークンは失効している可能性が高い。**初回投稿前に
> `node .claude/scripts/youtube/oauth-setup.js` で再認証**すること。認証が通らない場合は投稿を中止し、
> ユーザーにトークン再発行を依頼する。

## 前提

- 動画は `/bar-chart-race` (BCR 長尺) で生成済み (47 県まとめ動画の生成スキルは撤退時に削除済み)
- 高品質 1 本のみ。**今月すでに YouTube に投稿していれば投稿しない** (ガード 1 が停止する)

## ガード 3 点 (すべて必須)

### ガード 1: 月1上限 + 停止期間チェック

```bash
node .claude/scripts/lib/check-youtube-post-budget.cjs || exit 1
```
今月すでに 1 本 (posted + scheduled) あれば exit 1。`.claude/state/youtube-pause.json` の pause 期間中も停止。

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

## 投稿手順

1. **OAuth 確認** (初回・久しぶりの場合): `node .claude/scripts/youtube/oauth-setup.js`
2. **タイトル生成**: 50 字以内・SEO キーワード先頭・**過去タイトルと重複させない** (雛形 rules §2-6)
3. **ガード 1 → 2 を実行** (どちらか exit 1 なら中止)
4. **アップロード** (`upload.js` が内部でガード 1・2 を再度実行し、投稿台帳 posts.json に自動記録):
   ```bash
   node .claude/scripts/youtube/upload.js <動画ファイル> \
     --title "<タイトル>" --description "<説明>" \
     --tags "都道府県,ランキング,統計" \
     --thumbnail <サムネイル.png> \
     --metric-keys '<json配列>' --template <composition-id> --content-key <key> \
     --privacy public
   ```
5. **翌日ガード 3** を実行し結果を `docs/15_実験ログ/youtube/` に記録

## 投稿後

- 投稿は `upload.js` が `sns-posts-store.cjs` 経由で posts.json に自動記録する (別途 `/mark-sns-posted` 不要)
- メトリクスは `/update-sns-metrics` で後日 UPDATE

## 参照

- チャネル規約・頻度リミット・タイトル雛形: `.claude/rules/sns-content-standards.md` (§1 §2-6)
- 動画生成: `/bar-chart-race`
- 撤退・回復の経緯: `.claude/agents/youtube-strategist.md` / memory `project_youtube_shadowban_recovery_2026_04`
- ガードスクリプト: `.claude/scripts/lib/check-youtube-{post-budget,duplicate}.cjs` / `.claude/scripts/youtube/diagnose-shadowban.js`
