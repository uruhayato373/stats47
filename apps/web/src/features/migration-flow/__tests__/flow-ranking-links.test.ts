import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { GONE_RANKING_KEYS } from "@/config/gone-ranking-keys";
import { KNOWN_RANKING_KEYS } from "@/config/known-ranking-keys";

/**
 * フローパネル footer の「ランキングを見る」リンク。
 *
 * ★これらは tsx に直書きされており、カタログ (validate-theme-catalog の rankingLink 検査) の
 * 対象外。将来キーが GONE 化・改名されても CI が黙るので、ここで実在を固定する。
 * ソースから抽出して照合するので、tsx 側でキーを書き換えたら自動で追随する。
 */

const FLOW_CLIENTS = [
  "src/features/migration-flow/components/MigrationFlowSectionClient.tsx",
  "src/features/commute-flow/components/CommuteFlowSectionClient.tsx",
];

function extractRankingLinks(relPath: string): string[] {
  const source = readFileSync(path.resolve(process.cwd(), relPath), "utf8");
  return [...source.matchAll(/rankingLink="\/ranking\/([a-z0-9-]+)"/g)].map(
    (m) => m[1],
  );
}

describe("フローパネルの rankingLink", () => {
  for (const relPath of FLOW_CLIENTS) {
    const keys = extractRankingLinks(relPath);

    it(`${path.basename(relPath)}: rankingLink を 1 つ持つ`, () => {
      expect(keys).toHaveLength(1);
    });

    for (const key of keys) {
      it(`${key}: 公開キー (KNOWN) に在る`, () => {
        expect(KNOWN_RANKING_KEYS.has(key)).toBe(true);
      });

      it(`${key}: 410 (GONE) ではない`, () => {
        expect(GONE_RANKING_KEYS.has(key)).toBe(false);
      });
    }
  }
});
