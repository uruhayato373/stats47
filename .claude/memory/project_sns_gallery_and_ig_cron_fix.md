---
name: project_sns_gallery_and_ig_cron_fix
description: 統合メディアコンソール(ローカル4747 npm run admin、実装=apps/admin Next.js・2026-07-16完全移管)=SNS投稿(/sns)+画像ライブラリ(/ops/image-library。旧 /assets・/svg は 2026-10-27 廃止)+現況(/dashboard)。R2動画30日自動削除。IG自動投稿が約1ヶ月空振りcronバグ修正
metadata: 
  node_type: memory
  type: project
  originSessionId: fe123946-90e4-4044-aa73-e28061792715
---

SNS 投稿ギャラリー管理画面 + IG cron 修正 + R2 コスト対策 (feature/sns-gallery, 2026-07-07 develop merge 済)。

## 統合メディアコンソール (ローカル専用・2026-07-07 に SNS 単機能→全メディア横断に拡張)
- 起動: `npm run admin` → http://127.0.0.1:4747/ (skill `/admin-console`。`PORT=` で上書き可)
- **実装は独立 Next.js アプリ `apps/admin`** (App Router・127.0.0.1 bind 固定。**2026-07-16 に旧 node:http + vanilla JS 実装 `.claude/scripts/gallery/` から完全移管・旧実装と `sns:gallery` alias は削除**。構成・安全ガードは `apps/admin/README.md`)
- **主要画面**: `/` ホーム(件数サマリ) / `/sns` SNS投稿 / `/ops/image-library` 画像ライブラリ (OGP・リンクカード・note・SNS・ブログ SVG。旧 `/assets`・`/svg` は 2026-10-27 に廃止)
- **共有 collector**: `.claude/scripts/lib/gallery-collectors.mjs`(列挙 buildTab/note-image/video)+`svg-classify.mjs`(分類)を CI 静的ギャラリー `ogp/build-image-gallery.mjs`(--audit 週次ゲート)と共用。R2 list 不可 → sitemap/all.json/note state/archive-manifest 起点+HEAD probe
- SNS: `/sns` は投稿ID台帳。画像一覧/表、ID・本文検索、型/状態フィルタ、予約順・JST表示、Drive保全素材のプレビュー。2026-10-11 オーナー指示で下書き本文編集を追加。保存時は版を検査し承認待ちへ戻す。操作契約は `apps/admin/README.md`「SNSのID台帳」「安全ガード」
- 管理画面の書込は下書き本文だけ。予約・投稿・生成はowner agent/skillが担う。予約済み・公開済みの本文は閲覧用
- SNS素材は投稿IDに紐づくDrive保全素材を優先し、ローカル/R2へフォールバック。家計レシート・県図鑑・順位乗換も一覧と型フィルタに対応
- 展開候補: `/sns?scope=candidates`。`planning` に企画名・出どころ・確認事項、`material_keys` に元素材の別名を保持。既存/削除済みへの紐付けを優先する `reconcile-materials.mjs` で重複登録を防止。確認用プレビューはthumbnailで投稿素材と区別
- 2026-10-12: 確認用44件を同じIDで投稿用140枚＋本文へ更新（X11件、IG33件）。`preview_only=false`。画像はDriveの各ID配下、再現用props/manifest/入力は同じIDの`production-2026-10-12/`、投稿用コピーは`.local/r2/sns/<domain>/<key>/<platform>/{stills,caption.txt,props.json}`。2026-10-12にオーナーが44件の予約を指示。X11本は11/2〜11/12（11/3のみ12:15、他19:15 JST）、IG33本は11/1〜12/5の19:00（11/18・11/30は同型連日を避けて空ける）。IG配信は`instagram-w44`〜`w49`の予約表＋承認済みIDをdevelopから既存cronが読む。予約表だけのローカル保存では実予約にならないため、画像/本文のR2公開URL/SHA照合・全33件dry-run・develop反映まで確認する。#1133/#1134は現行相関gateで元ペアが不採用となり、収入×消費支出／第2次産業就業割合×共働き割合に差替え（元素材キーは保持）。
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
