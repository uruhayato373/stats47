import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../../../", import.meta.url));
test("selection commands emit only JSON, never ingest/write or call the live API", () => {
  const dir = mkdtempSync(join(tmpdir(), "estat-selection-cli-"));
  try {
    const fixture = join(dir, "transport.mjs");
    writeFileSync(fixture, `
      import { readFileSync } from "node:fs";
      const ledger = JSON.parse(readFileSync(${JSON.stringify(join(root, "data/estat/table-snapshots.json"))}, "utf8"));
      globalThis.fetch = async (url, options) => {
        if (options.method !== "GET") throw new Error("Unexpected mutation");
        const key = new URL(url).pathname;
        const shard = key.match(/^\\/estat-catalog\\/index\\/tables\\/(\\d+)\\.json$/);
        if (shard) return Response.json(ledger.tables.filter(t => t.statCode === shard[1]).map(t => ({ statsDataId: t.statsDataId, updatedDate: t.catalogVersion })));
        if (key === "/app/stats/accountant-annual-income/values.json") return Response.json({meta:{recipe:{configHash:"old"}}});
        throw new Error("Unexpected network input: " + key);
      };
    `);
    for (const [script, args] of [
      ["estat-refresh-selection.ts", ["--metric", "accountant-annual-income"]],
      ["page-data-batch.ts", ["--select-only", "--metric", "accountant-annual-income"]],
      ["estat-table-snapshot.ts", ["--check-updates"]],
    ]) {
      const result = spawnSync(process.execPath, ["--import", "tsx", "--import", fixture, `packages/data-configs/scripts/${script}`, ...args], {
        cwd: root, encoding: "utf8", timeout: 30_000,
      });
      assert.equal(result.status, 0, result.stderr);
      const output = JSON.parse(result.stdout);
      if (script === "estat-table-snapshot.ts") assert.deepEqual(output, []);
      else {
        assert.deepEqual(output.metricKeys, ["accountant-annual-income"]);
        assert.equal(output.reasons[0].configHashChanged, true);
      }
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
