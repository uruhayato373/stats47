---
name: windows-remotion-render
description: Windows で Remotion を描くには rspack と compositor の Windows 用部品を手元へ入れ、Chrome を指定する。npm ci で消える
metadata:
  node_type: memory
  type: feedback
  originSessionId: eb4958fe-f37c-428f-bbfd-1dd7c7637ab6
  modified: 2026-11-06T06:43:18.349Z
---

この Windows PC では `@rspack/binding-win32-x64-msvc` と `@remotion/compositor-win32-x64-msvc` が lock に無く、Remotion の描画が止まる。`npm pack <パッケージ>@<版>` で取り、`tar --force-local -xzf` で `node_modules/@rspack/...`・`node_modules/@remotion/...` へ展開すると動く (2026-11-06 に 4.0.517 / rspack 1.7.11 で確認)。ブラウザは入っている Chrome を `browserExecutable` で渡す。

**Why:** lock は Mac で作られ、Windows の任意依存が入らない。`npm ci` や再インストールで消える。

**How to apply:** 「Windows では描けない」と言う前に上の手順を試す。見本の作成は `npm run review-videos --workspace remotion` で、R2 の取得には会社のプロキシ用の `NODE_OPTIONS` が要る。`RankingShort` の既定 `gesBackground: true` は `public/backgrounds/ges/` の動画を読むが、この PC には無いので、見本は `false` で描く。関連: [[windows-npm-install-rolldown-binding]]、[[windows-script-portability]]
