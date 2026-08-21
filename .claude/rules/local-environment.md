# ローカル開発環境

## モノレポ構成

```
apps/
  web/       Next.js (Cloudflare Pages) — 公開サイト
  remotion/  Remotion — 動画・SNS 投稿画像生成（Instagram/X/note）
  ges/       Google Earth Studio — 47都道府県旋回動画の生成・自動化
packages/
  database/        Drizzle schema (型ソース) + テスト基盤 + 使い捨てビルドキャッシュ操作 (永続 D1 なし)
  types/           共通型定義
  visualization/   D3.js チャートコンポーネント
  components/      shadcn/ui ベース共通 UI
  estat-api/       e-Stat API クライアント
  ranking/         ランキング計算ロジック
  r2-storage/      Cloudflare R2 アクセス
  utils/           汎用ユーティリティ
```

## ストレージ

- **データ層は「完全DBレス」が正典** → `docs/01_技術設計/02_データアーキテクチャ.md`。本番は R2 snapshot のみ読む。SSOT は **git TS (設定・運用エンティティ) と R2 (観測値・配信) の二つだけ**。Derived (area_profiles / correlations) は **エフェメラル計算 → R2**。**永続/リモート D1 は廃止。クラウド/ローカルとも git TS 編集 + R2 直接反映で作業する (D1 認証は不要)。**
- **ローカルビルド DB (SQLite)**: `packages/database/.data/stats47.sqlite`（旧 batch / エフェメラル集計が建てる**使い捨てビルドキャッシュ**。SSOT ではない）。git 管理外。**不在でも git TS 編集 / R2 直接反映 / エフェメラル集計は可能 = 基本「正常」**。R2 を読みたいだけなら公開 URL 経由で認証なしに取得できる。
  - これは **Cloudflare D1 サービスではない**。本番は R2 snapshot のみ読み、DB を一切 query しない。
- **dev server の miniflare**: `next.config.ts` の `initOpenNextCloudflareForDev({ persist: { path: "../../.local/d1" } })` は **R2 dev binding cache** (`.local/d1/r2/stats47/blobs/`) のために残置。`[[d1_databases]]` binding (STATS47_STATIC_DB) は app が read しないため vestigial（miniflare が `.local/d1/.../miniflare-D1DatabaseObject/*.sqlite` を作るが、batch は参照しない）。**`apps/web/.wrangler/state/` は使わない。**
- **R2 読み取り (標準)**: ビルド/集計スクリプトは **公開 URL 経由**で R2 を読める →
  `R2_PUBLIC_FETCH_URL=https://storage.stats47.jp`（GET のみ・list 不可）+ `NODE_OPTIONS='--conditions react-server'`。

## R2 読み書き — ローカル / CI 両方から remote R2 が唯一の真実源 ★

**読み取り・書き込みともにローカルから remote R2 へ直接可能。ローカル R2 ミラー (`.local/r2`) は廃止。**
`_assert-ci-write.ts` はデフォルト許可に変更済み。ローカル書き込み時は `console.warn` を出すだけで続行する。

- **読み取り (標準)**: `R2_PUBLIC_FETCH_URL=https://storage.stats47.jp`（GET のみ・list 不可・認証不要）
- **書き込み (ローカル)**: `.env.local` に R2 S3 creds (`R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_S3_ENDPOINT`) または `wrangler login` 認証が必要。S3 creds はユーザーが Cloudflare ダッシュボードで発行する。

| 目的 | 実行方法 |
|---|---|
| 配信 snapshot 再生成 + R2 push | CI: `gh workflow run sync-snapshots.yml [-f only=<task>] [-f dry_run=true]` / ローカル: S3 creds 設定後に直接実行可 |
| blog 公開 | CI: `publish-blog.yml` |
| e-Stat → R2 観測値更新 | CI: `data-refresh.yml` |

- CI シークレット: `CLOUDFLARE_R2_ACCESS_KEY_ID` / `CLOUDFLARE_R2_SECRET_ACCESS_KEY` / `CLOUDFLARE_ACCOUNT_ID` は設定済。
- 新規 R2 書き込みスクリプトは先頭で `assertR2WriteAllowed()` を呼ぶこと（呼び出し元への通知のため）。

## ローカルビルド DB (SQLite) パス固定値

`better-sqlite3` は存在しないパスで `new Database()` すると**空ファイルを自動作成する**。下記以外で開かないこと。中央定義は `packages/database/src/config/local-db-paths.ts` の `LOCAL_DB_PATHS.STATIC.getPath()`（全 batch がこれ経由 or 同一パスを解決）。

```
packages/database/.data/stats47.sqlite
```

（旧 miniflare ハッシュパス `.local/d1/v3/d1/miniflare-D1DatabaseObject/<hash>.sqlite` は廃止。dev server の miniflare が同名ファイルを作る場合があるが batch は参照しない。）

## ネットワーク

- **プロキシ制約**: 企業ネットワークで S3 API が HTTP 407/503 でブロックされる場合あり。`/push-r2` スキルが wrangler CLI フォールバックを案内する

### ★turbo は環境変数を落とす — TLS 傍受プロキシ配下で dev が壊れる (2026-08-04)

**turbo 2.x は既定が strict env mode** で、`turbo.json` に宣言しない環境変数を子プロセスへ渡さない
(実測: `npm run dev:web` で起動した dev サーバーの env は 42 個だけ)。落ちるものの中に
**`NODE_EXTRA_CA_CERTS`** が含まれるのが致命的で、**TLS を傍受するプロキシ配下**
(Claude Code のエージェントプロキシ / 社内 i-FILTER) では Node が CA を信頼できず、
**全 HTTPS が `SELF_SIGNED_CERT_IN_CHAIN` で落ちる**。症状は「dev サーバーが R2 を一切読めない」で、
テーマページが 500、home の featured が空、`/ranking/*` が「見つかりません」になる。

`turbo.json` の `globalPassThroughEnv` に `NODE_EXTRA_CA_CERTS` と proxy 変数 (HTTP(S)_PROXY /
NO_PROXY の大小文字) を列挙して解決済み。**passThrough は cache key に入らない**ので、
値がマシンごとに違っても turbo cache は効く (別の proxy/CA 値で task hash が不変であることを実測)。

切り分け方 (同種の症状が出たとき):

```bash
# 1. dev サーバーの env に CA があるか (無ければ turbo が落としている)
pid=$(ps -eo pid,cmd --no-headers | grep "[n]ext-server" | awk '{print $1}' | head -1)
tr '\0' '\n' < /proc/$pid/environ | grep -c NODE_EXTRA_CA_CERTS
# 2. 最小 env で fetch して cause を見る (SELF_SIGNED_CERT_IN_CHAIN なら CA 不足)
env -i HOME=$HOME PATH=$PATH node -e "fetch('https://storage.stats47.jp/app/ranking/total-population/item.json').then(r=>console.log(r.status)).catch(e=>console.log(e.cause?.code))"
# 3. 切り分けのため turbo を介さず起動する (これで直るなら turbo の env 剥がしが原因)
cd apps/web && npm run dev
```

> `curl` や素の `node` が通るのに dev だけ落ちるのが特徴。**ネットワーク障害と誤診しないこと**
> (シェルには `NODE_EXTRA_CA_CERTS` があるため手元の検証コマンドは全部通ってしまう)。

### ★会社 Windows PC の dev は Windows R2 gateway を使う (2026-08-19)

会社ネットワーク (兵庫県庁) は **i-FILTER (Digital Arts) が透過型 TLS 傍受**をしている。実測で確定した挙動:

| 経路 | 結果 |
|---|---|
| curl (Windows 証明書ストアを信頼) | 200 |
| Node の素の fetch | `SELF_SIGNED_CERT_IN_CHAIN` (Node は Windows ストアを見ない) |
| Node + 社内 CA を `NODE_EXTRA_CA_CERTS` に設定 | **HTTP 503 のブロックページ** (CA 信頼だけでは通らない = 直接の外向き通信自体がポリシーで遮断) |
| Node + `HTTPS_PROXY` の明示 CONNECT (undici ProxyAgent) | 200 |
| PowerShell/.NET + Windows 既定 credentials・証明書ストア | 200 |

`storage.stats47.jp` の証明書は `CN=CARGO-CA, DC=hyogo, DC=local` に差し替えられている (Cloudflare 本来の証明書ではない)。

Next.js dev の RSC は global fetch を独自ラッパに差し替えるため、undici の per-call `dispatcher` では
安定して回避できない。Windows では `apps/web/scripts/dev-server.ts` が loopback の読み取り専用 gateway
(`scripts/r2-dev-gateway.ps1`) を自動起動し、dev 子プロセスだけの `R2_PUBLIC_FETCH_URL` と
`NEXT_PUBLIC_R2_PUBLIC_URL` を `http://127.0.0.1:4777` に差し替える。配信コードと本番設定は変更しない。

gateway は Windows の既定 proxy credentials と証明書ストアを使う。接続先は固定の HTTPS upstream、
listen は `127.0.0.1`、method は `GET` / `HEAD`、R2 key は path traversal を拒否する。
**TLS 検証を無効化しない。** `npm run dev:web` または `npm run dev --workspace=apps/web` で自動的に有効になる。
一時的に従来経路へ戻す場合だけ `R2_DEV_GATEWAY=0` を指定する。Windows 以外では gateway を起動しない。

Next.js 自身による SWC lockfile patch の外向き fetch は引き続き `SELF_SIGNED_CERT_IN_CHAIN` を警告する場合がある。
`✓ Ready` の後にページが 200 で表示できるなら非致命であり、R2 データ・画像の取得には影響しない。

**補足**: 素の tsx スクリプトは `HTTPS_PROXY` を継承していれば ProxyAgent 経由で R2 に到達できる
(`packages/estat-api/src/core/client/http-client.ts` / `packages/ranking/src/scripts/audit-ranking-data-integrity.ts` の実装)。
`R2_PUBLIC_FETCH_URL` を使う読み取りスクリプトはこの経路で動く。

**★「HTTPS_PROXY を継承していれば通る」は自動ではない (2026-08-21 実測)**。Node の組み込み fetch は
`HTTPS_PROXY` を見ないので、**スクリプト側が明示的に `ProxyAgent` を作って `dispatcher` に渡す**
必要がある。上記 2 実装が通るのはそう書いてあるからで、素の `fetch()` を書いた新しいスクリプトは
会社 PC で `ENOTFOUND` になる。実測 (Node v22.14 / 対 e-Stat API):

| 書き方 | 結果 |
|---|---|
| `fetch(url)` | `ENOTFOUND` (DNS ごと遮断) |
| `NODE_USE_ENV_PROXY=1 fetch(url)` | `ENOTFOUND` (このバージョンでは効かない) |
| `fetch(url, { dispatcher: new ProxyAgent(process.env.HTTPS_PROXY) })` | 200 |

ESM (`.mjs`) から undici を取るときは `createRequire(import.meta.url)("undici")` を使う。
CI (Linux) は `HTTPS_PROXY` が無いので、**env があるときだけ dispatcher を作る**書き方にすれば
両方で動く (手本: `.claude/scripts/audit/theme-chart-live-audit.mjs` の `resolveDispatcher`)。

**e-Stat の app ID は `apps/web/.env.development` にある** (公開 ID・git tracked・秘密ではない)。
`NEXT_PUBLIC_ESTAT_APP_ID` が未設定でも、スクリプトがこのファイルを読めば e-Stat を叩ける。

### ★Windows では `next build` が完走しない (2026-08-05)

`npm run build --workspace apps/web` は `/themes/[themeSlug]/opengraph-image` の prerender で
必ず落ちる。原因は vendored な `next/dist/compiled/@vercel/og/index.node.js` が

```js
fileURLToPath(join(import.meta.url, "../noto-sans-v27-latin-regular.ttf"))
```

と **`path.join` を `file://` URL 文字列に適用**していること。Windows では区切りが `\` になり
`file:\C:\...` となって `TypeError: Invalid URL` で落ちる (下記「file:// URL を文字列連結しない」と同じバグ)。

- リポジトリ側では直せない (`node_modules` 内の vendored コード)。**Linux の CI build が権威**。
- ローカルの検証は `npm run type-check --workspace apps/web` と対象 test で行う。
- **`npm run build | tail` の終了コードを成功判定に使わない**。`tail` の exit code が返るため
  build の失敗が隠れる (2026-08-05 に実際に「exit 0」と誤報した)。判定は出力本文を読む。

### ★`npm run type-check` は Windows で「走らずに落ちる」(2026-08-06)

ルートと `packages/estat-api` の `type-check` スクリプトは
`NODE_OPTIONS="--max-old-space-size=4096" tsc --noEmit` という **POSIX の env 前置**を使う。
npm は Windows でスクリプトを `cmd.exe /d /s /c` 経由で実行するため、これは

```
'NODE_OPTIONS' は、内部コマンドまたは外部コマンド、
操作可能なプログラムまたはバッチ ファイルとして認識されていません。
```

で即座に失敗する。**型エラーが 0 でも exit 1 になり、逆に「走った」と誤認しやすい**
(2026-08-06 に実際に「turbo type-check exit 0」と誤報告した。見ていたのは背景タスクの
ラッパーの終了コードで、turbo は一度も起動していなかった)。

Windows での代替:

```bash
NODE_OPTIONS="--max-old-space-size=4096" npx turbo run type-check --continue
cd packages/estat-api && NODE_OPTIONS="--max-old-space-size=4096" npx tsc --noEmit
```

Git Bash から `npx turbo` / `npx tsc` を直接呼べば env 前置が効く (npm を挟まないため)。
`--continue` を付けないと最初の失敗で残りが検査されない。
**判定は必ず出力本文の `error TS` 件数で行う** (`| tail` や `| grep` の終了コードを見ない)。

### ★`file://` URL を文字列連結しない (2026-08-05)

`` `file://${process.argv[1]}` `` は Windows で必ず不一致になる。Node は `argv[1]` を絶対パスへ
解決するが Windows では `C:\path\x.mjs` の形で、`import.meta.url` の `file:///C:/path/x.mjs` と
一致しない。ESM のエントリポイント判定に使うと **main() が呼ばれないまま exit 0 で終わる**
(失敗ではなく無言の no-op)。Linux では一致するため CI では露見しない。

```js
import { pathToFileURL } from "node:url";
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
```

機械チェック: `npm run check:file-url-guard` (pre-commit + `pr-quality-check.yml`)。

### ★Windows で clone した直後は `core.symlinks` を有効にする (2026-08-05)

git for Windows の既定は `core.symlinks=false` で、**symlink がリンク先パスだけを中身に持つ
通常ファイルとして checkout される**。このリポジトリは 2 つの symlink を持つ:

| ファイル | リンク先 | 壊れると何が起きるか |
|---|---|---|
| `AGENTS.md` | `CLAUDE.md` | `npm run docs:check` が **DG003 error** になり、`docs/` に触る commit が pre-commit で全部止まる |
| `.claude/design-system/SSOT.md` | `docs/01_技術設計/04_デザインシステム.md` | デザイン SSOT の参照が切れる |

```bash
git config core.symlinks true
rm AGENTS.md .claude/design-system/SSOT.md
git checkout -- AGENTS.md .claude/design-system/SSOT.md
```

- **`AGENTS.md` を CLAUDE.md のコピーに置き換えて回避しない**。Codex と Claude の指示 SSOT
  一本化が壊れ、2 ファイルがドリフトする。
- symlink 作成には Developer Mode か管理者権限が要ると説明されることがあるが、この PC では
  **既定のまま Node の `fs.symlinkSync` で作成できた**。まず上記を試すこと。
- **Git Bash の `ln -s` で可否を判定しない**。MSYS の既定はコピーを作るため `[ -L ]` が false
  になり、「symlink 不可」と誤診する (2026-08-05 に実際に誤診した)。判定するなら
  `node -e 'require("fs").symlinkSync(...)'` を使う。

## dev サーバー起動 ★ルート `npm run dev` を使わない

**Web サイトの動作確認は必ず web 単体で起動する。ルート `npm run dev`（= `turbo run dev`）を使わない。**

```bash
npm run dev:web          # = turbo run dev --filter=web (推奨)
# または
npm run dev --workspace=apps/web   # turbo を介さず最速 (✓ Ready in 2s)
```

- ルート `npm run dev`（`turbo run dev`）は **23 パッケージすべての dev を起動**し、出力が混ざって "Ready" を検出しづらく、port 3000 を listen する前に体感で固まる。web 単体なら数秒で起動する（2026-06-20 に同じ取り違えで時間を浪費した）。
- dev サーバーは**常駐プロセス**。エージェントが起動するときは `run_in_background: true` で起動し、**出力ファイルを polling して `✓ Ready` を確認**する。前面 `sleep` での固定待ちは禁止（タイムアウト・取りこぼしの元）。
- 表示が更新されないときは「キャッシュ」を疑う前に **dev サーバーが listen しているか**を先に確認する（`lsof -i :3000` / `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/`）。

## 頻用コマンド

```bash
# ドキュメント変更（SSOT: .claude/rules/docs-vs-issues.md）
npm run docs:fix       # 生成管理された実装計画INDEXを同期
npm run docs:check     # 構造 + リンク悪化
npm run docs:check:all # テスト + 鮮度 + orphan候補

# 型チェック（ワークスペース別）
npx tsc --noEmit -p apps/web/tsconfig.json
cd apps/remotion && npx tsc --noEmit

# 管理コンソール（ローカル専用・Next.js 15・127.0.0.1:4747）
# 10 画面:
#   制作・投稿 : /sns (動画再生→投稿/予約/caption/メトリクス) ・ /buzz-map (企画キューと素材生成)
#   資産       : /assets (OGP/カード/note/動画・欠落チェック/再生成) ・ /svg (ブログSVGカタログ)
#   収益       : /revenue (AdSense 週次・内訳。他チャネルは未計測と明示) ・ /ads (アフィリ運用ゲート/在庫/GA4/compliance)
#   品質・運用 : /dashboard (メトリクス・進捗キュー・STP戦略) ・ /quality (8監査の残欠陥と鮮度)
#                /ops (workflow健全性・R2鮮度・Claude利用量・agents/skills/memory台帳) ・ /todo (.claude/todo 台帳)
# 書き込みは /sns の投稿予約と /buzz-map の素材生成だけで、他はすべて読み取り専用。
#   起動後にブラウザで http://127.0.0.1:4747/（file:// で直接開かない）。
# 常駐プロセスなので run_in_background + Ready polling で起動する。skill: /admin-console
# 実装は独立 Next.js アプリ apps/admin (localhost 専用・127.0.0.1 bind 固定・PORT= で上書き可)。
# 旧 node:http 実装 (.claude/scripts/gallery/) と sns:gallery alias は 2026-07-16 に廃止。
# apps/gallery からの改名は 2026-08-18 (中身が画像ギャラリーでなく運営全体の管理画面になったため)。
npm run admin
```

> 旧 `npm run backup:d1 --env production`（リモート D1 → R2 バックアップ）は **リモート D1 廃止により不要**。
> 完全DBレスでは観測値・配信は R2 が SSOT、設定/運用は git TS が SSOT で履歴は git に残る。
