import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * server.ts が canvas / tokml に依存する ./export を再エクスポートしていないことを検証する。
 * webpack (Next.js ビルド) で .node バイナリのパースエラーが発生するのを防ぐ。
 */
describe("packages/gis/src/server.ts", () => {
  const serverTs = readFileSync(resolve(__dirname, "../server.ts"), "utf-8");

  it("should not re-export from ./export (canvas/tokml dependency)", () => {
    // from "./export" や from './export' を検出
    const hasExportImport = /from\s+["']\.\/export["']/.test(serverTs);
    expect(hasExportImport, 'server.ts must not re-export from "./export" — use @stats47/gis/export instead').toBe(false);
  });
});
