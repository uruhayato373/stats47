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
    env: { ...process.env, CLAUDE_PROJECT_DIR: root },
  });
}

function run(root) {
  return spawnSync(process.execPath, [CHECKER, "--no-orphan"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, CLAUDE_PROJECT_DIR: root },
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
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("rejects a drifted Codex MCP command", (t) => {
  const root = fixture({
    ".mcp.json": JSON.stringify({
      mcpServers: {
        codex: {
          type: "stdio",
          command: "codex",
          args: ["mcp"],
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
