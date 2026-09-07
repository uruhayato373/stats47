import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import YAML from "yaml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const readWorkflow = (name) => YAML.parse(fs.readFileSync(path.join(root, `.github/workflows/${name}.yml`), "utf8"));
const sync = readWorkflow("sync-snapshots");
const images = readWorkflow("generate-ogp-images");
const step = (workflow, job, name) => workflow.jobs[job].steps.find((entry) => entry.name.includes(name));
const validation = step(sync, "sync", "Validate explicit ranking scope").run;
const generation = step(sync, "sync", "Regenerate snapshots").run;
const imageGeneration = step(images, "generate", "Generate images").run;
const imageScopeStep = step(sync, "sync", "Validate explicit ranking image scope");
const imageScopeValidation = imageScopeStep?.run ?? "";
const syncImageStep = step(sync, "sync-ranking-keys", "Generate changed ranking OGP/cards");

function run(script, overrides = {}, fixture = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ranking-scope-test-"));
  const bin = path.join(dir, "bin");
  fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin, "npx"), `#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const args = process.argv.slice(2);
const fixture = ${JSON.stringify(fixture)};
fs.appendFileSync(process.env.CALL_LOG, JSON.stringify(args) + "\\n");
if (args[1] === "-e") {
  const result = spawnSync(process.env.REAL_TSX, ["-e", args[2]], { cwd: process.env.REAL_ROOT, env: process.env, stdio: "inherit" });
  process.exit(result.status ?? 1);
}
if (args.some(a => a.endsWith("generate-ranking-values.ts"))) {
  if (process.env.FAIL_GENERATE === "1") process.exit(1);
  if (!args.includes("--dry-run")) for (const key of process.env.RANKING_KEYS.split(",")) {
    const dir = ".local/r2/app/ranking/" + key;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dir + "/values.json", JSON.stringify({ rankingKey: key, partitions: [{ values: [{ value: 1 }] }] }));
    if (process.env.EXTRA_STAGING === "1") fs.writeFileSync(dir + "/unexpected.json", "{}");
  }
}
if (args.some(a => a.endsWith("diff-push-r2.ts")) && process.env.FAIL_PUSH === "1") process.exit(1);
if (args.some(a => a.endsWith("generate-ogp-images.ts"))) {
  if (fixture.imageGenerationFails) process.exit(1);
  if (!fixture.imagePlanMissing) {
    const type = args[args.indexOf("--type") + 1];
    fs.mkdirSync(".local", { recursive: true });
    fs.writeFileSync(".local/image-generation-publish-plan-" + type + ".json", "{}");
  }
}
if (args.some(a => a.endsWith("push-generated-image-set.ts")) && fixture.imagePushFails) process.exit(1);
`, { mode: 0o755 });
  try {
    const result = spawnSync("bash", ["-e", "-c", script], {
      cwd: dir,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        CALL_LOG: path.join(dir, "calls.jsonl"),
        REAL_TSX: path.join(root, "node_modules/.bin/tsx"),
        REAL_ROOT: root,
        RANKING_KEYS: "total-population,clothing-footwear-expenditure-total",
        SNAPSHOT_TASK: "ranking-values",
        SNAPSHOT_DRY_RUN: "false",
        IMAGE_TYPE: "ranking",
        IMAGE_LIMIT: "2",
        BLOG_SLUGS: "",
        ...overrides,
      },
    });
    const callsFile = path.join(dir, "calls.jsonl");
    const calls = fs.existsSync(callsFile) ? fs.readFileSync(callsFile, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse) : [];
    return { ...result, calls };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const pushes = (calls) => calls.filter((args) => args.some((arg) => arg.endsWith("diff-push-r2.ts")));

test("explicit snapshots use exact directory prefixes and preserve the CSV as one argument", () => {
  const result = run(`${validation}\n${generation}`);
  assert.equal(result.status, 0, result.stderr);
  const generate = result.calls.find((args) => args.some((arg) => arg.endsWith("generate-ranking-values.ts")));
  assert.deepEqual(generate.slice(-2), ["--only", "total-population,clothing-footwear-expenditure-total"]);
  assert.deepEqual(pushes(result.calls).map((args) => args.slice(-2)), [
    ["--prefix", "app/ranking/total-population/"],
    ["--prefix", "app/ranking/clothing-footwear-expenditure-total/"],
  ]);
  assert.equal(step(sync, "sync", "Stage area specialty").if, "inputs.ranking_keys == ''");
});

for (const keys of ["../total-population", "total-population,", "total-population,total-population", "unknown-ranking-key", "total-population;touch /tmp/nope", Array.from({ length: 51 }, (_, i) => `key-${i}`).join(",")]) {
  test(`invalid or unknown scope fails before generation: ${keys.slice(0, 60)}`, () => {
    const result = run(`${validation}\n${generation}`, { RANKING_KEYS: keys });
    assert.notEqual(result.status, 0);
    assert.equal(pushes(result.calls).length, 0);
    assert.equal(result.calls.some((args) => args.some((arg) => arg.endsWith("generate-ranking-values.ts"))), false);
  });
}

test("scoped snapshots reject other tasks", () => {
  const result = run(`${validation}\n${generation}`, { SNAPSHOT_TASK: "master" });
  assert.notEqual(result.status, 0);
  assert.equal(result.calls.length, 0);
});

test("dry run generates no PUTs", () => {
  const result = run(`${validation}\n${generation}`, { SNAPSHOT_DRY_RUN: "true" });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(pushes(result.calls).length, 0);
  assert.ok(result.calls.some((args) => args.includes("--dry-run")));
});

for (const env of [{ FAIL_GENERATE: "1" }, { EXTRA_STAGING: "1" }]) {
  test(`failed generation or unexpected files fail before the first PUT: ${JSON.stringify(env)}`, () => {
    const result = run(`${validation}\n${generation}`, env);
    assert.notEqual(result.status, 0);
    assert.equal(pushes(result.calls).length, 0);
  });
}

test("a failed PUT stops the scope and remains a failure", () => {
  const result = run(`${validation}\n${generation}`, { FAIL_PUSH: "1" });
  assert.notEqual(result.status, 0);
  assert.equal(pushes(result.calls).length, 1);
});

test("ranking OGP and cards receive only the explicit key array", () => {
  for (const type of ["ranking", "ranking-cards"]) {
    const result = run(imageGeneration, { IMAGE_TYPE: type });
    assert.equal(result.status, 0, result.stderr);
    const generate = result.calls.find((args) => args.some((arg) => arg.endsWith("generate-ogp-images.ts")));
    assert.deepEqual(generate.slice(-2), ["--key", "total-population,clothing-footwear-expenditure-total"]);
  }
});

test("other image types and mixed slug scopes reject ranking_keys", () => {
  for (const env of [{ IMAGE_TYPE: "blog" }, { BLOG_SLUGS: "some-blog" }, { RANKING_KEYS: "unknown-ranking-key" }]) {
    const result = run(imageGeneration, env);
    assert.notEqual(result.status, 0);
    assert.equal(result.calls.some((args) => args.some((arg) => arg.endsWith("generate-ogp-images.ts"))), false);
  }
});

test("empty scope preserves the existing full workflow path and shared R2 lock", () => {
  assert.match(generation, /bash \.claude\/skills\/db\/sync-snapshots\/run\.sh "\$\{ARGS\[@\]\}"/);
  assert.equal(sync.concurrency.group, "r2-write");
  assert.equal(images.concurrency.group, "r2-write");
});

test("image-only scope is distinct and validated before staging or any snapshot writes", () => {
  assert.deepEqual(sync.on.workflow_dispatch.inputs.ranking_image_keys, {
    description: "ranking-items / master / 全task の画像のみ: 対象キーのカンマ区切り (最大50件、空なら従来のKNOWN最大50件)",
    required: false,
    default: "",
  });
  assert.equal(imageScopeStep.env.RANKING_KEYS, "${{ inputs.ranking_image_keys }}");
  assert.equal(imageScopeStep.env.SNAPSHOT_TASK, "${{ inputs.only }}");
  assert.equal(syncImageStep.env.RANKING_KEYS, "${{ inputs.ranking_image_keys }}");
  assert.equal(step(sync, "sync", "Regenerate snapshots").env.RANKING_KEYS, "${{ inputs.ranking_keys }}");
  const steps = sync.jobs.sync.steps;
  assert.ok(steps.indexOf(imageScopeStep) < steps.indexOf(step(sync, "sync", "Stage area specialty")));
  assert.ok(steps.indexOf(imageScopeStep) < steps.indexOf(step(sync, "sync", "Regenerate snapshots")));
});

for (const task of ["ranking-items", "master", ""]) {
  test(`explicit image scope selects both image types for ${task || "all tasks"}`, () => {
    const result = run(`${imageScopeValidation}\n${syncImageStep.run}`, { SNAPSHOT_TASK: task });
    assert.equal(result.status, 0, result.stderr);
    const generated = result.calls.filter(args => args.some(arg => arg.endsWith("generate-ogp-images.ts")));
    assert.equal(generated.length, 2);
    assert.deepEqual(generated.map(args => args[args.indexOf("--type") + 1]), ["ranking", "ranking-cards"]);
    for (const args of generated) {
      assert.deepEqual(args.slice(args.indexOf("--key")), ["--key", "total-population,clothing-footwear-expenditure-total"]);
      assert.equal(args[args.indexOf("--max-generate") + 1], "50");
    }
    const published = result.calls.filter(args => args.some(arg => arg.endsWith("push-generated-image-set.ts")));
    assert.deepEqual(published.map(args => args.slice(-2)), [
      ["--plan", ".local/image-generation-publish-plan-ranking.json"],
      ["--plan", ".local/image-generation-publish-plan-ranking-cards.json"],
    ]);
    assert.equal(pushes(result.calls).length, 0, "image scope does not enter the ranking-values data writer");
  });
}

test("image scope accepts the full 50-key boundary as one CSV argument", () => {
  const knownSource = fs.readFileSync(path.join(root, "packages/ranking/src/config/known-ranking-keys.ts"), "utf8");
  const keys = [...knownSource.matchAll(/^  "([a-z0-9-]+)"/gm)].slice(0, 50).map(match => match[1]);
  assert.equal(keys.length, 50);
  const result = run(`${imageScopeValidation}\n${syncImageStep.run}`, { RANKING_KEYS: keys.join(","), SNAPSHOT_TASK: "master" });
  assert.equal(result.status, 0, result.stderr);
  const generated = result.calls.filter(args => args.some(arg => arg.endsWith("generate-ogp-images.ts")));
  assert.equal(generated.length, 2);
  for (const args of generated) assert.deepEqual(args.slice(-2), ["--key", keys.join(",")]);
});

for (const keys of ["../total-population", "total-population,", " total-population", "total-population\n", "total-population,total-population", "unknown-ranking-key", "projected-population-2045", "total-population;touch /tmp/nope", Array.from({ length: 51 }, (_, i) => `key-${i}`).join(",")]) {
  test(`invalid image scope stops before any write: ${keys.slice(0, 60)}`, () => {
    const result = run(`${imageScopeValidation}\nnpx should-not-write`, { RANKING_KEYS: keys, SNAPSHOT_TASK: "master" });
    assert.notEqual(result.status, 0);
    assert.ok(!result.calls.some(args => args.includes("should-not-write")));
  });
}

for (const task of ["ranking-values", "blog", "page-components", "invalid-task"]) {
  test(`explicit image scope rejects unsupported task ${task} before any write`, () => {
    const result = run(`${imageScopeValidation}\nnpx should-not-write`, { SNAPSHOT_TASK: task });
    assert.notEqual(result.status, 0);
    assert.equal(result.calls.length, 0, "task rejection precedes even TS registry loading");
  });
}

test("empty image scope retains default known self-heal and does not restrict unrelated tasks", () => {
  for (const task of ["master", "ranking-values", "blog", ""]) {
    const validated = run(imageScopeValidation, { RANKING_KEYS: "", SNAPSHOT_TASK: task });
    assert.equal(validated.status, 0, validated.stderr);
    assert.equal(validated.calls.length, 0);
  }
  const result = run(syncImageStep.run, { RANKING_KEYS: "" });
  assert.equal(result.status, 0, result.stderr);
  const generated = result.calls.filter(args => args.some(arg => arg.endsWith("generate-ogp-images.ts")));
  assert.equal(generated.length, 2);
  for (const args of generated) assert.deepEqual(args.slice(-6), ["--source", "known", "--limit", "50", "--max-generate", "50"]);
});

for (const fixture of [{ imageGenerationFails: true }, { imagePlanMissing: true }, { imagePushFails: true }]) {
  test(`scoped image hooks preserve failure gates: ${JSON.stringify(fixture)}`, () => {
    const result = run(syncImageStep.run, {}, fixture);
    assert.notEqual(result.status, 0);
    const generated = result.calls.filter(args => args.some(arg => arg.endsWith("generate-ogp-images.ts")));
    assert.equal(generated.length, 1, "failure stops before the second image type");
    const published = result.calls.filter(args => args.some(arg => arg.endsWith("push-generated-image-set.ts")));
    assert.equal(published.length, fixture.imagePushFails ? 1 : 0);
  });
}
