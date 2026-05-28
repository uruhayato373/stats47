#!/usr/bin/env node
// 各 SKILL.md の frontmatter に primary_agent / co_agents を追記する。
// .claude/agents/*.md から skill 担当表を parse して mapping を構築し、
// 新 agent 優先 (priority) で primary を決定する。
//
// Usage:
//   node .claude/scripts/lib/update-skill-primary-agent.cjs [--dry-run]

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const AGENTS_DIR = path.join(PROJECT_ROOT, ".claude/agents");
const SKILLS_DIR = path.join(PROJECT_ROOT, ".claude/skills");
const DRY_RUN = process.argv.includes("--dry-run");

// 新 agent (Phase 2 で追加) は primary 優先
const NEW_AGENTS = new Set([
  "knowledge-curator", "improvement-triage", "estat-researcher",
  "data-ingester", "db-schema-manager", "snapshot-exporter", "r2-publisher",
  "trend-scout", "blog-planner", "chart-author", "blog-critic", "sns-metrics-sync",
  "gsc-analyst", "ga4-analyst", "performance-auditor", "adsense-analyst",
  "image-prompt-curator", "ui-consistency-reviewer",
]);

// 縮退記述 agent (旧 17 のうち主要責務を新 agent に委譲) は co_agent 行き
const DEPRECATED_AGENTS = new Set([
  "data-pipeline", "db-manager", "blog-editor", "seo-auditor",
  "sns-renderer", "code-reviewer", "note-manager", "strategy-advisor",
]);

// agent.md の skill 表で網羅されていない skill の手動マッピング。
// agent.md 側を更新するのが筋だが、 Phase 3 では縮退記述のみ行ったので
// fallback として script 側で補完する (Phase 3.5 相当)。
const FALLBACK_MAPPING = {
  "archive-remotion-output": "sns-renderer",
  "blog-review": "blog-critic",
  "brushup-blog": "article-writer",
  "design-note-structure": "note-manager",
  "draft-from-trend": "article-writer",
  "enhance-ranking-ai-content": "data-ingester",
  "expand-indicators": "strategy-advisor",
  "fetch-note-metrics": "sns-metrics-sync",
  "generate-compare": "sns-renderer",
  "generate-csv": "snapshot-exporter",
  "generate-instagram-schedule": "instagram-strategist",
  "goal": "strategy-advisor",
  "investigate-note-data": "note-manager",
  "page-data-batch": "data-ingester",
  "panel-review": "blog-critic",
  "prune-remotion-output": "sns-renderer",
  "recompute-correlations": "snapshot-exporter",
  "render-ges-ports": "sns-renderer",
  "schedule-instagram-mbs": "instagram-strategist",
  "sns-metrics-improvement": "sns-metrics-sync",
  "strategic-compact": "devops-runner",
  "sync-metrics-cache": "data-ingester",
  "task-router": null, // internal dispatcher (user-invocable: false) — skip
  "update-x-profile": "x-strategist",
  "validate-note-idea": "note-manager",
  "verification-loop": "devops-runner",
};

function findAllSkills() {
  const skills = {};
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === "SKILL.md") {
        const skillName = path.basename(path.dirname(full));
        skills[skillName] = full;
      }
    }
  }
  walk(SKILLS_DIR);
  return skills;
}

function parseAgentSkills() {
  const agentToSkills = {};
  for (const file of fs.readdirSync(AGENTS_DIR)) {
    if (!file.endsWith(".md") || file === "README.md") continue;
    const agentName = file.replace(/\.md$/, "");
    const content = fs.readFileSync(path.join(AGENTS_DIR, file), "utf8");
    // 「担当外」「Output Contract」「過去のインシデント」セクションを除外
    const cleaned = content
      .replace(/##\s*担当外[\s\S]*?(?=\n##\s|\n#\s|$)/g, "")
      .replace(/##\s*Output Contract[\s\S]*?(?=\n##\s|\n#\s|$)/g, "")
      .replace(/##\s*過去のインシデント[\s\S]*?(?=\n##\s|\n#\s|$)/g, "")
      .replace(/##\s*移行ステータス[\s\S]*?(?=\n##\s|\n#\s|$)/g, "")
      .replace(/^>\s*\*\*\[移行ステータス\][\s\S]*?\n\n/m, "");
    // `/skill-name` または `skill-name` パターンを抽出
    const matches = [...cleaned.matchAll(/`\/?([a-z][a-z0-9-]+)`/g)];
    const skills = new Set();
    for (const m of matches) skills.add(m[1]);
    agentToSkills[agentName] = [...skills];
  }
  return agentToSkills;
}

function buildSkillToAgents(agentToSkills, allSkills) {
  const skillToAgents = {};
  for (const [agent, skills] of Object.entries(agentToSkills)) {
    for (const skill of skills) {
      if (!allSkills[skill]) continue;
      if (!skillToAgents[skill]) skillToAgents[skill] = new Set();
      skillToAgents[skill].add(agent);
    }
  }
  // priority sort: NEW (0) > ACTIVE (1) > DEPRECATED (2)
  const result = {};
  for (const [skill, agents] of Object.entries(skillToAgents)) {
    const sorted = [...agents].sort((a, b) => {
      const pa = NEW_AGENTS.has(a) ? 0 : DEPRECATED_AGENTS.has(a) ? 2 : 1;
      const pb = NEW_AGENTS.has(b) ? 0 : DEPRECATED_AGENTS.has(b) ? 2 : 1;
      return pa - pb;
    });
    result[skill] = sorted;
  }
  // fallback for unmapped skills
  for (const [skill, agent] of Object.entries(FALLBACK_MAPPING)) {
    if (!result[skill] && agent && allSkills[skill]) {
      result[skill] = [agent];
    }
  }
  return result;
}

function updateSkillFrontmatter(skillPath, primaryAgent, coAgents) {
  const content = fs.readFileSync(skillPath, "utf8");
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fmMatch) {
    return { ok: false, reason: "no-frontmatter" };
  }
  const frontmatter = fmMatch[1];
  // primary_agent / co_agents を除去してから追加
  const lines = frontmatter
    .split("\n")
    .filter((l) => !l.startsWith("primary_agent:") && !l.startsWith("co_agents:"));
  lines.push(`primary_agent: ${primaryAgent}`);
  if (coAgents.length) {
    lines.push(`co_agents: [${coAgents.join(", ")}]`);
  }
  const newFrontmatter = lines.join("\n");
  const newContent = content.replace(
    /^---\n[\s\S]*?\n---\n/,
    `---\n${newFrontmatter}\n---\n`
  );
  if (DRY_RUN) return { ok: true, reason: "dry-run" };
  if (newContent === content) return { ok: true, reason: "no-change" };
  fs.writeFileSync(skillPath, newContent);
  return { ok: true, reason: "updated" };
}

function main() {
  const allSkills = findAllSkills();
  const agentToSkills = parseAgentSkills();
  const skillToAgents = buildSkillToAgents(agentToSkills, allSkills);

  let updated = 0, unchanged = 0, unmapped = 0, errors = 0;
  const unmappedList = [];

  for (const [skill, skillPath] of Object.entries(allSkills)) {
    const agents = skillToAgents[skill] || [];
    if (agents.length === 0) {
      unmapped++;
      unmappedList.push(skill);
      continue;
    }
    const [primary, ...co] = agents;
    const result = updateSkillFrontmatter(skillPath, primary, co);
    if (!result.ok) {
      errors++;
      console.error(`ERROR ${skill}: ${result.reason}`);
    } else if (result.reason === "updated" || result.reason === "dry-run") {
      updated++;
    } else {
      unchanged++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total skills: ${Object.keys(allSkills).length}`);
  console.log(`Updated: ${updated}${DRY_RUN ? " (dry-run)" : ""}`);
  console.log(`Unchanged: ${unchanged}`);
  console.log(`Unmapped (no agent claims): ${unmapped}`);
  console.log(`Errors: ${errors}`);

  if (unmappedList.length) {
    console.log(`\n=== Unmapped skills ===`);
    for (const s of unmappedList.sort()) console.log(`  ${s}`);
  }
}

main();
