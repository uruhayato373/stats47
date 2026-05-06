import { config } from "dotenv";
import * as path from "path";
config({ path: path.resolve(__dirname, "..", "..", "..", "..", ".env.local") });

async function main() {
  const { listFromR2WithSize } = await import("../lib/index.js");
  const files = await listFromR2WithSize();
  const prefixes = new Map<string, number>();
  for (const f of files) {
    const prefix = f.key.split('/')[0];
    prefixes.set(prefix, (prefixes.get(prefix) ?? 0) + 1);
  }
  console.log(`Total: ${files.length} files`);
  [...prefixes.entries()].sort((a, b) => a[0].localeCompare(b[0])).forEach(([p, n]) => console.log(`  ${p}  (${n} files)`));
}

main().catch(e => { console.error(e); process.exit(1); });
