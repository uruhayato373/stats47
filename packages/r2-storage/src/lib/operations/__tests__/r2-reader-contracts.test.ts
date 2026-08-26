import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

interface ReaderContract {
  id: string;
  sourceFiles: string[];
  criticality: "critical" | "high";
  runtimeParsers: string[];
  missingBehavior: "no-data";
  fallback: string;
  owner: string;
}

const root = process.cwd();
const inventoryPath = path.join(root, ".claude/config/r2-reader-contracts.json");
const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8")) as {
  version: number;
  contracts: ReaderContract[];
};

const REQUIRED = [
  "stats-r2",
  "ranking-items",
  "ranking-values",
  "page-components",
  "categories",
  "area-profile",
  "area-databook",
  "correlations",
];

describe("public R2 reader contract inventory", () => {
  it("優先consumerをowner/fallback/runtime parser付きで全件棚卸しする", () => {
    expect(inventory.version).toBe(1);
    expect(inventory.contracts.map((entry) => entry.id).sort()).toEqual([...REQUIRED].sort());
    for (const entry of inventory.contracts) {
      expect(entry.owner).not.toBe("");
      expect(entry.fallback).not.toBe("");
      expect(entry.runtimeParsers.length).toBeGreaterThan(0);
      expect(entry.missingBehavior).toBe("no-data");
    }
  });

  it("登録consumerはruntime parserを実配線し、typed generic JSON境界を持たない", () => {
    for (const entry of inventory.contracts) {
      const source = entry.sourceFiles.map((file) => {
        const absolute = path.join(root, file);
        expect(fs.existsSync(absolute), `${entry.id}: ${file}`).toBe(true);
        return fs.readFileSync(absolute, "utf8");
      }).join("\n");
      for (const parser of entry.runtimeParsers) {
        expect(source, `${entry.id}: ${parser} が未配線`).toContain(parser);
      }
      expect(source, `${entry.id}: typed generic JSON boundary`).not.toMatch(
        /fetchFromR2AsJson\s*<\s*(?!unknown\b)[^>]+>/,
      );
    }
  });
});
