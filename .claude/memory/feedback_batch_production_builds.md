---
name: feedback-batch-production-builds
description: 画面の確認で本番ビルド (1 回 10 分) を修正ごとに回さない。dev で確かめ、本番ビルドは変更をまとめて 1 回。dev が壊れていたら先に dev を直すか、修正をためてからビルドする (2026-10-28 に 6 回回して指摘)
metadata:
  type: feedback
---

**事象 (2026-10-28)**: 見本合わせと詳細パネルの確認で、本番ビルド (`npm run build -w apps/web` → `next start -p 3200`、1 回 10 分前後) を
6 回回した。開発サーバーが使えず (Turbopack は sitemap.xml の衝突で全ページ 500、webpack の dev は hydrate しない)、
「直す → ビルド → 見る → 直す → ビルド」を 1 件ずつ回したため。オーナーから「本番ビルドを何回も回すのを効率化した方がいい」と指摘された。

**Why:** メモリの少ない Mac では本番ビルドが作業時間の大半を占める。1 回のビルドで見つかる不具合は、まとめて直してから次の 1 回で確かめれば足りる。

**How to apply:**
- 画面の確認はまず dev (`npm run dev:web`) で行う。dev が壊れていたら、本番ビルドを繰り返す前に dev を直す作業を提案する ([[feedback-dev-server-web-only]])
- 本番ビルドは節目に 1 回。その 1 回で線の格子の検査・見本との測り比べ・画面の目視をまとめて行い、見つけた修正はためて次の節目に回す
- 入口は `npm run check:release-local` (本番ビルド 1 回を代表ページの検査と共有する)
- 同日に dev が使えなかった原因は 2 つで、どちらも直した: ① Turbopack が `/sitemap.xml` の route と metadata の衝突で全ページ 500 (index の route を `app/sitemap-index.xml/` へ移し rewrites で書き換え)、② `127.0.0.1` で開くと Next.js 16 の dev が開発用リソースを止めて hydrate しない (`allowedDevOrigins: ["127.0.0.1"]`)。「dev でボタンが動かない」ときは、まず URL を `localhost` に変えて比べる
