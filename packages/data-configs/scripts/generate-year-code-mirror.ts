#!/usr/bin/env -S npx tsx
/** Generate the plain-node year-code entrypoint from its TypeScript source. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const source = new URL('../../estat-api/src/stats-data/utils/extract-year-code.ts', import.meta.url);
const output = new URL('../../../.claude/scripts/lib/year-code.mjs', import.meta.url);
const header = '// Generated from packages/estat-api/src/stats-data/utils/extract-year-code.ts.\n' +
  '// Regenerate: node --import tsx packages/data-configs/scripts/generate-year-code-mirror.ts\n';
const mirror = header + ts.transpileModule(readFileSync(source, 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
if (process.argv.includes('--check')) {
  if (!existsSync(output) || readFileSync(output, 'utf8') !== mirror) {
    console.error('Year code mirror drift: regenerate ' + fileURLToPath(output));
    process.exitCode = 1;
  } else console.log('Year code mirror matches TypeScript source');
} else {
  writeFileSync(output, mirror);
  console.log(fileURLToPath(output));
}
