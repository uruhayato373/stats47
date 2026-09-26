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
    expect(source).toContain(
      'className="hidden w-[316px] shrink-0 lg:flex lg:self-stretch lg:flex-col lg:gap-3"',
    );

    // レールはページと一緒に流れる。追従する領域 (旧 railSticky) を戻さない (2026-09-25)。
    const asideStart = source.indexOf('<aside className="hidden w-[316px]');
    const asideEnd = source.indexOf('</aside>', asideStart);
    const asideSource = source.slice(asideStart, asideEnd);
    expect(asideSource).not.toContain("sticky");
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
  // (ArticleShell / RightRailWidgets) が引き続き守る。CitiesNavCard 等の一覧グリッドが持つ
  // `max-h-72` + `overflow-y-auto` は都道府県内市区町村グリッドの意図的な折りたたみ表示であり、
  // ここで禁止している「レール全体を覆う独立スクロール」とは別物のため対象外とする。
});
