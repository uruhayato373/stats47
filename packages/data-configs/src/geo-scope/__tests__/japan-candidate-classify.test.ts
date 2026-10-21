import { describe, expect, it } from "vitest";

import { requestKey } from "../../source-coordinate";
import {
  classifyEstatRequest,
  indexNationalEvidence,
  VERIFY_TARGET_CLASSIFICATIONS,
} from "../japan-candidate-classify";

describe("japan candidate classification", () => {
  it("今の live audit の R2 監査行 (params なし) で落ちず、旧形式の e-Stat 行だけを全国行の証拠にする", () => {
    const index = indexNationalEvidence([
      { kind: "r2" },
      { params: { statsDataId: "0000010101", cdCat01: "A1101" }, hasNational: true },
      { params: { statsDataId: "0000010102" }, hasNational: false },
      { params: { statsDataId: "0000010103" } },
    ]);
    expect([...index.entries()]).toEqual([
      [requestKey({ statsDataId: "0000010101", filters: { cdCat01: "A1101" } }), true],
      [requestKey({ statsDataId: "0000010102", filters: {} }), false],
    ]);
  });

  it("全国行の有無で official-candidate / unsupported に分け、証拠が無ければ verify へ回す", () => {
    const index = new Map([["A", true], ["B", false]]);
    expect(classifyEstatRequest("A", index).classification).toBe("official-candidate");
    expect(classifyEstatRequest("B", index).classification).toBe("unsupported");
    const unknown = classifyEstatRequest("C", index);
    expect(unknown).toMatchObject({ classification: "unknown-no-audit-entry", hasNational: null });
    expect(VERIFY_TARGET_CLASSIFICATIONS).toContain(unknown.classification);
    expect(VERIFY_TARGET_CLASSIFICATIONS).not.toContain("unsupported");
  });
});
