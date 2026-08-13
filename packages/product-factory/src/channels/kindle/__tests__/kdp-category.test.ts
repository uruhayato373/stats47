/**
 * カテゴリ SSOT が **KDP に実在する掲載場所だけ**を指していることを固定する。
 *
 * ★なぜテストが要るか
 *   実在しない掲載場所を書いても型検査は通る。気づくのは出品フォームで
 *   「保存して続行」が止まったときで、そこまで来ないと分からない。
 *   採取済みの分類表と突き合わせれば、書いた時点で落ちる。
 */
import { describe, it, expect } from "vitest";
import { KINDLE_BOOKS } from "../book-catalog";
import { kdpCategoriesFor, KDP_CATEGORY_THIRD } from "../kdp-category";
import treeJson from "../kdp-category-tree.json";

const TREE = treeJson.tree as Record<string, string[]>;
const PLACES = treeJson.places as Record<string, string[]>;

describe("KDP カテゴリ SSOT", () => {
  it("採取した分類表が空でない (空表なら全 PASS になってしまう)", () => {
    expect(Object.keys(TREE).length).toBeGreaterThan(5);
    expect(Object.values(TREE).flat().length).toBeGreaterThan(50);
    expect(Object.keys(PLACES).length).toBeGreaterThan(5);
    expect(Object.values(PLACES).flat().length).toBeGreaterThan(50);
  });

  it("全書籍のカテゴリが実在する", () => {
    const bad: string[] = [];
    for (const b of KINDLE_BOOKS) {
      const paths = kdpCategoriesFor(b.id);
      expect(paths.length, `${b.id} の枠数`).toBeGreaterThanOrEqual(1);
      expect(paths.length, `${b.id} の枠数 (KDP は最大 3)`).toBeLessThanOrEqual(3);
      for (const p of paths) {
        if (!TREE[p.top]) bad.push(`${b.id}: 第2段「${p.top}」が実在しない`);
        else if (!TREE[p.top].includes(p.sub)) bad.push(`${b.id}: 「${p.top} > ${p.sub}」が実在しない`);
        else {
          // ★掲載場所まで見る。select 3 段は絞り込みで、チェックを入れて初めて 1 枠になる。
          const key = `${p.top} > ${p.sub}`;
          const list = PLACES[key];
          if (!list) bad.push(`${b.id}: 「${key}」の掲載場所を採取していない`);
          else if (!list.includes(p.place)) bad.push(`${b.id}: 掲載場所「${key} > ${p.place}」が実在しない`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it("実在しない掲載場所を検出できる (検査が効いていることの実証)", () => {
    // 採取表に無い値を作って、上と同じ判定が落ちることを確かめる。
    const fake = { top: "ビジネス・経済", sub: "統計学" }; // ← これがもとの SSOT の値。実在しない
    expect(TREE[fake.top]).toBeTruthy();
    expect(TREE[fake.top].includes(fake.sub)).toBe(false);
    // 掲載場所の取り違えも検出できること (sub 名をそのまま place に使うと落ちる経路がある)
    expect(PLACES["社会・政治 > 社会学"]).toBeTruthy();
    expect(PLACES["社会・政治 > 社会学"].includes("社会学")).toBe(false);
  });

  it("3 枠目が全書籍ぶんある (取りこぼすと 2 枠しか付かない)", () => {
    const missing = KINDLE_BOOKS.map((b) => b.id).filter((id) => !KDP_CATEGORY_THIRD[id]);
    expect(missing).toEqual([]);
  });
});
