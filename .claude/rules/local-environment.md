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

### ★会社 Windows PC では dev サーバーを起動しない (機械ゲートあり・2026-07-28)

会社ネットワーク (兵庫県庁) は **i-FILTER (Digital Arts) が透過型 TLS 傍受**をしている。実測で確定した挙動:

| 経路 | 結果 |
|---|---|
| curl (Windows 証明書ストアを信頼) | 200 |
| Node の素の fetch | `SELF_SIGNED_CERT_IN_CHAIN` (Node は Windows ストアを見ない) |
| Node + 社内 CA を `NODE_EXTRA_CA_CERTS` に設定 | **HTTP 503 のブロックページ** (CA 信頼だけでは通らない = 直接の外向き通信自体がポリシーで遮断) |
| Node + `HTTPS_PROXY` の明示 CONNECT (undici ProxyAgent) | 200 (これが唯一の正規の出口) |

`storage.stats47.jp` の証明書は `CN=CARGO-CA, DC=hyogo, DC=local` に差し替えられている (Cloudflare 本来の証明書ではない)。

**dev サーバーを使わない理由**: stats47 はほぼ全ページが R2 依存で、R2 が読めない dev は確認手段にならない
(home featured が空・ranking がチャート無しになる)。Next.js dev の RSC は global fetch を独自ラッパに
差し替えており undici の per-call `dispatcher` が落ちるため、回避には配信コード (`packages/r2-storage`) への
環境依存コード混入か preload での `setGlobalDispatcher` が要る。**どちらも負債になるため採らない。**

**検証は CI (workflow dispatch) と本番 URL の実測で行う** — 実際、2026-07-27〜28 の大規模作業
(values writer 復活・整合性監査新設・YouTube 撤退・R2 9.44GB 削減・featured 障害復旧) は
すべて dev サーバー無しで完結した。

**機械ゲート**: `.claude/hooks/pre-bash-safety.js` の `WINDOWS_BLOCKED_PATTERNS` が
`process.platform === "win32"` のときだけ `npm/pnpm/yarn/bun run dev*` `next dev` `turbo run dev` を deny する
(Mac/Linux では素通し)。`npm run build` `npm run gallery` 等は誤検知しないことをテスト済み。

**例外**: 素の tsx スクリプトは `HTTPS_PROXY` を継承していれば ProxyAgent 経由で R2 に到達できる
(`packages/estat-api/src/core/client/http-client.ts` / `packages/ranking/src/scripts/audit-ranking-data-integrity.ts` の実装)。
`R2_PUBLIC_FETCH_URL` を使う読み取りスクリプトはこの経路で動く。

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

# 統合メディア管理コンソール（ローカル専用・依存ゼロ・127.0.0.1:4747）
# 1画面で: SNS素材(/sns 動画再生→投稿/予約/caption/メトリクス) + 画像資産(/assets OGP/カード/note/動画・欠落チェック/再生成)
#         + ブログSVGカタログ(/svg) + プロジェクト現況(/dashboard メトリクス/進捗キュー/改善バックログTODO/STP戦略・読み取り専用ミラー)。
#         起動後にブラウザで http://127.0.0.1:4747/（file:// で直接開かない）。
# 常駐プロセスなので run_in_background + Ready polling で起動する。skill: /sns-gallery
# 実装は独立 Next.js アプリ apps/gallery (localhost 専用・127.0.0.1 bind 固定・PORT= で上書き可)。
# 旧 node:http 実装 (.claude/scripts/gallery/) と sns:gallery alias は 2026-07-16 に廃止。
npm run gallery
```

> 旧 `npm run backup:d1 --env production`（リモート D1 → R2 バックアップ）は **リモート D1 廃止により不要**。
> 完全DBレスでは観測値・配信は R2 が SSOT、設定/運用は git TS が SSOT で履歴は git に残る。
