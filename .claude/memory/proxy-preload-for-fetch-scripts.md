---
name: proxy-preload-for-fetch-scripts
description: 会社PCで素のfetch()を使う既存scriptを無改修で通すnode --import preload手法 (undici EnvHttpProxyAgent + file:// URL、ローカル配信は除外)
metadata: 
  node_type: memory
  type: project
  originSessionId: f1964ee4-1d52-44d2-812b-c9f017044bbb
  modified: 2026-11-13T13:23:15.080Z
---

会社 Windows PC (兵庫県庁ネットワーク) では素の `fetch()` を使う script (例:
`.claude/scripts/blog/fetch-ranking-data-r2.mjs` / `fetch-correlation-scatter.mjs`) が
R2 取得に失敗する。script 側を改修せずに通す方法:

1. preload を scratchpad に置く (undici はリポジトリの node_modules から createRequire で解決):

```js
import { createRequire } from "node:module";
const require = createRequire("C:/Users/m004195/stats47/package.json");
const { EnvHttpProxyAgent, setGlobalDispatcher } = require("undici");
setGlobalDispatcher(new EnvHttpProxyAgent({
  noProxy: [process.env.NO_PROXY ?? process.env.no_proxy ?? "", "localhost", "127.0.0.1", "::1"].join(","),
}));
```

2. `node --import "file:///C:/.../proxy-preload.mjs" <script> ...` で実行する。

**Why:** Node の組み込み fetch は HTTPS_PROXY を見ない (`.claude/rules/local-environment.md` に実測記録)。
環境変数に従う dispatcher を注入し、外部は proxy、除外したローカル配信は直接取得する。

**How to apply:**
- Windows では `--import` に **file:// URL が必須** (素のパスは `ERR_UNSUPPORTED_ESM_URL_SCHEME` で落ちる)。
- `npx tsx` で動く script (generate-article-charts.ts 等) はネットワーク不要ならそのままでよい。
- 恒久対応するなら script 側に `resolveDispatcher` パターン ([[proxy-fetch-canonical-pattern]] =
  `.claude/scripts/audit/theme-chart-live-audit.mjs` の手本) を入れる方が正だが、一時実行はこの preload が最速。
- **ローカル地図のTimeoutError (2026-11-13)**: e-Stat取得は通るのに `http://127.0.0.1:4777/gis/...` が30秒で落ちる場合、全通信を固定の `ProxyAgent` へ渡していないか確認する。`EnvHttpProxyAgent` と上記除外で解決し、P-04の全国・県内地図を含む12画像を生成・照合した。外部とローカルを同じ実行で使うときも証明書検証は無効化しない。

**Playwright の直接リクエストは別経路 (2026-11-13 実測)**: note の更新道具が会社 PC で `HTTP 503`「ブロックされました」になる原因は、
`ctx.request` (APIRequestContext) がプロキシを見ないことだった (同じ GET が、指定なし 503・`proxy: { server: HTTPS_PROXY }` で 200・
ページ内 `fetch` は元から 200)。`.claude/scripts/note/lib/note-session.mjs` の `launchContext` が `HTTPS_PROXY` のある環境でだけ
context にプロキシを渡す。素の Node `fetch` の読み取りには引き続きこの preload が要る (`NODE_OPTIONS="--import file:///…/proxy-preload.mjs"` と
`NODE_EXTRA_CA_CERTS`)。この形で本文のリンク置換 4 本を会社 PC から公開できた。画像のアップロードが通るかは未検証
(`NOTE-FIGURE-ROLLOUT-01` の仮説)。503 を「アップロードがフィルターで止まる」と決めつけず、どの経路のリクエストかを先に切り分ける。

**証明書の追加 (2026-10-28 実測)**: プロキシを通しても `fetch failed` / `UNABLE_TO_VERIFY_LEAF_SIGNATURE` で落ちる
(会社のネットワークが TLS 証明書を差し替えるため)。Node 22.14 には `--use-system-ca` が無いので、PowerShell で
`Cert:\LocalMachine\Root`・`Cert:\CurrentUser\Root`・`Cert:\LocalMachine\CA` を PEM に書き出し
(`[Convert]::ToBase64String($_.RawData,'InsertLineBreaks')` を BEGIN/END CERTIFICATE で囲む)、
`NODE_EXTRA_CA_CERTS=<pem>` を付けて preload と併用する。`audit-note-unverified.mjs --published` は
これで 428 本すべて取得できた (未設定時は fetchFailed=428・exit 2 で、結果は 0 件ではなく判定不能)。
