---
type: implementation-spec
date: 2026-07-16
status: ready
tags: [gallery, nextjs, local-tooling, media-console]
---

# 統合メディアコンソール Next.js 移行仕様

## 0. 最新決定: 段階移行ではなく完全置換する

2026-07-16 のオーナー決定により、旧 `node:http` / Vanilla JS 実装との後方互換、
旧新併存、API path / response の 1:1 互換、段階 cutover は要件から外す。

以下を最新の実装方針とする。本節と後続節が衝突する場合は本節を優先する。

- 利用中の画面機能、SSOT、投稿/予約/再生成の安全ガードは Next.js へ移植する。
- 内部 API は Next.js 向けに再設計してよく、旧 path、status、response shape を維持する必要はない。
- `.claude/scripts/gallery/` の旧 server / HTML / gallery 専用 collector は、必要ロジックの移植後に削除する。
- 旧 server への proxy、adapter、compatibility route、feature flag、フォールバックは残さない。
- root の正式コマンドは `npm run gallery`。旧 `npm run sns:gallery` alias は削除する。
- 旧/新サーバーの並行起動や API 比較は行わず、Next.js 実装単体の機能テストで完了判定する。
- 今回は Next.js 移管のみを行い、agent / skill 管理などの新機能は追加しない。

後続の §7 API 表は「現行機能を理解するための調査資料」、§9 / §11 / §13 の
互換 cutover 記述は superseded とし、最新の Claude Code 実装指示は
`docs/handoffs/2026-07-16-gallery-nextjs-implementation-prompt.md` を正とする。

## 1. 結論

現行のローカル統合メディアコンソールを、公開サイト `apps/web` とは分離した
**Next.js App Router アプリ `apps/gallery`** へ移行する。

利用者向けの入口は変えない。

```bash
npm run gallery
# http://127.0.0.1:4747/
```

旧 `npm run sns:gallery` も後方互換 alias として維持する。本アプリは localhost 専用であり、
Cloudflare、Vercel、R2 static hosting などへはデプロイしない。

## 2. 背景と移行理由

現行実装は `.claude/scripts/gallery/` 配下の依存ゼロ `node:http` + Vanilla JS で、
およそ 2,200 行に増えている。

- 5 画面: `/`, `/sns`, `/assets`, `/svg`, `/dashboard`
- 読み取り・書き込み・アクションを含む 15 以上の API
- X / Instagram / YouTube の投稿・予約
- 画像再生成ジョブとログ監視
- OGP / カード / note / 動画 / SVG の横断カタログ
- ローカル動画の HTTP Range 配信
- state JSON / metrics CSV / Markdown の読み取りミラー

今後も機能追加が見込まれ、単一の `server.mjs` と HTML 内のインライン JS/CSS では、
型の共有、UI 部品の再利用、ルート単位のテスト、差分レビューが難しくなっている。

## 3. ゴール

1. `apps/gallery` に Next.js App Router のローカル管理アプリを構築する。
2. 現行の URL、表示情報、投稿・予約ガード、HTTP status を維持する。
3. ページ、API、ドメインロジック、ジョブ実行、型を分離する。
4. 既存 SSOT と collector を保ち、別のデータストアを新設しない。
5. 機能追加時に、対応する Route Handler / component / test だけを変更できる状態にする。

## 4. 非ゴール

- 公開サイト `apps/web` への統合
- リモート公開、認証、マルチユーザー化
- R2 / git TS / posts.json / schedule JSON / metrics の SSOT 変更
- 投稿頻度、cron、OGP 生成コマンドの仕様変更
- ギャラリー移行と無関係な公開サイトの UI 改修
- 初回移行と同時の新機能追加や全面的な UX リデザイン
- 新しい汎用フレームワーク、グローバル状態管理、データフェッチライブラリの導入

## 5. 不変条件

### 5.1 起動とネットワーク

- `npm run gallery` で起動する。
- 既定ポートは `4747`。`PORT=5000 npm run gallery` も維持する。
- `0.0.0.0` や LAN IP に bind せず、必ず `127.0.0.1` に bind する。
- `file://` で HTML を直接開く互換性は廃止し、same-origin の localhost UI だけを許可する。
- CORS `*` は廃止し、Route Handler に CORS ヘッダーを追加しない。
- すべての filesystem / `child_process` 利用ルートは `runtime = "nodejs"` と
  `dynamic = "force-dynamic"` を明示する。Edge runtime では実行しない。

### 5.2 SSOT

- SNS 投稿台帳: `.claude/state/sns/posts.json`
- 台帳書き込み: `.claude/scripts/lib/sns-posts-store.cjs` 経由のみ
- Instagram 予約: `.claude/state/instagram-w*-schedule.json` + posts.json の二重書き込み
- ローカル SNS 素材: `.local/r2/sns`
- ブログ OGP パイロット: `.local/ogp-pilot`
- 配信素材: R2。公開 URL から読み、list は前提にしない。
- dashboard: state JSON / metrics CSV / Markdown の読み取り専用ミラー

Next.js 側に DB、独自 JSON、複製 manifest を新設しない。

### 5.3 書き込みと外部作用のガード

- post 編集は `caption` / `scheduled_at` のみ。
- post 登録は常に `status = "draft"`。
- IG 予約は過去日不可、1日1件、対象 week JSON + posts.json を同一処理で更新する。
- X は最後の成功から 7 日超なら、`force:true` がない限り dry-run を先に強制する。
- YouTube は `confirm:true`、`video_file`、`title` を必須とし、ファイル実在を確認する。
- 再生成は `REGEN` ホワイトリスト内の kind のみ。`keys` は `^[a-z0-9,_-]+$`。
- ジョブは同時実行 1 件、ログ保持は末尾 500 行。
- 画面の読み込みや再描画だけで、投稿・予約・R2 書き込みを実行しない。

## 6. 採用アーキテクチャ

### 6.1 アプリ境界

```text
apps/gallery/                       # localhost 専用 Next.js アプリ
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx                  # /
│   ├── sns/page.tsx              # /sns
│   ├── assets/page.tsx           # /assets
│   ├── svg/page.tsx              # /svg
│   ├── dashboard/page.tsx        # /dashboard
│   ├── media/[...path]/route.ts   # Range 対応ローカル配信
│   ├── pilot/[...path]/route.ts
│   └── api/                       # 現行 API と 1:1 対応
├── components/
│   ├── console-nav.tsx
│   ├── async-state.tsx           # loading / empty / error
│   ├── job-dialog.tsx
│   ├── media-preview.tsx
│   └── <page-specific>/
├── lib/
│   ├── client/
│   │   └── api-client.ts
│   ├── contracts/                 # API 入出力型と入力 schema
│   └── server/
│       ├── project-root.ts
│       ├── posts.ts
│       ├── inventory.ts
│       ├── limits.ts
│       ├── instagram.ts
│       ├── assets.ts
│       ├── svg-catalog.ts
│       ├── dashboard.ts
│       ├── jobs.ts
│       ├── actions.ts
│       └── safe-local-file.ts
├── tests/
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

一つの大きな `gallery-service.ts` にまとめず、変更理由ごとに分ける。一方で、将来利用を
想定した repository インターフェースや DI container は作らない。

### 6.2 フレームワークと依存

- Next.js: `15.1.7`（root override / `apps/web` と同じ）
- React / React DOM: `19.2.x`
- TypeScript: root の現行版
- UI primitive: `@stats47/components`
- icon: `lucide-react`
- style: Tailwind CSS v3 + ギャラリー専用の最小 CSS variables
- validation: Zod v3（Route Handler の書き込み入力に使用）
- test: Vitest + Playwright

SWR、TanStack Query、Zustand などは導入しない。ページ内状態は `useState` / `useEffect` と
小さな fetch wrapper で十分。

### 6.3 プロジェクトルート解決

Next.js が `apps/gallery` を cwd として起動することを前提とし、ルートは一箇所で決定する。

```ts
const candidate = process.env.STATS47_PROJECT_ROOT
  ? path.resolve(process.env.STATS47_PROJECT_ROOT)
  : path.resolve(process.cwd(), '../..');
```

`candidate/package.json` の `name === "stats47-monorepo"` を起動時または初回アクセス時に検証し、
間違った cwd で別ファイルを読み書きしない。各モジュールが `../..` を個別に持たない。

### 6.4 Server / Client 分離

- `layout.tsx`、静的なページシェルは Server Component。
- フィルター、編集、ポーリング、メディア fallback だけを Client Component にする。
- filesystem、ストア、認証情報、コマンド文字列を Client Component へ渡さない。
- `lib/server/*` は `server-only` を import し、client bundle への混入を失敗させる。
- ローカル/R2 プレビューは URL が動的で SVG/動画も扱うため、`next/image` ではなく
  `<img>` / `<video>` を使う。例外理由をコンポーネントにコメントし、lint disable は局所化する。

### 6.5 既存 collector の扱い

以下は CI 静的ギャラリーと共有しているため、移行で複製・廃止しない。

- `.claude/scripts/lib/gallery-collectors.mjs`
- `.claude/scripts/lib/svg-classify.mjs`

Next.js の server-only adapter から直接 import する。TypeScript が型を推論できない場合は、
`any` や全体的な `@ts-ignore` で逃げず、必要な export だけの `.d.ts` または typed adapter を作る。

`dashboard-data.mjs` は現行ギャラリー専用なので、移行完了後に `apps/gallery/lib/server/`
へ TypeScript で移す。パース規則や欠損時の `{error}` 応答は変えない。

## 7. URL と API 互換性

### 7.1 画面

| URL          | 責務                                | 移行条件                                                |
| ------------ | ----------------------------------- | ------------------------------------------------------- |
| `/`          | セクション導線と件数サマリ          | 現行 4 セクションへの導線とサマリ値を維持               |
| `/sns`       | 投稿台帳、素材、caption、予約、投稿 | platform/status/search、残枠、整合性警告、操作を維持    |
| `/assets`    | 画像・動画資産                      | 11 タブ、limit/all、欠落チェック、再生成を維持          |
| `/svg`       | SVG 分類カタログ                    | catalog、table/unknown、limit/all、inspect 情報を維持   |
| `/dashboard` | プロジェクト現況                    | 読み取り専用、60 秒 TTL、セクション単位の欠損耐性を維持 |

### 7.2 API

Route Handler は、以下の method / path / 主要 status を維持する。成功応答のトップレベルの
key も変えない。

| Method | Path                       | 応答・制約                                          |
| ------ | -------------------------- | --------------------------------------------------- |
| GET    | `/api/posts`               | `{count, posts}`; `platform/status/domain/q` filter |
| GET    | `/api/inventory`           | `{posts, extras}`                                   |
| GET    | `/api/dashboard/summary`   | dashboard summary; 60秒 TTL                         |
| GET    | `/api/limits`              | `{limits, galleryState}`                            |
| GET    | `/api/ig-consistency`      | `{onlyInJson, onlyInPosts}`                         |
| GET    | `/api/jobs`                | `{jobs}`; log は `tail` 3行                         |
| GET    | `/api/jobs/:id`            | job 詳細; 不在は 404                                |
| GET    | `/api/assets/tabs`         | `{tabs}`                                            |
| GET    | `/api/assets/summary`      | SNS/blog/note/video 件数                            |
| GET    | `/api/assets/tab/:tab`     | `limit` / `all=1`; unknown tab は 400               |
| POST   | `/api/assets/check`        | `{checked, result}`; unknown tab は 400             |
| GET    | `/api/svg/catalog`         | `limit` / `all=1`; 失敗は 500                       |
| PATCH  | `/api/posts/:id`           | `caption/scheduled_at` のみ; 400/404                |
| POST   | `/api/posts`               | draft 登録; 必須欠落は 400; 成功 201                |
| POST   | `/api/probe-r2`            | `{found}`; `domain/content_key` 必須                |
| POST   | `/api/actions/schedule-ig` | IG 予約; 業務エラーは 400                           |
| POST   | `/api/actions/publish-x`   | 受付 202、実行中 409、dry-run 強制 428              |
| POST   | `/api/actions/publish-yt`  | 受付 202、入力不正 400、実行中 409                  |
| POST   | `/api/actions/regenerate`  | 受付 202、kind/keys 不正 400、実行中 409            |
| GET    | `/media/:path*`            | local SNS 素材、200/206/403/404/416                 |
| GET    | `/pilot/:path*`            | local OGP pilot、200/403/404                        |

エラー応答は常に `{error: string}` とする。予期しない例外で stack、env、credential、
完全なコマンド入力をクライアントに返さない。

### 7.3 画面操作の特性一覧

API が互換でも UI から到達できなければ回帰とみなす。次の操作を移植対象とする。

#### SNS

- platform: All / X / Instagram / YouTube
- status: All / draft / scheduled / posted
- `content_key` / caption 部分一致検索、手動再読み込み、件数表示
- X / Instagram / YouTube の残枠 `used/max` と超過表示
- IG schedule JSON と posts.json の不整合警告
- ローカル→R2 候補順の画像/動画 fallback、動画 controls、source badge
- posted の日時、impressions、likes、engagement、投稿 URL、caption 折りたたみ
- draft/scheduled の caption 編集、差分がある場合だけ保存ボタンを有効化
- X dry-run / 予約投稿 / 確認付き即時投稿、428 時の追加確認 + `force:true`
- IG 日時入力と cron 予約登録
- YouTube の動画ファイル、title、月 1 回確認から job 開始
- 台帳未登録素材の draft 登録
- job log dialog と完了後の残枠更新
- 初期表示上限 200 件と、超過件数の案内

#### Assets

- API が返すタブ順の動的 tab、key/slug 検索、limit、`all`、再読み込み
- タブの source / aspect / R2 key pattern 表示
- light / dark / video を含む variant 表示と page URL
- 画像/動画の読み込み失敗表示
- 表示中タブの欠落一括チェックとカード単位の成功/欠落表示
- 初期表示上限 400 件と、超過件数の案内
- 次の tab だけに再生成ボタンを表示する:
  - `blog-ogp` / `blog-card` → `blog-thumbnails`
  - `ranking-ogp` → `ogp-ranking`
  - `ranking-card` → `ogp-ranking-cards`
  - `areas-ogp` → `ogp-areas`
  - `note-cover` → `ogp-note-covers`
- 再生成は keys 入力、「生成→R2 push」の明示確認、job log dialog を必須とする

#### SVG

- 記事数 limit、全記事（重い処理）、手動読み込み
- count > 0 の catalog tab、catalog 説明、総 SVG 数 / 記事数
- `slug/file` 検索、SVG プレビュー、viewBox 表示
- `no viewBox` / `no dark` 警告
- 初期表示上限 300 件と、超過件数の案内

#### Dashboard

- GSC / GA4 / AdSense の最新値、週次比較、sparkline
- PSI 違反数、GSC coverage 要対応数
- blog 品質是正 / ai-content / 記事ネタ / SNS / 勝ちパターン / 実験の進捗カード
- 改善バックログの Tier / Status / Metric filter、未完了→Tier→期日順の sort、期日超過表示
- 機能バックログの section filter と section→Tier→ID 順の sort
- STP ポジショニング、ターゲティング判定、提言反映状況、SSOT 参照
- collector の一部が失敗しても、他セクションを表示する

## 8. 実装詳細

### 8.1 API 型と入力検証

- クライアントと Route Handler が共有する DTO を `lib/contracts/` に置く。
- 書き込み API と action API の body は Zod schema で検証する。
- query の `limit` は非負の有限整数だけを受け付ける。NaN / Infinity / 負数は 400。
- `platform` は `x | instagram | youtube`、status は現行台帳で許可する列挙に制限する。
- `unknown` から型ガードを通し、`any` は使わない。

入力強化により現行の正常入力を拒否しないこと。特に `scheduled_at: null`、日本語 caption、
comma 区切り keys を回帰テストする。

### 8.2 ジョブ管理

`jobs.ts` は server-only のプロセス内 singleton とする。Next.js dev の HMR でモジュールが
再評価されても二重 registry を作らないよう、型付き `globalThis` key に保持する。

- `Map<number, Job>`、sequence、running job id をひとまとめにする。
- `spawn` は shell 無しの `cmd + args[]` を原則とする。
- 既存 `ogpRegen` でやむを得ず `sh -c` を使う箇所は、kind と keys の検証後にのみ到達させる。
- stdout / stderr を行単位で追記し、500 行を超えた古い行を捨てる。
- `close` と `error` の両方で終了状態を確定し、実行中フラグを解放する。
- client は実行中だけ 1 秒間隔で job 詳細をポーリングし、success/failed で停止する。
- dev server 再起動で job 履歴が失われる現行仕様は維持する。永続 job DB は作らない。

### 8.3 ローカルファイル配信

`safe-local-file.ts` で次を共通化する。

1. URL segment をデコードする。
2. base directory から `path.resolve` する。
3. `path.relative(base, target)` が `..` で始まらず absolute でもないことを確認する。
4. regular file のみ許可する。symlink で base 外へ出られないよう `realpath` 後にも同じ検査を行う。

`/media` は `Range: bytes=start-end` を処理し、`Readable.toWeb(fs.createReadStream(...))` で
Web `Response` へ渡す。`content-range`、`content-length`、`accept-ranges`、MIME を現行同様に返す。

### 8.4 キャッシュ

- dashboard summary: プロセス内 60 秒 TTL
- SVG catalog: `limit/all` ごとにプロセス内 10 分 TTL
- posts、limits、inventory、jobs: 常に最新を読む
- HTTP 応答は `Cache-Control: no-store`。Next.js のビルド/ルーター cache を SSOT にしない。

### 8.5 UI

初回移行は情報設計と操作を変えず、現行の dark console を React 化する。

- 全ページ共通の sticky navigation、active state、page title
- loading / empty / recoverable error / fatal error を明示
- フォーム送信中は対象操作を disabled にし、二重送信を防ぐ
- 投稿・予約・R2 再生成は明示的なボタン操作と確認 UI からのみ実行
- keyboard focus、label、dialog title、ボタンの accessible name を持たせる
- デスクトップと 390px 幅で横スクロールなく基本操作できる
- `@stats47/components` の Button / Card / Input / Textarea / Tabs / Badge / Dialog を優先し、
  app-local に同等 primitive を再実装しない
- ギャラリーは公開サイトではないため `PageShell` や page_components を持ち込まず、専用シェルにする

## 9. 移行手順

### Phase 0: 現行仕様の特性化

1. 現行 `server.mjs` と 5 HTML の操作・API 利用を読む。
2. 上記 API 表の status / top-level key / 主要ガードを特性テスト一覧にする。
3. 現行サーバーを 4747 で起動し、読み取り API の応答形と画面を確認する。
4. 本番投稿、本番予約、R2 push はしない。

### Phase 1: `apps/gallery` scaffold

1. workspace package、Next.js、TypeScript、Tailwind、Vitest、Playwright の最小構成を追加する。
2. `next.config.ts` で `@stats47/components` を transpile 対象にする。
3. root `package-lock.json` を `npm install` で正常に更新する。
4. ホームと共通ナビゲーションを作る。
5. この時点で root `npm run gallery` は旧サーバーのままにする。

### Phase 2: server domain と読み取り API

1. project root、store adapter、media candidate、limits、inventory を実装する。
2. assets / SVG / dashboard collector を server-only adapter 経由で移す。
3. GET API と `/media` / `/pilot` を実装する。
4. 別ポート（例: 4748）で旧/新の読み取り API の形と件数を比較する。

### Phase 3: 読み取り UI

1. `/dashboard` → `/assets` → `/svg` → `/sns` の閲覧部分の順に移す。
2. 画像・動画 fallback、filter、search、tab、limit/all を再現する。
3. Playwright で 5 画面の読み込み、navigation、console error の無いことを確認する。

### Phase 4: 書き込みと action

1. post draft 登録、caption/scheduled_at 編集、IG 予約を移す。
2. job registry、X / YouTube / regenerate action、job dialog を移す。
3. 自動テストでは store / spawn / filesystem を一時ディレクトリまたは mock に差し替える。
4. X は dry-run のみ手動確認可。YouTube upload、IG 本予約、R2 push は実行しない。

### Phase 5: cutover

1. パリティゲートをすべて通す。
2. root `gallery` / `sns:gallery` を `apps/gallery` 起動へ切り替える。
3. 旧 `.claude/scripts/gallery/server.mjs` と 5 HTML を削除する。
4. `dashboard-data.mjs` は TS 移行済みを確認して削除する。
5. 共有 collector 2 ファイルは残す。
6. ドキュメント、memory、backlog の参照先を更新する。

Phase 2〜4 の途中は、旧実装を削除しない。旧新のポートを分けて比較できる状態を保つ。

## 10. テスト計画

### 10.1 Unit

- JST の週開始/月開始と頻度カウント
- media candidate の優先順位と重複除去
- IG schedule 対象ファイル選択、過去日、1日1件ガード
- IG consistency の片側欠落検出
- regenerate kind / keys のホワイトリスト
- safe path の `..`、URL encode、absolute path、symlink 脱出防止
- Range parser の通常、開始省略、終了省略、範囲外
- job 同時実行 1 件、500 行上限、close/error 状態遷移
- Zod schema の成功/失敗と HTTP status mapping

### 10.2 Route integration

- GET API の top-level key と `Cache-Control: no-store`
- post PATCH whitelist、not found、empty patch
- draft 登録の `status=draft`
- X の 400/409/428/202
- YouTube の confirm / file existence / 409/202
- regenerate の 400/409/202
- media の 200/206/403/404/416 と必須ヘッダー
- エラーに stack / credential が含まれないこと

### 10.3 E2E

- 5 画面が 200 で表示され、共通ナビで遷移できる
- SNS の platform / status / query filter
- caption 編集の二重送信防止（一時 store）
- assets の tab / limit / all と欠落チェック（network mock 可）
- SVG catalog filter
- job dialog の running → success/failed とポーリング停止
- 390px と desktop の主要ビューで横溢れがない
- browser console error 0

### 10.4 実行コマンド

```bash
npm install
npm run type-check --workspace=apps/gallery
npm run test --workspace=apps/gallery
npm run build --workspace=apps/gallery
npm run gallery
```

起動後に別シェルで:

```bash
curl -fsS http://127.0.0.1:4747/api/assets/summary
curl -fsS http://127.0.0.1:4747/api/limits
curl -fsS http://127.0.0.1:4747/api/dashboard/summary
```

## 11. パリティゲート（cutover の必須条件）

- [ ] `npm run gallery` で `127.0.0.1:4747` だけに listen する
- [ ] `PORT=<port>` override が動作する
- [ ] 5 画面と共通ナビゲーションが動作する
- [ ] すべての読み取り API の形と件数が旧実装と一致する
- [ ] SNS の閲覧、filter、caption 編集、draft 登録が動作する
- [ ] IG 予約二重書き込みを一時ファイルで検証し、実データに書かない
- [ ] X dry-run と 7 日ガードを検証する
- [ ] YouTube / R2 再生成は spawn mock で入力とガードを検証する
- [ ] ジョブ同時実行 1 件と log polling が動作する
- [ ] local mp4 を browser で seek でき、Range 206/416 が正しい
- [ ] path traversal / symlink escape を 403 にする
- [ ] type-check、unit/integration、build、Playwright smoke が成功する
- [ ] 旧 server/HTML を削除しても共有 collector 利用側が壊れない
- [ ] 本番投稿、IG 実予約、YouTube upload、R2 push、デプロイを実行していない

## 12. ドキュメント更新範囲

cutover 時に少なくとも次を更新する。

- `CLAUDE.md` / `AGENTS.md` のギャラリー実装場所（該当記載がある場合）
- `.claude/rules/local-environment.md`
- `.claude/rules/sns-content-standards.md` §5.5
- `.claude/memory/project_sns_gallery_and_ig_cron_fix.md`
- `.claude/memory/MEMORY.md`
- `.claude/launch.json`（コマンド名維持なら実質変更不要かを確認）
- `docs/todo/02_機能バックログ.md`
- `docs/02_実装計画/00_INDEX.md`

実装完了後は、恒常仕様を rules / memory / code README へ抽出したうえで、本仕様書を
消化済み実装計画として削除してよい（git 履歴に保持）。

## 13. ロールバック

cutover コミット前は root script を旧実装のまま保つ。cutover 後に致命的な回帰が見つかった場合は、
データを戻すのではなく、root `gallery` / `sns:gallery` の起動先と旧 server/HTML を
git 履歴から戻す。SSOT の posts.json / schedule JSON / R2 は移行対象ではないため、
データマイグレーションの rollback は発生しない。
