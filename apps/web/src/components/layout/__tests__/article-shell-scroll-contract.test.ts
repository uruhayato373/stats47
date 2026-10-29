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
    // 幅も含めて完全一致で固定する。scroll を有効化するクラスの混入を防ぐのが主目的だが、
    // 寸法を変える変更もここで一度止まるので、意図した変更かを必ず確認できる
    // 316px は PageShell と共通。300×250 バナーは Card なしで等倍表示する。
    // 本文の下に積んだときは 640px 以上で 2 列の格子 (2026-10-29)。
    expect(source).toContain(
      "'mt-4 grid grid-cols-1 items-start gap-4 @min-[640px]/shell:grid-cols-2 @min-[988px]/shell:mt-0 @min-[988px]/shell:flex @min-[988px]/shell:flex-col @min-[988px]/shell:w-[316px] @min-[988px]/shell:shrink-0 @min-[988px]/shell:self-stretch @min-[988px]/shell:gap-3'",
    );
    expect(source).toContain("<aside className={ARTICLE_RAIL_CLASS}>{rail}</aside>");

    // レールはページと一緒に流れる。追従する領域 (旧 railSticky) を戻さない (2026-09-25)。
    const classStart = source.indexOf("export const ARTICLE_RAIL_CLASS");
    const classSource = source.slice(classStart, source.indexOf(";", classStart));
    expect(classSource).not.toContain("sticky");
    expect(source).not.toContain("railSticky");
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
