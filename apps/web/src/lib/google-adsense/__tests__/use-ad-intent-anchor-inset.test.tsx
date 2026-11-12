import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { measureAdIntentAnchorInset, useAdIntentAnchorInset } from "../use-ad-intent-anchor-inset";

let pathname: string | null = "/blog/some-article";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

/**
 * 守りたいのは、Cookie 同意の帯が広告インテントのアンカーに重ならないこと (2026-11-11 の本番で下半分が隠れていた)。
 * 広告の側は動かさず、自分たちの部品が避ける高さを測る。
 */
function addAnchor(top: number, height = 50) {
  const el = document.createElement("div");
  el.className = "google-anno-sa";
  el.getBoundingClientRect = () => ({ top, height, bottom: top + height, left: 0, right: 0, width: 300, x: 0, y: top, toJSON: () => ({}) });
  document.documentElement.appendChild(el);
  return el;
}

function Probe() {
  return <output data-testid="inset">{useAdIntentAnchorInset()}</output>;
}

afterEach(() => {
  document.querySelectorAll(".google-anno-sa").forEach((e) => e.remove());
  pathname = "/blog/some-article";
});

describe("measureAdIntentAnchorInset", () => {
  it("アンカーが無ければ 0", () => {
    expect(measureAdIntentAnchorInset(document, 800)).toBe(0);
  });

  it("画面の下に固定されたアンカーは、下端からアンカーの上端までの高さにすき間を足す", () => {
    addAnchor(742); // 800 - 742 = 58
    expect(measureAdIntentAnchorInset(document, 800)).toBe(62);
  });

  it("画面の上側に出たアンカーと、高さ 0 のアンカーは避けない", () => {
    const top = addAnchor(10);
    expect(measureAdIntentAnchorInset(document, 800)).toBe(0);
    top.remove();
    addAnchor(742, 0);
    expect(measureAdIntentAnchorInset(document, 800)).toBe(0);
  });
});

describe("useAdIntentAnchorInset", () => {
  it("ブログの個別記事で、後から差し込まれたアンカーを測る", async () => {
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
    const view = render(<Probe />);
    expect(view.getByTestId("inset").textContent).toBe("0");
    await act(async () => {
      addAnchor(742);
      await Promise.resolve();
    });
    expect(view.getByTestId("inset").textContent).toBe("62");
  });

  it("開いた時点で既にアンカーがあれば、最初の測定で拾う", async () => {
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
    addAnchor(742);
    const view = render(<Probe />);
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    expect(view.getByTestId("inset").textContent).toBe("62");
  });

  it("広告インテントを出さないページでは、アンカーがあっても 0 のまま", async () => {
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
    pathname = "/ranking/total-population";
    addAnchor(742);
    const view = render(<Probe />);
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    expect(view.getByTestId("inset").textContent).toBe("0");
  });
});
