const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const WORKFLOW = path.join(ROOT, ".github/workflows/pr-quality-check.yml");
const REGISTRY = path.join(ROOT, ".claude/config/quality-gates.json");
const REMOTION_BUILD = "npm run build --workspace=apps/remotion";

function jobBlock(text, jobId) {
  const lines = text.split(/\r?\n/);
  const jobsIndex = lines.findIndex((line) => /^jobs:\s*$/.test(line));
  if (jobsIndex === -1) return [];
  let start = -1;
  for (let index = jobsIndex + 1; index < lines.length; index += 1) {
    const match = lines[index].match(/^  ([A-Za-z0-9_-]+):\s*$/);
    if (!match) continue;
    if (match[1] === jobId) start = index;
    else if (start !== -1) return lines.slice(start, index);
  }
  return start === -1 ? [] : lines.slice(start);
}

function stepBlocks(jobLines) {
  const starts = [];
  for (let index = 0; index < jobLines.length; index += 1) {
    if (/^      -\s+(?:name|run|uses):/.test(jobLines[index])) starts.push(index);
  }
  return starts.map((start, position) => jobLines.slice(start, starts[position + 1] ?? jobLines.length));
}

function stepRuns(step, command) {
  return step.some((line) => {
    const match = line.match(/^\s*(?:-\s+)?run:\s*(.+)$/);
    return match?.[1].trim() === command;
  });
}

function isSoftFail(step) {
  return step.some((line) => /^\s*continue-on-error:\s*true(?:\s*#.*)?$/.test(line));
}

function requiredJobs(jobLines) {
  const needs = jobLines.find((line) => /^    needs:/.test(line));
  return new Set(needs?.match(/[A-Za-z0-9_-]+/g)?.filter((id) => id !== "needs") ?? []);
}

function auditMediaCi(text, registry, manifests) {
  const findings = [];
  const expected = {
    remotion: { lifecycle: "active", risk: "critical-bundler" },
    ges: { lifecycle: "tooling-only", risk: "tooling-only-generator" },
  };
  const required = new Set();

  for (const [id, expectation] of Object.entries(expected)) {
    const workspace = registry.workspaces?.find((item) => item.id === id);
    if (!workspace || workspace.lifecycle !== expectation.lifecycle || workspace.ciProfile?.risk !== expectation.risk) {
      findings.push(`${id.toUpperCase()}_RISK_PROFILE_INVALID`);
      continue;
    }
    const checks = workspace.ciProfile.prChecks ?? [];
    const manifest = manifests[id];
    if (typeof manifest.scripts?.test !== "string" && workspace.ciProfile.testPolicy?.status !== "none") {
      findings.push(`${id.toUpperCase()}_TEST_POLICY_UNCLASSIFIED`);
    }
    for (const kind of ["type-check", "build", "test"]) {
      if (typeof manifest.scripts?.[kind === "test" ? "test" : kind] !== "string") continue;
      if (!checks.some((check) => check.kind === kind)) findings.push(`${id.toUpperCase()}_${kind.toUpperCase().replace("-", "_")}_UNCLASSIFIED`);
    }
    for (const check of checks) {
      const steps = stepBlocks(jobBlock(text, check.job));
      const step = steps.find((candidate) => stepRuns(candidate, check.command));
      if (!step || isSoftFail(step)) findings.push(`${id.toUpperCase()}_${check.kind.toUpperCase().replace("-", "_")}_NOT_BLOCKING`);
      required.add(check.job);
    }
  }

  const aggregate = requiredJobs(jobBlock(text, "quality-check"));
  for (const job of required) {
    if (!aggregate.has(job)) findings.push(`${job.toUpperCase().replaceAll("-", "_")}_NOT_REQUIRED`);
  }
  return findings;
}

function fixtureRegistry() {
  return {
    workspaces: [
      {
        id: "remotion",
        lifecycle: "active",
        ciProfile: {
          risk: "critical-bundler",
          testPolicy: { status: "none" },
          prChecks: [
            { kind: "type-check", job: "type-check", command: "npm run type-check" },
            { kind: "build", job: "remotion-quality", command: REMOTION_BUILD },
          ],
        },
      },
      {
        id: "ges",
        lifecycle: "tooling-only",
        ciProfile: {
          risk: "tooling-only-generator",
          testPolicy: { status: "none" },
          prChecks: [{ kind: "type-check", job: "type-check", command: "npm run type-check" }],
        },
      },
    ],
  };
}

const manifests = {
  remotion: { scripts: { "type-check": "tsc --noEmit", build: "remotion bundle src/index.ts" } },
  ges: { scripts: { "type-check": "tsc --noEmit" } },
};

function workflow({ build = REMOTION_BUILD, softBuild = false, needs = "type-check, remotion-quality" } = {}) {
  return `name: fixture\non:\n  pull_request:\njobs:\n  type-check:\n    steps:\n      - run: npm run type-check\n  remotion-quality:\n    steps:\n      - run: ${build}\n        continue-on-error: ${softBuild}\n  quality-check:\n    needs: [${needs}]\n    steps:\n      - run: echo ok\n`;
}

test("実registryとPR workflowがRemotion/GES risk matrixを満たす", () => {
  const registry = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
  const realManifests = Object.fromEntries(
    ["remotion", "ges"].map((id) => [id, JSON.parse(fs.readFileSync(path.join(ROOT, `apps/${id}/package.json`), "utf8"))]),
  );
  assert.deepEqual(auditMediaCi(fs.readFileSync(WORKFLOW, "utf8"), registry, realManifests), []);
});

test("正常なmedia workspace CI契約を受理する", () => {
  assert.deepEqual(auditMediaCi(workflow(), fixtureRegistry(), manifests), []);
});

test("Remotion bundle欠落を検出する", () => {
  assert.deepEqual(auditMediaCi(workflow({ build: "echo missing" }), fixtureRegistry(), manifests), ["REMOTION_BUILD_NOT_BLOCKING"]);
});

test("Remotion bundleのsoft-fail化を検出する", () => {
  assert.deepEqual(auditMediaCi(workflow({ softBuild: true }), fixtureRegistry(), manifests), ["REMOTION_BUILD_NOT_BLOCKING"]);
});

test("Remotion jobのrequired集約切断を検出する", () => {
  assert.deepEqual(auditMediaCi(workflow({ needs: "type-check" }), fixtureRegistry(), manifests), ["REMOTION_QUALITY_NOT_REQUIRED"]);
});
