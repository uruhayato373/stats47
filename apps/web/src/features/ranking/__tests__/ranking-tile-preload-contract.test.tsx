import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RankingPageHeadAssets } from "../components/RankingKeyPage/RankingPageHeadAssets";

const PROJECT_ROOT = resolve(import.meta.dirname, "../../../../../..");
const LAYOUT = "apps/web/src/app/layout.tsx";

/**
 * ランキング地図タイルの preload 契約。
 *
 * 経緯: 2026-08-05 の Chrome DevTools trace (412x915 / Slow 4G / CPU 4x) で、
 * `/ranking/total-population` のモバイル LCP は 5,853ms、うち load delay が 5,835ms を
 * 占めていた。LCP 要素は先頭タイル `/tiles/light_all/5/28/12@2x.png` そのものだが、
 * preload 4 枚すべてに `media="(min-width: 1024px)"` が付いており、モバイルでは
 * どのタイルも先読みされず初期 document から発見できなかった。
 *
 * このテストは「先頭 1 枚だけ全 viewport・残りは desktop 限定」を固定する。
 * media を全枚に戻す変更も、逆に 4 枚すべてをモバイルへ先読みする変更もここで落ちる。
 */
describe("ranking tile preload contract", () => {
  const tileUrls = [
    "/tiles/light_all/5/28/12@2x.png",
    "/tiles/light_all/5/29/12@2x.png",
    "/tiles/light_all/5/28/13@2x.png",
    "/tiles/light_all/5/29/13@2x.png",
  ];

  function preloadLinks(): string[] {
    const html = renderToStaticMarkup(
      <RankingPageHeadAssets
        structuredData={{}}
        breadcrumbStructuredData={{}}
        faqStructuredData={null}
        initialTileUrls={tileUrls}
      />,
    );
    return [...html.matchAll(/<link[^>]*rel="preload"[^>]*>/g)].map((m) => m[0]);
  }

  it("preloads every initial tile", () => {
    expect(preloadLinks()).toHaveLength(tileUrls.length);
  });

  it("discovers the LCP tile on every viewport", () => {
    const first = preloadLinks()[0];
    expect(first).toContain(tileUrls[0]);
    // media を付けるとモバイルで先読みされず load delay に戻る
    expect(first).not.toContain("media=");
    expect(first.toLowerCase()).toContain('fetchpriority="high"');
  });

  it("keeps the remaining tiles desktop-only", () => {
    const rest = preloadLinks().slice(1);
    expect(rest).toHaveLength(3);
    for (const link of rest) {
      expect(link).toContain('media="(min-width: 1024px)"');
      expect(link.toLowerCase()).not.toContain('fetchpriority="high"');
    }
  });
});

/**
 * タイルは同一 origin の /tiles/* proxy で配信される。cartocdn への接続 hint は
 * 実際の接続先と一致せず、2026-08-05 に削除した。復活させるなら cartocdn を
 * 実際に叩く実装とセットで戻す。
 */
describe("stale tile CDN hints", () => {
  it("does not preconnect to a CDN the browser never contacts", () => {
    expect(readFileSync(resolve(PROJECT_ROOT, LAYOUT), "utf8")).not.toContain(
      "cartocdn.com",
    );
  });
});
