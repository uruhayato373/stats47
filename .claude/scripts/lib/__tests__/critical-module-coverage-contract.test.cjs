const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const INVENTORY_FILE = path.join(ROOT, ".claude/config/critical-module-coverage.json");
const WORKFLOW_FILE = path.join(ROOT, ".github/workflows/pr-quality-check.yml");
const EXPECTED_IDS = new Set([
  "shape-gate",
  "unit-classifier",
  "dependency-collector",
  "chart-props-validator",
  "r2-runtime-parser",
  "metric-recipe",
  "value-verification",
  "link-audit-core",
  "ranking-route-metadata",
]);
const DATA_COMMAND = "(cd packages/data-configs && npx vitest run src/__tests__/shape-gate.test.ts src/__tests__/recipe.test.ts src/__tests__/value-verification.test.ts src/unit/__tests__/unit-comparability.test.ts src/theme-catalog/__tests__/chart-dependencies.test.ts src/theme-catalog/__tests__/stat-series-ref.test.ts src/link-audit/__tests__/link-check-core.test.ts --coverage --coverage.reporter=text-summary)";
const R2_COMMAND = "(cd packages/r2-storage && npx vitest run src/lib/operations/__tests__/snapshot-reader.test.ts --coverage --coverage.reporter=text-summary)";
const WEB_COMMAND = "(cd apps/web && npx vitest run src/features/ranking/utils/__tests__/generate-meta-data.test.ts --coverage --coverage.reporter=text-summary --coverage.thresholds.lines=0 --coverage.thresholds.statements=0 --coverage.thresholds.functions=0 --coverage.thresholds.branches=0)";
const CONTRACT_COMMAND = "node --test .claude/scripts/lib/__tests__/critical-module-coverage-contract.test.cjs";

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
  return starts.map((start, position) =>
    jobLines.slice(start, starts[position + 1] ?? jobLines.length),
  );
}

function stepHasCommand(step, command) {
  return step.some((line) => {
    const value = line.trim();
    return value === command || value === `run: ${command}` || value === `- run: ${command}`;
  });
}

function isSoftFail(step) {
  return step.some((line) => /^\s*continue-on-error:\s*true(?:\s*#.*)?$/.test(line));
}

function requiredJobs(text) {
  const line = jobBlock(text, "quality-check").find((candidate) => /^    needs:/.test(candidate));
  return new Set(line?.match(/[A-Za-z0-9_-]+/g)?.filter((id) => id !== "needs") ?? []);
}

function auditInventory(inventory, { exists, configText }) {
  const findings = [];
  if (inventory?.version !== 1 || !Array.isArray(inventory.modules)) {
    return ["CRITICAL_COVERAGE_INVENTORY_INVALID"];
  }
  const ids = new Set();
  const moduleKeys = new Set();
  for (const item of inventory.modules) {
    if (typeof item.id !== "string" || ids.has(item.id)) findings.push("CRITICAL_COVERAGE_ID_INVALID");
    ids.add(item.id);
    const moduleKey = `${item.workspace}/${item.module}`;
    if (moduleKeys.has(moduleKey)) findings.push("CRITICAL_COVERAGE_MODULE_DUPLICATE");
    moduleKeys.add(moduleKey);
    if (!exists(moduleKey)) findings.push(`${item.id ?? "unknown"}:MODULE_MISSING`);
    if (!Array.isArray(item.tests) || item.tests.length === 0) {
      findings.push(`${item.id ?? "unknown"}:TEST_INVENTORY_MISSING`);
    } else {
      for (const testFile of item.tests) {
        if (!exists(`${item.workspace}/${testFile}`)) findings.push(`${item.id}:TEST_MISSING`);
      }
    }
    for (const metric of ["lines", "branches", "functions"]) {
      const value = item.floor?.[metric];
      if (typeof value !== "number" || value < 0 || value > 100) {
        findings.push(`${item.id ?? "unknown"}:${metric.toUpperCase()}_FLOOR_INVALID`);
      }
    }
    if (!/^[0-9a-f]{40}$/.test(item.measuredAt ?? "")) {
      findings.push(`${item.id ?? "unknown"}:MEASUREMENT_BASE_INVALID`);
    }
  }
  for (const id of EXPECTED_IDS) {
    if (!ids.has(id)) findings.push(`${id}:CRITICAL_MODULE_UNCLASSIFIED`);
  }
  for (const workspace of new Set(inventory.modules.map((item) => item.workspace))) {
    const text = configText(workspace);
    const hasThresholds = text.includes("thresholds: criticalThresholds") || text.includes("...criticalThresholds");
    if (!text.includes("critical-module-coverage.json") || !hasThresholds) {
      findings.push(`${workspace}:VITEST_THRESHOLD_WIRING_MISSING`);
    }
  }
  return [...new Set(findings)];
}

function auditWorkflow(text) {
  const findings = [];
  const steps = stepBlocks(jobBlock(text, "test"));
  const coverageStep = steps.find((step) => stepHasCommand(step, DATA_COMMAND) || stepHasCommand(step, R2_COMMAND));
  if (!coverageStep || !stepHasCommand(coverageStep, DATA_COMMAND) || !stepHasCommand(coverageStep, R2_COMMAND) || !stepHasCommand(coverageStep, WEB_COMMAND) || isSoftFail(coverageStep)) {
    findings.push("CRITICAL_MODULE_COVERAGE_NOT_BLOCKING");
  }
  const contractStep = stepBlocks(jobBlock(text, "static-gates"))
    .find((step) => stepHasCommand(step, CONTRACT_COMMAND));
  if (!contractStep || isSoftFail(contractStep)) findings.push("CRITICAL_MODULE_COVERAGE_CONTRACT_NOT_BLOCKING");
  if (!requiredJobs(text).has("test")) findings.push("CRITICAL_MODULE_COVERAGE_JOB_NOT_REQUIRED");
  if (!requiredJobs(text).has("static-gates")) findings.push("CRITICAL_MODULE_COVERAGE_CONTRACT_NOT_REQUIRED");
  return findings;
}

function fixtureInventory() {
  return {
    version: 1,
    modules: [...EXPECTED_IDS].map((id, index) => ({
      id,
      workspace: id === "r2-runtime-parser"
        ? "packages/r2-storage"
        : id === "ranking-route-metadata"
          ? "apps/web"
          : "packages/data-configs",
      module: `src/${id}.ts`,
      tests: [`src/${id}.test.ts`],
      floor: { lines: 80, branches: 70, functions: 75 },
      measuredAt: "1".repeat(40),
    })),
  };
}

function healthyWorkflow({ soft = false, needs = "test" } = {}) {
  return `name: fixture\non:\n  pull_request:\njobs:\n  static-gates:\n    steps:\n      - run: ${CONTRACT_COMMAND}\n        continue-on-error: false\n  test:\n    steps:\n      - name: critical coverage\n        run: |\n          ${DATA_COMMAND}\n          ${R2_COMMAND}\n          ${WEB_COMMAND}\n        continue-on-error: ${soft}\n  quality-check:\n    needs: [static-gates, ${needs}]\n    steps:\n      - run: echo ok\n`;
}

function fixtureEnvironment(inventory = fixtureInventory()) {
  const paths = new Set();
  for (const item of inventory.modules) {
    paths.add(`${item.workspace}/${item.module}`);
    for (const testFile of item.tests) paths.add(`${item.workspace}/${testFile}`);
  }
  return {
    exists: (file) => paths.has(file),
    configText: () => 'import floors from "../../.claude/config/critical-module-coverage.json";\nthresholds: criticalThresholds',
  };
}

test("実inventory・Vitest config・PR workflowがcritical module coverage契約を満たす", () => {
  const workflow = fs.readFileSync(WORKFLOW_FILE, "utf8");
  if (!fs.existsSync(INVENTORY_FILE)) {
    assert.fail("CRITICAL_COVERAGE_INVENTORY_MISSING");
  }
  const inventory = JSON.parse(fs.readFileSync(INVENTORY_FILE, "utf8"));
  const environment = {
    exists: (file) => fs.existsSync(path.join(ROOT, file)),
    configText: (workspace) => fs.readFileSync(path.join(ROOT, workspace, "vitest.config.ts"), "utf8"),
  };
  assert.deepEqual(auditInventory(inventory, environment), []);
  assert.deepEqual(auditWorkflow(workflow), []);
});

test("正常な9領域inventoryとblocking workflowを受理する", () => {
  const inventory = fixtureInventory();
  assert.deepEqual(auditInventory(inventory, fixtureEnvironment(inventory)), []);
  assert.deepEqual(auditWorkflow(healthyWorkflow()), []);
});

test("critical moduleのinventory欠落を検出する", () => {
  const inventory = fixtureInventory();
  inventory.modules.pop();
  assert.ok(auditInventory(inventory, fixtureEnvironment(inventory)).some((finding) => finding.includes("CRITICAL_MODULE_UNCLASSIFIED")));
});

test("実測範囲外の推測floorを拒否する", () => {
  const inventory = fixtureInventory();
  inventory.modules[0].floor.branches = 101;
  assert.ok(auditInventory(inventory, fixtureEnvironment(inventory)).includes("shape-gate:BRANCHES_FLOOR_INVALID"));
});

test("Vitest threshold wiring欠落を検出する", () => {
  const inventory = fixtureInventory();
  assert.ok(
    auditInventory(inventory, {
      ...fixtureEnvironment(inventory),
      configText: () => "export default {};",
    }).some((finding) => finding.includes("VITEST_THRESHOLD_WIRING_MISSING")),
  );
});

test("coverage commandのsoft-fail化を検出する", () => {
  assert.ok(auditWorkflow(healthyWorkflow({ soft: true })).includes("CRITICAL_MODULE_COVERAGE_NOT_BLOCKING"));
});

test("coverage jobのrequired集約切断を検出する", () => {
  assert.ok(auditWorkflow(healthyWorkflow({ needs: "static-gates" })).includes("CRITICAL_MODULE_COVERAGE_JOB_NOT_REQUIRED"));
});

test("mutation contract自体のPR配線欠落を検出する", () => {
  const workflow = healthyWorkflow().replace(CONTRACT_COMMAND, "echo missing");
  assert.ok(auditWorkflow(workflow).includes("CRITICAL_MODULE_COVERAGE_CONTRACT_NOT_BLOCKING"));
});
