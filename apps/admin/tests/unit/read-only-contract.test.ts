import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const adminRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function filesUnder(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(full) : [full];
  });
}

describe("admin read-only contract", () => {
  it("API routeはGETだけを公開する", () => {
    const violations = filesUnder(path.join(adminRoot, "app/api"))
      .filter((file) => file.endsWith("route.ts"))
      .flatMap((file) => {
        const source = fs.readFileSync(file, "utf8");
        return /export\s+(?:async\s+)?function\s+(POST|PATCH|PUT|DELETE)|export\s+const\s+(POST|PATCH|PUT|DELETE)/.test(
          source,
        )
          ? [path.relative(adminRoot, file)]
          : [];
      });
    expect(violations).toEqual([]);
  });

  it("clientに書き込みhelperと実行endpointを持たない", () => {
    const clientFiles = filesUnder(path.join(adminRoot, "components")).filter((file) =>
      file.endsWith(".tsx"),
    );
    const violations = clientFiles.flatMap((file) => {
      const source = fs.readFileSync(file, "utf8");
      return /apiSend|\/api\/actions\/|\/api\/buzz-map\/actions\//.test(source)
        ? [path.relative(adminRoot, file)]
        : [];
    });
    expect(violations).toEqual([]);
  });

  it("server層に子プロセス起動・ファイル書き込みadapterを持たない", () => {
    const serverFiles = filesUnder(path.join(adminRoot, "lib/server")).filter((file) =>
      file.endsWith(".ts"),
    );
    const forbidden =
      /node:child_process|from\s+["']child_process["']|\bspawn\s*\(|\bexecFile\s*\(|\bwriteFile(?:Sync)?\s*\(|\bappendFile(?:Sync)?\s*\(|\bupdateById\s*\(|\binsert\s*\(/;
    const violations = serverFiles.flatMap((file) =>
      forbidden.test(fs.readFileSync(file, "utf8")) ? [path.relative(adminRoot, file)] : [],
    );
    expect(violations).toEqual([]);
  });
});
