import fs from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanupFixtureRoot, makeFixtureRoot } from "../helpers/fixture-root";

/**
 * /ops/agents のサーバー層。
 * ★skill の「担当のモデル」は primary_agent の frontmatter から引く。agent 側の model を変えたら
 *   skill 側の表示も追従することを固定する (写しを持たない契約)。
 * ★CI の --model は Claude 以外 (gemini-api) を拾わない。
 */

let root: string | null = null;
afterEach(() => {
  if (root) cleanupFixtureRoot(root);
  root = null;
  delete process.env.STATS47_PROJECT_ROOT;
});

function write(rel: string, body: string) {
  const p = path.join(root!, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, body);
}

async function load() {
  process.env.STATS47_PROJECT_ROOT = root!;
  vi.resetModules();
  return import("@/lib/server/agent-models");
}

describe("parseFrontmatter", async () => {
  const { parseFrontmatter } = await import("@/lib/server/agent-models");

  it("1 行の値・折り返し・配列を読む", () => {
    const fm = parseFrontmatter(
      ["---", "name: a", "description: >", "  一行目", "  二行目", "co_agents: [x, y]", "list:", "  - p", "  - q", "model: sonnet", "---", "body"].join("\n"),
    );
    expect(fm).toEqual({ name: "a", description: "一行目 二行目", co_agents: ["x", "y"], list: ["p", "q"], model: "sonnet" });
  });

  it("frontmatter が無ければ null", () => {
    expect(parseFrontmatter("# title")).toBeNull();
  });
});

describe("parseCiRuns", async () => {
  const { parseCiRuns } = await import("@/lib/server/agent-models");

  it("--model と続く --effort を拾い、Claude 以外は捨てる", () => {
    const yml = "run: |\n  claude -p x \\\n    --model sonnet \\\n    --effort high\n  other --model gemini-api\n  claude --model opus\n";
    expect(parseCiRuns("w.yml", yml)).toEqual([
      { workflow: "w.yml", model: "sonnet", effort: "high" },
      { workflow: "w.yml", model: "opus", effort: null },
    ]);
  });

  it("--model と --effort の間に別の引数が挟まっても同じ呼び出しとして読む", () => {
    const yml = "claude_args: |\n  --model sonnet\n  --json-schema '{\"type\":\"object\"}'\n  --effort medium\n  --max-turns 200\n";
    expect(parseCiRuns("w.yml", yml)).toEqual([{ workflow: "w.yml", model: "sonnet", effort: "medium" }]);
  });

  it("次の --model の effort を前の呼び出しに付けない", () => {
    const yml = "a --model sonnet\nb --model opus --effort low\n";
    expect(parseCiRuns("w.yml", yml)).toEqual([
      { workflow: "w.yml", model: "sonnet", effort: null },
      { workflow: "w.yml", model: "opus", effort: "low" },
    ]);
  });
});

describe("agentModelCatalog", () => {
  it("skill の担当モデルは primary_agent の frontmatter から引き、担当数を数える", async () => {
    root = makeFixtureRoot();
    write(".claude/agents/writer.md", "---\nname: writer\ndescription: 書く。詳細\nmodel: opus\n---\n");
    write(".claude/agents/README.md", "# index");
    write(".claude/skills/blog/publish/SKILL.md", "---\nname: publish\ndomain: blog\ndescription: d\nprimary_agent: writer\nco_agents: [ghost]\n---\n");
    write(".claude/skills/blog/publish/reference/SKILL.md", "---\nname: not-a-skill\n---\n");
    write(".claude/skills/misc/orphan/SKILL.md", "---\nname: orphan\ndescription: d\nprimary_agent: missing\n---\n");

    const { agentModelCatalog } = await load();
    const v = agentModelCatalog();
    if ("error" in v) throw new Error(v.error);

    expect(v.agents.map((a) => a.name)).toEqual(["writer"]);
    expect(v.agents[0].primarySkills).toBe(1);
    expect(v.skills.map((s) => [s.name, s.primaryAgentModel])).toEqual([
      ["publish", "opus"],
      ["orphan", null],
    ]);
    expect(v.routing).toBeNull();
  });

  it("frontmatter の無いファイルは画面を落とさず errors に載せる", async () => {
    root = makeFixtureRoot();
    write(".claude/agents/broken.md", "# no frontmatter");
    const { agentModelCatalog } = await load();
    const v = agentModelCatalog();
    if ("error" in v) throw new Error(v.error);
    expect(v.errors).toEqual([{ file: ".claude/agents/broken.md", error: "frontmatter が無い" }]);
  });
});
