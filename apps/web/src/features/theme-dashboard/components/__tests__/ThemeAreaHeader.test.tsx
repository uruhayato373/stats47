import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ThemeAreaHeader } from "../ThemeAreaHeader";
import { ThemePrefectureProvider } from "../ThemePrefectureContext";

describe("ThemeAreaHeader", () => {
  it("都道府県名を含むH1だけを表示し、説明文を重ねない", () => {
    const { container } = render(
      <ThemePrefectureProvider initialAreaCode="28000" initialAreaName="兵庫県">
        <ThemeAreaHeader themeTitle="教育・文化" />
      </ThemePrefectureProvider>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "兵庫県の教育・文化" }),
    ).toBeInTheDocument();
    expect(container.querySelector("header p")).toBeNull();
  });
});
