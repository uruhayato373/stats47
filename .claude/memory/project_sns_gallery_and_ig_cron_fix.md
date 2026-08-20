---
name: project_sns_gallery_and_ig_cron_fix
description: 統合メディアコンソール(ローカル4747 npm run admin、実装=apps/admin Next.js・2026-07-16完全移管)=SNS投稿(/sns)+画像資産(/assets OGP/カード/note/動画・欠落チェック・再生成)+SVGカタログ(/svg)+現況(/dashboard)。R2動画30日自動削除。IG自動投稿が約1ヶ月空振りcronバグ修正
metadata: 
  node_type: memory
  type: project
  originSessionId: fe123946-90e4-4044-aa73-e28061792715
---

SNS 投稿ギャラリー管理画面 + IG cron 修正 + R2 コスト対策 (feature/sns-gallery, 2026-07-07 develop merge 済)。

## 統合メディアコンソール (ローカル専用・2026-07-07 に SNS 単機能→全メディア横断に拡張)
- 起動: `npm run admin` → http://127.0.0.1:4747/ (skill `/admin-console`。`PORT=` で上書き可)
- **実装は独立 Next.js アプリ `apps/admin`** (App Router・127.0.0.1 bind 固定。**2026-07-16 に旧 node:http + vanilla JS 実装 `.claude/scripts/gallery/` から完全移管・旧実装と `sns:gallery` alias は削除**。構成・安全ガードは `apps/admin/README.md`)
- **4 セクション**: `/` ホーム(件数サマリ) / `/sns` SNS投稿 / `/assets` 画像資産(OGP・リンクカード light/dark・note カバー・note記事内画像・動画master。欠落チェック=HEAD probe / 再生成=kind ホワイトリストで generate系 spawn) / `/svg` ブログSVGカタログ(6カタログ分類)
- **共有 collector**: `.claude/scripts/lib/gallery-collectors.mjs`(列挙 buildTab/note-image/video)+`svg-classify.mjs`(分類)を CI 静的ギャラリー `ogp/build-image-gallery.mjs`(--audit 週次ゲート)と共用。R2 list 不可 → sitemap/all.json/note state/archive-manifest 起点+HEAD probe
- SNS: X/IG/YT タブ × status フィルタ。動画は `<video>` 再生、caption 編集 (PATCH ホワイトリスト caption/scheduled_at のみ)、残枠バッジ (X週2-3/IG週3/YT月1)
- 投稿はハイブリッド: X=publish-x spawn (dry-run/予約/即時・同時1・7日ぶりは dry-run 強制428) / IG=予約登録のみ (schedule JSON + posts.json 同時、実投稿は cron) / YT=upload.js spawn (月1+重複ガード内蔵・confirm必須)
- 素材は R2、ローカル無ければ R2 公開URL直参照。R2 list 不可 → 「R2探索」HEAD probe で発見→draft登録
- 台帳 SSOT は posts.json のまま (新DBなし)。書込は sns-posts-store.cjs 経由のみ。正典 `.claude/rules/sns-content-standards.md` §5.5

## ★IG cron バグ (約1ヶ月 IG 自動投稿が空振りしていた・2026-07-07 修正)
- `post-from-schedule.cjs` のデフォルト schedule ファイルが特定週固定 (w19=5/18-6/7) で、
  週替わりで手編集が必要だった。w20 (6/8-7/27) 期間中も w19 を読み続け **6/8以降の IG 投稿が発火せず**。
- 修正: `instagram-w*-schedule.json` を全走査し**当日エントリを含む週ファイルを自動選択**。
  IG_SCHEDULE_FILE 明示時はそれを使う (後方互換)。トークン検証は当日エントリ確定後 (assertToken) に移動。
- 検証: `IG_FORCE_DATE=YYYY-MM-DD node .claude/scripts/instagram/post-from-schedule.cjs` でファイル解決を確認。
- 副次で sns-posts-store.cjs の insert 採番を `max(nextId, maxId+1)` に防御修正 (stale nextId で id 重複が実発生)。

## R2 コスト対策 (投稿済み動画の30日自動削除)
- R2 は無料枠10GB超過・課金中 (2026-07 で 20.65GB)。動画(.mp4)は再レンダー可能な派生物。
- `packages/r2-storage/src/scripts/cleanup-posted-sns-videos.ts`: status=posted && posted_at≤now-30日 の
  content_key の **.mp4 のみ削除** (png/caption.txt/posts.json記録・メトリクスは永続)。draft/scheduled 残るキーは保護。
  **dry-run 既定・--execute で実削除**。ローカル dry-run 実測: 対象13本/112MB。
- `.github/workflows/cleanup-r2-sns-videos.yml` (weekly 日曜04:00 JST + dispatch)。schedule実行は実削除。
- 削除済み動画を再投稿したい場合は Remotion で再レンダー。

[[project_sns_reorg_2026_07]] [[feedback_shared_working_copy_git_race]]
