import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AiContentAccordion } from "../components/AiContentAccordion";
import { AiInsightCard } from "../components/AiInsightCard";

describe("ランキング本文の共通開閉UI", () => {
  it("AI考察をSSR可能なネイティブdetailsで表示する", () => {
    const { container } = render(
      <AiInsightCard title="データの考察">
        <p>考察本文</p>
      </AiInsightCard>,
    );

    expect(screen.getByRole("heading", { level: 2, name: "データの考察" })).toHaveClass(
      "text-sm",
    );
    expect(screen.getByText("考察本文")).toBeInTheDocument();
    expect(container.querySelectorAll("details")).toHaveLength(1);
    expect(container.textContent).not.toContain("▼");
  });

  it("AIサブ節も同じ開閉契約を再利用する", () => {
    const { container } = render(
      <AiContentAccordion title="地域別の傾向">地域別本文</AiContentAccordion>,
    );

    expect(screen.getByRole("heading", { level: 2, name: "地域別の傾向" })).toBeInTheDocument();
    expect(container.querySelector("[data-slot='disclosure-icon']")).not.toBeNull();
  });
});

describe("移行対象が独自アコーディオンへ戻らない", () => {
  const targets = [
    "src/features/ranking/components/RankingFaqSection.tsx",
    "src/features/ranking/components/AiContentAccordion.tsx",
    "src/features/ranking/components/AiInsightCard.tsx",
    "src/features/ranking/components/RankingDefinitionCard/index.tsx",
    "src/components/stat-charts/components/cards/DefinitionsCard.tsx",
  ];

  for (const target of targets) {
    it(target, () => {
      const source = readFileSync(resolve(process.cwd(), target), "utf8");
      expect(source).toMatch(/@\/components\/content/);
      expect(source).not.toContain("@radix-ui/react-accordion");
      expect(source).not.toContain("▼");
      expect(source).not.toContain("text-lg");
    });
  }
});
