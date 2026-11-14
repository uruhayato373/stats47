/**
 * 共通のクリック監視 (NAV-CLICK-COVERAGE-01・2026-09-26)。
 * 部品ごとの手動計測ではサイト内のページ移動の約 2 割しか記録できていなかったので、既定を「全部送る」に反転した。
 * 守ること: 1 クリック 1 件 / 専用イベントの領域と外部リンクは送らない / 部品側の送信と重ならない / 遷移を止めない。
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { trackNavClick } from "@/lib/analytics/events";

import { NavClickTracker, resolveNavClick } from "../NavClickTracker";

const LOCATION = {
  href: "http://localhost:3000/ranking/foo",
  origin: "http://localhost:3000",
  pathname: "/ranking/foo",
};

function dom(html: string): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = html;
  document.body.appendChild(root);
  return root;
}

describe("resolveNavClick", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("導線名とラベルを外側の data 属性から取る", () => {
    const root = dom(
      '<nav data-nav-surface="blog_toc"><a href="/blog/x#h2" data-nav-label="見出し"><span>目次</span></a></nav>',
    );
    expect(resolveNavClick(root.querySelector("span"), LOCATION)).toEqual({
      label: "見出し",
      href: "/blog/x#h2",
      surface: "blog_toc",
    });
  });

  it("日本語の見出しは文字コードのままにせず送る", () => {
    const root = dom('<nav data-nav-surface="blog_toc"><a href="#上位と下位" data-nav-label="上位と下位">上位と下位</a></nav>');
    expect(resolveNavClick(root.querySelector("a"), LOCATION)?.href).toBe("/ranking/foo#上位と下位");
  });

  it("導線名が無ければ unlabeled、ラベルは行き先のページ種別", () => {
    const root = dom('<a href="/themes/aging?pref=13000">テーマ</a>');
    expect(resolveNavClick(root.querySelector("a"), LOCATION)).toEqual({
      label: "themes",
      href: "/themes/aging?pref=13000",
      surface: "unlabeled",
    });
  });

  it("専用イベントの領域・外部リンク・導線名の無い同じページ内の移動は送らない", () => {
    const root = dom(
      '<div data-click-owner="rail"><a id="a" href="/ranking/bar">関連</a></div>' +
        '<a id="b" href="https://example.com/">外部</a>' +
        '<a id="c" href="#section">節へ</a>',
    );
    for (const id of ["a", "b", "c"]) {
      expect(resolveNavClick(root.querySelector(`#${id}`), LOCATION)).toBeNull();
    }
  });

  it("行き先の無いボタン代わりのリンク (href=\"#\"。地図の拡大・縮小など) は、導線名が無ければ送らない", () => {
    // Leaflet の拡大・縮小は <a href="#" role="button">。押してもページは移らないのに、
    // 今いるページへの移動として unlabeled で数えていた (2026-11-14 に /geo の各分析ページの HTML で確認)
    const root = dom(
      '<a id="zoom" class="leaflet-control-zoom-in" href="#" role="button"><span>+</span></a>' +
        '<nav data-nav-surface="blog_toc"><a id="named" href="#">先頭へ</a></nav>' +
        '<a id="self" href="/ranking/foo">このページ</a>',
    );
    expect(resolveNavClick(root.querySelector("#zoom span"), LOCATION)).toBeNull();
    // 導線名が付いていれば、目次と同じく数える
    expect(resolveNavClick(root.querySelector("#named"), LOCATION)?.surface).toBe("blog_toc");
    // パスで書かれた今のページへのリンクは、これまでどおり数える
    expect(resolveNavClick(root.querySelector("#self"), LOCATION)?.surface).toBe("unlabeled");
  });

  it("/api/ へのリンク (CSV のダウンロードなど) はページの移動ではないので送らない", () => {
    // 2026-W44 の nav-click-surfaces.csv で unlabeled × api が 705 件あった。サイト内で <a href> が /api/ を指すのは
    // DataUsageCard のダウンロードで、これは csv_download で数えている (CONTENT-FOLLOWUP-01)
    const root = dom(
      '<a id="csv" href="/api/ranking/foo/download?format=csv&amp;basis=original">ダウンロード</a>' +
        '<nav data-nav-surface="ranking_data"><a id="named" href="/api/ranking/foo/download?format=csv">CSV</a></nav>' +
        '<a id="apis" href="/apis-guide">API の案内</a>',
    );
    expect(resolveNavClick(root.querySelector("#csv"), LOCATION)).toBeNull();
    expect(resolveNavClick(root.querySelector("#named"), LOCATION)).toBeNull();
    // 「/api」で始まる別のページは数える
    expect(resolveNavClick(root.querySelector("#apis"), LOCATION)?.label).toBe("apis-guide");
  });
});

describe("NavClickTracker", () => {
  const gtag = vi.fn();
  beforeEach(() => {
    vi.useFakeTimers();
    gtag.mockReset();
    (window as unknown as { gtag: typeof gtag }).gtag = gtag;
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  const navClicks = () => gtag.mock.calls.filter(([, name]) => name === "nav_click");

  it("計測の無いリンクは 1 クリックで 1 件送り、クリックを止めない", () => {
    render(<NavClickTracker />);
    const root = dom('<a href="/areas/13000">東京都</a>');
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    act(() => {
      root.querySelector("a")!.dispatchEvent(event);
      vi.runAllTimers();
    });
    expect(navClicks()).toHaveLength(1);
    expect(navClicks()[0][2]).toMatchObject({ nav_surface: "unlabeled", nav_href: "/areas/13000" });
    expect(event.defaultPrevented).toBe(false);
  });

  it("部品側が同じクリックで trackNavClick を送ったら重ねて送らない", () => {
    render(<NavClickTracker />);
    const root = dom('<a href="/ranking/foo2">部品で計測</a>');
    const anchor = root.querySelector("a")!;
    anchor.addEventListener("click", () =>
      trackNavClick({ label: "x", href: "/ranking/foo2", surface: "theme_ranking" }),
    );
    act(() => {
      anchor.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      vi.runAllTimers();
    });
    expect(navClicks()).toHaveLength(1);
    expect(navClicks()[0][2]).toMatchObject({ nav_surface: "theme_ranking" });
  });
});
