/**
 * 「観測値ゼロ」アラームの感度を固定する (2026-07-31)。
 *
 * このアラームが守りたいのは「**公開されているのにチャートが空のページ**」。
 * 全 PASS はゲートが何も見ていない状態と区別がつかないので、
 * 発火する側と発火しない側を両方固定する。
 */
import { describe, expect, it } from "vitest";

import { selectUnexpectedEmpties } from "../empty-values-alarm";

const never = () => false;

describe("selectUnexpectedEmpties", () => {
  it("★公開中の metric が 0 件なら検出する (空ページが本番に出ている状態)", () => {
    expect(
      selectUnexpectedEmpties([{ key: "published-but-empty", isActive: true }], never),
    ).toEqual(["published-but-empty"]);
  });

  it("★未公開 (isActive:false) は検出しない — 観測値が無いのが正しい状態", () => {
    // 実測 2026-07-31: prefectural-income-per-capita (statsDataId が TBD) と
    // station-passengers-annual-total (配信は app/station-passengers 側) で
    // 全件 refresh が exit 1 になった。どちらも未公開のプレースホルダ。
    expect(
      selectUnexpectedEmpties(
        [
          { key: "prefectural-income-per-capita", isActive: false },
          { key: "station-passengers-annual-total", isActive: false },
        ],
        never,
      ),
    ).toEqual([]);
  });

  it("EXPECTED_EMPTY に登録済みなら公開中でも検出しない", () => {
    expect(
      selectUnexpectedEmpties(
        [{ key: "allowlisted", isActive: true }],
        (key) => key === "allowlisted",
      ),
    ).toEqual([]);
  });

  it("公開中と未公開が混在しても公開中だけを返す", () => {
    expect(
      selectUnexpectedEmpties(
        [
          { key: "draft", isActive: false },
          { key: "live", isActive: true },
          { key: "live-allowed", isActive: true },
        ],
        (key) => key === "live-allowed",
      ),
    ).toEqual(["live"]);
  });

  it("mutation: isActive の絞り込みを外すと未公開まで拾ってしまう", () => {
    const withoutActiveFilter = (candidates: { key: string; isActive: boolean }[]) =>
      candidates.filter((c) => !never()).map((c) => c.key);
    const candidates = [{ key: "draft", isActive: false }];
    expect(withoutActiveFilter(candidates)).toEqual(["draft"]);
    expect(selectUnexpectedEmpties(candidates, never)).toEqual([]);
  });
});
