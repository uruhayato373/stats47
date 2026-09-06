import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const script = resolve(import.meta.dirname, "../scripts/verify-epub.mts");

describe("Kindle edition verification CLI safety", () => {
  it("rejects the retired publication-state mutation before building anything", () => {
    const result = spawnSync(process.execPath, ["--import", "tsx", resolve(import.meta.dirname, "../scripts/verify-publishable.mts"), "--apply"], { encoding: "utf8" });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("--apply is retired");
    expect(result.stdout).toBe("");
  });
  it("rejects a traversal version before reading EPUBs", () => {
    const result = spawnSync(process.execPath, ["--import", "tsx", script, "--version", "../v1", "--json"], {
      encoding: "utf8",
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Unsafe book version");
    expect(result.stdout).toBe("");
  });

  it("rejects a missing version argument rather than silently using v1", () => {
    const result = spawnSync(process.execPath, ["--import", "tsx", script, "--version", "--json"], {
      encoding: "utf8",
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("--version requires a value");
    expect(result.stdout).toBe("");
  });
});
