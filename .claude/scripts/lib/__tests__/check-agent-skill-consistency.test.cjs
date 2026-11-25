"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const CHECKER = path.resolve(__dirname, "..", "check-agent-skill-consistency.cjs");

function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-prompt-contract-"));
  for (const [relativePath, content] of Object.entries(files)) {
    const target = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  return root;
}

function runWithOrphan(root) {
  return spawnSync(process.execPath, [CHECKER], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, STATS47_SCAN_ROOT: root },
  });
}

function run(root) {
  return spawnSync(process.execPath, [CHECKER, "--no-orphan"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, STATS47_SCAN_ROOT: root },
  });
}

function linkCodexBlogImageSkill(root) {
  const link = path.join(root, ".agents/skills/generate-blog-images");
  fs.mkdirSync(path.dirname(link), { recursive: true });
  fs.symlinkSync(
    path.join(root, ".claude/skills/blog/generate-blog-images"),
    link,
    "dir"
  );
}

const VALID_AGENT = `---
name: worker
description: bounded executor
model: sonnet
---

## Output Contract

One table only.
`;

test("accepts complete agent and skill prompt contracts", (t) => {
  const root = fixture({
    ".claude/agents/worker.md": VALID_AGENT,
    ".claude/skills/work/SKILL.md": `---
name: work
description: do bounded work
primary_agent: worker
---
`,
  });
  t.after(() => fs.rmSync(root, { recursive: true }));
  const result = run(root);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("rejects missing agent fields, owner, output contract, and banned prompts", (t) => {
  const root = fixture({
    ".claude/agents/worker.md": `---
name: worker
description: incomplete
---

答える前に再確認する。
`,
    ".claude/skills/work/SKILL.md": `---
name: work
description: missing owner
---
`,
  });
  t.after(() => fs.rmSync(root, { recursive: true }));
  const result = run(root);
  assert.equal(result.status, 1);
  for (const code of ["E4", "E5", "E6", "E7"]) {
    assert.match(result.stdout, new RegExp(`\\[${code}\\]`));
  }
});

test("rejects delegation without shared contracts or with cap above three", (t) => {
  const root = fixture({
    ".claude/agents/worker.md": VALID_AGENT,
    ".claude/skills/work/SKILL.md": `---
name: work
description: delegate work
primary_agent: worker
---

Agent(worker) を最大4並列で起動する。
`,
  });
  t.after(() => fs.rmSync(root, { recursive: true }));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /\[E8\]/);
  assert.match(result.stdout, /同時起動上限/);
});

test("accepts delegation capped at three with both shared contracts", (t) => {
  const root = fixture({
    ".claude/agents/worker.md": VALID_AGENT,
    ".claude/skills/work/SKILL.md": `---
name: work
description: bounded delegation
primary_agent: worker
---

Agent(worker) を最大3並列で起動する。
Follow .claude/rules/model-prompting.md.
Follow .claude/rules/agent-output-contract.md.
`,
  });
  t.after(() => fs.rmSync(root, { recursive: true }));
  const result = run(root);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("rejects skill entrypoints longer than five hundred lines", (t) => {
  const root = fixture({
    ".claude/agents/worker.md": VALID_AGENT,
    ".claude/skills/work/SKILL.md": `---
name: work
description: oversized entrypoint
primary_agent: worker
---
${Array.from({ length: 500 }, (_, index) => `line ${index}`).join("\n")}
`,
  });
  t.after(() => fs.rmSync(root, { recursive: true }));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /\[E6\].*500行/);
});

test("rejects custom agent descriptions longer than three hundred characters", (t) => {
  const root = fixture({
    ".claude/agents/worker.md": `---
name: worker
description: ${"x".repeat(301)}
model: sonnet
---

## Output Contract

One table only.
`,
  });
  t.after(() => fs.rmSync(root, { recursive: true }));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /\[E4\].*300文字/);
});

test("rejects ambiguous plain scalars and malformed argument hints", (t) => {
  const root = fixture({
    ".claude/agents/worker.md": `---
name: worker
description: executor: ambiguous description
model: sonnet
---

## Output Contract

One table only.
`,
    ".claude/skills/work/SKILL.md": `---
name: work
description: do bounded work
argument-hint: [--one] [--two]
primary_agent: worker
---
`,
  });
  t.after(() => fs.rmSync(root, { recursive: true }));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /\[E9\]/);
  assert.match(result.stdout, /plain scalar/);
});

test("accepts folded descriptions and quoted argument hints", (t) => {
  const root = fixture({
    ".claude/agents/worker.md": `---
name: worker
description: >-
  executor: bounded description
model: sonnet
---

## Output Contract

One table only.
`,
    ".claude/skills/work/SKILL.md": `---
name: work
description: >-
  Run one task: keep its scope bounded.
argument-hint: "[--one] [--two]"
primary_agent: worker
---
`,
  });
  t.after(() => fs.rmSync(root, { recursive: true }));
  const result = run(root);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("accepts the Claude Code to Codex MCP blog image contract", (t) => {
  const root = fixture({
    ".mcp.json": JSON.stringify({
      mcpServers: {
        codex: {
          type: "stdio",
          command: "npx",
          args: ["-y", "@openai/codex@0.153.0", "mcp-server"],
        },
      },
    }),
    ".claude/agents/worker.md": VALID_AGENT,
    ".claude/skills/blog/generate-blog-images/SKILL.md": `---
name: generate-blog-images
description: generate blog images through Codex MCP
primary_agent: worker
---

Call mcp__codex__codex with output from:
npm run blog-images:codex -- request --slug example
    npm run blog-images:codex -- ingest --slug example
`,
  });
  linkCodexBlogImageSkill(root);
  t.after(() => fs.rmSync(root, { recursive: true }));
  const result = run(root);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("rejects a drifted Codex MCP command", (t) => {
  const root = fixture({
    ".mcp.json": JSON.stringify({
      mcpServers: {
        codex: {
          type: "stdio",
          // 固定しない codex は 0.154.0 以降 mcp-server を持たず MCP が落ちる (2026-10-15)
          command: "codex",
          args: ["mcp-server"],
        },
      },
    }),
    ".claude/agents/worker.md": VALID_AGENT,
    ".claude/skills/blog/generate-blog-images/SKILL.md": `---
name: generate-blog-images
description: generate blog images through Codex MCP
primary_agent: worker
---

Call mcp__codex__codex with output from:
npm run blog-images:codex -- request --slug example
    npm run blog-images:codex -- ingest --slug example
`,
  });
  linkCodexBlogImageSkill(root);
  t.after(() => fs.rmSync(root, { recursive: true }));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /\[E10\].*mcp-server/);
});

test("accepts YouTube master-first pilot and TikTok withdrawal policy", (t) => {
  const root = fixture({
    ".claude/rules/sns-content-standards.md": [
      "| **YouTube** | **限定 pilot** |",
      "通常動画をマスターコンテンツにする",
      "| **TikTok** | **撤退 (恒久)** |",
    ].join("\n"),
    "apps/remotion/scripts/pipeline/render-sns-all.ts": "// IG/X/note only",
    "apps/remotion/scripts/pipeline/render-bar-chart-race.ts":
      'const allowed = new Set(["instagram", "x"]);',
    ".claude/skills/sns/generate-compare/reference/captions.md":
      "X / Instagram only",
    ".claude/skills/sns/update-sns-metrics/SKILL.md": `---
name: update-sns-metrics
description: YouTube pilot uses manual Studio metrics
primary_agent: worker
---

YouTube pilot は Studio 手動計測
`,
    ".claude/agents/worker.md": VALID_AGENT,
  });
  t.after(() => fs.rmSync(root, { recursive: true }));
  const result = run(root);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("rejects legacy YouTube Shorts or TikTok batch paths", (t) => {
  const root = fixture({
    ".claude/rules/sns-content-standards.md": [
      "| **YouTube** | **限定 pilot** |",
      "通常動画をマスターコンテンツにする",
      "| **TikTok** | **撤退 (恒久)** |",
    ].join("\n"),
    "apps/remotion/scripts/pipeline/render-sns-all.ts":
      'const id = "RankingYouTube-Short";',
    "apps/remotion/scripts/pipeline/render-bar-chart-race.ts": [
      'const allowed = new Set(["instagram", "x"]);',
      'const old = { platform: "tiktok" };',
    ].join("\n"),
    ".claude/skills/sns/generate-compare/reference/captions.md":
      "youtube/shorts.json\ntiktok/caption.json",
    ".claude/skills/sns/update-sns-metrics/SKILL.md": `---
name: update-sns-metrics
description: YouTube pilot uses manual Studio metrics
primary_agent: worker
---

YouTube pilot は Studio 手動計測
`,
    ".claude/agents/worker.md": VALID_AGENT,
  });
  t.after(() => fs.rmSync(root, { recursive: true }));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /\[E11\]/);
  assert.match(result.stdout, /旧一括生成経路/);
  assert.match(result.stdout, /TikTok 自動生成/);
  assert.match(result.stdout, /比較キャプションの旧出力/);
});

test("accepts fable as an agent model but still rejects unknown models", (t) => {
  // fable は 2026-08-17 に backlog-loop の escalation 先として許可した。
  // 許可値が野放図に広がらないよう、未知の値は落ちることを同時に固定する。
  const root = fixture({
    ".claude/agents/hard.md": VALID_AGENT.replace("model: sonnet", "model: fable"),
    ".claude/skills/work/SKILL.md": `---
name: work
description: do bounded work
primary_agent: hard
---
`,
  });
  t.after(() => fs.rmSync(root, { recursive: true }));
  assert.equal(run(root).status, 0, "fable を許可していない");

  const bad = fixture({
    ".claude/agents/hard.md": VALID_AGENT.replace("model: sonnet", "model: gpt-9"),
    ".claude/skills/work/SKILL.md": `---
name: work
description: do bounded work
primary_agent: hard
---
`,
  });
  t.after(() => fs.rmSync(bad, { recursive: true }));
  const result = run(bad);
  assert.notEqual(result.status, 0, "未知のモデルを通してはいけない");
  assert.match(result.stdout + result.stderr, /gpt-9/);
});

// ── orphan 走査: .ts と相対 import (2026-08-21) ─────────────────────────────

test("orphan 走査は .claude/scripts 配下の .ts も見る", () => {
  // ★.ts を歩いていなかったため、TS で書いたスクリプトは一度も検査されていなかった。
  const root = fixture({
    ".claude/scripts/demo/lonely.ts": "export const x = 1;",
  });
  const result = runWithOrphan(root);
  assert.match(result.stdout, /lonely[.]ts.*orphan/, "TS スクリプトが orphan 判定されていない");
});

test("相対 import で参照されている module は orphan にしない", () => {
  // ★import は拡張子を書かないので、basename 照合だけだと誤報する。
  const root = fixture({
    ".claude/scripts/demo/index.ts": 'import { a } from "./data/thing"; export const b = a;',
    ".claude/scripts/demo/data/thing.ts": "export const a = 1;",
  });
  const result = runWithOrphan(root);
  assert.doesNotMatch(result.stdout, /thing[.]ts.*orphan/, "相対 import が参照として見えていない");
});

test("ただの文字列一致では参照とみなさない", () => {
  // ★拡張子を落とした素の名前で緩く探すと `key: "thing"` のような無関係な文字列に当たる。
  //   import 指定子の形 (`/thing` の直後が引用符) だけを参照とみなす。
  const root = fixture({
    ".claude/scripts/demo/index.ts": 'export const registry = [{ key: "thing" }];',
    ".claude/scripts/demo/data/thing.ts": "export const a = 1;",
  });
  const result = runWithOrphan(root);
  assert.match(result.stdout, /thing[.]ts.*orphan/, "無関係な文字列一致を参照と誤認している");
});

// [E12] Codex mirror: 生成物 (.agents/skills / .codex/agents) が SSOT からずれていれば止め、
// 再生成後は通る。mirror ディレクトリが無い fixture では検査しない (既存 fixture を壊さない)。
const MIRROR = path.resolve(__dirname, "..", "sync-codex-mirror.cjs");

test("[E12] mirror が無い fixture では検査しない", (t) => {
  const root = fixture({
    ".claude/agents/worker.md": VALID_AGENT,
    ".claude/skills/dev/probe/SKILL.md": "---\nname: probe\ndescription: probe skill\nprimary_agent: worker\n---\n\nbody\n",
  });
  t.after(() => fs.rmSync(root, { recursive: true }));
  const result = run(root);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.doesNotMatch(result.stdout, /\[E12\]/);
});

test("[E12] ドリフトした mirror を止め、再生成すると通る", (t) => {
  const root = fixture({
    ".claude/agents/worker.md": VALID_AGENT,
    ".claude/skills/dev/probe/SKILL.md": "---\nname: probe\ndescription: probe skill\nprimary_agent: worker\n---\n\nbody\n",
    ".claude/skills/analytics/x/reference/snapshots/2026-W01/q.csv": "data",
    ".agents/skills/dev/probe/SKILL.md": "stale copy",
    ".agents/skills/gone/SKILL.md": "no longer in SSOT",
    ".codex/agents/worker.toml": 'name = "worker"\n',
  });
  t.after(() => fs.rmSync(root, { recursive: true }));
  const drifted = run(root);
  assert.equal(drifted.status, 1);
  assert.match(drifted.stdout, /\[E12\]/);

  const regen = spawnSync(process.execPath, [MIRROR, "--root", root], { cwd: root, encoding: "utf8" });
  assert.equal(regen.status, 0, regen.stdout + regen.stderr);
  assert.equal(fs.readFileSync(path.join(root, ".agents/skills/dev/probe/SKILL.md"), "utf8"), fs.readFileSync(path.join(root, ".claude/skills/dev/probe/SKILL.md"), "utf8"));
  assert.ok(!fs.existsSync(path.join(root, ".agents/skills/gone")), "SSOT に無い skill は消える");
  assert.ok(!fs.existsSync(path.join(root, ".agents/skills/analytics/x/reference/snapshots")), "snapshot データは mirror しない");
  const toml = fs.readFileSync(path.join(root, ".codex/agents/worker.toml"), "utf8");
  assert.match(toml, /^name = "worker"\ndescription = "bounded executor"\ndeveloper_instructions = '''\n## Output Contract/m);
  assert.doesNotMatch(toml, /\.Codex\//);

  const clean = run(root);
  assert.equal(clean.status, 0, clean.stdout + clean.stderr);
  const check = spawnSync(process.execPath, [MIRROR, "--check", "--root", root], { cwd: root, encoding: "utf8" });
  assert.equal(check.status, 0, check.stdout + check.stderr);
});

// CI-TOOLING-FOLLOWUP-01: worktree のセッションでは CLAUDE_PROJECT_DIR が元の作業ツリーを指す。
// mirror がその変数をルートにすると、worktree で再生成したつもりで元の作業ツリーへ書き込む。
// 書き込む先は、実行したスクリプトが置かれている作業ツリーにする。
test("mirror は CLAUDE_PROJECT_DIR が別の作業ツリーを指していても、自分の作業ツリーだけに書く", (t) => {
  const skill = "---\nname: probe\ndescription: probe skill\nprimary_agent: worker\n---\n\nbody\n";
  const drifted = () => ({
    ".claude/agents/worker.md": VALID_AGENT,
    ".claude/skills/dev/probe/SKILL.md": skill,
    ".agents/skills/dev/probe/SKILL.md": "stale copy",
    ".codex/agents/worker.toml": 'name = "worker"\n',
  });
  // worktree: スクリプトの写しを持つ作業ツリー。original: セッションを開いた元の作業ツリー
  const worktree = fixture({ ...drifted(), ".claude/scripts/lib/sync-codex-mirror.cjs": fs.readFileSync(MIRROR, "utf8") });
  const original = fixture(drifted());
  t.after(() => { fs.rmSync(worktree, { recursive: true }); fs.rmSync(original, { recursive: true }); });

  const result = spawnSync(process.execPath, [path.join(worktree, ".claude/scripts/lib/sync-codex-mirror.cjs")], {
    cwd: worktree, encoding: "utf8", env: { ...process.env, CLAUDE_PROJECT_DIR: original },
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(fs.readFileSync(path.join(original, ".agents/skills/dev/probe/SKILL.md"), "utf8"), "stale copy", "元の作業ツリーへ書き込んでいる");
  assert.equal(fs.readFileSync(path.join(original, ".codex/agents/worker.toml"), "utf8"), 'name = "worker"\n', "元の作業ツリーへ書き込んでいる");
  assert.equal(fs.readFileSync(path.join(worktree, ".agents/skills/dev/probe/SKILL.md"), "utf8"), skill, "自分の作業ツリーを再生成していない");
  assert.match(fs.readFileSync(path.join(worktree, ".codex/agents/worker.toml"), "utf8"), /^description = "bounded executor"$/m);
});

test("[E3] .codex/hooks.json の command が指す hook も存在検査する", (t) => {
  const root = fixture({
    ".claude/agents/worker.md": VALID_AGENT,
    ".codex/hooks.json": JSON.stringify({ hooks: { Stop: [{ hooks: [{ type: "command", command: "node '.claude/hooks/missing-hook.js'" }] }] } }),
  });
  t.after(() => fs.rmSync(root, { recursive: true }));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /\[E3\].*missing-hook\.js/);
});

test("mirror は skill のフォルダを相対リンクで共有し、複製・誤リンク・壊れたリンクを検出する", (t) => {
  // CODEX-MIRROR-SLIM-01: SKILL.md の複製をやめ、skill のフォルダごとの symlink にした
  // (Codex は symlink の skill フォルダを辿る。https://learn.chatgpt.com/docs/build-skills、2026-11-24 取得)。
  const root = fixture({
    ".claude/agents/worker.md": VALID_AGENT,
    ".claude/skills/dev/probe/SKILL.md": "probe",
    ".claude/skills/dev/probe/reference/improvement-log.md": "before",
    ".claude/skills/dev/probe/scripts/run.ts": "export {};",
    ".claude/skills/dev/other/SKILL.md": "other",
    ".claude/skills/learned/note.md": "learned",
    ".agents/skills/dev/probe/SKILL.md": "old",
  });
  t.after(() => fs.rmSync(root, { recursive: true }));
  const invoke = (...args) => spawnSync(process.execPath, [MIRROR, ...args, "--root", root], { cwd: root, encoding: "utf8" });
  assert.equal(invoke("--check").status, 1, "古い複製のフォルダは不一致");
  assert.equal(invoke().status, 0);
  const folder = path.join(root, ".agents/skills/dev/probe");
  const learned = path.join(root, ".agents/skills/learned/note.md");
  assert.ok(fs.lstatSync(folder).isSymbolicLink(), "skill のフォルダはリンク");
  assert.ok(!path.isAbsolute(fs.readlinkSync(folder)), "別PCでも使える相対リンク");
  assert.equal(fs.readFileSync(path.join(folder, "SKILL.md"), "utf8"), "probe", "リンク越しに SKILL.md が読める");
  assert.equal(fs.readFileSync(path.join(root, ".claude/skills/dev/probe/scripts/run.ts"), "utf8"), "export {};", "複製を消しても原本は残る");
  assert.ok(fs.lstatSync(learned).isSymbolicLink(), "skill の外のファイルはファイルごとのリンク");
  fs.writeFileSync(path.join(folder, "reference/improvement-log.md"), "after");
  assert.equal(fs.readFileSync(path.join(root, ".claude/skills/dev/probe/reference/improvement-log.md"), "utf8"), "after");
  assert.equal(invoke("--check").status, 0, "原本更新後も再生成は不要");
  fs.unlinkSync(folder);
  fs.symlinkSync("../../../.claude/skills/dev/other", folder, "dir");
  assert.equal(invoke("--check").status, 1, "別の skill を指す誤リンクは不一致");
  assert.equal(invoke().status, 0);
  assert.equal(fs.readFileSync(path.join(folder, "SKILL.md"), "utf8"), "probe");
  fs.unlinkSync(folder);
  fs.symlinkSync("missing", folder, "dir");
  assert.equal(invoke("--check").status, 1, "壊れたリンクは不一致");
  assert.equal(invoke().status, 0);
  assert.equal(fs.readFileSync(path.join(folder, "SKILL.md"), "utf8"), "probe");
});

test("mirror は .codex/hooks.json を settings.json から生成し、Codex で動かない hook を除く", (t) => {
  const settings = {
    hooks: {
      PreToolUse: [
        { matcher: "Bash", hooks: [{ type: "command", command: 'node "$CLAUDE_PROJECT_DIR"/.claude/hooks/pre-bash-safety.js' }] },
        { matcher: "mcp__Claude_Browser__.*", hooks: [{ type: "command", command: 'node "$CLAUDE_PROJECT_DIR"/.claude/hooks/pre-browser-admin-read.mjs' }] },
      ],
      Stop: [
        { hooks: [{ type: "command", command: 'node "$CLAUDE_PROJECT_DIR"/.claude/hooks/check-docs-on-stop.js --flag' }] },
        { hooks: [{ type: "command", command: 'node "$CLAUDE_PROJECT_DIR"/.claude/hooks/check-findings-on-stop.js' }] },
      ],
    },
  };
  const root = fixture({
    ".claude/agents/worker.md": VALID_AGENT,
    ".claude/settings.json": JSON.stringify(settings),
    ".claude/skills/dev/probe/SKILL.md": "probe",
    ".codex/agents/worker.toml": 'name = "worker"\n',
    ".codex/hooks.json": "{}\n",
  });
  t.after(() => fs.rmSync(root, { recursive: true }));
  const invoke = (...args) => spawnSync(process.execPath, [MIRROR, ...args, "--root", root], { cwd: root, encoding: "utf8" });
  assert.equal(invoke("--check").status, 1, "手で書いた hooks.json は不一致");
  assert.equal(invoke().status, 0);
  const hooks = JSON.parse(fs.readFileSync(path.join(root, ".codex/hooks.json"), "utf8")).hooks;
  assert.deepEqual(hooks.PreToolUse, [{ matcher: "Bash", hooks: [{ type: "command", command: "node '.claude/hooks/pre-bash-safety.js'" }] }]);
  assert.deepEqual(hooks.Stop, [{ hooks: [{ type: "command", command: "node '.claude/hooks/check-docs-on-stop.js' --flag" }] }]);
  assert.equal(invoke("--check").status, 0);
});

test("E13: 4 体以上の agent に同じ方針の行を写すと止め、正典 rule への 1 行参照は通す", (t) => {
  const copied = "セッション中にブラウザで取りに行かない。記録が古いときは判定不能と最終観測日を書いて止める。";
  const ref = "正典 (記録の置き場・古いときの扱い・例外) は `.claude/rules/recorded-measurement-first.md`。";
  const agent = (name, line) => VALID_AGENT.replace("name: worker", `name: ${name}`) + `\n## 記録から判断する\n\n${line}\n`;
  const names = ["a1", "a2", "a3", "a4"];

  const copiedRoot = fixture(Object.fromEntries(names.map((n) => [`.claude/agents/${n}.md`, agent(n, copied)])));
  t.after(() => fs.rmSync(copiedRoot, { recursive: true }));
  const copiedResult = run(copiedRoot);
  assert.equal(copiedResult.status, 1);
  assert.match(copiedResult.stdout, /\[E13\]/);

  const refRoot = fixture(Object.fromEntries(names.map((n) => [`.claude/agents/${n}.md`, agent(n, ref)])));
  t.after(() => fs.rmSync(refRoot, { recursive: true }));
  assert.doesNotMatch(run(refRoot).stdout, /\[E13\]/);

  // 3 体までは agent 固有の言い回しが偶然重なることがあるので止めない
  const fewRoot = fixture(Object.fromEntries(names.slice(0, 3).map((n) => [`.claude/agents/${n}.md`, agent(n, copied)])));
  t.after(() => fs.rmSync(fewRoot, { recursive: true }));
  assert.doesNotMatch(run(fewRoot).stdout, /\[E13\]/);
});
