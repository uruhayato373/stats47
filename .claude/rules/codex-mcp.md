# codex MCP 利用規約 (Claude Code から Codex を呼ぶとき)

Claude Code から **MCP 経由で OpenAI Codex を呼ぶ**ときの実行規約 (SSOT)。
セカンドオピニオン・独立レビュー・切り出せる実装の委譲に使う。

> **3 つの「Codex」を混同しない**（本ルールの対象は ① だけ）
>
> | # | 経路 | 実体 | 規約 |
> |---|---|---|---|
> | **①** | **Claude Code → MCP (`mcp__codex__codex`)** | Claude のツールコールとして同期実行 | **本ルール** |
> | ② | standalone Codex (VSCode 拡張 / `codex` TUI) | 独立プロセス。`AGENTS.md` (=`CLAUDE.md` symlink) を読む | 同時起動禁止 or worktree 分離 (CLAUDE.md「並行エージェント」節) |
> | ③ | 「Codex セッション (OpenAI 画像)」 | オーナーが Codex 側で画像生成する手作業 | `area-databook-standards.md` §5 ほか。MCP とは無関係 |

---

## 1. 前提 (マシンごとに 1 回)

```bash
npm i -g @openai/codex     # 実測 0.146.1 で動作確認
codex login                # ChatGPT アカウント。認証情報はエージェントが扱わない
codex login status         # → "Logged in using ChatGPT" なら準備完了
```

- 入口は `.mcp.json` の `codex` エントリ (`type: stdio` / `command: codex` / `args: ["mcp-server"]`)。
  **`codex mcp` は別物** (Codex が外部 MCP を使う側の管理コマンド)。サーバー起動は `codex mcp-server`。
- `.mcp.json` は git tracked なので設定は全マシンに共有されるが、**CLI 本体と認証はマシンごと**。
  未インストールのマシンでは MCP 接続が失敗するだけで、他のツールには影響しない。
- 認証は `~/.codex/auth.json`。**このファイルを読まない・コピーしない・ログに出さない。**

## 2. ツール

| ツール | 用途 | 主な入力 | 返り値 |
|---|---|---|---|
| `mcp__codex__codex` | 新規セッション開始 | `prompt` (必須) / `sandbox` / `approval-policy` / `cwd` / `model` / `base-instructions` / `config` | `{ threadId, content }` |
| `mcp__codex__codex-reply` | 既存セッションの継続 | `threadId` + `prompt` | 同上 |

- 続きを投げるときは**必ず `threadId` を渡す** (新規 `codex` を呼ぶと文脈がゼロから始まる)。
- `model` 未指定なら Codex 側の既定モデル。指定するなら `gpt-5.2-codex` 等。

## 3. パラメータ規律 (★これが git 混入を防ぐ主装置)

| パラメータ | 既定 | 規律 |
|---|---|---|
| `sandbox` | **`read-only`** | 調査・レビュー・セカンドオピニオンは read-only。**ファイルを書けないので git 混入が構造的にゼロ**。編集させるときだけ `workspace-write`。**`danger-full-access` は使わない** |
| `approval-policy` | **`never`** | MCP 経由に対話承認 UI は無い。`on-request`/`untrusted` にすると承認待ちで止まるだけ。危険性は `sandbox` 側で制御する |
| `cwd` | リポジトリルートを**明示** | 省略するとサーバープロセスの cwd に依存し、worktree 運用時に解決先がぶれる |

`workspace-write` で編集させる場合は、**プロンプト冒頭で触ってよいパスを明示的に列挙する**
(`.claude/rules/agent-output-contract.md` の Task Capsule と同じ発想。`<scope>` に相当)。

## 4. git 規律 (memory `feedback_shared_working_copy_git_race` の MCP 版)

MCP 経由は同期呼び出しなので、**別プロセス Codex で起きていた HEAD/index/branch ref の奪い合いは
構造的に起きない**。ただし同 memory の 2026-08-05 エントリ (自分が起動した subagent の WIP が
`git add -A` で混入した事例) が示すとおり、「同じ作業ツリーを触る別の書き手」であることは変わらない。

1. **codex 実行中に Claude 側で並行書き込みをしない** — background Bash / 並列 subagent を
   走らせたまま `workspace-write` の codex を呼ぶと、同時性の race が復活する
2. **`git add -A` / `commit -a` 厳禁**。編集後は `git status --short` で touch されたパスを確認し、
   **明示パス add** → `git diff --cached --name-only` で混入チェックしてから commit
3. **取り込み後の検証は `npm run type-check` (turbo 全パッケージ)**。
   `apps/web` 単体 tsc では monorepo 横断の型不整合を検出できない (2026-06-21 に CI 2 回 fail した実例)
4. `package.json` を触られた場合は `npm install --package-lock-only` で lock を同期する
   (同じく 2026-06-21 の `npm ci` 失敗原因)
5. **codex の成果物はレビューしてから自分で commit する。** codex 自身に commit / push させない

## 5. 使いどころ

| 向く | 向かない |
|---|---|
| 独立した第三者視点のレビュー (Claude の実装を別モデルに批判させる) | Claude が数ツールコールで終わる調査 (往復コストが乗るだけ) |
| 切り出せる単一 work package の実装委譲 | 本ルール以外の規約判断を伴う作業 (Codex は `.claude/rules/` の文脈を持たない) |
| 同じ問題への別アプローチの生成 (判断材料を増やす) | 外部変更 (deploy / R2 push / 投稿) — outward-facing は Claude 側で承認を取る |

`.claude/rules/model-prompting.md` の委譲規律 (大きく・独立し・並列化できる作業だけ) は
codex MCP にもそのまま適用する。**自分で数回のツールコールで終わる作業は委譲しない。**

## 関連

- 設定: `.mcp.json` (`codex` エントリ) / ローカル有効化: `.claude/settings.local.json` の `enabledMcpjsonServers`
- git 競合の履歴と回避策: memory `feedback_shared_working_copy_git_race`
- 並行エージェント全般 (standalone Codex 経路): `CLAUDE.md`「並行エージェント (Codex 等) と SSOT を共有する」
- 委譲設計: `.claude/rules/model-prompting.md` / prompt 契約: `.claude/rules/agent-output-contract.md`
