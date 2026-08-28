# codex MCP 利用規約 (Claude Code から Codex を呼ぶとき)

Claude Code から **MCP 経由で OpenAI Codex を呼ぶ**ときの実行規約 (SSOT)。
セカンドオピニオン・独立レビュー・切り出せる実装の委譲に使う。

> **3 つの「Codex」を混同しない**（本ルールの対象は ① だけ）
>
> | # | 経路 | 実体 | 規約 |
> |---|---|---|---|
> | **①** | **Claude Code → MCP (`mcp__codex__codex`)** | Claude のツールコールとして同期実行 | **本ルール** |
> | ② | standalone Codex (VSCode 拡張 / `codex` TUI) | 独立プロセス。`AGENTS.md` (=`CLAUDE.md` symlink) を読む | 同時起動禁止 or worktree 分離 (CLAUDE.md「並行エージェント」節) |
> | ③ | Codex built-in imagegen | Codex CLI/IDEで直接、または①経由で画像生成 | blog は `/generate-blog-images`。area は `area-databook-standards.md` §5 |

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

### ★会社 Windows PC (兵庫県庁ネットワーク) — 実行できることがある (2026-08-28 実測で解禁)

> **2026-08-28 更新**: 同じ会社 PC で `mcp__codex__codex` (built-in imagegen 含む) が
> **6 回連続成功**した (ブログ OGP 背景 6 枚の生成)。2026-08-06 の 503 は恒常ではなく、
> ネットワークポリシー側の状態に依存する。**会社 PC でもまず実行を試してよい**。
> 503 が返ったら下記の記録どおりフィルタ遮断なので、リトライせず別ネットワークへ回す。
> なぜ通るようになったかは未特定 (下の仮説は未検証のまま)。

以下は 2026-08-06 に 503 で失敗したときの記録 (再発時の診断用に保持):

MCP 接続とツールのロードは成功するが、**実行すると 503 で失敗する**。CLI (0.146.1) も
`codex login status` も正常で、原因はネットワーク側。

```
unexpected status 503 Service Unavailable: <HTML>…<TITLE>警告</TITLE>…,
url: https://chatgpt.com/backend-api/codex/responses
```

返ってきたのは **i-FILTER (Digital Arts) のブロックページ**で、TLS エラーではなく
**フィルタのポリシー拒否ページ**が返っている (`SELF_SIGNED_CERT_IN_CHAIN` の CA 不足系とは別)。

- **`.mcp.json` の `command` を `.cmd` のフルパスに書き換えても直らない。** コマンド解決が
  原因なら MCP サーバーの接続自体が失敗する。ツールがロードできている時点でその線は消える。
- **[仮説・未検証] codex CLI がプロキシを使わず直接外に出ているために遮断されている可能性がある。**
  同日の probe では **codex の 503 をどちらの経路でも再現できていない** — `curl` を
  `HTTPS_PROXY` 経由にすると `407 Proxy Authentication Required`、`--noproxy '*'` の直結だと
  schannel の TLS 傍受エラーで、いずれも 503 ブロックページにならなかった。
  `local-environment.md` は「直接の外向き通信はポリシー遮断 / 明示 CONNECT が唯一の正規の出口」と
  記録しているので、**プロキシ経由なら通る可能性は否定できていない**。
  検証するなら codex がプロキシを使っているかを確認する (reqwest は既定で `HTTPS_PROXY` を見るが、
  MCP サーバーへの環境変数の継承と `NO_PROXY` の効き方は未確認)。
- (2026-08-28 に冒頭へ移した通り) 会社 PC でもまず実行を試す。503 が再発したときだけ
  **別ネットワーク (自宅 Mac 等) へ回す**。仮説の検証が済んだらこの記録を整理する。

## 2. ツール

| ツール | 用途 | 主な入力 | 返り値 |
|---|---|---|---|
| `mcp__codex__codex` | 新規セッション開始 | `prompt` (必須) / `sandbox` / `approval-policy` / `cwd` / `model` / `base-instructions` / `config` | `{ threadId, content }` |
| `mcp__codex__codex-reply` | 既存セッションの継続 | `threadId` + `prompt` | 同上 |

- 続きを投げるときは**必ず `threadId` を渡す** (新規 `codex` を呼ぶと文脈がゼロから始まる)。
- `model` 未指定なら Codex 側の既定モデル。repo固有evalなしに固定modelへ上書きしない。

### 画像生成 (`/generate-blog-images`)

ブログ背景は `.claude/skills/blog/generate-blog-images/SKILL.md` を唯一の入口とする。
Claude Codeが生成要求JSONを組み立て直さず、
`npm run blog-images:codex -- request --slug <slug>` の `mcp.arguments` をそのまま使う。

1. `mcp__codex__codex` を `sandbox: read-only` / `approval-policy: never` / repo root `cwd` で呼ぶ。
2. Codexは組み込み `$imagegen` で1枚だけ生成し、repoを編集せず生成画像pathとprompt hashを返す。
3. Claude側が `npm run blog-images:codex -- ingest ...` で1200×630 JPEGへ正規化してgit assetへ取り込む。
4. `npm run check:blog-images` と画像pipeline testを通す。

意味仕様とpromptのSSOTは `apps/web/scripts/data/blog-codex-background-catalog.ts`、
exact bytesのSSOTは `apps/web/scripts/lib/assets/blog-codex-backgrounds/*.jpg`。
MCP prompt、自由入力prompt、生成済み画像をskill/ruleへ複製しない。Codex MCPが使えない場合に
Geminiへ暗黙fallbackしない。R2 push / deployはCodexへ委譲しない。

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
