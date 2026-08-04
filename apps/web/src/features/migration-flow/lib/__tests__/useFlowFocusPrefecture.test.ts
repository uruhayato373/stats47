import { describe, expect, it } from "vitest";

import {
  DEFAULT_FOCUS,
  resolveFlowFocus,
  toFlowCode,
} from "../useFlowFocusPrefecture";

/**
 * フロー図の焦点県の決定規則。
 *
 * ★2026-08-04 の是正対象: フロー 2 種がページの都道府県選択と非連動で、
 * 「全国」を選んでいるのに東京のフローが黙って出続けていた。さらにページ側 (5 桁)
 * とフロー側 (2 桁) が同じ `?pref=` を互いに上書きし合っていた。
 * ここで固定するのは「ページ選択が上位 / 全国は正直に代表県と宣言する / 手動選択は
 * ページ選択が変わるまで有効」という 3 つの不変量。
 */
describe("toFlowCode", () => {
  it("5 桁のページコードを 2 桁のフローコードに変換する", () => {
    expect(toFlowCode("13000")).toBe("13");
    expect(toFlowCode("01000")).toBe("01");
  });

  it("全国 (null) と桁数の合わない値は null にする", () => {
    expect(toFlowCode(null)).toBeNull();
    // 2 桁を渡されても 5 桁として解釈しない (旧 ?pref= 混在の名残を弾く)
    expect(toFlowCode("13")).toBeNull();
    expect(toFlowCode("abcde")).toBeNull();
  });
});

describe("resolveFlowFocus", () => {
  it("全国 (context なし) では代表県にフォールバックし、それを申告する", () => {
    expect(resolveFlowFocus(null, null, undefined)).toEqual({
      prefCode: DEFAULT_FOCUS,
      isNationalFallback: true,
    });
  });

  it("全国のとき SSR が読んだ初期県があればそれを使う", () => {
    expect(resolveFlowFocus(null, null, "27")).toEqual({
      prefCode: "27",
      isNationalFallback: true,
    });
  });

  it("不正な初期県は無視して代表県に落とす", () => {
    expect(resolveFlowFocus(null, null, "99").prefCode).toBe(DEFAULT_FOCUS);
  });

  it("ページで県を選んでいればフローはそれに追従する (今回の主バグ)", () => {
    expect(resolveFlowFocus("27", null, "13")).toEqual({
      prefCode: "27",
      isNationalFallback: false,
    });
  });

  it("全国のまま手動で焦点県を選んだらバッジを消す", () => {
    expect(resolveFlowFocus(null, { boundTo: null, code: "01" }, undefined)).toEqual({
      prefCode: "01",
      isNationalFallback: false,
    });
  });

  it("手動選択は同じページ県の間だけ有効", () => {
    expect(resolveFlowFocus("27", { boundTo: "27", code: "13" }, undefined).prefCode).toBe(
      "13",
    );
  });

  it("ページ県が変わると手動選択は失効し、ページ県が勝つ", () => {
    // 大阪を見ながらフローだけ東京にしていた状態で、ページを愛知に切り替えた
    expect(resolveFlowFocus("23", { boundTo: "27", code: "13" }, undefined)).toEqual({
      prefCode: "23",
      isNationalFallback: false,
    });
  });

  it("ページ県から全国に戻すと手動選択も失効する", () => {
    expect(resolveFlowFocus(null, { boundTo: "27", code: "13" }, undefined)).toEqual({
      prefCode: DEFAULT_FOCUS,
      isNationalFallback: true,
    });
  });
});
