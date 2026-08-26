const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const WORKFLOW = path.join(ROOT, ".github/workflows/pr-quality-check.yml");
const ADMIN_JOB = "admin-quality";
const BUILD_COMMAND = "npm run build --workspace=apps/admin";
const E2E_COMMAND = "npm run test:e2e --workspace=apps/admin -- --project=desktop tests/e2e/smoke.spec.ts";

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

function auditAdminCi(text) {
  const findings = [];
  const admin = jobBlock(text, ADMIN_JOB);
  const steps = stepBlocks(admin);
  for (const [code, command] of [
    ["ADMIN_BUILD_NOT_BLOCKING", BUILD_COMMAND],
    ["ADMIN_E2E_NOT_BLOCKING", E2E_COMMAND],
  ]) {
    const step = steps.find((candidate) => stepRuns(candidate, command));
    if (!step || isSoftFail(step)) findings.push(code);
  }
  if (!requiredJobs(jobBlock(text, "quality-check")).has(ADMIN_JOB)) {
    findings.push("ADMIN_JOB_NOT_REQUIRED");
  }
  return findings;
}

function workflow({ build = BUILD_COMMAND, e2e = E2E_COMMAND, softE2e = false, needs = ADMIN_JOB } = {}) {
  return `name: fixture\non:\n  pull_request:\njobs:\n  ${ADMIN_JOB}:\n    steps:\n      - run: ${build}\n      - run: ${e2e}\n        continue-on-error: ${softE2e}\n  quality-check:\n    needs: [${needs}]\n    steps:\n      - run: echo ok\n`;
}

test("実PR workflowでadmin buildとdesktop smokeがrequired blockingになる", () => {
  assert.deepEqual(auditAdminCi(fs.readFileSync(WORKFLOW, "utf8")), []);
});

test("正常なadmin CI契約を受理する", () => {
  assert.deepEqual(auditAdminCi(workflow()), []);
});

test("build command欠落を検出する", () => {
  assert.deepEqual(auditAdminCi(workflow({ build: "echo missing" })), ["ADMIN_BUILD_NOT_BLOCKING"]);
});

test("E2Eのsoft-fail化を検出する", () => {
  assert.deepEqual(auditAdminCi(workflow({ softE2e: true })), ["ADMIN_E2E_NOT_BLOCKING"]);
});

test("admin jobのrequired集約切断を検出する", () => {
  assert.deepEqual(auditAdminCi(workflow({ needs: "static-gates" })), ["ADMIN_JOB_NOT_REQUIRED"]);
});
