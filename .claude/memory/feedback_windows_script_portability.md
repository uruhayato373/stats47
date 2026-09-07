---
name: feedback_windows_script_portability
description: Windows でスクリプトが落ちる 3 パターン (URL pathname の先頭スラッシュ / npx の spawn / Mac パス直書き) と、それぞれの正しい書き方
metadata:
  type: feedback
---

Mac では動くが **Windows では確実に落ちる**書き方が 3 つある。いずれも 2026-07-28 に実際に
スクリプトが落ちて発覚した。新規スクリプトを書くときは最初からこの形にする。

| NG | OK | 症状 |
|---|---|---|
| `new URL(".", import.meta.url).pathname` | `path.dirname(fileURLToPath(import.meta.url))` | 先頭に `/` が付き (`/C:/...`)、`path.resolve` がドライブ直下と解釈して **`C:\C:\...`** になる |
| `execFileSync("npx", ["tsx", ...])` | ローカルバイナリを node で直接起動: `execFileSync(process.execPath, [path.join(root,"node_modules/tsx/dist/cli.mjs"), ...])` | `npx` = `npx.cmd` で **ENOENT**。`.cmd` を明示しても Node 22 は shell 無しの `.cmd` 起動を **EINVAL** で拒否する (CVE-2024-27980 の緩和策) |
| プロファイル等の Mac パス直書き | `existsSync(MAIN_CHECKOUT) ? MAIN_CHECKOUT : REPO_ROOT` (REPO_ROOT はファイル位置から解決) | 別ドライブ配下に空ディレクトリを掘り、Playwright なら「ログイン済みなのに未ログイン」になる ([[feedback_playwright_profile_dual_os]]) |

**Why:** どれもエラーが原因を示さない (`C:\C:\...`・`ENOENT`・空プロファイル) ので、
Windows で初めて実行したときに毎回デバッグからやり直しになる。

**How to apply:**
- `shell: true` で逃げない。引数のクォート事故を招く。ローカルバイナリを `process.execPath` で直接叩く。
- `process.cwd()` をフォールバックにしない。実行ディレクトリ次第でパスが分裂する。
- 既存の一括修正済み: `.claude/scripts/{ads,blog,data,lib,remotion,surveys}/` と
  `.claude/skills/sns/{post-x-batch,publish-x}/`、`apps/web/scripts/sync-known-keys-from-remote.ts`。
- 2026-09-07 に `.claude/scripts/lib/preflight-commit.mjs` でも同じ問題を再現した。
  `npm` / `npx` は Windows だけ `process.execPath` と npm CLI (`process.env.npm_execpath`) / npx CLI を
  組み合わせて起動する。`.cmd` への置換は Node 22 で `EINVAL` になるため採用しない。
  回帰テストは `.claude/scripts/lib/__tests__/preflight-commit.test.mjs` の
  `resolveInvocation` ケースで、Windows の npm / npx が shell を介さず Node CLI に解決されることを固定する。
- 会社 Windows PC の web dev は Windows の proxy credentials・証明書ストアを使う R2 gateway を自動起動する
  (`apps/web/scripts/dev-server.ts`、正典 `.claude/rules/local-environment.md`)。
