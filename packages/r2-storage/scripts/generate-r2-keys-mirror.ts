#!/usr/bin/env -S npx tsx
/** Generate the plain-node mirror from the TypeScript source; --check never writes. */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const SRC = fileURLToPath(new URL("../src/keys.ts", import.meta.url));
const OUT = fileURLToPath(new URL("../../../packages/r2-storage/mirror/r2-keys.mjs", import.meta.url));
const HEADER = `// generated, do not edit
// Source: packages/r2-storage/src/keys.ts
// Generate: npm run r2-keys:mirror
// Verify: npm run r2-keys:mirror:check
`;

function main(): void {
  const source = readFileSync(SRC, "utf8");
  const siteImport = 'import SITE from "../../types/src/site.json";';
  if (!source.includes(siteImport)) throw new Error("Update mirror generator for the SITE import");
  // Keep the shared site.json live through the existing Node adapter, without copying the host.
  const { outputText } = ts.transpileModule(
    source.replace(siteImport, 'import { SITE } from "../../types/mirror/site-config.cjs";'),
    { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } },
  );
  const mirror = HEADER + outputText;
  if (process.argv.includes("--check")) {
    let current = "";
    try { current = readFileSync(OUT, "utf8"); } catch { /* Missing output is drift. */ }
    if (current !== mirror) {
      console.error("R2 keys mirror is missing or stale. Run npm run r2-keys:mirror");
      process.exitCode = 1;
      return;
    }
    console.log("✓ R2 keys mirror matches the TypeScript source");
    return;
  }
  writeFileSync(OUT, mirror);
  console.log(`Generated ${OUT}`);
}

main();
