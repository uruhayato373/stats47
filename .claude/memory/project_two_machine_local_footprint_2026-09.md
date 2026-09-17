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

## ChatGPT (Codex) アプリが会社 PC で「固まる」= ネットワークの 503 (2026-09-17 実測)

- 症状: プロンプト送信後に UI が止まって見える。原因は会社ネットワーク (i-FILTER) が
  `chatgpt.com/backend-api/codex/responses` を 503 (「警告」ページ) で遮断していること。websocket は毎回
  (5 回リトライ ≈ 6.5 秒 → `falling back to HTTP`)、HTTP も断続的に遮断され、その時は数十秒〜数十分待った末に
  503 エラーで turn が終わる。リポジトリ設定は無関係。`responses_websockets` flag は "removed" で websocket は切れない。
- 証拠の取り方: `~/.codex/logs_2.sqlite` を `node:sqlite` (Node 22) で読む。`target='codex_api::endpoint::responses_websocket'`
  の ERROR と `codex_core::responses_retry`。session の `task_complete.time_to_first_token_ms` で待ち時間が分かる。
- Mac 側 f44ff75a0 (invalid transport で Codex 起動不能) は別症状。Windows でも `codex mcp list` / `codex doctor` は正常。
- `~/.codex/config.toml` (git 外) で thread 起動ごとに失敗していた MCP 4 台 (notebooklm = Google 認証切れ、
  cloudflare-graphql/observability = OAuth 未ログイン、cloudflare-api = env 未設定) を `enabled = false` にし、
  dotfiles `codex/host.windows.toml` にも同じ無効化を入れた (link.mjs は host セクションで丸ごと置換するので url も持たせる)。
- **注意**: `bin/link.mjs` は base.toml の `model` / `model_reasoning_effort` で先頭スカラーを置き換えるので、
  アプリで選んだモデル (2026-09-17 時点 gpt-5.6-sol / xhigh) が gpt-6-astra / medium に戻る。実行前に base.toml を合わせる。
- **2 回目以降の turn が送れない (2026-09-16〜17、会社 PC のみ) = `personality` 未設定 × Statsig 遮断**: 同一スレッドの
  2 通目は composer が「送信中」のまま `turn/start` が app-server に届かない (Electron ログは `config/read` で途切れる)。
  原因は app.asar の turn 開始前処理 `readDefaultPersonality`: `config/read` に `personality` が無いと
  `readExperimentPersonality()` が Statsig の評価 (`readExecutionAssignments`) を await するが、会社プロキシは
  `ab.chatgpt.com` を 403 (RBAC: access denied) で遮断するため永遠に resolve しない。1 通目は別経路で値が入るので通る。
  **修正 = `~/.codex/config.toml` に `personality = "friendly"` を明示** (dotfiles `codex/base.toml` にも同梱)。
  設定後は**アプリ再起動が必要** (app-server が config をキャッシュ)。再現/検証は新規スレッドで「1+1=?」→「2+2=?」。
  無関係と実測済み: アプリ版 (26.908.4834→9136 でも再現)、内部ブラウザ、repo/.codex 設定、MCP、git、queue/steer 設定、
  仮スレッド ID、PAC (8/26 から不変)、OS 更新 (無し)、Statsig キャッシュ (9/10 から不変)。
