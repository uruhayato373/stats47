/**
 * 楽天カードの **実行時 API 呼び出し禁止** を機械強制する契約テスト。
 *
 * 背景 (2026-08-04): 楽天に申告した Expected QPS は 1。一方 deploy-workers.yml の
 * warm-cache は sitemap の全 URL を順に叩くため、ページ描画時に楽天 API を呼ぶ設計だと
 * デプロイのたびに 646 ページ分がバーストする。429 で弾かれてもカードは [] に degrade して
 * 静かに消えるだけで気づけない。そのため日次 cron で R2 に焼き、ページは R2 だけを読む。
 *
 * 規約 (.claude/rules/affiliate-ads-standards.md §12):
 *   **コンポーネントから searchRakutenItems / searchFurusatoItems を直接呼ばないこと。**
 *
 * 文書だけでは次に触る人が戻してしまうため、ここで落とす。
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

// vitest の cwd はモノレポ root なのでテストファイルからの相対で解決する
const COMPONENTS_DIR = resolve(import.meta.dirname, "../components");
const ADS_DIR = resolve(import.meta.dirname, "..");

/** 実行時に楽天 API を叩く関数。取得スクリプト以外から呼んではいけない。 */
const RUNTIME_FORBIDDEN = ["searchRakutenItems", "searchFurusatoItems"];

function listTsx(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".tsx"))
    .sort();
}

describe("楽天カードは実行時に API を叩かない", () => {
  const files = listTsx(COMPONENTS_DIR);

  it("components ディレクトリを列挙できる", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it.each(files)("%s: 楽天 API を直接呼ばない", (file) => {
    const source = readFileSync(join(COMPONENTS_DIR, file), "utf8");
    for (const fn of RUNTIME_FORBIDDEN) {
      // コメント中の言及は許す (行頭が // または * のみの行を除く)
      const code = source
        .split("\n")
        .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
        .join("\n");
      expect(
        code.includes(fn),
        `${file} が ${fn} を呼んでいる。実行時に楽天 API を叩くと Expected QPS=1 に対し ` +
          `deploy 後の warm-cache で 646 ページ分がバーストする。` +
          `repositories/rakuten-snapshot.ts の reader で R2 を読むこと`,
      ).toBe(false);
    }
  });

  it("楽天カード 2 つは R2 reader を使っている", () => {
    for (const file of ["RakutenItemsCard.tsx", "FurusatoNozeiCard.tsx"]) {
      const source = readFileSync(join(COMPONENTS_DIR, file), "utf8");
      expect(source, `${file} が R2 reader を使っていない`).toContain("rakuten-snapshot");
    }
  });

  it("server-only を読むカードは client-safe barrel (index.ts) から export しない", () => {
    // index.ts に残すと client component の module graph に server-only が混入し build が落ちる
    const index = readFileSync(join(ADS_DIR, "index.ts"), "utf8");
    const server = readFileSync(join(ADS_DIR, "server.ts"), "utf8");
    for (const name of ["RakutenItemsCard", "FurusatoNozeiCard"]) {
      expect(
        new RegExp(`export\\s*\\{[^}]*\\b${name}\\b`).test(index),
        `${name} が index.ts から export されている (server.ts へ移すこと)`,
      ).toBe(false);
      expect(server).toContain(name);
    }
  });
});
