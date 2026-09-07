import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Cloudflare Workers Static Assets の `_headers` 契約。
 *
 * 経緯: hashed な `/_next/static/*` が `public, max-age=0, must-revalidate` で配信され、
 * ブラウザが毎ナビゲーションで 304 再検証していた (2026-08-05 実測)。内容ハッシュ付き
 * URL は中身が変わらないので immutable にできる。
 *
 * このテストは「対象を広げない」ことを守る。ハッシュを持たない URL を immutable に
 * すると、デプロイしても最大 1 年ぶん古い資産が配信され続ける。
 *
 * 仕様: https://developers.cloudflare.com/workers/static-assets/headers/ (アクセス 2026-08-05)
 */

const HEADERS_FILE = resolve(import.meta.dirname, "../../public/_headers");

function headerRules(content: string): Map<string, string[]> {
  const rules = new Map<string, string[]>();
  let headers: string[] = [];
  for (const line of content.split("\n")) {
    if (line.startsWith("/")) {
      headers = [];
      rules.set(line.trim(), headers);
    } else if (/^\s+\S/.test(line) && !line.trim().startsWith("#")) {
      headers.push(line.trim());
    }
  }
  return rules;
}

describe("_headers (Workers static assets)", () => {
  const content = readFileSync(HEADERS_FILE, "utf8");
  const rules = headerRules(content);

  it("hashed static asset を 1 年 immutable にする", () => {
    expect(rules.get("/_next/static/*")).toContain(
      "Cache-Control: public, max-age=31536000, immutable"
    );
  });

  it("ハッシュを持たない URL へ immutable を広げない", () => {
    // 増やすときは「その URL は内容が変わっても名前が変わらないか」を必ず確認する
    const immutablePaths = [...rules]
      .filter(([, headers]) =>
        headers.some((header) => /\bimmutable\b/i.test(header))
      )
      .map(([path]) => path);
    expect(immutablePaths).toEqual(["/_next/static/*"]);
  });

  it("非ハッシュの地図には Content-Type のみを補い、長期キャッシュを付けない", () => {
    expect(rules.get("/prefecture.topojson")).toEqual([
      "Content-Type: application/json; charset=utf-8",
    ]);
  });

  it("Cloudflare の制約 (splat は 1 URL につき 1 つ) を満たす", () => {
    for (const path of rules.keys()) {
      expect((path.match(/\*/g) ?? []).length).toBeLessThanOrEqual(1);
    }
  });
});
