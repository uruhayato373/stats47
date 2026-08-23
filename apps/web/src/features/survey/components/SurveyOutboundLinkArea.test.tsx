import Link from "next/link";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SurveyOutboundLinkArea } from "./SurveyOutboundLinkArea";

const { trackNavClick } = vi.hoisted(() => ({ trackNavClick: vi.fn() }));

vi.mock("@/lib/analytics/events", () => ({ trackNavClick }));

describe("SurveyOutboundLinkArea", () => {
  it("survey から遷移先への taxonomy surface と id を送る", () => {
    render(
      <SurveyOutboundLinkArea surface="survey_theme">
        <Link href="/themes/population" onClick={(event) => event.preventDefault()}>
          人口テーマ
        </Link>
      </SurveyOutboundLinkArea>,
    );

    fireEvent.click(screen.getByRole("link", { name: "人口テーマ" }));

    expect(trackNavClick).toHaveBeenCalledWith({
      label: "population",
      href: "/themes/population",
      surface: "survey_theme",
    });
  });
});
