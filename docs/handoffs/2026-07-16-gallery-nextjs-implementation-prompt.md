---
type: session-handoff
date: 2026-07-16
status: active
tags: [gallery, nextjs, claude-code, implementation-prompt]
---

# Claude Code 実装プロンプト: 統合メディアコンソール完全 Next.js 化

以下のコードブロック全体を、stats47 リポジトリのルートで開いた Claude Code に渡す。

```text
Output Format:
- 最初に「成功条件 / 変更対象 / 変更しない対象 / 検証計画」を簡潔に提示する。
- 作業の節目で、完了・検証済み・残タスクを報告する。
- 最終報告は「結果 / 主な変更 / 検証結果 / 未実行・残リスク / 変更ファイル」の順にする。
- 失敗した検証は隠さず、原因と未解決事項を書く。

stats47 のローカル統合メディアコンソールを、独立 Next.js App Router workspace
`apps/gallery` へ完全に移管してください。

これは段階移行ではなく完全置換です。旧 `node:http` / Vanilla JS 実装との後方互換、
旧新併存、API contract の維持、旧サーバーへの fallback は不要です。利用中の機能と
安全ガードを Next.js で再実装した後、旧実装を削除し、Next.js だけが残る状態まで
今回の作業で完了させてください。

まず必ず読む:
1. `CLAUDE.md`
2. `.claude/memory/MEMORY.md`
3. `.claude/rules/coding-standards.md`
4. `.claude/rules/ui-components.md`
5. `.claude/rules/local-environment.md`
6. `.claude/rules/sns-content-standards.md` §5.5
7. `.claude/rules/docs-vs-issues.md`
8. `.claude/rules/agent-output-contract.md`（Agent tool を使う場合）
9. `docs/02_実装計画/26_統合メディアコンソールNextjs移行仕様.md` §0

現行機能の調査対象:
- `.claude/scripts/gallery/server.mjs`
- `.claude/scripts/gallery/{index,sns,assets,svg,dashboard}.html`
- `.claude/scripts/gallery/dashboard-data.mjs`
- `.claude/scripts/lib/gallery-collectors.mjs`
- `.claude/scripts/lib/svg-classify.mjs`
- `.claude/scripts/lib/sns-posts-store.cjs`
- `packages/components/package.json`
- `packages/components/src/index.ts`
- root `package.json` / `package-lock.json` / `turbo.json`

開始前に `git status --short` を確認してください。他セッションの未コミット変更を
修正・整形・削除・stash しないでください。ギャラリー移管と無関係な差分には触れないで
ください。

成功条件:
- `apps/web` とは分離した `apps/gallery` が Next.js App Router で実装されている。
- `npm run gallery` で `http://127.0.0.1:4747/` に起動する。
- `PORT=<port> npm run gallery` でポートを上書きできる。
- bind 先は必ず `127.0.0.1`で、`0.0.0.0` や LAN に公開しない。
- `/`, `/sns`, `/assets`, `/svg`, `/dashboard` で、現在利用している表示と操作が行える。
- SNS 台帳、IG schedule、R2、dashboard の SSOT を変更せず、複製 store を作らない。
- posts.json への書き込みは引き続き `sns-posts-store.cjs` 経由にする。
- X 7日 dry-run ガード、IG 二重書き込み、YouTube confirm、regenerate whitelist、
  job 同時実行1件を維持する。
- local mp4 の Range 配信と seek、path traversal / symlink escape 防止が動作する。
- `.claude/scripts/gallery/` の旧 server、5 HTML、gallery 専用の `dashboard-data.mjs` が削除されている。
- root `package.json` の `gallery` は `apps/gallery` を起動する。旧 `sns:gallery` alias は削除する。
- 旧 server の proxy、compatibility API、feature flag、fallback コードが残っていない。
- 共有 `.claude/scripts/lib/gallery-collectors.mjs` と `svg-classify.mjs` は CI 利用があるため削除しない。
- type-check、test、build、localhost の画面確認が成功する。

再設計してよいもの:
- Next.js 内部の API path、request/response shape、HTTP status
- React component の分割、server/client data flow
- ページ内の loading / error / empty state
- フォームや dialog の構成
- ジョブポーリングの内部実装

変更してはいけないもの:
- SNS 投稿台帳、IG schedule JSON、R2、metrics/state/docs の SSOT
- 投稿頻度とチャネル運用ルール
- 破壊的アクション前の確認と入力ガード
- CI 静的ギャラリーが共有している collector

実装方針:
1. `apps/gallery` に Next.js 15.1.7 / React 19.2 / TypeScript の最小 workspace を作る。
2. デフォルトは Server Component。イベント、filter、フォーム、job polling だけ Client Component にする。
3. filesystem / `child_process` を使うコードは `server-only`、Node.js runtime、dynamic/no-store にする。
4. 入出力型と Zod schema、server domain logic、Route Handler、UI を分離する。
5. job registry は HMR で二重化しない型付き `globalThis` singleton にする。永続 DB は作らない。
6. local file は `realpath` を含む base directory 検査を通し、Range 200/206/416 を正しく扱う。
7. UI primitive は `@stats47/components` を優先する。動的な R2/local プレビューは `<img>` / `<video>` でよい。
8. SWR、TanStack Query、Zustand、DI framework など、今回不要な抽象化は追加しない。
9. 旧コードから必要な業務ロジックを移植し、Next.js で動作したら旧実装をすべて削除する。
10. 今回は Next.js 移管に限定し、agent / skill 管理ページやその他の新機能は追加しない。

安全な検証:
- 読み取りは実データで確認してよい。
- post 書き込み、IG schedule、filesystem 更新は `/tmp/` fixture へ差し替える。
- X は dry-run または spawn mock のみ。
- YouTube upload、IG 実予約、regenerate/R2 push は実行せず spawn/network mock で検証する。
- UI の破壊的アクションは E2E で API を mock する。

必須検証:
- root で `npm install`し、workspace と `package-lock.json` を同期する。
- `npm run type-check --workspace=apps/gallery`
- `npm run test --workspace=apps/gallery`
- `npm run build --workspace=apps/gallery`
- `npm run gallery` を常駐起動し、Ready を polling して `127.0.0.1:4747` の listen を確認する。
- ホーム / SNS / assets / SVG / dashboard の主要操作を Playwright で確認する。
- desktop と 390px 幅、browser console error 0、主要ページ 200 を確認する。
- local mp4 を seek できること、Range 206/416、path traversal / symlink escape 防止をテストする。
- 共有 collector を使う既存静的ギャラリーの最小 smoke を実行する。
- `rg` で削除した旧 server/HTML/コマンドへの古い参照が残っていないか確認する。

完全移管時の必須更新:
- root `package.json`: `gallery` を `apps/gallery` 起動へ変更し、`sns:gallery` を削除
- `.claude/rules/local-environment.md`
- `.claude/rules/sns-content-standards.md` §5.5
- `.claude/memory/project_sns_gallery_and_ig_cron_fix.md`
- `.claude/memory/MEMORY.md`
- `.claude/launch.json`
- `docs/todo/02_機能バックログ.md` の `GALLERY-NEXTJS-01`
- `docs/02_実装計画/00_INDEX.md`
- `apps/gallery/README.md`（起動、構成、SSOT、安全ガード、検証コマンド）

削除対象:
- `.claude/scripts/gallery/server.mjs`
- `.claude/scripts/gallery/{index,sns,assets,svg,dashboard}.html`
- `.claude/scripts/gallery/dashboard-data.mjs`（ロジックを `apps/gallery` へ移植後）
- 旧実装だけに必要だった参照・設定・CORS/file:// 互換コード

削除禁止:
- `.claude/scripts/lib/gallery-collectors.mjs`
- `.claude/scripts/lib/svg-classify.mjs`
- `.claude/scripts/lib/sns-posts-store.cjs`
- SNS state / schedule / R2 / dashboard が読む正典ファイル

スコープ外:
- agent / skill 管理ページ
- 本番デプロイ、PR、push、R2 書き込み
- X 本投稿、IG 実予約、YouTube upload
- リモート公開、認証、DB、新しい JSON SSOT
- `apps/web` の変更、無関係な refactor、dependency upgrade
- ユーザーの明示指示なしの commit

互換レイヤーや旧実装を残して「一部移行完了」としないでください。Next.js だけで
利用中機能が動き、旧コードと古い参照が削除され、検証が通った状態を完了としてください。

実装完了後も commit / push / PR / deploy は行わず、変更内容と検証結果を報告して
停止してください。
```
