/**
 * 広告のセルの表記の契約 (2026-11-25 オーナー決定)。
 *
 * - AdSense のセルは「広告」の文字を出さない (Google の規約は表記を義務づけていない:
 *   support.google.com/adsense/answer/1346295・2026-11-25 確認)。計測と撮影の目印 data-ad-cell は残す
 * - アフィリエイトのセルの「PR」は景品表示法のステマ告示の表示なので、必ず出す
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdCell } from "../AdCell";

describe("AdCell の表記", () => {
  it("AdSense のセルは「広告」の文字を出さず、目印の属性だけを持つ", () => {
    const { container } = render(<AdCell label="広告"><div>ad</div></AdCell>);
    expect(screen.queryByText("広告")).toBeNull();
    expect(container.querySelector('[data-ad-cell="広告"]')).not.toBeNull();
  });

  it("アフィリエイトのセルは「PR」を必ず出す", () => {
    render(<AdCell label="PR"><div>banner</div></AdCell>);
    expect(screen.getByText("PR")).toBeInTheDocument();
  });
});
