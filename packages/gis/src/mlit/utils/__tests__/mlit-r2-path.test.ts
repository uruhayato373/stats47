/**
 * `buildMlitR2Path` の書式検証。
 *
 * 2026-08-17 まで `packages/gis/src/mlit` にはテストが 1 本も無く、`prefCode` を
 * **一切検証せずに** R2 key とローカルのファイルパスへ補間していた
 * (CodeQL の `js/request-forgery` / `js/path-injection` が指していた実バグ)。
 *
 * 両方向を固定する:
 *   - 正常な 2 桁コードで**パスが変わらない** (是正が既存の呼び出しを壊していない)
 *   - 不正な値で throw する (検証が実際に効いている)
 *
 * 正典: `docs/todo/05_機能バックログ.md` の `CODEQL-JS-BACKLOG-01`
 */

import { describe, expect, it } from "vitest";

import { buildMlitR2Path, MLIT_VERSION } from "../mlit-r2-path";

describe("buildMlitR2Path", () => {
  it("prefecture は prefCode を要求しない", () => {
    expect(buildMlitR2Path({ type: "prefecture" })).toBe(
      `gis/mlit/${MLIT_VERSION}/prefecture.topojson`,
    );
  });

  it("allCities は wardMode でファイル名が変わる", () => {
    expect(buildMlitR2Path({ type: "allCities", wardMode: "merged" })).toBe(
      `gis/mlit/${MLIT_VERSION}/jp_city_dc.topojson`,
    );
    expect(buildMlitR2Path({ type: "allCities", wardMode: "split" })).toBe(
      `gis/mlit/${MLIT_VERSION}/jp_city.topojson`,
    );
  });

  // ★是正前後でここが変わってはいけない (既存の呼び出しを壊していないことの担保)
  it("正常な 2 桁コードのパスは従来どおり", () => {
    expect(
      buildMlitR2Path({ type: "city", prefCode: "13", wardMode: "merged" }),
    ).toBe(`gis/mlit/${MLIT_VERSION}/13/13_city_dc.topojson`);
    expect(
      buildMlitR2Path({ type: "city", prefCode: "01", wardMode: "split" }),
    ).toBe(`gis/mlit/${MLIT_VERSION}/01/01_city.topojson`);
    expect(buildMlitR2Path({ type: "city", prefCode: "47" })).toBe(
      `gis/mlit/${MLIT_VERSION}/47/47_city_dc.topojson`,
    );
  });

  it("prefCode 未指定は従来どおり専用メッセージで throw", () => {
    expect(() => buildMlitR2Path({ type: "city" })).toThrow(
      /prefCode is required/,
    );
  });

  // ★検証が効いていることの実証。これが落ちるなら書式チェックが外れている
  it.each([
    ["..", "1 段の親ディレクトリ"],
    ["../../etc", "多段のトラバーサル"],
    ["13/../../secret", "正常なコードに続けたトラバーサル"],
    ["1", "1 桁"],
    ["133", "3 桁"],
    ["ab", "数字でない"],
    ["1 3", "空白入り"],
    ["", "空文字"],
  ])("不正な prefCode %j (%s) は throw する", (bad) => {
    expect(() => buildMlitR2Path({ type: "city", prefCode: bad })).toThrow();
  });

  it("5 桁の市区町村コードをそのまま渡すと throw する (切り出しは呼び元の責務)", () => {
    // extractPrefectureCode を通さずに 13101 を渡すと、以前は
    // gis/mlit/<ver>/13101/13101_city_dc.topojson という存在しない key を作っていた
    expect(() => buildMlitR2Path({ type: "city", prefCode: "13101" })).toThrow(
      /2 桁の数字/,
    );
  });
});
