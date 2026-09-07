import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const entry = resolve(root, "packages/product-factory/src/channels/kindle/export-kdp-listings.ts");
const publication = resolve(root, ".claude/config/kdp-listings.json");
const CLI_TIMEOUT_MS = 60_000;

describe("KDP revision preparation cannot overwrite publication history", () => {
  it("rejects apply, missing/unsafe versions, and incomplete editions without changing the ledger", () => {
    const before = readFileSync(publication);
    const version = "absent-test-edition-9f423";
    for (const args of [["--apply"], [], ["--version", "../v1"], ["--version", version]]) {
      const result = spawnSync(process.execPath, ["--import", "tsx", entry, ...args], {
        cwd: root, encoding: "utf8", timeout: CLI_TIMEOUT_MS,
      });
      expect(result.status).not.toBe(0);
      expect(result.error).toBeUndefined();
      expect(readFileSync(publication).equals(before)).toBe(true);
    }
    expect(existsSync(resolve(root, ".local/kindle-listing-revisions", `${version}.json`))).toBe(false);
  }, 180_000);
});
