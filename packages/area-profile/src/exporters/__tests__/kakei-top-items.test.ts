import { listAllMetrics } from "@stats47/data-configs";
import { describe, expect, it } from "vitest";

import {
  KAKEI_TOP_ITEM_LIMIT,
  groupKakeiItemKeys,
  kakeiDetailItemCode,
  pickKakeiTopItems,
  type KakeiTopCandidate,
} from "../kakei-top-items";

const kakei = (key: string, cdCat01?: string) => ({
  key,
  source: { kind: "kakei-chousa", filter: cdCat01 === undefined ? {} : { cdCat01 } },
});

/** 1 位が最大値の 47 県の値。1 位 = 200、2 位 = 100、以降は 1 ずつ下がる。 */
const ranked = [{ rank: 1, value: 200 }, { rank: 2, value: 100 }, { rank: 3, value: 99 }, { rank: 4, value: 98 }];

const cand = (o: Partial<KakeiTopCandidate> & { rankingKey: string; itemCode: string }): KakeiTopCandidate => ({
  label: o.rankingKey,
  value: 100,
  unit: "円",
  year: "2025年",
  rank: 1,
  ranked,
  ...o,
});

describe("kakeiDetailItemCode", () => {
  it("最下層の品目 (末尾の 0 が 2 つ以下) のコードを返す", () => {
    expect(kakeiDetailItemCode(kakei("gyoza", "010920070"))).toBe("010920070");
    expect(kakeiDetailItemCode(kakei("rice", "010110001"))).toBe("010110001");
    expect(kakeiDetailItemCode(kakei("x", "010920100"))).toBe("010920100");
  });

  it("食料費・消費支出総額・魚介類のような集計区分は外す", () => {
    expect(kakeiDetailItemCode(kakei("food-total", "010000000"))).toBeNull();
    expect(kakeiDetailItemCode(kakei("total", "001100000"))).toBeNull();
    expect(kakeiDetailItemCode(kakei("seafood", "010200000"))).toBeNull();
  });

  it("コードが無い・9 桁でない・家計調査でない指標は外す", () => {
    expect(kakeiDetailItemCode(kakei("no-code"))).toBeNull();
    expect(kakeiDetailItemCode(kakei("savings", "012"))).toBeNull();
    expect(kakeiDetailItemCode({ key: "pop", source: { kind: "estat", filter: { cdCat01: "010920070" } } })).toBeNull();
  });
});

describe("groupKakeiItemKeys", () => {
  it("同じ品目の支出額と購入数量を 1 つの品目にまとめる", () => {
    const groups = groupKakeiItemKeys([
      kakei("beef-consumption-expenditure", "010310010"),
      kakei("beef-consumption-quantity", "010310010"),
      kakei("food-expenditure-total", "010000000"),
    ]);
    expect([...groups.entries()]).toEqual([
      ["010310010", ["beef-consumption-expenditure", "beef-consumption-quantity"]],
    ]);
  });
});

describe("kakeiDetailItemCode と実際の指標", () => {
  const groups = groupKakeiItemKeys(listAllMetrics());

  it("ぎょうざは品目に入り、食料費の集計区分は入らない", () => {
    const keys = [...groups.values()].flat();
    expect(keys).toContain("gyoza-frozen-consumption-expenditure");
    expect(keys).not.toContain("food-expenditure-total");
    expect(keys).not.toContain("consumption-expenditure-total");
  });

  it("品目コードごとの指標は支出額と購入数量の高々 2 本 (規則が 1 件にまとめる前提)", () => {
    for (const keys of groups.values()) expect(keys.length).toBeLessThanOrEqual(2);
  });
});

describe("pickKakeiTopItems", () => {
  it("全国 3 位以内だけを順位順に返し、4 位以下は載せない", () => {
    const items = pickKakeiTopItems([
      cand({ rankingKey: "c", itemCode: "3", rank: 3 }),
      cand({ rankingKey: "d", itemCode: "4", rank: 4 }),
      cand({ rankingKey: "a", itemCode: "1", rank: 1 }),
      cand({ rankingKey: "b", itemCode: "2", rank: 2 }),
    ]);
    expect(items.map((i) => i.rankingKey)).toEqual(["a", "b", "c"]);
  });

  it("同じ品目の支出額と購入数量が両方入るときは順位が上の 1 件だけにする", () => {
    const items = pickKakeiTopItems([
      cand({ rankingKey: "beef-quantity", itemCode: "1", unit: "g", rank: 1 }),
      cand({ rankingKey: "beef-expenditure", itemCode: "1", unit: "円", rank: 3 }),
    ]);
    expect(items.map((i) => i.rankingKey)).toEqual(["beef-quantity"]);
  });

  it("同じ品目で順位が同じなら支出額を選ぶ", () => {
    const items = pickKakeiTopItems([
      cand({ rankingKey: "a-quantity", itemCode: "1", unit: "g", rank: 2 }),
      cand({ rankingKey: "z-expenditure", itemCode: "1", unit: "円", rank: 2 }),
    ]);
    expect(items.map((i) => i.rankingKey)).toEqual(["z-expenditure"]);
  });

  it(`${KAKEI_TOP_ITEM_LIMIT} 件で打ち切り、同順位では 47 都道府県の平均の何倍かが大きい品目を先にする`, () => {
    const standout = [{ rank: 1, value: 500 }, { rank: 2, value: 100 }];
    const flat = [{ rank: 1, value: 101 }, { rank: 2, value: 100 }];
    const candidates = Array.from({ length: 6 }, (_, i) =>
      cand({ rankingKey: `k${i}`, itemCode: String(i), rank: 1, value: i === 5 ? 500 : 101, ranked: i === 5 ? standout : flat }),
    );
    const items = pickKakeiTopItems(candidates);
    expect(items).toHaveLength(KAKEI_TOP_ITEM_LIMIT);
    expect(items[0].rankingKey).toBe("k5");
  });

  it("2 位と僅差でも平均を大きく上回る品目を、2 位との差は大きいが平均並みの品目より先にする (宇都宮のぎょうざ)", () => {
    // ぎょうざ: 1 位 3,575 円・2 位 3,418 円 (差 1.05 倍) だが平均の約 1.9 倍
    const gyoza = [{ rank: 1, value: 3575 }, { rank: 2, value: 3418 }, { rank: 3, value: 1000 }, { rank: 4, value: 900 }];
    // 平均並みの品目: 1 位だけ少し高く、2 位以下が低い (差 1.5 倍) が平均の約 1.2 倍
    const flat = [{ rank: 1, value: 1500 }, { rank: 2, value: 1000 }, { rank: 3, value: 1300 }, { rank: 4, value: 1200 }];
    const items = pickKakeiTopItems([
      cand({ rankingKey: "flat", itemCode: "010000010", rank: 1, value: 1500, ranked: flat }),
      cand({ rankingKey: "gyoza", itemCode: "010000020", rank: 1, value: 3575, ranked: gyoza }),
    ]);
    expect(items.map((i) => i.rankingKey)).toEqual(["gyoza", "flat"]);
  });

  it("同順位では食料の品目を、決定力が大きい非食料より先にする", () => {
    const wide = [{ rank: 1, value: 900 }, { rank: 2, value: 100 }];
    const narrow = [{ rank: 1, value: 101 }, { rank: 2, value: 100 }];
    const items = pickKakeiTopItems([
      cand({ rankingKey: "tatami", itemCode: "044000010", rank: 1, ranked: wide }),
      cand({ rankingKey: "gyoza", itemCode: "010920070", rank: 1, ranked: narrow }),
      cand({ rankingKey: "food-rank2", itemCode: "010310010", rank: 2, ranked: wide }),
    ]);
    // 順位が先。食料でも 2 位は 1 位の非食料より後ろ
    expect(items.map((i) => i.rankingKey)).toEqual(["gyoza", "tatami", "food-rank2"]);
  });

  it("小さい値が 1 位の指標・古い年の値は載せない", () => {
    const asc = [{ rank: 1, value: 1 }, { rank: 2, value: 5 }, { rank: 3, value: 9 }];
    expect(pickKakeiTopItems([cand({ rankingKey: "a", itemCode: "1", ranked: asc })])).toEqual([]);
    expect(pickKakeiTopItems([cand({ rankingKey: "b", itemCode: "2", year: "2014年" })])).toEqual([]);
  });

  it("候補が無ければ空配列", () => {
    expect(pickKakeiTopItems([])).toEqual([]);
  });
});
