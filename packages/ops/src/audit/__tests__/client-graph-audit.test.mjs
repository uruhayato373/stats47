import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { auditClientGraph, compareWithBaseline, fileDirective } from "../client-graph-audit-core.mjs";

let root;

function write(relativePath, content) {
  const file = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  return file;
}

function sourceFiles() {
  const found = [];
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (/\.tsx?$/.test(entry.name)) found.push(absolute);
    }
  };
  walk(root);
  return found;
}

const audit = () => auditClientGraph({
  repoRoot: root,
  tsconfigPath: path.join(root, "apps/web/tsconfig.json"),
  files: sourceFiles(),
});

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

describe("全 use client ファイルから重い依存への経路", () => {
  it("軽い部品だけなら 0 件で、use client を 1 件として数える", () => {
    const result = audit();
    assert.deepEqual(result.clientFiles, ["apps/web/src/ui/Light.tsx"]);
    assert.deepEqual(result.offenders, []);
  });

  it("barrel を 1 つ経由して全指標 registry に届く経路を 1 件注入すると、そのファイルと経路を報告する", () => {
    write("apps/web/src/lib/barrel.ts", 'export * from "./light";\nexport * from "../../../../packages/data-configs/src/registry";\n');
    const { offenders } = audit();
    assert.equal(offenders.length, 1);
    assert.equal(offenders[0].file, "apps/web/src/ui/Light.tsx");
    assert.deepEqual(offenders[0].chain, [
      "apps/web/src/ui/Light.tsx",
      "apps/web/src/lib/barrel.ts",
      "packages/data-configs/src/registry.ts",
    ]);
  });

  it("注入した経路を除くと 0 件に戻る", () => {
    write("apps/web/src/lib/barrel.ts", 'export * from "./light";\nexport * from "../../../../packages/data-configs/src/registry";\n');
    assert.equal(audit().offenders.length, 1);
    write("apps/web/src/lib/barrel.ts", 'export * from "./light";\n');
    assert.equal(audit().offenders.length, 0);
  });

  it("全テーマ定義に届く経路も数える", () => {
    write("apps/web/src/ui/Themes.tsx", '"use client";\nimport { ALL_THEMES } from "@/features/theme-dashboard/config/all-themes";\nexport const T = () => ALL_THEMES;\n');
    assert.deepEqual(audit().offenders.map((offender) => offender.file), ["apps/web/src/ui/Themes.tsx"]);
  });

  it("GIS 原典処理の外部パッケージへの import も数える", () => {
    write("apps/web/src/ui/Gis.tsx", '"use client";\nimport unzipper from "unzipper";\nexport const G = () => unzipper;\n');
    const { offenders } = audit();
    assert.equal(offenders.length, 1);
    assert.deepEqual(offenders[0].chain, ["apps/web/src/ui/Gis.tsx", "unzipper"]);
  });

  it("型だけの import は辿らない", () => {
    write("apps/web/src/ui/Typed.tsx", '"use client";\nimport type { METRICS_REGISTRY } from "../../../../packages/data-configs/src/registry";\nimport { type ALL_THEMES } from "@/features/theme-dashboard/config/all-themes";\nexport const x = 1;\n');
    assert.deepEqual(audit().offenders, []);
  });

  it('"use server" のファイルはブラウザへ入らないので辿らない', () => {
    write("apps/web/src/lib/action.ts", '"use server";\nimport { METRICS_REGISTRY } from "../../../../packages/data-configs/src/registry";\nexport async function run() { return METRICS_REGISTRY; }\n');
    write("apps/web/src/ui/Form.tsx", '"use client";\nimport { run } from "@/lib/action";\nexport const F = () => run;\n');
    assert.deepEqual(audit().offenders, []);
  });

  it("use client でないファイルは起点にしない", () => {
    write("apps/web/src/lib/server-only.ts", 'import { METRICS_REGISTRY } from "../../../../packages/data-configs/src/registry";\nexport const s = METRICS_REGISTRY;\n');
    assert.deepEqual(audit().offenders, []);
  });

  it("テストと stories は起点にしない", () => {
    write("apps/web/src/ui/Heavy.test.tsx", '"use client";\nimport "../../../../packages/data-configs/src/registry";\n');
    assert.equal(audit().clientFiles.includes("apps/web/src/ui/Heavy.test.tsx"), false);
  });

  it("先頭のコメントの後ろにあるディレクティブも読む", () => {
    assert.equal(fileDirective('// header\n"use client";\nimport x from "y";'), "client");
    assert.equal(fileDirective('/* a */\n\'use server\''), "server");
    assert.equal(fileDirective('import x from "y";\n"use client";'), null);
  });
});

describe("baseline との比較", () => {
  const offender = (file) => ({ file, chain: [file], target: "x" });

  it("baseline に無いファイルは増加として報告する", () => {
    const result = compareWithBaseline({ offenders: [offender("a.tsx"), offender("b.tsx")], clientFiles: ["a.tsx", "b.tsx"], baselineFiles: ["a.tsx"] });
    assert.deepEqual(result.added.map((entry) => entry.file), ["b.tsx"]);
    assert.equal(result.blind, false);
  });

  it("baseline にあるのに届かなくなったファイルは縮小できるものとして報告する", () => {
    const result = compareWithBaseline({ offenders: [offender("a.tsx")], clientFiles: ["a.tsx", "b.tsx"], baselineFiles: ["a.tsx", "b.tsx"] });
    assert.deepEqual(result.added, []);
    assert.deepEqual(result.stale, ["b.tsx"]);
  });

  it("baseline があるのに 1 件も検出できなければ、検査が経路をたどれていない疑いとして扱う", () => {
    const result = compareWithBaseline({ offenders: [], clientFiles: ["a.tsx"], baselineFiles: ["a.tsx"] });
    assert.equal(result.blind, true);
  });
});
