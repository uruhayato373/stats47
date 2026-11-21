import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

// .claude の入口 (baseline のパスを渡す側) を起動して確かめる基盤のテスト。
// 本体の判定 (経路の数え方・baseline との比較) は packages/ops/src/audit/__tests__/client-graph-audit.test.mjs。
const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "audit", "client-graph-audit.mjs");

let root;

function write(relativePath, content) {
  const file = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  return file;
}

/** 実リポジトリと同じ相対パスで、最小の重い依存と軽い部品を置く。 */
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "client-graph-audit-"));
  write("apps/web/tsconfig.json", JSON.stringify({
    compilerOptions: {
      module: "esnext", moduleResolution: "bundler", jsx: "react-jsx", strict: true, noEmit: true,
      baseUrl: ".", paths: { "@/*": ["./src/*"] },
    },
  }));
  write("packages/data-configs/src/registry.ts", "export const METRICS_REGISTRY = {};\n");
  write("apps/web/src/features/theme-dashboard/config/all-themes.ts", "export const ALL_THEMES = [];\n");
  write("apps/web/src/lib/light.ts", "export const light = 1;\n");
  write("apps/web/src/lib/barrel.ts", 'export * from "./light";\n');
  write("apps/web/src/ui/Light.tsx", '"use client";\nimport { light } from "@/lib/barrel";\nexport const Light = () => light;\n');
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe("CLI (git で追跡された fixture)", () => {
  const run = (...args) => spawnSync("node", [CLI, "--root", root, ...args], { encoding: "utf8" });
  const track = () => {
    execFileSync("git", ["init", "-q"], { cwd: root });
    execFileSync("git", ["add", "-A"], { cwd: root });
  };
  const setBaseline = (files) => write(".claude/config/client-graph-baseline.json", JSON.stringify({ version: 1, offenders: files.map((file) => ({ file, target: "x" })) }));

  it("経路を 1 件注入すると exit 1 で落ち、除くと exit 0 で通る", () => {
    setBaseline([]);
    write("apps/web/src/lib/barrel.ts", 'export * from "../../../../packages/data-configs/src/registry";\n');
    track();
    const failed = run();
    assert.equal(failed.status, 1, failed.stdout + failed.stderr);
    assert.match(failed.stderr, /増加: apps\/web\/src\/ui\/Light\.tsx/);

    write("apps/web/src/lib/barrel.ts", 'export * from "./light";\n');
    const passed = run();
    assert.equal(passed.status, 0, passed.stdout + passed.stderr);
  });

  it("baseline に載せた既存の経路は通り、同じ baseline でも新しい経路は落ちる", () => {
    write("apps/web/src/lib/barrel.ts", 'export * from "../../../../packages/data-configs/src/registry";\n');
    setBaseline(["apps/web/src/ui/Light.tsx"]);
    track();
    assert.equal(run().status, 0);

    write("apps/web/src/ui/Second.tsx", '"use client";\nimport "@/lib/barrel";\n');
    execFileSync("git", ["add", "-A"], { cwd: root });
    const failed = run();
    assert.equal(failed.status, 1);
    assert.match(failed.stderr, /増加: apps\/web\/src\/ui\/Second\.tsx/);
  });

  it("baseline が空でないのに何も検出できなければ失敗する (検査の盲目化を見逃さない)", () => {
    setBaseline(["apps/web/src/ui/Light.tsx"]);
    track();
    const result = run();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /1 件も検出できなかった/);
  });

  it("--write-baseline は縮めるだけで、増加があれば書かない", () => {
    write("apps/web/src/lib/barrel.ts", 'export * from "../../../../packages/data-configs/src/registry";\n');
    setBaseline([]);
    track();
    const result = run("--write-baseline");
    assert.equal(result.status, 1);
    const baseline = JSON.parse(fs.readFileSync(path.join(root, ".claude/config/client-graph-baseline.json"), "utf8"));
    assert.deepEqual(baseline.offenders, []);
  });
});
