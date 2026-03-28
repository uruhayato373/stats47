import { describe, expect, it } from "vitest";

import { addLineBreaksAfterPeriod } from "../add-line-breaks";

describe("addLineBreaksAfterPeriod", () => {
  it("句点の後に改行を挿入する", () => {
    const input = "最初の文。次の文。";
    const result = addLineBreaksAfterPeriod(input);

    expect(result).toBe("最初の文。\n次の文。\n");
  });

  it("すでに改行がある句点には重複挿入しない", () => {
    const input = "最初の文。\n次の文。";
    const result = addLineBreaksAfterPeriod(input);

    expect(result).toBe("最初の文。\n次の文。\n");
  });

  it("句点がない場合はそのまま返す", () => {
    const input = "句点なしのテキスト";
    const result = addLineBreaksAfterPeriod(input);

    expect(result).toBe("句点なしのテキスト");
  });

  it("空文字列はそのまま返す", () => {
    const result = addLineBreaksAfterPeriod("");

    expect(result).toBe("");
  });
});
