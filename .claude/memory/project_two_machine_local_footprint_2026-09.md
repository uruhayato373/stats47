---
name: project_two_machine_local_footprint_2026-09
description: 2026-09-14 に入れた「ローカル肥大化抑制 + 会社Windows/自宅Mac 二拠点」の運用ポインタと、この Windows PC 固有の pre-commit / preflight の罠
metadata:
  type: project
---

2026-09-14 に PR #969 → #970 → #971 (stacked) で次を入れた。設計の正典は `.claude/rules/local-environment.md`
「2 台で同じ形にする手順」「ローカル資源の予算と保持」と `data-storage.md` / `r2-storage-design.md`。
残タスクは backlog `STATE-R2-MIGRATION-01` / `STATE-R2-LIFECYCLE-01` / `CONFIG-SECRET-CLAUDE-JSON-01` / `MAC-FIRST-RUN-01`。

- 個人設定は private repo `uruhayato373/dotfiles` (`~/dotfiles`、秘密値なし)。`~/.claude/settings.json` は
  その symlink (Claude Code が書く変更もそのまま dotfiles に落ちる = 2026-09-14 に実測)。`~/.codex/config.toml`
  は `bin/link.mjs` がセクション単位でマージする (Codex デスクトップが書く `[projects.*]` 等を壊さない)。
- `.agents/skills` と `.codex/agents/*.toml` は生成物。`node .claude/scripts/lib/sync-codex-mirror.cjs` で再生成し、
  E12 が CI / pre-commit / Stop hook でドリフトを止める。SKILL.md を直したら同じ commit で再生成する。
- 生の観測 state は R2 `state/<domain>/` (最初は `ads/ga4-affiliate`)。ローカルは `npm run state:pull -- <domain>`。
- `~/.claude.json` の github MCP には PAT が平文で残っている (Codex 側は削除済み)。会社 PC は `gh` が
  プロキシ認証で使えないため意図的に残した。消すのは gh が通ってから。

**Why:** git は 25 pack / loose 6,286、`.local` 2.7GB、`C:\tmp` 10.6GB、`.claude/state/metrics` が 4 週で 230 commit、
husky は両 OS で一度も走っていなかった、memory の symlink は Windows で未設定 (repo 122 件が読まれていなかった)。

**How to apply:**
- この Windows PC の pre-commit は**約 12 分**かかる (type-check:scripts 9 本 + vitest)。`git commit` は
  `run_in_background` で回し、出力をファイルに落として `❌` を grep する。
- vitest の `blog-image-render.test.ts` (EBUSY) と `blog-image-noop-plan.test.ts` (10s timeout) は負荷で落ちる
  フレーク。単体で再実行して PASS なら commit を再実行する (`--no-verify` は使わない)。
- `npm run preflight:pr` はこの PC で 2 gate が環境要因で落ちる: 「Sitemap / Tag Keys」(TLS 傍受で R2 fetch 不可) と
  「Unit Semantics Mirror」(CRLF checkout をバイト比較)。Linux CI が権威。
- `git commit` する前に `books/` のような禁止 path がローカルに残っていないか (`npm run source-vault:check`)。
  残っていると `source-vault:check` が全 commit を止める。2026-09-14 は 467MB を `C:\tmp\stats47-books-vaulted-20260914`
  へ退避した (Drive vault と sha256 全件一致を確認済み・14 日で自動回収)。
- 4 本の worktree (`C:\tmp\stats47-affiliate-*-20260908`) は未コミット作業を含むので消していない。
  閉じるときは各 worktree で `git status --porcelain` が空になってから `git worktree remove`。
