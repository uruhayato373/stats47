import "server-only";

import fs from "node:fs";
import path from "node:path";

import { projectRoot } from "./project-root";
import { wrap } from "./state-io";

/**
 * agent / skill / CI 無人実行 / backlog-loop のモデル割り当て一覧 (読み取り専用)。
 * 正本はそれぞれ `.claude/agents/*.md` の frontmatter、`.claude/skills/**\/SKILL.md` の frontmatter、
 * `.github/workflows/*.yml` の `--model` / `--effort`、`.claude/config/backlog-routing-policy.json`。
 * ここは写しを持たず、表示のたびに正本を読む。モデル選定の規約は `.claude/rules/model-prompting.md`。
 */

export interface AgentEntry {
  name: string;
  file: string;
  domain: string | null;
  model: string | null;
  effort: string | null;
  description: string;
  /** primary_agent としてこの agent を指す skill の数 */
  primarySkills: number;
  /** co_agents としてこの agent を指す skill の数 */
  coSkills: number;
}

export interface SkillEntry {
  name: string;
  file: string;
  domain: string | null;
  primaryAgent: string | null;
  /** primary_agent の model。skill 自体は呼び出したセッションのモデルで動くので参考値 */
  primaryAgentModel: string | null;
  coAgents: string[];
  userInvocable: boolean;
  modelInvocable: boolean;
  description: string;
}

export interface CiRunEntry {
  workflow: string;
  model: string;
  effort: string | null;
}

export interface RoutingClassEntry {
  className: string;
  model: string;
  effort: string | null;
  maxAttempts: number | null;
}

/** `.claude/state/metrics/model-usage/latest.json` (build-model-usage-report.mjs が書く) の画面で使う部分 */
export interface UsageReport {
  generatedAt: string;
  window: { weeks: number; subWeeks: string[]; mainWeeks: string[] };
  sources: { local: Array<{ platform: string; generatedAt: string }>; pricing: { source: string; observedAt: string } };
  agents: Array<{ agentType: string; runs: number; calls: number; costUsd: number; costPerRun: number | null; byModel: Record<string, number>; byEffort: Record<string, number>; custom: boolean }>;
  main: Array<{ model: string; effort: string; calls: number; costUsd: number }>;
  ci: Array<{ workflow: string; runs: number; items: number; costUsd: number; costPerRun: number | null; costPerItem: number | null; errors: number; models: Record<string, number>; efforts: Record<string, number> }>;
  canary: Array<{ file: string; agent: string; baseline: { model: string; effort: string | null }; candidate: { model: string; effort: string | null }; verdict: string; scores: { baseline: { recall: number; cost: number }; candidate: { recall: number; cost: number } }; generatedAt: string }>;
  proposals: Array<{ id: string; kind: string; agent: string; current: string; suggested: string; costUsd: number | null; savingUsd?: number | null; runs: number; evidence: string; canary?: string; next: string }>;
}

export const USAGE_REPORT = ".claude/state/metrics/model-usage/latest.json";

export interface AgentModelCatalog {
  usage: UsageReport | null;
  agents: AgentEntry[];
  skills: SkillEntry[];
  ciRuns: CiRunEntry[];
  routing: { updatedAt: string | null; classes: RoutingClassEntry[] } | null;
  errors: Array<{ file: string; error: string }>;
}

export const AGENT_MODEL_SOURCES = ".claude/agents/*.md + .claude/skills/**/SKILL.md + .github/workflows/*.yml + .claude/config/backlog-routing-policy.json";

type Frontmatter = Record<string, string | string[]>;

/** SKILL.md / agent.md の frontmatter を読む。対象は 1 行の値・`>` `|` の複数行・`[a, b]` と `- a` の配列だけ */
export function parseFrontmatter(md: string): Frontmatter | null {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const out: Frontmatter = {};
  const lines = m[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, raw] = kv;
    const value = raw.trim();
    const block: string[] = [];
    while (i + 1 < lines.length && /^\s+\S|^\s*$/.test(lines[i + 1]) && !/^[A-Za-z_-]+:/.test(lines[i + 1])) {
      block.push(lines[++i].trim());
    }
    if (value.startsWith("[")) {
      out[key] = value.replace(/^\[|\]$/g, "").split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    } else if (value === "" && block.some((b) => b.startsWith("- "))) {
      out[key] = block.filter((b) => b.startsWith("- ")).map((b) => b.slice(2).trim());
    } else if (value === ">" || value === "|" || value === ">-" || value === "|-") {
      out[key] = block.filter(Boolean).join(value.startsWith(">") ? " " : "\n");
    } else {
      out[key] = value.replace(/^["']|["']$/g, "");
    }
  }
  return out;
}

const str = (v: string | string[] | undefined): string | null => (typeof v === "string" && v !== "" ? v : null);
const list = (v: string | string[] | undefined): string[] => (Array.isArray(v) ? v : typeof v === "string" && v ? [v] : []);

function walkSkillFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      // reference/ 配下は skill 本体ではない
      if (e.name === "reference" || e.name === "node_modules") continue;
      out.push(...walkSkillFiles(p));
    } else if (e.name === "SKILL.md") {
      out.push(p);
    }
  }
  return out;
}

/**
 * workflow yml から `--model X` と、同じ呼び出しの `--effort Y` を拾う (claude CLI / base-action の無人実行)。
 * `--effort` は `--model` の直後とは限らない (間に `--json-schema` 等が挟まる) ので、
 * 次の `--model` までの 6 行以内を同じ呼び出しとみなす。
 */
export function parseCiRuns(file: string, yml: string): CiRunEntry[] {
  const runs: CiRunEntry[] = [];
  const matches = [...yml.matchAll(/--model[ =]+["']?([A-Za-z0-9._-]+)/g)];
  matches.forEach((m, i) => {
    // gemini-api 等の Claude 以外は対象外
    if (!/^(haiku|sonnet|opus|fable|claude-)/.test(m[1])) return;
    const segment = yml.slice(m.index, matches[i + 1]?.index ?? yml.length).split("\n").slice(0, 6).join("\n");
    const effort = segment.match(/--effort[ =]+["']?([a-z]+)/)?.[1] ?? null;
    runs.push({ workflow: file, model: m[1], effort });
  });
  return runs;
}

export function agentModelCatalog() {
  return wrap((): AgentModelCatalog => {
    const root = projectRoot();
    const errors: AgentModelCatalog["errors"] = [];
    const rel = (p: string) => path.relative(root, p);

    const agentsDir = path.join(root, ".claude/agents");
    const agents: AgentEntry[] = [];
    for (const f of fs.existsSync(agentsDir) ? fs.readdirSync(agentsDir).sort() : []) {
      if (!f.endsWith(".md") || f === "README.md") continue;
      const p = path.join(agentsDir, f);
      const fm = parseFrontmatter(fs.readFileSync(p, "utf8"));
      if (!fm) {
        errors.push({ file: rel(p), error: "frontmatter が無い" });
        continue;
      }
      agents.push({
        name: str(fm.name) ?? f.replace(/\.md$/, ""),
        file: rel(p),
        domain: str(fm.domain),
        model: str(fm.model),
        effort: str(fm.effort),
        description: str(fm.description) ?? "",
        primarySkills: 0,
        coSkills: 0,
      });
    }
    const byName = new Map(agents.map((a) => [a.name, a]));

    const skills: SkillEntry[] = [];
    for (const p of walkSkillFiles(path.join(root, ".claude/skills")).sort()) {
      const fm = parseFrontmatter(fs.readFileSync(p, "utf8"));
      if (!fm) {
        errors.push({ file: rel(p), error: "frontmatter が無い" });
        continue;
      }
      const primaryAgent = str(fm.primary_agent);
      const coAgents = list(fm.co_agents);
      const primary = primaryAgent ? byName.get(primaryAgent) : undefined;
      if (primary) primary.primarySkills++;
      for (const c of coAgents) {
        const a = byName.get(c);
        if (a) a.coSkills++;
      }
      skills.push({
        name: str(fm.name) ?? path.basename(path.dirname(p)),
        file: rel(p),
        domain: str(fm.domain),
        primaryAgent,
        primaryAgentModel: primary?.model ?? null,
        coAgents,
        userInvocable: str(fm["user-invocable"]) !== "false",
        modelInvocable: str(fm["disable-model-invocation"]) !== "true",
        description: str(fm.description) ?? "",
      });
    }

    const wfDir = path.join(root, ".github/workflows");
    const ciRuns: CiRunEntry[] = [];
    for (const f of fs.existsSync(wfDir) ? fs.readdirSync(wfDir).sort() : []) {
      if (!/\.ya?ml$/.test(f)) continue;
      ciRuns.push(...parseCiRuns(f, fs.readFileSync(path.join(wfDir, f), "utf8")));
    }

    let routing: AgentModelCatalog["routing"] = null;
    const policyPath = path.join(root, ".claude/config/backlog-routing-policy.json");
    if (fs.existsSync(policyPath)) {
      try {
        const policy = JSON.parse(fs.readFileSync(policyPath, "utf8")) as {
          updatedAt?: string;
          classes?: Record<string, { model?: string; effort?: string; maxAttempts?: number }>;
        };
        routing = {
          updatedAt: policy.updatedAt ?? null,
          classes: Object.entries(policy.classes ?? {}).map(([className, c]) => ({
            className,
            model: c.model ?? "?",
            effort: c.effort ?? null,
            maxAttempts: c.maxAttempts ?? null,
          })),
        };
      } catch (e) {
        errors.push({ file: rel(policyPath), error: (e as Error).message });
      }
    }

    let usage: UsageReport | null = null;
    const usagePath = path.join(root, USAGE_REPORT);
    if (fs.existsSync(usagePath)) {
      try {
        usage = JSON.parse(fs.readFileSync(usagePath, "utf8")) as UsageReport;
      } catch (e) {
        errors.push({ file: USAGE_REPORT, error: (e as Error).message });
      }
    }

    return { usage, agents, skills, ciRuns, routing, errors };
  });
}
