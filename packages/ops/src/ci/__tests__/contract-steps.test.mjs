import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import YAML from "yaml";

import { SOURCE_WORKFLOW, runAllSteps, selectContractSteps, summarize } from "../contract-steps.mjs";

/**
 * 守る意図 (CI-CONTRACT-TESTS-DEVELOP-GAP-01): main への PR でしか回らなかった契約テストを develop でも回す。
 * 段の一覧は PR の workflow から読むので二重管理にならない。落ちた段の後ろも続けて、落ちた段を全部報告する。
 */
const WORKFLOW = {
  jobs: {
    "contract-tests": {
      steps: [
        { name: "checkout", uses: "actions/checkout@x" },
        { name: "install", if: "steps.cache.outputs.cache-hit != 'true'", run: "npm ci" },
        { name: "alert", run: "npm run test:alert-lifecycle" },
        { name: "scoped", if: "needs.changes.outputs.workflow_contracts == 'true'", run: "npm run test:scoped" },
        { name: "with env", run: "node a.mjs", env: { FOO: "1" } },
      ],
    },
  },
};

test("条件の無い run の段だけを書かれた順に選ぶ (依存の入れ直しと差分連動の段は外す)", () => {
  assert.deepEqual(selectContractSteps(WORKFLOW).map((step) => step.name), ["alert", "with env"]);
  assert.deepEqual(selectContractSteps(WORKFLOW)[1].env, { FOO: "1" });
});

test("job が無ければ黙って 0 段にせず止める", () => {
  assert.throws(() => selectContractSteps({ jobs: {} }), /contract-tests job が見つからない/);
});

test("1 段が落ちても後ろの段を続け、落ちた段を全部報告する", () => {
  const ran = [];
  const results = runAllSteps(selectContractSteps(WORKFLOW), (step) => {
    ran.push(step.name);
    return step.name === "alert" ? 1 : 0;
  });
  assert.deepEqual(ran, ["alert", "with env"]);
  const { failed, text } = summarize(results);
  assert.deepEqual(failed.map((result) => result.name), ["alert"]);
  assert.match(text, /2 段のうち 1 段が落ちた: alert/);
});

test("実際の PR の workflow から契約テストの段を 10 段以上読める (job 名や構造が変わったら気づく)", () => {
  const workflow = YAML.parse(readFileSync(new URL(`../../../../../${SOURCE_WORKFLOW}`, import.meta.url), "utf8"));
  const steps = selectContractSteps(workflow);
  assert.ok(steps.length >= 10, `段が ${steps.length} 件しかない`);
  assert.ok(steps.every((step) => !/^npm ci\b/.test(step.run.trim())), "依存の入れ直しの段が混ざっている");
});
