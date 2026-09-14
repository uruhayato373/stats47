---
name: proxy-preload-for-fetch-scripts
description: 会社PCで素のfetch()を使う既存scriptを無改修で通すnode --import preload手法 (undici ProxyAgent + file:// URL)
metadata: 
  node_type: memory
  type: project
  originSessionId: f1964ee4-1d52-44d2-812b-c9f017044bbb
  modified: 2026-08-28T08:14:12.338Z
---

会社 Windows PC (兵庫県庁ネットワーク) では素の `fetch()` を使う script (例:
`.claude/scripts/blog/fetch-ranking-data-r2.mjs` / `fetch-correlation-scatter.mjs`) が
R2 取得に失敗する。script 側を改修せずに通す方法:

1. preload を scratchpad に置く (undici はリポジトリの node_modules から createRequire で解決):

```js
import { createRequire } from "node:module";
const require = createRequire("C:/Users/m004195/stats47/package.json");
const { ProxyAgent, setGlobalDispatcher } = require("undici");
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
if (proxy) setGlobalDispatcher(new ProxyAgent(proxy));
```

2. `node --import "file:///C:/.../proxy-preload.mjs" <script> ...` で実行する。

**Why:** Node の組み込み fetch は HTTPS_PROXY を見ない (`.claude/rules/local-environment.md` に実測記録)。
global dispatcher を注入すれば script 内の素の fetch がすべて proxy 経由になる。

**How to apply:**
- Windows では `--import` に **file:// URL が必須** (素のパスは `ERR_UNSUPPORTED_ESM_URL_SCHEME` で落ちる)。
- `npx tsx` で動く script (generate-article-charts.ts 等) はネットワーク不要ならそのままでよい。
- 恒久対応するなら script 側に `resolveDispatcher` パターン ([[proxy-fetch-canonical-pattern]] =
  `.claude/scripts/audit/theme-chart-live-audit.mjs` の手本) を入れる方が正だが、一時実行はこの preload が最速。
