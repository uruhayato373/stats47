const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const REGISTRY = path.join(ROOT, ".claude/config/quality-gates.json");
const WORKFLOW = path.join(ROOT, ".github/workflows/pr-quality-check.yml");
const MATRIX_TEST_COMMAND =
  "node --test .claude/scripts/lib/__tests__/workspace-ci-matrix-contract.test.cjs";
const SOURCE_EXTENSION = /\.(?:[cm]?[jt]sx?)$/;
const TEST_FILE = /\.(?:test|spec)\.[cm]?[jt]sx?$/;
const POLICY_BY_KIND = {
  "type-check": "typeCheckPolicy",
  test: "testPolicy",
  build: "buildPolicy",
  lint: "lintPolicy",
};
const POLICY_KINDS = Object.keys(POLICY_BY_KIND);
const SUPPLEMENTAL_CHECK_KINDS = new Set(["render-test"]);
const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".local",
  ".next",
  ".open-next",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
]);

function collectFiles(directory) {
  const result = [];
  const stack = [directory];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(absolute);
      else result.push(absolute);
    }
  }
  return result;
}

function inventoryWorkspaces(root) {
  const rootManifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const items = [];
  for (const pattern of rootManifest.workspaces ?? []) {
    assert.match(pattern, /^[^*]+\/\*$/, `unsupported workspace pattern: ${pattern}`);
    const parent = path.join(root, pattern.slice(0, -2));
    for (const entry of fs.readdirSync(parent, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const directory = path.join(parent, entry.name);
      const manifestFile = path.join(directory, "package.json");
      if (!fs.existsSync(manifestFile)) continue;
      const files = collectFiles(directory).filter((file) => SOURCE_EXTENSION.test(file));
      if (files.length === 0) continue;
      items.push({
        id: entry.name,
        relative: path.relative(root, directory),
        manifest: JSON.parse(fs.readFileSync(manifestFile, "utf8")),
        sourceCount: files.filter((file) => !TEST_FILE.test(file)).length,
        testCount: files.filter((file) => TEST_FILE.test(file)).length,
      });
    }
  }
  return items.sort((left, right) => left.relative.localeCompare(right.relative));
}

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

function stepRuns(step, command) {
  for (let index = 0; index < step.length; index += 1) {
    const match = step[index].match(/^\s*(?:-\s+)?run:\s*(.*)$/);
    if (!match) continue;
    const inline = match[1].trim();
    if (inline && inline !== "|" && inline !== ">") return inline === command;
    const indentation = step[index].search(/\S/);
    for (let next = index + 1; next < step.length; next += 1) {
      const nextIndentation = step[next].search(/\S/);
      if (nextIndentation !== -1 && nextIndentation <= indentation) break;
      if (step[next].trim() === command) return true;
    }
  }
  return false;
}

function isBlockingStep(step, check) {
  if (!stepRuns(step, check.command)) return false;
  if (step.some((line) => /^\s*continue-on-error:\s*true(?:\s*#.*)?$/.test(line))) return false;
  if (!check.workingDirectory) return true;
  return step.some(
    (line) => line.trim() === `working-directory: ${check.workingDirectory}`,
  );
}

function requiredJobs(text) {
  const lines = jobBlock(text, "quality-check");
  const line = lines.find((candidate) => /^    needs:/.test(candidate));
  return new Set(line?.match(/[A-Za-z0-9_-]+/g)?.filter((id) => id !== "needs") ?? []);
}

function registeredVitestProjects(root) {
  const text = fs.readFileSync(path.join(root, "vitest.config.ts"), "utf8");
  return new Set(
    [...text.matchAll(/["']([^"']+)\/vitest\.config\.[cm]?ts["']/g)].map(
      (match) => match[1],
    ),
  );
}

function hasReason(policy) {
  return typeof policy?.reason === "string" && policy.reason.trim().length >= 12;
}

function auditWorkspaceMatrix({ inventory, registry, workflow, rootManifest, vitestProjects }) {
  const findings = [];
  const required = requiredJobs(workflow);
  const registryByPath = new Map((registry.workspaces ?? []).map((item) => [item.path, item]));

  for (const item of inventory) {
    const workspace = registryByPath.get(item.relative);
    const label = item.id.toUpperCase().replaceAll("-", "_");
    if (!workspace) {
      findings.push(`${label}_PROFILE_MISSING`);
      continue;
    }
    if (!new Set(["active", "tooling-only", "inactive"]).has(workspace.lifecycle)) {
      findings.push(`${label}_LIFECYCLE_INVALID`);
      continue;
    }
    const profile = workspace.ciProfile;
    if (!profile || typeof profile.risk !== "string" || profile.risk.length === 0) {
      findings.push(`${label}_PROFILE_MISSING`);
      continue;
    }
    const checks = Array.isArray(profile.prChecks) ? profile.prChecks : [];

    for (const kind of POLICY_KINDS) {
      const policyName = POLICY_BY_KIND[kind];
      const policy = profile[policyName];
      const check = checks.find((candidate) => candidate.kind === kind);
      const manifestScript = item.manifest.scripts?.[kind];
      const hasCapability = kind === "test" ? item.testCount > 0 : typeof manifestScript === "string";

      if (!policy || !new Set(["required", "none"]).has(policy.status)) {
        findings.push(`${label}_${kind.toUpperCase().replace("-", "_")}_POLICY_MISSING`);
        continue;
      }

      if (workspace.lifecycle === "inactive") {
        if (policy.status !== "none" || !hasReason(policy) || check) {
          findings.push(`${label}_${kind.toUpperCase().replace("-", "_")}_INACTIVE_POLICY_INVALID`);
        }
        continue;
      }

      if (kind === "build" && item.relative.startsWith("packages/") && manifestScript) {
        const sourceEntrypoint = [item.manifest.main, item.manifest.types].some((value) =>
          typeof value === "string" && value.endsWith(".ts"),
        );
        if (policy.status === "none" && !(item.manifest.private && sourceEntrypoint)) {
          findings.push(`${label}_BUILD_POLICY_INVALID`);
        }
      } else if (hasCapability !== (policy.status === "required")) {
        findings.push(`${label}_${kind.toUpperCase().replace("-", "_")}_POLICY_INVALID`);
      }

      if (policy.status === "none") {
        if (!hasReason(policy) || check) {
          findings.push(`${label}_${kind.toUpperCase().replace("-", "_")}_NONE_UNJUSTIFIED`);
        }
        continue;
      }

      if (!check || typeof check.job !== "string" || typeof check.command !== "string") {
        findings.push(`${label}_${kind.toUpperCase().replace("-", "_")}_CHECK_MISSING`);
        continue;
      }
      const step = stepBlocks(jobBlock(workflow, check.job)).find((candidate) =>
        isBlockingStep(candidate, check),
      );
      if (!step) {
        findings.push(`${label}_${kind.toUpperCase().replace("-", "_")}_NOT_BLOCKING`);
      }
      if (!required.has(check.job)) findings.push(`${label}_${kind.toUpperCase().replace("-", "_")}_NOT_REQUIRED`);

      if (kind === "test" && check.command === "npm run test:packages") {
        if (!vitestProjects.has(item.relative)) findings.push(`${label}_TEST_PROJECT_MISSING`);
        if (!rootManifest.scripts?.["test:packages"]?.includes("--project '@stats47/*'")) {
          findings.push("ROOT_PACKAGE_TEST_RUNNER_INVALID");
        }
      }
      if (kind === "type-check" && check.command === "npm run type-check") {
        if (!rootManifest.scripts?.["type-check"]?.includes("turbo run type-check")) {
          findings.push("ROOT_TYPE_CHECK_RUNNER_INVALID");
        }
      }
    }

    for (const check of checks.filter((candidate) => SUPPLEMENTAL_CHECK_KINDS.has(candidate.kind))) {
      const step = stepBlocks(jobBlock(workflow, check.job)).find((candidate) =>
        isBlockingStep(candidate, check),
      );
      if (!step) {
        findings.push(`${label}_${check.kind.toUpperCase().replace("-", "_")}_NOT_BLOCKING`);
      }
      if (!required.has(check.job)) {
        findings.push(`${label}_${check.kind.toUpperCase().replace("-", "_")}_NOT_REQUIRED`);
      }
    }

    if (checks.some((check) =>
      !POLICY_KINDS.includes(check.kind) && !SUPPLEMENTAL_CHECK_KINDS.has(check.kind)
    )) {
      findings.push(`${label}_UNKNOWN_PR_CHECK`);
    }
  }

  const staticSteps = stepBlocks(jobBlock(workflow, "static-gates"));
  if (!staticSteps.some((step) => isBlockingStep(step, { command: MATRIX_TEST_COMMAND }))) {
    findings.push("WORKSPACE_MATRIX_AUDIT_NOT_BLOCKING");
  }
  return [...new Set(findings)];
}

function profile({ lifecycle = "active", tests = true, build = true, lint = false } = {}) {
  const inactive = lifecycle === "inactive";
  const checks = inactive
    ? []
    : [
        { kind: "type-check", job: "type-check", command: "npm run type-check" },
        ...(tests ? [{ kind: "test", job: "test", command: "npm run test:packages" }] : []),
        ...(build ? [{ kind: "build", job: "build", command: "npm run build -w apps/a" }] : []),
        ...(lint ? [{ kind: "lint", job: "static-gates", command: "npm run lint -w apps/a" }] : []),
      ];
  const none = (reason) => ({ status: "none", reason });
  return {
    id: "a",
    path: "apps/a",
    lifecycle,
    ciProfile: {
      risk: inactive ? "inactive" : "critical-app",
      prChecks: checks,
      typeCheckPolicy: inactive ? none("workspace is inactive") : { status: "required" },
      testPolicy: inactive || !tests ? none("workspace has no active unit suite") : { status: "required" },
      buildPolicy: inactive || !build ? none("workspace exposes no build artifact") : { status: "required" },
      lintPolicy: inactive || !lint ? none("workspace exposes no lint command") : { status: "required" },
    },
  };
}

function fixtureWorkflow({ softTest = false, needs = "static-gates, type-check, test, build" } = {}) {
  return `name: fixture\non:\n  pull_request:\njobs:\n  static-gates:\n    steps:\n      - run: ${MATRIX_TEST_COMMAND}\n  type-check:\n    steps:\n      - run: npm run type-check\n  test:\n    steps:\n      - run: npm run test:packages\n        continue-on-error: ${softTest}\n  build:\n    steps:\n      - run: npm run build -w apps/a\n  quality-check:\n    needs: [${needs}]\n    steps:\n      - run: echo ok\n`;
}

function fixtureInput({ workspace = profile(), workflow = fixtureWorkflow(), testCount = 1 } = {}) {
  return {
    inventory: [{
      id: "a",
      relative: "apps/a",
      sourceCount: 1,
      testCount,
      manifest: { private: true, scripts: { "type-check": "tsc --noEmit", test: "vitest", build: "next build" } },
    }],
    registry: { workspaces: [workspace] },
    workflow,
    rootManifest: { scripts: { "type-check": "turbo run type-check", "test:packages": "vitest run --project '@stats47/*'" } },
    vitestProjects: new Set(["apps/a"]),
  };
}

test("実manifest・registry・PR workflowの全source-bearing workspace契約を満たす", () => {
  const registry = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
  const workflow = fs.readFileSync(WORKFLOW, "utf8");
  const input = {
    inventory: inventoryWorkspaces(ROOT),
    registry,
    workflow,
    rootManifest: JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")),
    vitestProjects: registeredVitestProjects(ROOT),
  };
  assert.deepEqual(auditWorkspaceMatrix(input), []);
});

test("active workspaceのrequired policyを受理する", () => {
  assert.deepEqual(auditWorkspaceMatrix(fixtureInput()), []);
});

test("source-bearing workspaceのprofile欠落を検出する", () => {
  assert.deepEqual(
    auditWorkspaceMatrix({ ...fixtureInput(), registry: { workspaces: [] } }),
    ["A_PROFILE_MISSING"],
  );
});

test("存在するunit suiteをnone分類すると検出する", () => {
  const workspace = profile();
  workspace.ciProfile.testPolicy = { status: "none", reason: "tests are intentionally skipped" };
  workspace.ciProfile.prChecks = workspace.ciProfile.prChecks.filter((check) => check.kind !== "test");
  assert.ok(auditWorkspaceMatrix(fixtureInput({ workspace })).includes("A_TEST_POLICY_INVALID"));
});

test("required testのsoft-fail化を検出する", () => {
  assert.ok(
    auditWorkspaceMatrix(fixtureInput({ workflow: fixtureWorkflow({ softTest: true }) }))
      .includes("A_TEST_NOT_BLOCKING"),
  );
});

test("required jobの集約切断を検出する", () => {
  assert.ok(
    auditWorkspaceMatrix(fixtureInput({ workflow: fixtureWorkflow({ needs: "static-gates, type-check, build" }) }))
      .includes("A_TEST_NOT_REQUIRED"),
  );
});

test("補助render testもblockingかつrequiredなら受理する", () => {
  const workspace = profile();
  workspace.ciProfile.prChecks.push({
    kind: "render-test",
    job: "render",
    command: "npm run test:render",
  });
  const workflow = `${fixtureWorkflow({ needs: "static-gates, type-check, test, build, render" })}\n  render:\n    steps:\n      - run: npm run test:render\n`;
  assert.deepEqual(auditWorkspaceMatrix(fixtureInput({ workspace, workflow })), []);
});

test("未定義の補助check kindを検出する", () => {
  const workspace = profile();
  workspace.ciProfile.prChecks.push({
    kind: "unknown-extra",
    job: "test",
    command: "npm run test:packages",
  });
  assert.ok(auditWorkspaceMatrix(fixtureInput({ workspace })).includes("A_UNKNOWN_PR_CHECK"));
});

test("inactive workspaceにPR checkが残ると検出する", () => {
  const workspace = profile({ lifecycle: "inactive", tests: false, build: false, lint: false });
  workspace.ciProfile.prChecks.push({ kind: "type-check", job: "type-check", command: "npm run type-check" });
  assert.ok(
    auditWorkspaceMatrix(fixtureInput({ workspace, testCount: 0 }))
      .includes("A_TYPE_CHECK_INACTIVE_POLICY_INVALID"),
  );
});

test("matrix audit自体のPR配線欠落を検出する", () => {
  const workflow = fixtureWorkflow().replace(MATRIX_TEST_COMMAND, "echo missing");
  assert.ok(
    auditWorkspaceMatrix(fixtureInput({ workflow })).includes("WORKSPACE_MATRIX_AUDIT_NOT_BLOCKING"),
  );
});
