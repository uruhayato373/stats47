---
name: feedback_playwright_profile_dual_os
description: Playwright 永続プロファイルのパスは Mac 直書きでも process.cwd() でもなく「Mac 本体が実在すればそこ、無ければファイル位置から解決した repo root」で決める
metadata:
  type: feedback
---

Playwright の永続プロファイル (ログイン状態) を置く root は、次の 1 本のフォールバックで決める。
`process.platform` で分岐しない。

```js
const MAIN_CHECKOUT = "/Users/minamidaisuke/stats47";              // Mac 本体 (worktree 共有用)
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const PROFILE_ROOT = existsSync(MAIN_CHECKOUT) ? MAIN_CHECKOUT : REPO_ROOT;
```

**Why:**
- Mac パスを直書きすると Windows では**別ドライブ配下に空プロファイルを掘り、「ログイン済みなのに
  未ログイン」**になる (doboku-note で実際に発生)。しかもエラーにならず静かに再ログインを要求するだけなので
  原因に辿り着きにくい。
- `process.cwd()` フォールバックは**実行ディレクトリ次第でプロファイルが分裂**する。ファイル自身の位置
  (`import.meta.url` / `__dirname`) から解決すれば、どこから実行しても同じ場所に決まる。
- Mac 本体を優先するのは git worktree から実行しても同じログインを共有するため (`.local/` は gitignore で
  worktree にコピーされない)。

**How to apply:**
- 適用済み: `.claude/scripts/ads/lib/asp-browser-base.mjs` (3 ASP 共通基盤) /
  `.claude/skills/ads/scout-asp/scripts/{a8-browser.ts,login.mjs}`。
- **SNS 系 (publish-x 等) は未適用** — Windows では再ログインになる。必要になった時点で同じ形に揃える。
- 正典: `docs/01_技術設計/playwright-auth-profiles.md` の対策 A'。関連: [[project_asp_site_attribution]]
