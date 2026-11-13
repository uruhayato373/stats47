import { describe, expect, it } from "vitest";

import { buildEstatProvenance } from "./build-estat-provenance-index";
import estatProvenanceJson from "./estat-provenance.generated.json";

/**
 * estat-provenance.generated.json は指標の定義 (data/metrics) から作る派生物。指標を足したり出典を変えたりして
 * 作り直し忘れると古い写しが残り、出典の解決が静かにずれる (2026-11-12 に 1 度起き、1875fe7fa で直した)。
 * 指標の定義から作り直した結果と食い違えば落とす。直し方は下のメッセージのとおり。
 */
const REGEN = "cd packages/data-configs && npx tsx scripts/ssds/build-estat-provenance.ts";

describe("estat-provenance.generated.json は指標の定義と同期している", () => {
  const { index } = buildEstatProvenance();
  const committed = estatProvenanceJson as typeof index;

  it("SSDS の統計表 ID の一覧が一致する", () => {
    expect(committed.ssdsTableIds, `古くなっている。作り直す: ${REGEN}`).toEqual(index.ssdsTableIds);
  });

  it("statsDataId から調査への対応が一致する", () => {
    expect(committed.statsDataIdToSurvey, `古くなっている。作り直す: ${REGEN}`).toEqual(index.statsDataIdToSurvey);
  });

  it("検査が空振りしていない (統計表と対応が多数ある)", () => {
    expect(index.ssdsTableIds.length).toBeGreaterThan(10);
    expect(Object.keys(index.statsDataIdToSurvey).length).toBeGreaterThan(50);
  });
});
