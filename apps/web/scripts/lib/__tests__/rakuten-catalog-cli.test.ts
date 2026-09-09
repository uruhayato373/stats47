import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../../../../..");
const run = (script: string, args: string[]) => spawnSync(process.execPath,
  ["--import", "tsx", "-r", "./packages/ranking/src/scripts/setup-cli.js", `apps/web/scripts/${script}.ts`, ...args],
  { cwd: root, encoding: "utf8", timeout: 30000,
    env: { ...process.env, RAKUTEN_APP_ID: "", RAKUTEN_ACCESS_KEY: "", NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID: "" } });
const temporary = () => {
  mkdirSync(join(root, ".local"), { recursive: true });
  return mkdtempSync(join(root, ".local/rakuten-cli-test-"));
};

describe("Rakuten local CLI safety", () => {
  it("--local と --dry-run の併用は書込み前に明示エラーにする", () => {
    const output = temporary();
    const result = run("sync-rakuten-catalog", ["--local", output, "--dry-run"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("--local と --dry-run は併用できません");
    expect(existsSync(join(output, "manifest.json"))).toBe(false);
    expect(existsSync(join(output, "app"))).toBe(false);
  }, 40000);

  it("鍵がない場合は全47県＋指定2品目を未試行として記録しAPI取得を始めない", () => {
    const output = temporary();
    const result = run("sync-rakuten-catalog", ["--terms", "さんま,コーヒー", "--local", output]);
    expect(result.status).toBe(1);
    const manifest = JSON.parse(readFileSync(join(output, "manifest.json"), "utf8"));
    expect(manifest).toMatchObject({ status: "missing-credentials", mode: "local-only", expected: 49,
      complete: false, succeeded: 0, empty: 0, failed: 0, notAttempted: 49 });
  }, 40000);

  it.each([["--local"], ["--local", "--dry-run"], ["--local", "../outside"], ["--limit", "invalid"]])(
    "不完全・範囲外の引数 %j を既定出力へ切り替えず停止する", (...args) => {
      const result = run("sync-rakuten-catalog", args);
      expect(result.status).toBe(1);
      expect(result.stdout).not.toContain("品目 ");
    }, 40000,
  );

  it("オフライン監査は有効な0件とファイル未取得を区別し元の生成時刻を保つ", () => {
    const directory = temporary();
    const input = join(directory, "input");
    const output = join(directory, "output");
    const source = { generatedAt: "2026-09-07T21:53:30.854Z", items: [] };
    for (const code of Array.from({ length: 46 }, (_, i) => `${String(i + 1).padStart(2, "0")}000`)) {
      const file = join(input, `app/rakuten/furusato/${code}.json`);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, JSON.stringify(source));
    }
    const result = run("audit-rakuten-catalog", ["--input-dir", input, "--output-dir", output, "--terms", ""]);
    expect(result.status).toBe(1);
    const audit = JSON.parse(readFileSync(join(output, "audit.json"), "utf8"));
    expect(audit).toMatchObject({ expected: 47, audited: 46, unavailable: 1 });
    expect(audit.results[0]).toMatchObject({ status: "audited", before: 0, after: 0, generatedAt: source.generatedAt });
    expect(audit.results[46]).toMatchObject({ status: "unavailable-or-invalid" });
    expect(JSON.parse(readFileSync(join(output, "filtered/app/rakuten/furusato/01000.json"), "utf8"))).toEqual(source);
  }, 40000);
});
