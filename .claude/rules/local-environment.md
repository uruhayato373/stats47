---
paths:
  - "package.json"
  - "turbo.json"
  - "apps/*/package.json"
  - "apps/web/scripts/{dev-server.ts,r2-dev-gateway.ps1,r2-dev-cache.ps1}"
  - ".claude/config/local-resources.json"
  - ".claude/scripts/lib/local-resource*"
  - "scripts/scheduled/local-resources.ps1"
  - ".claude/agents/{db-schema-manager,data-ingester,r2-publisher,devops-runner}.md"
---
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

## R2 読み書き — ローカル / CI 両方から remote R2 が唯一の真実源

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

### turbo は環境変数を落とす — TLS 傍受プロキシ配下で dev が壊れる

**turbo 2.x は既定が strict env mode** で、`turbo.json` に宣言しない環境変数を子プロセスへ渡さない
(実測: `npm run dev:web` で起動した dev サーバーの env は 42 個だけ)。落ちるものの中に
**`NODE_EXTRA_CA_CERTS`** が含まれるのが致命的で、**TLS を傍受するプロキシ配下**
(Claude Code のエージェントプロキシ / 社内 i-FILTER) では Node が CA を信頼できず、
**全 HTTPS が `SELF_SIGNED_CERT_IN_CHAIN` で落ちる**。症状は「dev サーバーが R2 を一切読めない」で、
テーマページが 500、home の featured が空、`/ranking/*` が「見つかりません」になる。

`turbo.json` の `globalPassThroughEnv` に `NODE_EXTRA_CA_CERTS` と proxy 変数 (HTTP(S)_PROXY /
NO_PROXY の大小文字) を列挙して解決済み。**passThrough は cache key に入らない**ので、
値がマシンごとに違っても turbo cache は効く (別の proxy/CA 値で task hash が不変であることを実測)。

ローカルsnapshotプレビューでは`dev.passThroughEnv`が`R2_PUBLIC_FETCH_URL`、`NEXT_PUBLIC_R2_PUBLIC_URL`、S3認証3変数も引き継ぐ。gatewayを使う場合は`R2_ACCESS_KEY_ID= R2_SECRET_ACCESS_KEY= R2_S3_ENDPOINT=`を明示し、S3優先を解除する。これはcache無効のdevだけの設定。gateway単体のHTTP200では足りず、公開前の指標キーとgateway URLがWebのHTML/通信に出ることを確認する。

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

### 会社 Windows PC の dev は Windows R2 gateway を使う

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

gateway は `HTTPS_PROXY` / `HTTP_PROXY` があればその経路を明示的に使い、未設定時だけ Windows の既定 proxy に戻る。
どちらも Windows の既定 credentials と証明書ストアを使う。接続先は固定の HTTPS upstream、
listen は `127.0.0.1`、method は `GET` / `HEAD`、R2 key は path traversal を拒否する。
**TLS 検証を無効化しない。** `npm run dev:web` または `npm run dev --workspace=apps/web` で自動的に有効になる。
一時的に従来経路へ戻す場合だけ `R2_DEV_GATEWAY=0` を指定する。Windows 以外では gateway を起動しない。

**gateway は GET を 300 秒メモリキャッシュする (2026-08-21)**。リクエスト処理は逐次なので、
アプリが並列に投げた R2 fetch も 1 本ずつ社内プロキシへ出ていく。同じオブジェクトを読み直さない
だけで、R2 依存の重いページが実測で速くなった (同一端末・warm・中央値):

| route | before | after |
|---|---:|---:|
| `/themes/population-dynamics` | 2,857 / 3,106 ms | 862 / 918 ms |
| `/ranking/total-population` | 1,213 / 1,508 ms | 862 / 1,005 ms |
| `/areas/13000` | 2,228 / 1,955 ms | 1,788 / 1,981 ms (ほぼ不変 = R2 律速ではない) |
| 一覧系 (`/themes` `/areas` `/ranking`) | 222〜526 ms | 227〜490 ms (元から速い) |

R2 を更新した直後に dev へ即反映したいときは `R2_DEV_GATEWAY_CACHE_SECONDS=0` で切る。
キャッシュするのは **GET の 200 だけ**で、Range・条件付き・`Cache-Control: no-cache` は素通し。
応答に `X-R2-Dev-Cache: HIT|MISS` が付く。

**★`.ps1` は UTF-8 BOM 付きで保存する。** `powershell.exe` (Windows PowerShell 5.1) は BOM の無い
`.ps1` を ANSI (CP932) として読むため、UTF-8 の日本語がコメントにあるだけでも化けて
「予期しない `}`」の構文エラーになり gateway が起動しない (2026-08-21 実測: BOM 無しで構文エラー
2 件、BOM 付きで 0 件)。契約は `dev-r2-gateway-contract.test.ts` が固定する。

**★計測するときは curl のプロセス起動を分離する。** Git Bash の `curl` は 1 回の起動だけで
実測 ~310 ms かかるので、1 リクエスト 1 プロセスで測ると本来の応答時間がそこに埋もれる
(「gateway 1 回 259 ms」という誤った値を一度出した。実際のキャッシュヒットは 11.5 ms)。
1 プロセスに URL を並べて渡し、`-o /dev/null` を URL の数だけ付ける (足りないと 2 本目以降の
本文が `-w` の出力に混ざる)。

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

### Windows の NotebookLM 連携

既存の `notebooklm-cross-query.mjs` / `notebooklm-notebook-builder.mjs` は
`%USERPROFILE%\.notebooklm-venv\Scripts\notebooklm.exe` を自動検出する。PATH の変更は不要。
2026-09-09 に専用環境で `notebooklm-py[browser,mcp]==0.8.2` を確認した。
これは Google 公式 SDK ではなく、既存スキルが採用する
[notebooklm-py](https://github.com/teng-lin/notebooklm-py) の CLI / MCP。

初回導入は `uv venv --python python "$env:USERPROFILE/.notebooklm-venv"`、続いて
`uv pip install --python "$env:USERPROFILE/.notebooklm-venv/Scripts/python.exe" 'notebooklm-py[browser,mcp]==0.8.2' 'truststore==0.10.4'`。
既存環境がある場合は再作成しない。

```powershell
$env:PYTHONIOENCODING = 'utf-8'
$notebookCli = Join-Path $env:USERPROFILE '.notebooklm-venv/Scripts/notebooklm.exe'
& $notebookCli login --browser chrome
```

Google ログインは本人が専用ブラウザーで行う。ログイン完了は CLI が自動検出する。
認証状態はユーザーフォルダーの `.notebooklm` 配下に置き、リポジトリへコピーしたり内容を出力しない。
利用可能の判定はインストール成功ではなく、認証検査・ノートブック一覧・引用付き質問応答の成功で行う。

**Codex はローカル stdio MCP を使う。** 登録先は `%USERPROFILE%\.codex\config.toml` の
`[mcp_servers.notebooklm]`。既存の MCP を残して、次のコマンドで追加する。

```powershell
codex mcp add notebooklm --env 'PYTHONIOENCODING=utf-8' --env 'NO_PROXY=localhost,127.0.0.1,::1,.local' -- "$env:USERPROFILE/.notebooklm-venv/Scripts/python.exe" -c 'import truststore; truststore.inject_into_ssl(); from notebooklm.mcp.__main__ import main; main()' --profile default --log-level WARNING
```

- `truststore` は MCP プロセス内で Windows の信頼済み証明書ストアを使用する。
  TLS 検証は有効のまま。専用環境以外やパッケージ本体を書き換えない。
- この端末では `NO_PROXY` の Google 除外により直接通信が HTTP 503 の社内ブロック応答となった。
  MCP のみ除外先をローカル宛てに限定し、既定の `HTTP_PROXY` / `HTTPS_PROXY` 経由にすると接続成功。
  コマンド中のカンマを含む `--env` 引数は PowerShell で必ず引用する。
- 同じ MCP テーブルに `startup_timeout_sec = 60`、`tool_timeout_sec = 180`、
  `env_vars = ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy"]` を設定する。
  プロキシ認証値は設定ファイルに複製せず、環境から引き継ぐ。
- 初期化・`notebook_list`・`source_list`・`chat_ask` の実通信まで検証する。
  このタスクでツールが出ていなければ、アプリの「設定 → MCP servers」から再起動する。
  認証期限切れだけは専用ブラウザーで再ログインする。
- CLI を直接検査する場合も同じプロキシ除外設定を用い、上の Python 起動コードの import 先を
  `notebooklm.notebooklm_cli` に替えて `auth check --test --json` / `list --json` を渡す。

仕様: [NotebookLM 実装](https://github.com/teng-lin/notebooklm-py) /
[Windows 証明書ストア](https://truststore.readthedocs.io/en/latest/) /
[Codex MCP 設定](https://developers.openai.com/codex/mcp/)。

### Windows では `next build` が完走しない

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

### Windows の型検査と古い生成型

- **問題**: npm は Windows で `cmd.exe` を使うため、`NODE_OPTIONS=... tsc` という
  POSIX の環境変数前置は型検査を起動できない。
- **対策**: root と `packages/estat-api` は `cross-env` 経由へ修正済み。
  通常の `npm run type-check` を使う。workspace の前置構文への回帰は
  `.claude/scripts/lib/__tests__/scripts-type-check-coverage.test.cjs` が拒否する。
- **別原因**: admin の `.local/next-e2e/types/validator.ts` は、API route を削除した後も
  古い import を保持することがある。生成型を手編集したり、型検査から除外したりしない。
  apps/admin で `npx cross-env NEXT_DIST_DIR=.local/next-e2e next typegen`、続いて
  `npx cross-env NEXT_DIST_DIR=.local/next-admin-dev next typegen` で現在の route から再生成する。
  chunk を消さずに型だけ更新できるので、常設 dev の再起動・出力ディレクトリ削除は不要。
- **判定**: コマンド本体の exit code と全 workspace / scripts の完走を確認する。
  パイプ末尾や背景ラッパーの exit 0 を成功の根拠にしない。

### ファイルを書くときは Write/Edit を使う。heredoc で内容を流し込まない

Git Bash + Python/シェルの heredoc で**ファイル本文を書こうとすると壊れる**。同じセッションで
3 回踏んだので手順として固定する。

| 症状 | 原因 |
|---|---|
| JS/TS の文字列内が**本物の改行**になり `SyntaxError: Invalid or unexpected token` | Python の非 raw 文字列がバックスラッシュ n を改行に変換する |
| `unexpected EOF while looking for matching` の引用符エラー | 長い heredoc (~8KB 超) がシェル側で切れる |
| YAML やテーブルに意図しない改行が入る | 同上 |

**この注意書き自体、最初に heredoc で書いて上の 1 行目が壊れた** (4 回目)。
Edit ツールで書き直している。

**使い分け**:

- **ファイルを新規作成する / 大きく書き換える** → Write ツール。heredoc を使わない。
- **既存ファイルの一部を差し替える** → Edit ツール、または Python で
  **`r'''...'''` (raw 文字列)** を使う。非 raw ではバックスラッシュを含む文字が化ける。
- **アンカーは記憶で書かない**。`sed -n 'N,Mp'` や `cat -A` で**実バイトを読んでから**
  置換文字列を組む。`assert old in s` が落ちる原因はほぼこれ。

### `file://` URL を文字列連結しない

`` `file://${process.argv[1]}` `` は Windows で必ず不一致になる。Node は `argv[1]` を絶対パスへ
解決するが Windows では `C:\path\x.mjs` の形で、`import.meta.url` の `file:///C:/path/x.mjs` と
一致しない。ESM のエントリポイント判定に使うと **main() が呼ばれないまま exit 0 で終わる**
(失敗ではなく無言の no-op)。Linux では一致するため CI では露見しない。

```js
import { pathToFileURL } from "node:url";
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
```

機械チェック: `npm run check:file-url-guard` (pre-commit + `pr-quality-check.yml`)。

### Windows で clone した直後は `core.symlinks` を有効にする

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

### 2 台 (会社 Windows / 自宅 Mac) で同じ形にする手順

個人設定は private リポジトリ `uruhayato373/dotfiles` (秘密値なし)、プロジェクト設定は本リポジトリが運ぶ。
どちらの PC も次の順で 1 回だけ実行する。

| 手順 | Windows (PowerShell) | Mac (zsh) |
|---|---|---|
| dotfiles | `git clone <dotfiles> $env:USERPROFILE\dotfiles; node $env:USERPROFILE\dotfiles\bin\link.mjs --host windows` | `git clone <dotfiles> ~/dotfiles && node ~/dotfiles/bin/link.mjs --host mac` |
| stats47 | `git clone -c core.symlinks=true --filter=blob:none <stats47>` | `git clone --filter=blob:none <stats47>` |
| memory | `node .claude/scripts/setup-memory-symlink.mjs` (junction) | 同左 (symlink) |
| hooks | `git config core.hooksPath .husky` | 同左 |
| 一時領域 | `C:\tmp` (`STATS47_WORKTREE_ROOT`) | `~/tmp` (`/tmp` は 3 日で掃除される) |
| 定期掃除 | `scripts/scheduled/local-resources.ps1 -Action Install` | `bash scripts/scheduled/local-resources.sh install` |
| 認証 | `gh auth login; codex login` (設定ファイルに token を書かない) | 同左 |
| Codex mirror | `node .claude/scripts/lib/sync-codex-mirror.cjs --check` | 同左 |

- `.agents/skills` の補助ファイルは **`.claude/skills` の同名原本への相対 symlink**。`SKILL.md` だけは Codex の検出に必要な通常ファイルとして自動生成する（ファイル symlink は検出されない）。原本は `.claude/skills` のみ。既存のフォルダー symlink は利用可能。
  `.codex/agents/*.toml` は `.claude/agents/*.md` を形式変換した生成物。
  手で直さず `node .claude/scripts/lib/sync-codex-mirror.cjs` で再生成する (E12 が CI と pre-commit で
  ドリフトを止める)。skills の本文更新はリンクへ即時反映され、ファイル追加・削除時だけ再生成する。
  `type-check:scripts` はリンク一致確認後に原本だけを型検査する。`.codex/hooks.json` は `.claude/hooks/*.js` を直接指す (複製は 2026-09-14 に廃止)。
- `~/.claude/settings.json` は dotfiles への symlink、`~/.codex/config.toml` は dotfiles の
  `codex/base.toml` + `host.<os>.toml` を**セクション単位でマージ** (Codex デスクトップが書く
  `[projects.*]` / `[plugins.*]` / runtime パスを壊さない)。マシン固有の許可と `additionalDirectories` は
  gitignore 済みの `.claude/settings.local.json` に置く。
- Mac 固有の罠はまだ実測が無い。最初に Mac で動かしたときに本節へ追記する。

## dev サーバー起動 — ルート `npm run dev` を使わない

**Web サイトの動作確認は必ず web 単体で起動する。ルート `npm run dev`（= `turbo run dev`）を使わない。**

```bash
npm run dev:web          # = turbo run dev --filter=web (推奨)
# または
npm run dev --workspace=apps/web   # turbo を介さず最速 (✓ Ready in 2s)
```

- ルート `npm run dev`（`turbo run dev`）は **23 パッケージすべての dev を起動**し、出力が混ざって "Ready" を検出しづらく、port 3000 を listen する前に体感で固まる。web 単体なら数秒で起動する（2026-06-20 に同じ取り違えで時間を浪費した）。
- dev サーバーは**常駐プロセス**。エージェントが起動するときは `run_in_background: true` で起動し、**出力ファイルを polling して `✓ Ready` を確認**する。前面 `sleep` での固定待ちは禁止（タイムアウト・取りこぼしの元）。
- 表示が更新されないときは「キャッシュ」を疑う前に **dev サーバーが listen しているか**を先に確認する（`lsof -i :3000` / `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/`）。

## 検証コマンドの粒度

検査は変更規模に応じて3段階のいずれかを選ぶ。**本節が正典**であり、`CLAUDE.md` や各 agent /
skill には詳細を複製せず本節への参照だけを置く。

### 3段階モデル

1. **開発中**: 変更箇所に直接関係する型・構文確認 + 関連テストだけを実行する。UI 変更では
   デザイン規約の静的検査 (`/design-review` 等) を必要に応じて実行する。**全体ビルド・全テスト・
   47都道府県の個別巡回・ブラウザ実測はしない**。
2. **まとまった変更の完了時**: 影響する workspace の型検査 (`npm run type-check --workspace <pkg>`)
   + 対象機能のテスト。SSOT や生成処理を変更した場合だけ対応する生成・整合性検証を追加する。
   共通レイアウト/テンプレート変更は「代表コンポーネントのテスト + 全対象が同じテンプレートを
   参照する契約検査」を基本とする (実例: `page-shell-rail-contract.test.tsx` /
   `left-rail-layout-contract.test.tsx` / `article-shell-left-rail-contract.test.tsx`)。
   **47都道府県を個別にブラウザ表示して確認しない**。
3. **公開前・定期監査**: 全体ビルド・全テスト・全URL/47都道府県/リンク/構造化データ/広告DOM/
   表示速度の横断検査。CI (`pr-quality-check.yml`)・定期監査 (`page-quality-audit-weekly.yml` /
   `psi-audit-daily.yml` 等)・明示的なリリース確認で実施する。ユーザーが明示した場合や、
   本番・ブラウザでしか確認できない問題 (Cloudflare Workers ランタイム固有の挙動等) では
   個別に実施してよい。

### 変更種別ごとの標準

| 変更種別 | 標準 |
|---|---|
| docs / rules / agent / SKILL だけの変更 | 文書ガバナンス検査だけ (`npm run docs:fix` → `npm run docs:check`)。Web の型検査・ビルドは不要 |
| 小規模 UI 変更 | 対象テスト または `npm run type-check --workspace apps/web`。両方が同じ事実を重複検査する場合は片方でよい |
| ロジック変更・変換処理・共通ユーティリティ | 対象テスト + 影響 workspace の型検査 |
| route / metadata / generateStaticParams / SSG / R2 snapshot 参照 | 対象 route と関連契約テストを検査 (`nextjs-ssg-preservation.md` のチェックリスト参照) |
| 生成テンプレート変更 (git TS → R2 反映スクリプト等) | 生成 dry-run または差分確認 + validator (実例: `sync-snapshots.yml` の `dry_run=true` 入力、`npm run page-quality:validate`) |
| リリース (develop→main) | CI (`pr-quality-check.yml`) を権威とし、ローカルで同じ全体検査を重複実行しない |
| ブラウザ実測 | ユーザーが求めた場合・視覚的な判断が必要な場合・静的検査では判定できない場合に限定する |

ローカルの標準入口は2つだけにする。

```bash
npm run check:local          # 変更テンプレートの代表ページ。起動済みdevを再利用
npm run check:release-local  # 明示時のみ。production build 1回を代表page-qualityとE2Eで共有
```

`check:local` は未コミット差分を基準に最大3テンプレートを選び、ブラウザ計測を1 URL 1 sampleで
実行する。型検査は`--typecheck`、直接対応するunit test（最大12件）は`--tests`を明示したときだけ追加する。
`check:release-local` はdevの`.next`と別の`.local/next-release`へbuildし、起動中のdevを壊さない。
全URL・3 sample・全E2Eは週次GitHub Actionsを権威とする。

フル build / 全テストを省略した場合は、最終報告で「何を検証し、何を未実行か」を明示する。
`apps/web` のフル `build` は重いので、小変更のたびに実行しない。dev サーバーは
`npm run dev:web` (ルート `npm run dev` は 23 パッケージを起動するので使わない)。常駐は
background + Ready polling。Windows では `next build` が完走せず `type-check` の env 前置も
落ちる (Linux CI が権威。罠は本ファイル内「★Windows では」節)。

### 検査の重複を防ぐ

- 同じ変更内容に対して複数 agent が同じテストを繰り返さない。先行 agent が実行したコマンド・
  対象・結果を引き継ぎ、コード変更が無ければ再実行しない (`agent:session` の `--note` に
  検証結果を残す運用は下記「Codex / Claude の作業共有」と共通)。
- 検査失敗後は、原因に関係する検査だけを再実行する。「念のため」という理由だけで検査範囲を
  広げない。
- 検査を追加する場合は、その検査が発見する具体的な失敗を説明できることを条件とする。

### agent の責務分担

`devops-runner` が全体検査・リリース検証の所有者 (`/run-tests` フル・`/deploy`)。
`code-reviewer` / `ui-reviewer` / `ui-consistency-reviewer` / `performance-auditor` は原則
read-only で、必要な検査を「提案」するに留め、無条件に全検査を自ら実行しない (現状の
Output Contract・担当外欄で既に明記済み)。実装 agent は自分が変更した箇所に対応する最小限の
検査までを担当する。同じ検査を別 agent へ再委譲しない。ブラウザ監査・全URL監査は
page-quality (週次 `page-quality-audit-weekly.yml`) / PSI (日次 `psi-audit-daily.yml`) など
専任スキル・定期処理へ渡す。

## ローカル資源の予算と保持

端末の予算・掃除対象・保持日数の機械契約は `.claude/config/local-resources.json`。
計測は非常駐、`.local/resource-health/` に最新値と日別30件、容量監査2世代だけを保存する。全体走査は月次とし、
通常の開発前チェックではディレクトリを再帰走査しない。容量はファイル長合計で、junctionは辿らず、
hardlinkの重複は除かない。回収量はドライブ空き容量の前後も合わせて判断する。

月次監査は親子フォルダーを一度の走査で集計し、ユーザー共通のCodex/Claude保存領域も測る。
共有履歴DB・認証profileは自動削除しない。定期処理の失敗は成功済みの日次計測とは別に再試行する。
ビルド成果物とTurbo保存対象から、standalone内に入れ子になった `.next/cache` も除外する。

- Turboは `turbo.json` のキャッシュ上限 `2GB`、同時実行2件。実行時にTurbo自身が回収する。
- ローカルVitestは最大2 worker、preflightも最大2件。フルbuildは節目だけ、必要な対象を絞って検証する。
- pre-commitの共通静的検査は `preflight-commit.mjs --commit-static` と共有し最大2件で実行する。
  Stopの文書検査は2件並列。同じ入力ツリーのファイル・リンク先のsize/mtime/ctime、Node版、UTC日付が
  一致するときだけ `.local/stop-docs-success.json` の成功結果を再利用する。検査失敗・timeout・途中変更は保存しない。
  `DOCS_*` の環境上書き時は結果再利用を無効化する。CIと手動の `docs:check` は毎回検査する。
- Windows R2 gatewayのキャッシュ本文は合計64MiB、1件8MiB、最大2000件。期限切れは待受中も回収する。
  これはプロセス全体のメモリ上限ではない。大きい本文・長さ不明の本文・ローカルファイルはストリーム転送する。
- dev supervisorは終了時に自分で起動した子プロセスだけを終了する。Nodeやブラウザ全体を一括停止しない。
- `.codex/config.toml` はstandalone Codex用に再帰Codex・filesystem・GitHub・shadcn MCPを無効化する。
  ファイル操作とGitHub操作は標準ツールと`gh`で行う。変更は次回Codex起動から反映し、既存セッションを強制終了しない。
- editorの監視・検索から `.local`、`.turbo`、生成動画、追加worktreeを除外する。

Windowsの登録入口は `scripts/scheduled/local-resources.ps1 -Action Install`、Macは
`bash scripts/scheduled/local-resources.sh install` (launchd `com.stats47.local-resources`)。どちらも毎日09:00と
ログオン時に日次計測、日次の限定掃除、30日ごとの容量監査を実行し、同時に `git maintenance start` で
git自身のcommit-graph・prefetch・incremental repackを登録する (2026-09-14にpackが25個・loose 6,286個まで
溜まっていた再発防止。履歴は書き換えない)。同日重複・同時実行を避け、上限15分で終了する。
ログイン中かつ端末が稼働できるときの処理であり、電源OFF中は実行されない。通知はCodexの
「stats47 ローカル資源の点検結果を確認」が結果を読み、新しい異常・意味のある変化・復旧時だけ行う。

```bash
npm run local:health                 # 軽い計測。dev:web起動前にも実行
npm run local:audit                  # 容量走査（通常は月次だけ）
npm run local:cleanup                # 削除候補だけ表示
npm run local:cleanup -- --apply     # 条件を満たした生成cacheだけ削除
npm run local:resources:test         # 削除境界・保持・メモリ予算のテスト
```

自動掃除の対象は `cachePaths` (登録済みworktree内の再生成cache) と `scratchRoots` (OS一時領域直下の
`stats47-*`) だけで、最終変更が各entryの `ageDays` 以上前、リンクなし、対象が計画後に変化していない、
開発プロセスが停止中 (Macは `ps` で同じbusy判定)、の全条件を要求する。`cachePaths` の `*` は末尾segmentだけに
許し、登録済みworktreeと `scratchExclude` (source-vault・japan-zue・geo-ui) は名前が一致しても消さない。
ただし `scratchCachePaths` のGIS原典ZIP・展開データ・画像生成入力は検証成功後に即時削除する。
R2成果物・provenance・原典の再取得手段を確認後、`npm run local:cleanup -- --gis-only --include-recent --apply` を実行する。
失敗・中断で残った入力は最終変更から1日経過後の日次清掃で回収する（稼働中は削除しない）。
geo-ui直下の作業スクリプトは残す。今後のGIS処理では原典を作業中だけ一時領域へ取得し、
R2成果物・provenanceと原典URLの再取得可能性を確認して処理後に削除する。原典ZIPがすべてR2にあるとは限らない。
初回の `--include-recent` は明示的な掃除依頼時だけ使う。削除先は必ず許可リストを再展開して再検証する。

| 対象 | 寿命 | 消す主体 |
|---|---|---|
| `.next/cache`・`.turbo/cache/*`・`.local/{tmp,rakuten-cli-test-*,regen-*}` | 7日 | `local:cleanup` |
| `.local/verification/*`・`.local/geo-source-*` | 30日 | 同上 |
| `.local/r2` (push staging。CI は runner 内で自分の staging を作るので常駐不要。KSJ ミラーも R2 から再取得できる) | 7日 | 同上 |
| `C:/tmp/stats47-*` / `/tmp/stats47-*` (worktree・除外名を除く) | 14日 | 同上 |
| 認証profile・`.local/affiliate-status` | 年齢では消さない | 手動 |
| git追跡の生snapshot (psi/url-inspection/cloudflare/note/releases/analytics週次) | `prune-state-snapshots.mjs` の `RETENTION_POLICIES` | `fetch-metrics-weekly.yml` |
| `.local/{tsbuildinfo/,asset-policy-cache.json,maintenance-debt-cache.json,docs-links-cache.json}` (pre-commit の stat キャッシュ) | 掃除対象外 (数 MB)。おかしければ消してよい (次回 cold 走行で再生成) | 手動 |

### pre-commit を速くする仕掛け (2026-09-14・会社 Windows 実測)

pre-commit は Windows で約 12 分かかっていた。律速は tsc の直列実行と、全文を毎回読む I/O (antivirus 込み) で、
sharp のデコードや検査ロジックではない (`--cpu-prof` で `readFileUtf8` が 31 秒中 21 秒)。

| ステップ | 前 → 後 (warm) | 仕掛け |
|---|---|---|
| `type-check:scripts` (tsc 9 本) | 141s → 45s | `type-check-scripts.mjs`: 並列 3 + `--incremental` (`.local/tsbuildinfo/`)。対象一覧は package.json の引数のまま (coverage テストが文字列を読む) |
| `test:image-pipeline` (vitest 11 本) | 184s → 86s | scripts 系テストに `// @vitest-environment node` (DOM 不使用。jsdom 起動 152 秒が 0 に)。`test.setup.tsx` は `window` が無ければ DOM モックを飛ばす |
| `check-asset-policy` | 31s → 7s | (size, mtimeMs) → sha256 / 寸法 / 抽出参照のキャッシュ |
| `check-maintenance-debt` | 31s → 4s | (size, mtimeMs) → findings のキャッシュ |
| `check-docs-links` (Stop hook でも走る) | 38s → 3s | (size, mtimeMs) → 抽出参照のキャッシュ |
| `type-check:image-pipeline` (tsc 3 本) | 40s → 25s | 同 runner |

判定は内容だけで決まるため結果は不変 (findings 件数で確認済み)。CI は `.local/` が無いので cold 走行 = 従来と同じ判定で、
tsc だけ並列になる。vitest の残り 86 秒はテスト自身のモジュール import (sharp / next) で、project 絞り込みでは縮まない。
容量不足は空き25GiB未満で警告・15GiB未満で重大、RAMは利用可能3GiB未満で警告・1.5GiB未満で重大。
メモリは瞬間値なので継続状況と実行中作業も見て判断し、不明な計測値を正常と扱わない。

WIPのあるworktree、認証profile、参考文献、成果物や運用台帳は年齢だけで消さない。
`.local/r2` は R2 への push staging で、秘密値を CI 限定にした 2026-09-14 以降ローカルから push しないため常駐させない
(CI は runner 内で自分の staging を作る。KSJ ミラーは R2 `gis/` から再取得できる)。7日で回収する。
GISの一時領域は処理ごとにOS一時フォルダーへ作り、入力URL・hash・成果の保存先・復元手順を残す。
R2成果物・provenanceと原典の再取得手段を検証したら、原典ZIPも展開ファイルも即時回収する。固有スクリプトはデータ清掃の対象外。
参考文献は既存source-vault契約に従いprivate Driveからの復元検証とcoverage 100%を満たしてから回収する。
共有npm cacheは必要時に `npm cache verify` で整合性確認・不要blob回収を行う。uv・ブラウザの共有cacheは
利用元と再取得コストを調べてから扱い、定期的な全消去はしない。worktreeは必要時だけ作り、未完了変更を統合してから閉じる。

### worktree の後始末は bash の `rm -rf` を使わない

`git worktree remove` がディレクトリを消せずに終わることがある (Windows のファイルロック等)。
その後始末を Git Bash (MSYS) の `rm -rf` に任せると、**MSYS のパス変換が意図しないパスへ
展開し、無関係なディレクトリ (今回はメインの working tree 自体) を巻き込んで削除する事故が
起きる** (2026-09-14 実測: `rm -rf "C:/tmp/stats47-*"` の実行中に `apps/admin/` 配下
5,268 ファイルが消えた。commit は無傷だったため `git checkout -- .` で復旧した)。

```bash
npm run local:worktree:remove -- <worktree-path> [--force]
```

`.claude/scripts/lib/remove-worktree.mjs` は bash を経由せず Node の `fs.rmSync` だけで
パスを解決するため、シェルのパス変換が原理的に起きない。削除前に「対象が `git worktree list`
に登録されているか」「メインの working tree ではないか」を検証してから消す。

放置された worktree に気づく仕組みも足した。`npm run local:audit` の `staleWorktrees` に
「未コミット差分を抱えたまま `scratchAgeDays` (既定14日) 超放置」された登録済み worktree が
列挙される (削除はしない。気づくためだけの観測)。09-08 起点の worktree 4 本が 6 日間気づかれず、
中身は既に develop に着地済みだったことの再発防止。

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

未公開データのローカル確認では `WEB_DEV_HOST=127.0.0.1 npm run dev:web` を使い、Next.jsの待受をループバックに限定する。WEB_DEV_HOSTはdev-serverが--hostnameへ渡す（未指定時は既存のNext.js既定値）。

### Codex / Claude の作業共有

- Windows PowerShellでは以下の `npm` を `npm.cmd` とする。`npm.ps1` 経由でオプションが欠落する場合は `node .claude/hooks/session-guard.js` を直接使う。
- 編集開始時に `npm run agent:session -- --status` で担当・タスク・最終メモを確認する。
- `npm run agent:session -- --register --agent codex --session <task-id> --task <backlog-id>` で登録する。
  Claude は `--agent claude` を使う。ID はタスク中固定し、既存タスクなら同じ backlog ID を使う。
  Codex の `CODEX_THREAD_ID` / Claude の `CLAUDE_SESSION_ID` がある場合は `--session` を省略できる。
- 同一作業場所、または別 worktree の同一タスクを検出すると警告する。排他ロックではなく、登録に参加するセッションの重複検知。
  編集は worktree を分け、同じタスクを別担当が実行中なら担当と範囲を調整する。
- 作業の節目に同じ登録コマンドへ `--note "変更対象・検証コマンド・結果・次の一手"` を加えて更新する。
  45分で活動判定が切れるため、長い作業ではその前に更新する。
- 完了時は `npm run agent:session -- --release --session <task-id> --note "検証結果・成果物の場所"`。
  残タスクは既存 backlog、恒久判断は rules に残す。session メモは7日で回収する一時状態。
- 保存先は Git common directory の `session-locks/`。同じリポジトリの worktree 間で共有し、gitに追跡しない。
  別PC・別cloneの担当調整は共有backlogを使う。hook未対応環境でも上記CLIを明示実行できる。
- 検証結果はコード・lockfile・設定・生成データとコマンドが同じ場合だけ引き継ぐ。
  session メモ単独では検査を省略しない。型検査は既存incremental cacheを利用し、CIの必須検査は維持する。
- `npm run test:agent-efficiency` がリンク共有・誤リンク検知・検査対象・待ち枠の再利用・セッション共有を検証する。

### `npm install` / lockfile 更新の排他 (同一作業ツリー)

新しいツールは作らず、既存の `agent:session` をそのまま使う。

- `npm install` / `npm ci` / lockfile 更新の前に `npm run agent:session -- --status` と稼働中
  プロセス (`dev:web` / `npm run admin` / turbo) を確認する。
- 別セッションが同じ作業ツリーで稼働中、または `--note` に install 実行中の記録があるときは、
  新たな install を開始しない。install の再試行を並行して走らせない。
- dev サーバー・管理画面 (`apps/admin`) が `node_modules` を使用中の場合は、必要に応じて担当
  セッションと調整してから更新する。
- install を始める・終えるタイミングで `--register` / `--release` の `--note` に
  「npm install 実行中」「npm install 完了」等を残し、他セッションが `--status` で判断できる
  ようにする。
- テスト実行だけが依存不足で失敗する場合 (例: 特定パッケージの devDependency 欠如) を、
  アプリ実装そのものの失敗と混同しない。
- `git add -A` は引き続き禁止。
