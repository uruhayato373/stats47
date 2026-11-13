// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const PROJECT_ROOT = resolve(import.meta.dirname, "../../../../../..");

const readSource = (relativePath: string) =>
  readFileSync(resolve(PROJECT_ROOT, relativePath), "utf8");

describe("right rail scroll contract", () => {
  it("ArticleShell uses page scroll instead of an independent rail scroll", () => {
    const source = readSource(
      "apps/web/src/components/layout/ArticleShell.tsx",
    );

    expect(source).not.toContain("overflow-y-auto");
    expect(source).not.toContain("max-h-[calc(100vh");
    // 列幅は PageShell の共通グリッドが所有。カードの実幅・全境界は rail-layout.spec.ts が検査する。
    expect(source).toContain('className={RIGHT_RAIL_GRID_CLASS}');
    expect(source).not.toMatch(/w-\[316px\]|shrink-0/);

    // レールはページと一緒に流れる。追従する領域 (旧 railSticky) を戻さない (2026-09-25)。
    const classStart = source.indexOf("export const ARTICLE_RAIL_CLASS");
    const classSource = source.slice(classStart, source.indexOf(";", classStart));
    expect(classSource).not.toContain("sticky");
    expect(source).not.toContain("railSticky");
    // 右レールは本文の横で本文と同じ高さまで伸びる flex の列。最後に追従する広告 (RailAdSlot の sticky) は親の高さの中でしか
    // 動けず、中身の高さで終わる格子のままでは追従しなかった (2026-11-12 にブログ・ランキング・市区町村のランキングで実測)
    expect(classSource).toContain("rail:self-stretch");
    expect(classSource).toContain("rail:flex-col");
    // flex の列では items-start が横幅を縮めるので、本文の横では子を幅いっぱいに伸ばす (2026-11-13 本番のスモークテストで検出)
    expect(classSource).toContain("rail:items-stretch");
  });

  it("RightRailWidgets cannot opt into an independent rail scroll", () => {
    const source = readSource(
      "apps/web/src/components/rail/RightRailWidgets.tsx",
    );

    expect(source).not.toContain("stickyScroll");
    expect(source).not.toContain("overflow-y-auto");
    expect(source).not.toContain("max-h-[calc(100vh");
  });

  // AreaProfileSidebar は未使用 (どのページからも import されていなかった) だったため、
  // rail UI 契約統一 (RailStack/RailCard 移行) と同時に削除した (features/area-profile/index.ts
  // からも export を除去)。この面の「独立スクロールを作らない」契約は上 2 テスト
  // (ArticleShell / RightRailWidgets) が引き続き守る。CitiesNavCard は固定の高さのスクロールを
  // やめ、先頭だけ並べて残りを <details> で開く形にした (続きがあると気づけなかったため)。
});
