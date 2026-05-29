/**
 * src/metrics/*.ts を walk して src/registry.ts の autogen 部分を再生成する。
 *
 * 使い方:
 *   tsx packages/data-configs/scripts/build-registry.ts
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { METRICS_DIR, REGISTRY_FILE, keyToIdentifier } from "./_lib.js";

const IMPORTS_START = "// AUTOGEN_IMPORTS_START";
const IMPORTS_END = "// AUTOGEN_IMPORTS_END";
const REGISTRY_START = "// AUTOGEN_REGISTRY_START";
const REGISTRY_END = "// AUTOGEN_REGISTRY_END";

function main() {
  const files = readdirSync(METRICS_DIR)
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".d.ts"))
    .sort();

  if (files.length === 0) {
    console.warn("[registry] no metric files found in", METRICS_DIR);
    return;
  }

  const entries = files.map((f) => {
    const key = f.replace(/\.ts$/, "");
    const ident = keyToIdentifier(key);
    return { key, ident, file: `./metrics/${key}` };
  });

  const importLines = entries
    .map((e) => `import { ${e.ident} } from "${e.file}";`)
    .join("\n");

  const registryLines = entries
    .map((e) => `  ${JSON.stringify(e.key)}: ${e.ident},`)
    .join("\n");

  const oldContent = readFileSync(REGISTRY_FILE, "utf-8");

  const newContent = oldContent
    .replace(
      new RegExp(`${IMPORTS_START}[\\s\\S]*?${IMPORTS_END}`),
      `${IMPORTS_START}\n${importLines}\n${IMPORTS_END}`,
    )
    .replace(
      new RegExp(`${REGISTRY_START}[\\s\\S]*?${REGISTRY_END}`),
      `${REGISTRY_START}\nexport const METRICS_REGISTRY: MetricRegistry = {\n${registryLines}\n};\n${REGISTRY_END}`,
    );

  writeFileSync(REGISTRY_FILE, newContent);
  console.log(`[registry] built with ${entries.length} metrics`);
}

main();
