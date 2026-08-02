import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const PROJECT_ROOT = resolve(import.meta.dirname, "../../../../../..");

function source(path: string): string {
  return readFileSync(resolve(PROJECT_ROOT, path), "utf8");
}

describe("ranking map performance contract", () => {
  it("does not request raster base tiles that become the ranking page LCP", () => {
    const rankingMap = source(
      "apps/web/src/features/ranking/components/RankingMapChart/RankingMapChartClient.tsx",
    );
    expect(rankingMap).not.toContain("tileUrl=");
    expect(rankingMap).not.toContain("<TileSwitcher");
  });

  it("keeps base tiles optional for map features that still need geographic context", () => {
    const sharedMap = source(
      "packages/visualization/src/leaflet/components/LeafletChoroplethMap.tsx",
    );
    expect(sharedMap).toContain(
      '{tileUrl && <TileLayer url={tileUrl} attribution={attribution ?? ""} />}',
    );
  });
});
