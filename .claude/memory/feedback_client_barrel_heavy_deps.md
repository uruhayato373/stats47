---
name: feedback_client_barrel_heavy_deps
description: 開発サーバーが遅い・メモリで再起動するときは R2 より先に入口 (barrel) 経由でブラウザ向けに入る重い依存を疑う。全指標 registry・全テーマ定義・GIS 原典処理が実例 (2026-10-21)
metadata:
  node_type: memory
  type: feedback
  originSessionId: d3c7e2bb-de58-44a0-94f7-7f3ab787b91e
  modified: 2026-10-21T08:39:17.580Z
---

`npm run dev:web` が遅い、R2 snapshot が 10 秒で打ち切られる、「approaching the used memory threshold」で再起動する、という症状は、R2 やネットワークではなく**入口 (barrel / index.ts) 経由でブラウザ向けのバンドルに重い依存が入ること**が原因だった。2026-10-21 に 8GB の Mac で、ランキング詳細の初回コンパイルは 171 秒 (20,133 モジュール) かかり、県ページは 20,399 モジュールだった。

**Why:** 小さな関数を `@stats47/ranking` や `@stats47/data-configs/theme-catalog` の入口から読むだけで、指標定義 2,643 件の registry まで一緒に入っていた。県ページは `features/geo-analysis` の入口を経由して GIS の原典処理 (unzipper・proj4) まで読み込んでいた。テーマ切替は名前を出すためだけに全テーマ定義 (本番で 324KB) を持ち込んでいた。開発ビルドは使わない export を捨てないので全部コンパイルされる。本番も、data-configs は `sideEffects` を宣言していないので安全とは限らない。

**How to apply:** まず R2 の公開 URL を curl で叩き、R2 が遅くないことを確かめる。次に webpack のモジュール一覧 (next.config の一時プラグイン) や TypeScript の import 解析で、何がブラウザ向けに入るかを測る。重い部品は小さな公開口 (`registry-checks`・`mlit-ksj/catalog`・`geo-analysis/area` 等) に分け、サーバーで作った軽い値を props で渡す。逆戻りは `apps/web/src/__tests__/client-bundle-boundary.test.ts` と `packages/ranking/src/__tests__/client-entry-registry-boundary.test.ts` が止める。新しい入口を作ったらそこへ足す。Turbopack はキャッシュなしでも 7 秒台と速いが、テーマ詳細で webpack に無い hydration の不一致が出たので既定にしていない。関連: [[run-full-web-tests-before-push]]
