#!/usr/bin/env -S npx tsx
/**
 * 単位セマンティクス正典 (TS) から、素の node 用の鏡 (.mjs) を**生成**する。
 *
 * ## なぜ生成にするか
 *
 * `.claude/scripts/**` は素の `node` で実行されるため TS を import できない
 * (pre-commit / publish-blog / 日次 cron はすべて `node ...mjs`)。一方 packages 側は TS。
 * 両方に同じ解釈が要るが、**手写しの二重実装はドリフトする**——それが 44 箇所の独立実装を
 * 生んだ原因そのもの。ここでは正典から機械生成し、`--check` で差分を検出する
 * (theme-catalog の generate/validate と同じ様式)。
 *
 * Usage:
 *   npx tsx packages/data-configs/scripts/generate-unit-semantics-mirror.ts
 *   npx tsx packages/data-configs/scripts/generate-unit-semantics-mirror.ts --check
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "../../..");
const SRC = resolve(REPO_ROOT, "packages/data-configs/src/unit/unit-semantics.ts");
const OUT = resolve(REPO_ROOT, ".claude/scripts/lib/unit-semantics.mjs");

const HEADER = `/**
 * 単位セマンティクスの鏡 (素の node 用)。
 *
 * ★このファイルは **自動生成** される。直接編集してはならない。
 *   正典: packages/data-configs/src/unit/unit-semantics.ts
 *   生成: npx tsx packages/data-configs/scripts/generate-unit-semantics-mirror.ts
 *   検証: 同 --check (CI / pre-commit がドリフトを検出)
 *
 * .claude/scripts/** は素の node で実行され TS を import できないため鏡が要る。
 * 手写しの二重実装はドリフトするので機械生成にしている。
 */
`;

/**
 * 引数リストから型注釈を落とす。`raw: string | null | undefined` → `raw`。
 * デフォルト値 (`to = 1`) は残す。
 */
function stripParamTypes(params: string): string {
  return params
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p !== "")
    .map((p) => {
      const eq = p.indexOf("=");
      const name = (eq === -1 ? p : p.slice(0, eq)).split(":")[0].trim();
      return eq === -1 ? name : `${name} =${p.slice(eq + 1)}`;
    })
    .join(", ");
}

/** 正典から本体を切り出す (import 文と export 宣言だけを JS へ落とす)。 */
function toMirror(ts: string): string {
  let body = ts;
  // 先頭のファイル docblock は鏡側のヘッダに差し替える
  body = body.replace(/^\/\*\*[\s\S]*?\*\/\n/, "");
  // 型注釈のみの構文を落とす
  body = body
    .replace(/^import[^\n]*\n/gm, "")
    .replace(/^export interface [\s\S]*?^}\n/gm, "")
    .replace(/^export type [^\n]*\n/gm, "")
    // `const X: Readonly<...> = ` → `const X = `
    .replace(/^(\s*(?:export )?const \w+)\s*:\s*[^=]+=/gm, "$1 =")
    // 関数シグネチャ: 引数の型注釈と戻り値の型注釈をまとめて落とす。
    // 個別の型に対する置換を並べると新しい引数型を足したとき静かに漏れるので、
    // 「function 名(...) : 型 {」の形をパターンで扱う。
    .replace(
      /^((?:export )?function \w+)\(([^)]*)\)\s*(?::\s*[^{]+)?\{/gm,
      (_all, head: string, params: string) => `${head}(${stripParamTypes(params)}) {`,
    )
    // 変数宣言の型注釈
    .replace(/^(\s*const \w+)\s*:\s*UnitSemantics\s*=/gm, "$1 =")
    // as const / 型アサーション
    .replace(/ as const/g, "")
    .replace(/ satisfies [^;=]+/g, "");
  return `${HEADER}${body.trimStart()}`;
}

function main(): void {
  const ts = readFileSync(SRC, "utf8");
  const mirror = toMirror(ts);
  const check = process.argv.includes("--check");

  if (check) {
    let current = "";
    try {
      current = readFileSync(OUT, "utf8");
    } catch {
      console.error(`鏡が無い: ${OUT}\n  生成: npx tsx packages/data-configs/scripts/generate-unit-semantics-mirror.ts`);
      process.exit(1);
    }
    if (current !== mirror) {
      console.error(
        `単位セマンティクスの鏡が正典とずれている。\n` +
          `  正典: packages/data-configs/src/unit/unit-semantics.ts\n` +
          `  鏡  : .claude/scripts/lib/unit-semantics.mjs\n` +
          `  再生成: npx tsx packages/data-configs/scripts/generate-unit-semantics-mirror.ts`,
      );
      process.exit(1);
    }
    console.log("✓ 単位セマンティクスの鏡は正典と一致");
    return;
  }

  writeFileSync(OUT, mirror);
  console.log(`✅ ${OUT}`);
}

main();
