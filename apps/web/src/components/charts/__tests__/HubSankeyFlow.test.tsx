import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CommuteSankey } from "@/features/commute-flow/components/CommuteSankey";
import { MigrationSankey } from "@/features/migration-flow/components/MigrationSankey";

/**
 * HubSankeyFlow の契約: 通勤・人口移動の 2 つの Sankey は文言だけが違い、
 * 上位 8 件 + その他・集計キャプション・状態表示は共通の包み部品が持つ (2026-11-03 に統合)。
 */

// 10 県: 上位 8 件 + 「その他2県」に畳まれる
const partners = Array.from({ length: 10 }, (_, i) => ({
  code: String(i + 1).padStart(2, "0"),
  name: `P${i + 1}県`,
  inflow: 100 * (i + 1),
  outflow: 50 * (i + 1),
  net: 50 * (i + 1),
}));

const base = {
  focusCode: "13",
  focusName: "東京都",
  year: 2020,
  source: "test",
  partners,
  totals: { inflow: 5500, outflow: 2750, net: 2750 },
};

describe("HubSankeyFlow", () => {
  it("通勤フローは通勤の文言で集計キャプションを描く", () => {
    const { container } = render(<CommuteSankey code="13" initialData={base} />);
    expect(container.querySelector("p")?.textContent).toBe(
      "2020年・左=流入（他県に住み通勤） / 右=流出（他県へ通勤）（上位8＋その他）。流入 5,500／流出 2,750／昼間純流入 +2,750",
    );
    expect(screen.getAllByText(/その他2県/).length).toBeGreaterThan(0);
  });

  it("人口移動フローは人口移動の文言で集計キャプションを描く", () => {
    const { container } = render(<MigrationSankey code="13" initialData={base} />);
    expect(container.querySelector("p")?.textContent).toBe(
      "2020年・左=流入元 / 右=流出先（上位8＋その他）。総流入 5,500／総流出 2,750／純 +2,750",
    );
  });
});
