import { spawn } from "node:child_process";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { METRICS_REGISTRY } from "../registry";
import { extractSeoClaims } from "../seo-meta-facts";
import type { MetricConfig } from "../types";

/**
 * `audit-seo-meta-facts.ts --fail-on-new` の終了コードの契約 (CI-TOOLING-FOLLOWUP-02)。
 *
 * R2 から観測値を取れなかった指標は「判定不能」に数えるだけだったので、R2 が応答しない run では
 * 1 件も突合せずに終了コード 0 で通っていた。取得の失敗 (通信エラー・404 以外の応答) は CI を落とす。
 * 404 は落とさない: PR で足した指標の観測値は、マージ後の CI が R2 へ書くまで存在しない。
 */

const REPO_ROOT = resolve(__dirname, "../../../..");
const SCRIPT = "packages/data-configs/scripts/audit-seo-meta-facts.ts";

// 事実の主張がある指標 (主張が無い指標は R2 を読まない)
const TARGET_KEYS = (Object.values(METRICS_REGISTRY) as MetricConfig[])
  .filter((config) => {
    if (!config.isActive || !(config.seoTitle || config.seoDescription)) return false;
    const claims = extractSeoClaims(`${config.seoTitle ?? ""} ${config.seoDescription ?? ""}`, config.unit);
    return claims.ranks.length > 0 || claims.ratio !== null || claims.years.length > 0;
  })
  .slice(0, 3)
  .map((config) => config.key);

let server: Server | undefined;
afterEach(() => new Promise<void>((done) => (server ? server.close(() => done()) : done())));

async function runAudit(status: number): Promise<{ code: number | null; output: string }> {
  server = createServer((_request, response) => {
    response.statusCode = status;
    response.end("{}");
  });
  await new Promise<void>((ready) => server!.listen(0, "127.0.0.1", ready));
  const { port } = server.address() as AddressInfo;
  const child = spawn(
    process.execPath,
    ["--import", "tsx", SCRIPT, "--only", TARGET_KEYS.join(","), "--fail-on-new"],
    { cwd: REPO_ROOT, env: { ...process.env, R2_PUBLIC_FETCH_URL: `http://127.0.0.1:${port}` } },
  );
  let output = "";
  child.stdout.on("data", (chunk) => (output += chunk));
  child.stderr.on("data", (chunk) => (output += chunk));
  const code = await new Promise<number | null>((done) => child.on("close", done));
  return { code, output };
}

describe("audit-seo-meta-facts.ts --fail-on-new", () => {
  it("検査に使う指標を 3 件選べている", () => {
    expect(TARGET_KEYS).toHaveLength(3);
  });

  it("R2 が 503 を返して観測値を取れないときは、終了コード 1 で止める", async () => {
    const { code, output } = await runAudit(503);

    expect(output).toContain("R2 から観測値を取得できなかった指標 3 件");
    expect(code).toBe(1);
  }, 120_000);

  it("R2 に観測値がまだ無い (404) 指標は判定不能に数え、終了コード 0 で通す", async () => {
    const { code, output } = await runAudit(404);

    expect(output).toMatch(/観測値を取れず判定不能: \d/);
    expect(output).not.toContain("R2 から観測値を取得できなかった");
    expect(code).toBe(0);
  }, 120_000);
});
