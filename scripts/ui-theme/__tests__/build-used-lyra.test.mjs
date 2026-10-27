/**
 * style-lyra.used.css (正本から使う規則だけを抜いた生成物) の契約。
 *
 * - ソースに出る cn-* のうち正本にある名前は、すべて used.css にある (規則の取りこぼしは見た目の崩れになる)
 * - ソースで cn-* を組み立てていない (組み立てると抽出で拾えず、規則が黙って落ちる)
 * - used.css は正本と同じ順序・同じ本文で、生成し直した結果と一致する (手編集と再生成忘れを止める)
 * - 走査から外す atom の一覧は tailwind.config.ts の "!" 除外と同じで、どれも本当に import されていない
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  OUTPUT_CSS,
  ROOT,
  SOURCE_CSS,
  UNUSED_ATOMS,
  buildUsedCss,
  collectUsedNames,
  generate,
  listSourceFiles,
  lyraRuleNames,
  parseLyra,
} from "../build-used-lyra.mjs";

const SOURCE = readFileSync(SOURCE_CSS, "utf8");
const USED = readFileSync(OUTPUT_CSS, "utf8");

test("ソースに出る cn-* のうち正本にある名前は、すべて used.css にある", () => {
  const { names } = collectUsedNames(listSourceFiles());
  const ruleNames = lyraRuleNames(SOURCE);
  const usedRuleNames = lyraRuleNames(USED.slice(USED.indexOf(".style-lyra {")));
  const missing = [...names].filter((name) => ruleNames.has(name) && !usedRuleNames.has(name));
  assert.deepEqual(missing, []);
  // 走査が空振りしていない (部品の写しが cn-card などを持つ)
  assert.ok(usedRuleNames.has("cn-card"));
  assert.ok(usedRuleNames.has("cn-input"));
});

test("ソースで cn-* を組み立てていない", () => {
  const { dynamic } = collectUsedNames(listSourceFiles());
  assert.deepEqual(dynamic, []);
});

test("組み立ての検出は `cn-${…}` と \"cn-\" + … を拾い、shadcn-dashboard のような語は拾わない", () => {
  assert.match("`cn-${variant}`", /cn-\$\{/);
  const fixtureNames = new Set();
  for (const m of 'next-shadcn-dashboard "cn-card" `cn-${x}` "cn-" + y'.matchAll(
    /(?<![A-Za-z0-9_-])cn-[a-z0-9]+(?:-[a-z0-9]+)*/g
  )) {
    fixtureNames.add(m[0]);
  }
  assert.deepEqual([...fixtureNames], ["cn-card"]);
});

test("used.css は生成し直した結果と一致する (手編集・再生成忘れを止める)", () => {
  assert.equal(USED, generate().output);
});

test("used.css の規則は正本と同じ順序・同じ本文", () => {
  const sourceRules = parseLyra(SOURCE).filter((item) => item.kind === "rule");
  const usedRules = parseLyra(USED.slice(USED.indexOf(".style-lyra {"))).filter((item) => item.kind === "rule");
  const byName = new Map(sourceRules.map((rule) => [rule.name, rule.text]));
  for (const rule of usedRules) assert.equal(rule.text, byName.get(rule.name), rule.name);
  const order = sourceRules.map((rule) => rule.name);
  const indices = usedRules.map((rule) => order.indexOf(rule.name));
  assert.deepEqual(indices, [...indices].sort((a, b) => a - b));
});

test("buildUsedCss は使わない規則と、規則が残らない節の見出しを落とす", () => {
  const css = [
    ".style-lyra {",
    "  /* MARK: A */",
    "  .cn-a {",
    "    @apply p-1;",
    "  }",
    "",
    "  /* MARK: B */",
    "  .cn-b {",
    "    @apply p-2;",
    "  }",
    "}",
    "",
  ].join("\n");
  const out = buildUsedCss(css, new Set(["cn-b"]));
  assert.ok(out.includes(".cn-b {"));
  assert.ok(!out.includes(".cn-a {"));
  assert.ok(!out.includes("MARK: A"));
  assert.ok(out.includes("MARK: B"));
});

test("正本の形が想定外なら黙って落とさず例外にする", () => {
  assert.throws(() => parseLyra(".style-lyra {\n  .cn-a, .cn-b {\n    @apply p-1;\n  }\n}\n"));
});

test("走査から外す atom は tailwind.config.ts の除外と同じで、どれも import されていない", () => {
  const config = readFileSync(join(ROOT, "apps/web/tailwind.config.ts"), "utf8");
  const excluded = [...config.matchAll(/"!\.\.\/\.\.\/packages\/components\/src\/atoms\/ui\/([a-z-]+)\.tsx"/g)].map(
    (m) => m[1]
  );
  assert.deepEqual(excluded, UNUSED_ATOMS);

  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!["node_modules", ".next", ".turbo"].includes(entry.name)) walk(join(dir, entry.name));
      } else if (/\.[cm]?[jt]sx?$/.test(entry.name)) {
        files.push(join(dir, entry.name));
      }
    }
  };
  for (const dir of ["apps/web/src", "packages/components/src", "packages/visualization/src"]) walk(join(ROOT, dir));
  // 入口 (@stats47/components) から名前で import する書き方も数える
  const barrelImports = files.flatMap((file) =>
    [...readFileSync(file, "utf8").matchAll(/import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*["']@stats47\/components["']/g)].map(
      (m) => ({ file, names: m[1].split(",").map((s) => s.trim().split(/\s+as\s+/)[0].replace(/^type\s+/, "")) })
    )
  );
  for (const atom of UNUSED_ATOMS) {
    const deep = new RegExp(`atoms/ui/${atom}["']`);
    const sibling = new RegExp(`from ["']\\./${atom}["']`);
    const importers = files.filter((file) => {
      if (file.endsWith(join("packages/components/src/index.ts"))) return false; // export * の入口は数えない
      const text = readFileSync(file, "utf8");
      return deep.test(text) || sibling.test(text);
    });
    assert.deepEqual(importers, [], atom);

    const atomSource = readFileSync(join(ROOT, "packages/components/src/atoms/ui", `${atom}.tsx`), "utf8");
    const exported = new Set(
      [...atomSource.matchAll(/export\s*\{([^}]*)\}/g)].flatMap((m) =>
        m[1].split(",").map((s) => s.trim().split(/\s+as\s+/).pop()).filter(Boolean)
      )
    );
    assert.ok(exported.size > 0, `${atom} の export を読めない`);
    const viaBarrel = barrelImports.filter(({ names }) => names.some((name) => exported.has(name)));
    assert.deepEqual(viaBarrel.map(({ file }) => file), [], `${atom} (入口経由)`);
  }
});
