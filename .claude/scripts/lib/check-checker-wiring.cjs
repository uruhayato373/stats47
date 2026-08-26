#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..", "..");
const args = process.argv.slice(2);
const has = (value) => args.includes(value);
const writeIndex = args.indexOf("--write-baseline");
const baselineArg = writeIndex === -1 ? null : args[writeIndex + 1];
const BASELINE_PATH = path.resolve(
  ROOT,
  baselineArg && !baselineArg.startsWith("--")
    ? baselineArg
    : (process.env.CHECKER_WIRING_BASELINE ?? ".claude/config/checker-wiring-baseline.json"),
);
const REGISTRY_PATH = path.resolve(
  ROOT,
  process.env.QUALITY_GATES_REGISTRY ?? ".claude/config/quality-gates.json",
);

const SCRIPT_EXTENSIONS = new Set([".cjs", ".mjs", ".js", ".ts", ".sh", ".py"]);
const SOURCE_EXTENSIONS = new Set([".cjs", ".mjs", ".js", ".jsx", ".ts", ".tsx"]);
const CORPUS_EXTENSIONS = new Set([...SCRIPT_EXTENSIONS, ".json", ".md", ".yml", ".yaml"]);
const CHECKER_NAME = /(?:^|[-_.])(check|audit|validate|verify|lint|guard)(?:[-_.]|$)/i;
const WORKSPACE_LIFECYCLES = new Set(["active", "tooling-only", "inactive"]);
const NON_BASELINE_CODES = new Set([
  "COMMAND_CHECKER_MISMATCH",
  "COMMAND_NOT_FOUND",
  "DUPLICATE_GATE_ID",
  "DUPLICATE_WORKSPACE_ID",
  "EXPIRED_EXCEPTION",
  "INVALID_EXCEPTION",
  "INVALID_GATE_DECLARATION",
  "INVALID_GATE_REGISTRY",
  "INVALID_WORKSPACE_DECLARATION",
  "UNCLASSIFIED_WORKSPACE",
  "UNDECLARED_CRITICAL_CHECKER",
  "WORKSPACE_NOT_FOUND",
]);

function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

function walk(directory, output = []) {
  let entries;
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch {
    return output;
  }
  for (const entry of entries) {
    if (["node_modules", ".git", ".next", ".open-next", "dist", "coverage", "__tests__"].includes(entry.name)) {
      continue;
    }
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute, output);
    else output.push(absolute);
  }
  return output;
}

function candidateRoots() {
  const roots = [path.join(ROOT, ".claude/scripts")];
  for (const parent of ["apps", "packages"]) {
    const directory = path.join(ROOT, parent);
    let entries = [];
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {}
    for (const entry of entries) {
      if (entry.isDirectory()) roots.push(path.join(directory, entry.name, "scripts"));
    }
  }
  return roots;
}

function candidates() {
  return candidateRoots()
    .flatMap((root) => walk(root))
    .filter((file) => SCRIPT_EXTENSIONS.has(path.extname(file)))
    .filter((file) => CHECKER_NAME.test(path.basename(file)))
    .sort();
}

function isHuskyHook(file) {
  return rel(file).startsWith(".husky/") && path.extname(file) === "";
}

function corpusFiles() {
  const roots = [
    ".github", ".husky", ".claude/skills", ".claude/agents", ".claude/hooks",
    ".claude/scripts", "scripts", "apps", "packages",
  ];
  const files = roots.flatMap((root) => walk(path.join(ROOT, root)));
  return [...files, path.join(ROOT, "package.json")]
    .filter((file) => CORPUS_EXTENSIONS.has(path.extname(file)) || isHuskyHook(file))
    .filter((file) => rel(file) !== rel(BASELINE_PATH));
}

function readSafe(file) {
  try {
    if (fs.statSync(file).size > 800_000) return "";
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function includesChecker(text, checkerFile) {
  return text.includes(checkerFile) || text.includes(path.basename(checkerFile));
}

function workflowTriggers(text) {
  const lines = text.split(/\r?\n/);
  const triggers = new Set();
  const start = lines.findIndex((line) => /^(?:on|["']on["']):(?:\s|$)/.test(line));
  if (start === -1) return triggers;
  const inline = lines[start].replace(/^(?:on|["']on["']):\s*/, "").trim();
  if (inline) {
    for (const match of inline.matchAll(/[A-Za-z_][\w-]*/g)) triggers.add(match[0]);
    return triggers;
  }
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^\S/.test(line) && !/^\s*#/.test(line)) break;
    const match = line.match(/^\s{2}([A-Za-z_][\w-]*):/);
    if (match) triggers.add(match[1]);
  }
  return triggers;
}

function workflowSteps(text) {
  const lines = text.split(/\r?\n/);
  const starts = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(\s*)-\s+(?:name|run|uses):/);
    if (match) starts.push({ index, indent: match[1].length });
  }
  // Tiny fixture workflows and composite-like generated YAML can expose a bare
  // `run:` without a `- name:` wrapper. Preserve the old checker's ability to
  // recognize that executable reference while normal workflows use step blocks.
  if (starts.length === 0 && lines.some((line) => /^\s*run:/.test(line))) {
    starts.push({ index: 0, indent: -1 });
  }
  return starts.map((start, position) => {
    let end = lines.length;
    for (let cursor = position + 1; cursor < starts.length; cursor += 1) {
      if (starts[cursor].indent === start.indent) {
        end = starts[cursor].index;
        break;
      }
    }
    const block = lines.slice(start.index, end);
    const continueOnError = block.some((line) => /^\s*continue-on-error:\s*true(?:\s*#.*)?$/.test(line));
    const runParts = [];
    for (let cursor = 0; cursor < block.length; cursor += 1) {
      const match = block[cursor].match(/^\s*(?:-\s+)?run:\s*(.*)$/);
      if (!match) continue;
      const inline = match[1].trim();
      if (inline && inline !== "|" && inline !== ">") runParts.push(inline);
      const runIndent = block[cursor].search(/\S/);
      for (let next = cursor + 1; next < block.length; next += 1) {
        const nextIndent = block[next].search(/\S/);
        if (nextIndent !== -1 && nextIndent <= runIndent) break;
        runParts.push(block[next]);
      }
    }
    return { run: runParts.join("\n"), continueOnError };
  });
}

function workflowReferences(file, text, checkerFile) {
  const triggers = workflowTriggers(text);
  return workflowSteps(text)
    .filter((step) => includesChecker(step.run, checkerFile))
    .map((step) => ({
      file: rel(file),
      kind: "workflow",
      blocking: !step.continueOnError,
      scheduled: triggers.has("schedule"),
      pullRequest: triggers.has("pull_request"),
    }));
}

function packageReferences(file, text, checkerFile) {
  try {
    const parsed = JSON.parse(text);
    const scripts = Object.values(parsed.scripts ?? {}).filter((value) => typeof value === "string");
    if (!scripts.some((script) => includesChecker(script, checkerFile))) return [];
    return [{ file: rel(file), kind: "package", blocking: false, scheduled: false, pullRequest: false }];
  } catch {
    return [];
  }
}

function referencesFor(corpus, checkerFile) {
  const references = [];
  for (const entry of corpus) {
    const relative = rel(entry.file);
    if (relative === checkerFile) continue;
    if (relative.startsWith(".github/workflows/")) {
      references.push(...workflowReferences(entry.file, entry.text, checkerFile));
      continue;
    }
    if (path.basename(entry.file) === "package.json") {
      references.push(...packageReferences(entry.file, entry.text, checkerFile));
      continue;
    }
    if (!includesChecker(entry.text, checkerFile)) continue;
    if (isHuskyHook(entry.file)) {
      references.push({ file: relative, kind: "hook", blocking: true, scheduled: false, pullRequest: false });
    } else if (path.extname(entry.file) === ".md") {
      references.push({ file: relative, kind: "docs", blocking: false, scheduled: false, pullRequest: false });
    } else if (SCRIPT_EXTENSIONS.has(path.extname(entry.file))) {
      references.push({ file: relative, kind: "script", blocking: false, scheduled: false, pullRequest: false });
    } else {
      references.push({ file: relative, kind: "other", blocking: false, scheduled: false, pullRequest: false });
    }
  }
  return references;
}

function finding(code, file, message, gateId) {
  return { code, file, ...(gateId ? { gateId } : {}), message };
}

function readRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    return { exists: false, registry: { version: 1, workspaces: [], gates: [], exceptions: [] }, findings: [] };
  }
  try {
    const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
    if (registry.version !== 1 || !Array.isArray(registry.gates) || !Array.isArray(registry.workspaces)) {
      throw new Error("version=1, workspaces[], gates[] are required");
    }
    return {
      exists: true,
      registry: { ...registry, exceptions: Array.isArray(registry.exceptions) ? registry.exceptions : [] },
      findings: [],
    };
  } catch (error) {
    return {
      exists: true,
      registry: { version: 1, workspaces: [], gates: [], exceptions: [] },
      findings: [finding("INVALID_GATE_REGISTRY", rel(REGISTRY_PATH), String(error))],
    };
  }
}

function splitCommand(command) {
  return command.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)?.map((token) => token.replace(/^(["'])|(["'])$/g, "")) ?? [];
}

function commandTarget(command) {
  const tokens = splitCommand(command);
  if (tokens.length === 0) return null;
  if (tokens[0] === "npm" && tokens[1] === "run") return { kind: "npm", value: tokens[2] };
  const scriptIndex = tokens.findIndex((token, index) => index > 0 && (
    SCRIPT_EXTENSIONS.has(path.extname(token)) || token.startsWith("./") || token.startsWith(".claude/")
  ));
  return scriptIndex === -1 ? null : { kind: "file", value: tokens[scriptIndex] };
}

function commandExists(command) {
  const target = commandTarget(command);
  if (!target) return true;
  if (target.kind === "file") return fs.existsSync(path.resolve(ROOT, target.value));
  try {
    const rootPackage = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
    return typeof rootPackage.scripts?.[target.value] === "string";
  } catch {
    return false;
  }
}

function validateGates(registry) {
  const findings = [];
  const ids = new Set();
  for (const gate of registry.gates) {
    const required = ["id", "checker", "command", "scope", "owner", "trigger", "blocking", "networkOrSecrets", "timeoutMinutes"];
    const missing = required.filter((field) => gate?.[field] === undefined || gate?.[field] === "");
    if (missing.length > 0) {
      findings.push(finding("INVALID_GATE_DECLARATION", rel(REGISTRY_PATH), `missing fields: ${missing.join(", ")}`, gate?.id));
      continue;
    }
    if (ids.has(gate.id)) {
      findings.push(finding("DUPLICATE_GATE_ID", rel(REGISTRY_PATH), `duplicate id: ${gate.id}`, gate.id));
    }
    ids.add(gate.id);
    if (!Array.isArray(gate.scope) || !Array.isArray(gate.trigger) || typeof gate.blocking !== "boolean" ||
        !Number.isFinite(gate.timeoutMinutes) || gate.timeoutMinutes <= 0) {
      findings.push(finding("INVALID_GATE_DECLARATION", rel(REGISTRY_PATH), `invalid field type for ${gate.id}`, gate.id));
    }
    const target = commandTarget(gate.command);
    if (!commandExists(gate.command)) {
      findings.push(finding("COMMAND_NOT_FOUND", gate.checker, `command target does not exist: ${gate.command}`, gate.id));
    } else if (target?.kind === "file" && target.value.replace(/^\.\//, "") !== gate.checker.replace(/^\.\//, "")) {
      findings.push(finding("COMMAND_CHECKER_MISMATCH", gate.checker, `command invokes ${target.value}`, gate.id));
    }
  }
  return findings;
}

function workspacePaths() {
  let rootPackage;
  try {
    rootPackage = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  } catch {
    return [];
  }
  if (!Array.isArray(rootPackage.workspaces)) return [];
  const paths = ["."];
  for (const pattern of rootPackage.workspaces) {
    if (typeof pattern !== "string" || !pattern.endsWith("/*")) continue;
    const parent = pattern.slice(0, -2);
    let entries = [];
    try {
      entries = fs.readdirSync(path.join(ROOT, parent), { withFileTypes: true });
    } catch {}
    for (const entry of entries) {
      if (entry.isDirectory() && fs.existsSync(path.join(ROOT, parent, entry.name, "package.json"))) {
        paths.push(`${parent}/${entry.name}`);
      }
    }
  }
  return paths.sort();
}

function workspaceInventory(registry, shouldValidate) {
  const actualPaths = workspacePaths();
  const declarations = new Map();
  const ids = new Set();
  const findings = [];
  for (const workspace of registry.workspaces) {
    if (ids.has(workspace.id)) findings.push(finding("DUPLICATE_WORKSPACE_ID", rel(REGISTRY_PATH), `duplicate id: ${workspace.id}`));
    ids.add(workspace.id);
    declarations.set(workspace.path, workspace);
    if (!workspace.id || !workspace.path || !WORKSPACE_LIFECYCLES.has(workspace.lifecycle) || !workspace.owner ||
        !workspace.evidence || !workspace.reviewBy) {
      findings.push(finding("INVALID_WORKSPACE_DECLARATION", rel(REGISTRY_PATH), `invalid workspace: ${workspace.id ?? "unknown"}`));
    }
  }
  if (shouldValidate) {
    for (const workspacePath of actualPaths) {
      if (!declarations.has(workspacePath)) findings.push(finding("UNCLASSIFIED_WORKSPACE", workspacePath, "workspace missing from quality gate registry"));
    }
    for (const workspacePath of declarations.keys()) {
      if (!actualPaths.includes(workspacePath)) findings.push(finding("WORKSPACE_NOT_FOUND", workspacePath, "declared workspace does not exist"));
    }
  }
  const inventory = actualPaths.map((workspacePath) => {
    const absolute = workspacePath === "." ? ROOT : path.join(ROOT, workspacePath);
    let packageJson = {};
    try {
      packageJson = JSON.parse(fs.readFileSync(path.join(absolute, "package.json"), "utf8"));
    } catch {}
    const scripts = packageJson.scripts ?? {};
    const capability = (name) => Object.keys(scripts).filter((script) => script === name || script.startsWith(`${name}:`)).sort();
    return {
      path: workspacePath,
      sourceCount: walk(absolute).filter((file) => SOURCE_EXTENSIONS.has(path.extname(file))).length,
      lifecycle: declarations.get(workspacePath)?.lifecycle ?? "unclassified",
      owner: declarations.get(workspacePath)?.owner ?? null,
      commands: {
        typeCheck: capability("type-check"),
        test: capability("test"),
        coverage: Object.keys(scripts).filter((script) => script.includes("coverage")).sort(),
        lint: capability("lint"),
        build: capability("build"),
      },
    };
  });
  return { inventory, findings };
}

function validateExceptions(exceptions) {
  const active = [];
  const findings = [];
  const today = new Date().toISOString().slice(0, 10);
  for (const exception of exceptions) {
    if (!exception?.code || !exception?.file || !exception?.reason || !/^\d{4}-\d{2}-\d{2}$/.test(exception?.expiresAt ?? "")) {
      findings.push(finding("INVALID_EXCEPTION", rel(REGISTRY_PATH), "exception requires code, file, reason, expiresAt"));
      continue;
    }
    if (exception.expiresAt < today) {
      findings.push(finding("EXPIRED_EXCEPTION", exception.file, `exception expired at ${exception.expiresAt}`));
      continue;
    }
    active.push(exception);
  }
  return { active, findings };
}

function exceptionMatches(exception, item) {
  return exception.code === item.code && exception.file === item.file && (!exception.gateId || exception.gateId === item.gateId);
}

function inspect() {
  const checkerFiles = candidates().map(rel);
  const corpus = corpusFiles().map((file) => ({ file, text: readSafe(file) }));
  const registryResult = readRegistry();
  const registry = registryResult.registry;
  const gateByChecker = new Map(registry.gates.map((gate) => [gate.checker, gate]));
  const findings = [...registryResult.findings, ...validateGates(registry)];
  const classifications = [];

  for (const checkerFile of checkerFiles) {
    const references = referencesFor(corpus, checkerFile);
    const executable = references.filter((entry) => entry.kind !== "docs" && entry.kind !== "other");
    const gate = gateByChecker.get(checkerFile);
    const classification = {
      file: checkerFile,
      declared: Boolean(gate),
      invoked: executable.length > 0,
      blocking: executable.some((entry) => entry.blocking),
      scheduled: executable.some((entry) => entry.scheduled),
    };
    classifications.push(classification);

    if (!gate) {
      if (classification.blocking || classification.scheduled) {
        findings.push(finding(
          "UNDECLARED_CRITICAL_CHECKER",
          checkerFile,
          "blocking or scheduled checker must be declared in the quality gate registry",
        ));
      } else if (references.length === 0) {
        findings.push(finding("UNWIRED_CHECKER", checkerFile, "no workflow/hook/package/skill/agent/script reference found"));
      }
      continue;
    }
    if (executable.length === 0) {
      const code = references.some((entry) => entry.kind === "docs") ? "DOCS_ONLY_GATE" : "DECLARED_ONLY_GATE";
      findings.push(finding(code, checkerFile, "declared gate has no executable invocation", gate.id));
      continue;
    }
    if (gate.blocking && !executable.some((entry) => entry.blocking)) {
      findings.push(finding("NON_BLOCKING_GATE", checkerFile, "blocking gate is invoked only through fail-open paths", gate.id));
    }
    if (!gate.blocking && executable.some((entry) => entry.blocking)) {
      findings.push(finding("BLOCKING_FLAG_MISMATCH", checkerFile, "registry marks a blocking invocation as non-blocking", gate.id));
    }
    if (classification.scheduled && !gate.trigger.includes("schedule")) {
      findings.push(finding("MISSING_GATE_TRIGGER", checkerFile, "scheduled invocation is missing from registry trigger", gate.id));
    }
    if (executable.some((entry) => entry.pullRequest) && !gate.trigger.includes("pull_request")) {
      findings.push(finding("MISSING_GATE_TRIGGER", checkerFile, "pull_request invocation is missing from registry trigger", gate.id));
    }
    if (gate.trigger.includes("pull_request") && gate.blocking &&
        !executable.some((entry) => entry.blocking && entry.pullRequest)) {
      findings.push(finding("MISSING_GATE_TRIGGER", checkerFile, "no blocking pull_request invocation", gate.id));
    }
    if (gate.trigger.includes("schedule") && !executable.some((entry) => entry.scheduled)) {
      findings.push(finding("UNSCHEDULED_GATE", checkerFile, "no scheduled workflow invocation", gate.id));
    }
  }

  for (const gate of registry.gates) {
    if (!checkerFiles.includes(gate.checker) && fs.existsSync(path.resolve(ROOT, gate.checker))) {
      findings.push(finding("NOT_A_CHECKER", gate.checker, "declared checker is outside the discovered checker inventory", gate.id));
    }
  }

  const workspaces = workspaceInventory(registry, registryResult.exists);
  findings.push(...workspaces.findings);
  const exceptions = validateExceptions(registry.exceptions);
  const unsuppressed = [...findings, ...exceptions.findings].filter(
    (item) => NON_BASELINE_CODES.has(item.code) ||
      !exceptions.active.some((exception) => exceptionMatches(exception, item)),
  );
  return { checkerFiles, classifications, workspaces: workspaces.inventory, findings: unsuppressed };
}

function key(item) {
  return `${item.code}\u0000${item.file}`;
}

function writeBaseline(findings) {
  const output = {
    version: 1,
    description: "Known checker wiring findings. New code/path pairs fail --baseline.",
    findings,
  };
  fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true });
  fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`✓ checker wiring baseline 更新: ${rel(BASELINE_PATH)} (${findings.length})`);
}

function readBaseline() {
  try {
    const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
    if (baseline.version !== 1 || !Array.isArray(baseline.findings)) throw new Error("invalid schema");
    return baseline;
  } catch (error) {
    console.error(`✗ checker wiring baseline を読めない: ${String(error)}`);
    process.exit(2);
  }
}

function main() {
  const result = inspect();
  if (writeIndex !== -1) {
    writeBaseline(result.findings);
    return 0;
  }
  let regressions = result.findings;
  let resolved = [];
  if (has("--baseline")) {
    const baseline = readBaseline();
    const known = new Set(baseline.findings.map(key));
    const current = new Set(result.findings.map(key));
    regressions = result.findings.filter((item) => !known.has(key(item)));
    resolved = baseline.findings.filter((item) => !current.has(key(item)));
    const regressionKeys = new Set(regressions.map(key));
    for (const item of result.findings.filter((findingItem) => NON_BASELINE_CODES.has(findingItem.code))) {
      if (!regressionKeys.has(key(item))) {
        regressions.push(item);
        regressionKeys.add(key(item));
      }
    }
  }
  const output = {
    checked: result.checkerFiles.length,
    findings: result.findings,
    regressions,
    resolved,
    classifications: result.classifications,
    workspaces: result.workspaces,
  };
  if (has("--json")) console.log(JSON.stringify(output, null, 2));
  else if (regressions.length === 0) {
    console.log(`✓ checker wiring 悪化なし — ${output.checked} checkers / known ${output.findings.length} / new 0`);
  } else {
    console.error(`✗ checker wiring regression: ${regressions.length}`);
    for (const item of regressions) console.error(`  [${item.code}] ${item.file}`);
  }
  return regressions.length === 0 ? 0 : 1;
}

if (require.main === module) process.exit(main());

module.exports = { inspect, referencesFor, workflowSteps, workflowTriggers, workspaceInventory };
