/**
 * lyra の規則 (style-lyra.css の @apply) を部品の className へ書き込む方式の契約。
 *
 * - ソースの cn-* を含む文字列は、すべて書き込み済み (書き込み漏れは見た目の崩れになる)
 * - ソースで cn-* を組み立てていない (組み立てると拾えず、規則が黙って落ちる)
 * - 勝ち方は CSS で読んでいたときと同じ: lyra は部品の素のクラスにも呼び出し側の className にも勝ち、
 *   勝てるのは ! 付きだけ (lyra を cn(…) の最後の引数・cva の外の <名前>Lyra に置く)
 * - 公開サイトは lyra の規則を CSS として読まない (読むと同じ見た目が CSS に 2 回出る)
 * - 走査から外す atom の一覧は tailwind.config.ts の "!" 除外と同じで、どれも本当に import されていない
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { cn } from "../../../packages/components/src/lib/cn.ts";
import {
  REFERENCE_CSS,
  ROOT,
  SOURCE_CSS,
  UNUSED_ATOMS,
  inlineSource,
  losesToLyra,
  mergeReference,
  parseLyra,
  run,
} from "../inline-lyra.mjs";

const RULES = parseLyra(readFileSync(SOURCE_CSS, "utf8"));
const FIXTURE_RULES = new Map([["cn-a", "rounded-none text-xs"]]);

test("ソースの cn-* を含む文字列は、すべて lyra の規則が書き込み済み", () => {
  const { changed, dynamic, uncovered } = run({ write: false });
  assert.deepEqual(dynamic, []);
  assert.deepEqual(uncovered, []);
  assert.deepEqual(changed, []);
});

test("走査が空振りしていない (部品の写しが cn-card などを持ち、lyra の値が入っている)", () => {
  const card = readFileSync(join(ROOT, "packages/components/src/atoms/ui/card.tsx"), "utf8");
  // lyra の値 (ring-1) と、見本の差分 (style-reference.css の text-sm/relaxed) の両方が入っている
  assert.match(card, /\/\* lyra \*\/ "[^"]*\bring-1\b[^"]*\btext-sm\/relaxed\b/);
  const button = readFileSync(join(ROOT, "packages/components/src/atoms/ui/button.tsx"), "utf8");
  assert.match(button, /const buttonClassesLyra = cva\(/);
  assert.ok(RULES.has("cn-card"));
  assert.ok(RULES.has("cn-input"));
});

test("見本の差分は lyra の同じ性質を置き換え、lyra に無い規則への差分は止める", () => {
  const reference = parseLyra(readFileSync(REFERENCE_CSS, "utf8"), ".style-reference");
  const merged = mergeReference(RULES, reference);
  // パネルの文字は見本の 14px / 22.75px (lyra は 12px)。lyra の他の値 (py-4 ring-1) は残る
  assert.match(merged.get("cn-card"), /\btext-sm\/relaxed\b/);
  assert.doesNotMatch(merged.get("cn-card"), /\btext-xs\/relaxed\b/);
  assert.match(merged.get("cn-card"), /\bpy-4\b.*\bring-1\b/);
  assert.match(merged.get("cn-card-title"), /\btext-base leading-5\.5\b/);
  assert.throws(() => mergeReference(RULES, new Map([["cn-missing", "text-sm"]])), /cn-missing/);
});

test("cn(…) は lyra を className の後ろに足すので、lyra が呼び出し側に勝ち、! だけが lyra に勝つ", () => {
  const { output } = inlineSource('cn("cn-a px-2 rounded-xl hover:rounded-lg", className)', FIXTURE_RULES);
  // lyra に負けていた素のクラス (rounded-xl・hover:rounded-lg) は書き込み時に外す。hover: 付きは tailwind-merge では消えない
  assert.equal(output, 'cn("cn-a px-2", className, /* lyra */ "rounded-none text-xs")');
  assert.equal(cn("cn-a px-2", "text-sm", "rounded-none text-xs"), "cn-a px-2 rounded-none text-xs");
  assert.equal(cn("cn-a px-2", "text-sm!", "rounded-none text-xs"), "cn-a px-2 text-sm! rounded-none text-xs");
  // 何度書き込んでも同じ
  assert.equal(inlineSource(output, FIXTURE_RULES).output, output);
});

test("cva は同じ variant の形で lyra だけの cva を書き、何度書き込んでも同じ", () => {
  const source = [
    "const fooClasses = cva(",
    '  "cn-a inline-flex rounded-xl",',
    "  {",
    "    variants: {",
    "      size: {",
    '        sm: "cn-a h-7 hover:rounded-lg",',
    "      },",
    "    },",
    "    defaultVariants: {",
    '      size: "sm",',
    "    },",
    "  }",
    ")",
    "",
  ].join("\n");
  const { output } = inlineSource(source, FIXTURE_RULES);
  assert.match(output, /\/\/ lyra:begin fooClasses/);
  assert.match(output, /const fooClassesLyra = cva\("rounded-none text-xs", \{/);
  assert.match(output, /sm: "rounded-none text-xs",/);
  assert.match(output, /defaultVariants: \{ size: "sm" \},/);
  assert.match(output, /sm: "cn-a h-7",/);
  assert.equal(inlineSource(output, FIXTURE_RULES).output, output);
});

test("className=\"…\" の直書きは、その文字列の中で lyra を後ろに合成する", () => {
  const { output } = inlineSource('<span className="cn-a rounded-xl px-1" />', FIXTURE_RULES);
  assert.equal(output, '<span className="cn-a px-1 rounded-none text-xs" />');
});

test("lyra に負ける素のクラスの判定は、variant を含む側だけを負けにする", () => {
  assert.equal(losesToLyra("hover:bg-muted", ["bg-transparent"]), true);
  assert.equal(losesToLyra("bg-muted", ["hover:bg-transparent"]), false);
  assert.equal(losesToLyra("hover:bg-muted!", ["bg-transparent"]), false);
  assert.equal(losesToLyra("hover:text-sm", ["bg-transparent"]), false);
});

test("規則名を含まない文字列と、規則名に似た語は書き換えない", () => {
  const rules = new Map([["cn-card", "p-1"]]);
  const source = 'cn("p-2 shadcn-dashboard", className); cn("cn-cardx p-2", className)';
  assert.equal(inlineSource(source, rules).output, source);
});

test("組み立てた cn-* と、cn(…) にも cva(…) にも乗らない cn-* を拾う", () => {
  assert.deepEqual(inlineSource('const a = `cn-${x}`;\nconst b = "cn-" + y;', new Map()).dynamic, [1, 2]);
  assert.deepEqual(inlineSource('const a = ["cn-a p-1"]', FIXTURE_RULES).uncovered, [1]);
});

test("正本の形が想定外なら黙って落とさず例外にする", () => {
  assert.throws(() => parseLyra(".style-lyra {\n  .cn-a, .cn-b {\n    @apply p-1;\n  }\n}\n"));
  assert.throws(() => parseLyra(".style-lyra {\n  .cn-a {\n    padding: 0;\n  }\n}\n"));
});

test("公開サイトは lyra の規則を CSS として読まない", () => {
  const base = readFileSync(join(ROOT, "packages/ui-theme/base.css"), "utf8");
  assert.doesNotMatch(base, /@import\s+["'][^"']*style-lyra/);
  const globals = readFileSync(join(ROOT, "apps/web/src/app/globals.css"), "utf8");
  assert.doesNotMatch(globals, /@import\s+["'][^"']*style-lyra/);
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
