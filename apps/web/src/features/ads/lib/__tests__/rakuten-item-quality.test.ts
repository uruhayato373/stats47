import { describe, expect, it } from "vitest";

import { furusatoQualityReasons, furusatoRegionEvidence, hasProductTitleMatch, productQualityReasons, selectQualityItems } from "../rakuten-item-quality";

const item = { name: "さんま 干物セット 送料無料", url: "https://hb.afl.rakuten.co.jp/test", price: 3000, image: "https://thumbnail.image.rakuten.co.jp/test.jpg" };

describe("productQualityReasons", () => {
  it("さんまに混入した下着・パンツを旧snapshotでも除外する", () => {
    for (const name of ["新色 ナイトブラ 育乳", "テーパードパンツ レディース"]) {
      expect(productQualityReasons({ ...item, name }, "さんま")).toContain("title-mismatch");
    }
    expect(productQualityReasons(item, "さんま")).toEqual([]);
    expect(productQualityReasons({ ...item, name: "秋刀魚 干物" }, "さんま")).toEqual([]);
  });
  it("コーヒー色の衣料・器具を豆や飲料と取り違えない", () => {
    for (const name of ["コーヒー色 パンツ", "コーヒーメーカー", "コーヒーカップ", "コーヒー用 フィルター"]) {
      expect(productQualityReasons({ ...item, name }, "コーヒー").length).toBeGreaterThan(0);
    }
    expect(productQualityReasons({ ...item, name: "珈琲豆 500g" }, "コーヒー")).toEqual([]);
    expect(productQualityReasons({ ...item, name: "コーヒー ドリップバッグ" }, "コーヒー")).toEqual([]);
  });
  it("寄附・送料だけの商品・通常URL・画像なしを落とす", () => {
    expect(productQualityReasons({ ...item, name: "【ふるさと納税】さんま" }, "さんま")).toContain("donation-product");
    expect(productQualityReasons({ ...item, name: "《送料700円》さんま配送分" }, "さんま")).toContain("shipping-fee");
    expect(productQualityReasons({ ...item, name: "送料700円 さんま配送分" }, "さんま")).toContain("shipping-fee");
    expect(productQualityReasons({ ...item, url: "https://item.rakuten.co.jp/test" }, "さんま")).toContain("non-affiliate-url");
    expect(productQualityReasons({ ...item, image: null }, "さんま")).toContain("missing-image");
  });
  it("かな表記ゆれ・複数語ANDを検証する", () => {
    expect(hasProductTitleMatch("サンマ 干物", "さんま 干物")).toBe(true);
    expect(hasProductTitleMatch("さんま柄 Tシャツ", "さんま 干物")).toBe(false);
    expect(hasProductTitleMatch("さんま", "")).toBe(false);
  });
});

describe("furusatoQualityReasons", () => {
  const gift = { ...item, name: "【ふるさと納税】北海道 ホタテ", shopName: "北海道白糠町" };
  it("新規取得は県ショップを必須とし、他県や送料を混ぜない", () => {
    expect(furusatoQualityReasons(gift, "北海道", { requireShop: true })).toEqual([]);
    expect(furusatoQualityReasons({ ...gift, shopName: "青森県青森市" }, "北海道")).toContain("prefecture-mismatch");
    expect(furusatoQualityReasons({ ...gift, shopName: undefined }, "北海道", { requireShop: true })).toContain("region-unverified");
    expect(furusatoQualityReasons({ ...gift, name: "《送料700円》青森県/岩手県/秋田県" }, "北海道")).toContain("not-furusato");
  });
  it("旧snapshotは強い題名証拠を残し、不明・他県明記は分ける", () => {
    expect(furusatoRegionEvidence({ ...gift, shopName: undefined }, "北海道")).toBe("legacy-title");
    expect(furusatoQualityReasons({ ...gift, shopName: undefined }, "北海道")).toEqual([]);
    expect(furusatoRegionEvidence({ ...gift, name: "【ふるさと納税】ホタテ", shopName: undefined }, "北海道")).toBe("unknown");
    expect(furusatoRegionEvidence({ ...gift, name: "【ふるさと納税】青森県 ホタテ", shopName: undefined }, "北海道")).toBe("mismatch");
  });
  it("食文化の文脈では食事券・宿泊券・地域通貨を出さない", () => {
    for (const name of ["【ふるさと納税】北海道 海鮮お食事券", "【ふるさと納税】北海道 宿泊クーポン", "【ふるさと納税】北海道 地域通貨"]) {
      expect(furusatoQualityReasons({ ...gift, name }, "北海道", { context: "food" })).toContain("non-food-voucher");
      expect(furusatoQualityReasons({ ...gift, name }, "北海道")).toEqual([]);
    }
    expect(furusatoQualityReasons({ ...gift, name: "【ふるさと納税】北海道 レザー財布" }, "北海道", { context: "food" })).toContain("product-kind-mismatch");
  });
  it("重複は除き、良品でだけ上限を満たす", () => {
    const selected = selectQualityItems([gift, gift, { ...gift, url: item.url + '/2' }], i => furusatoQualityReasons(i, "北海道"));
    expect(selected).toHaveLength(2);
  });
});
