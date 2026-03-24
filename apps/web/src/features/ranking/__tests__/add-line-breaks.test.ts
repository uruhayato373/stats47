import { describe, expect, it } from "vitest";

import { addLineBreaksAfterPeriod } from "../utils/add-line-breaks";

describe("addLineBreaksAfterPeriod", () => {
  it("「。」の後に改行を挿入する", () => {
    expect(addLineBreaksAfterPeriod("テスト文。次の文。")).toBe("テスト文。\n次の文。\n");
  });

  it("既に改行がある場合は追加しない", () => {
    expect(addLineBreaksAfterPeriod("テスト文。\n次の文。\n")).toBe("テスト文。\n次の文。\n");
  });

  it("「。」がない場合はそのまま返す", () => {
    expect(addLineBreaksAfterPeriod("テスト文")).toBe("テスト文");
  });

  it("空文字列はそのまま返す", () => {
    expect(addLineBreaksAfterPeriod("")).toBe("");
  });

  it("末尾の「。」にも改行を挿入する", () => {
    expect(addLineBreaksAfterPeriod("テスト文。")).toBe("テスト文。\n");
  });

  it("連続する「。」を個別に処理する", () => {
    expect(addLineBreaksAfterPeriod("A。B。C。")).toBe("A。\nB。\nC。\n");
  });
});
