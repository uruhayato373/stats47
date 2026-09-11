import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import yaml from "js-yaml";

const workflow = yaml.load(fs.readFileSync(new URL("../../../../.github/workflows/theme-chart-audit-weekly.yml", import.meta.url), "utf8"));
const commitStep = workflow.jobs.audit.steps.find((step) => step.name.includes("Commit observations"));

test("weekly observation commit preserves experiment checkpoints without staging unrelated files", (t) => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "theme-weekly-commit-"));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  const observations = [
    ".claude/state/theme-charts/live-audit.json", ".claude/state/themes/quality.json",
    ".claude/state/themes/quality.definitions.json", ".claude/state/themes/quality.observations.json",
    ".claude/state/themes/quality.lastGoodObservations.json",
    ".claude/state/themes/portfolio.json", ".claude/state/themes/experiments.json",
  ];
  for (const file of [...observations, ".claude/state/themes/unrelated.json"]) {
    fs.mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true });
    fs.writeFileSync(path.join(cwd, file), "{}\n");
  }
  // Run the workflow shell; replace Git transport/index operations only.
  const stub = `git() {
    case "$1" in
      add) printf '%s\\n' "$3" >> staged ;;
      diff) return 1 ;;
      *) printf '%s\\n' "$1" >> calls ;;
    esac
  }\n`;
  const result = spawnSync("bash", ["-e", "-c", stub + commitStep.run], { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.deepEqual(fs.readFileSync(path.join(cwd, "staged"), "utf8").trim().split("\n").sort(), observations.sort());
  assert.deepEqual(fs.readFileSync(path.join(cwd, "calls"), "utf8").trim().split("\n").slice(-3), ["commit", "pull", "push"]);
});
