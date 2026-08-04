import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HubSankey } from "../HubSankey";

/**
 * HubSankey の chrome / usableHeight 契約。
 *
 * ★2026-08-04 に人口移動・通勤フローを `ChartPanel` に載せるため `chrome="bare"` を足した。
 * bare は「枠と SVG 内テキストを持たず、見出し・出典を ChartPanel に委ねる」モードで、
 * card (財政フローが使う既定) の挙動は変えていない。両方を固定して非回帰を担保する。
 */

const BASE = {
  title: "テスト県 人口移動フロー（2025年）",
  subtitle: "左: 流入元 → 中央: テスト県 → 右: 流出先",
  centerLabel: "テスト県",
  centerSub: "純移動 +100",
  centerSubColor: "#2563eb",
  leftNodes: [
    { name: "A県", value: 300 },
    { name: "B県", value: 200 },
  ],
  rightNodes: [
    { name: "C県", value: 250 },
    { name: "D県", value: 150 },
  ],
  leftColor: "#2563eb",
  rightColor: "#f59e0b",
  formatValue: (n: number) => String(n),
  footer: "出典: テスト統計",
};

const viewBoxHeight = (container: HTMLElement): number => {
  const vb = container.querySelector("svg")?.getAttribute("viewBox");
  return Number(vb!.split(" ")[3]);
};

describe("HubSankey — chrome", () => {
  it("card (既定): SVG 内に title / subtitle / footer を描き、カード枠で囲む", () => {
    const { container } = render(<HubSankey {...BASE} />);
    const text = container.querySelector("svg")!.textContent ?? "";

    expect(text).toContain(BASE.title);
    expect(text).toContain(BASE.subtitle);
    expect(text).toContain(BASE.footer);
    // 自前のカード枠 (財政フローはこの見た目のまま)
    expect(container.firstElementChild).toHaveClass("border");
  });

  it("bare: title / subtitle / footer を SVG に描かず、カード枠も持たない", () => {
    const { container } = render(<HubSankey {...BASE} chrome="bare" />);
    const text = container.querySelector("svg")!.textContent ?? "";

    expect(text).not.toContain(BASE.title);
    expect(text).not.toContain(BASE.subtitle);
    expect(text).not.toContain(BASE.footer);
    expect(container.firstElementChild).not.toHaveClass("border");
    // 中央ノードのラベルは chrome に関係なく残す (どの県のフローか分からなくなるため)
    expect(text).toContain(BASE.centerLabel);
  });

  it("bare は card より viewBox が低い (テキスト分の余白を詰める)", () => {
    const card = render(<HubSankey {...BASE} />);
    const bare = render(<HubSankey {...BASE} chrome="bare" />);

    expect(viewBoxHeight(bare.container)).toBeLessThan(
      viewBoxHeight(card.container),
    );
  });

  it("aria-label は chrome に関わらず title (SVG のアクセシブル名を失わない)", () => {
    const { container } = render(<HubSankey {...BASE} chrome="bare" />);
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-label",
      BASE.title,
    );
  });
});

describe("HubSankey — usableHeight", () => {
  it("小さくすると viewBox が低くなる (2 カラムで他チャートと縦横比を揃えるため)", () => {
    const tall = render(<HubSankey {...BASE} chrome="bare" />);
    const short = render(<HubSankey {...BASE} chrome="bare" usableHeight={340} />);

    expect(viewBoxHeight(short.container)).toBeLessThan(
      viewBoxHeight(tall.container),
    );
  });
});
